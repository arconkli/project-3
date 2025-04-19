-- Fix for brand_users table issues

-- First, ensure the brand_users table exists
CREATE TABLE IF NOT EXISTS brand_users (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (user_id, brand_id)
);

-- Add comment for better documentation
COMMENT ON TABLE brand_users IS 'Links users to brands they have access to';

-- Make sure the role column has the right constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_users_role_check'
  ) THEN
    ALTER TABLE brand_users ADD CONSTRAINT brand_users_role_check CHECK (role IN ('owner', 'admin', 'member'));
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error setting up role constraint: %', SQLERRM;
END $$;

-- Ensure the brand_id column references the brands table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_users_brand_id_fkey'
  ) THEN
    ALTER TABLE brand_users ADD CONSTRAINT brand_users_brand_id_fkey 
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error setting up brand_id foreign key: %', SQLERRM;
END $$;

-- Fix 1: Update all brand profiles with "pending" status to "active"
UPDATE profiles 
SET 
  status = 'active',
  updated_at = NOW()
WHERE 
  role = 'brand' 
  AND status = 'pending';

-- Fix 2: Create brand records for any profiles that don't have them
DO $$
DECLARE
  profile_record RECORD;
  brand_id UUID;
  brand_count INTEGER;
BEGIN
  RAISE NOTICE 'Checking for brand profiles without brand records...';
  
  FOR profile_record IN
    SELECT p.id, p.user_id, p.full_name, p.email 
    FROM profiles p
    WHERE p.role = 'brand'
    AND NOT EXISTS (
      SELECT 1 FROM brands b WHERE b.profile_id = p.id
    )
  LOOP
    RAISE NOTICE 'Creating brand record for profile %', profile_record.id;
    
    -- Insert a new brand record
    INSERT INTO brands (
      profile_id, 
      name, 
      description, 
      contact_email, 
      created_at, 
      updated_at
    ) VALUES (
      profile_record.id,
      COALESCE(profile_record.full_name, 'Brand Account'),
      'Brand account automatically created via fix script',
      profile_record.email,
      NOW(),
      NOW()
    )
    RETURNING id INTO brand_id;
    
    RAISE NOTICE 'Created brand with ID % for profile %', brand_id, profile_record.id;
    
    -- The trigger should create the brand_users link, but let's make sure
    INSERT INTO brand_users (
      user_id, 
      brand_id, 
      role, 
      created_at, 
      updated_at
    ) VALUES (
      profile_record.user_id,
      brand_id,
      'owner',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, brand_id) DO NOTHING;
  END LOOP;
  
  -- Count how many were affected
  SELECT COUNT(*) INTO brand_count
  FROM brands
  WHERE created_at > NOW() - INTERVAL '1 minute';
  
  RAISE NOTICE 'Created % new brand records', brand_count;
END $$;

-- Detect and repair orphaned records
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  -- Check for brand_users entries referencing non-existent brands
  SELECT COUNT(*) INTO orphaned_count 
  FROM brand_users bu
  LEFT JOIN brands b ON bu.brand_id = b.id
  WHERE b.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % orphaned brand_users records (references to non-existent brands)', orphaned_count;
  END IF;
  
  -- Check for brands without any users
  SELECT COUNT(*) INTO orphaned_count
  FROM brands b
  LEFT JOIN brand_users bu ON b.id = bu.brand_id
  WHERE bu.brand_id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE NOTICE 'Found % brands without any users', orphaned_count;
    
    -- Auto-repair by connecting orphaned brands to their profile owners
    WITH orphaned_brands AS (
      SELECT b.id as brand_id, p.user_id
      FROM brands b
      JOIN profiles p ON b.profile_id = p.id
      LEFT JOIN brand_users bu ON b.id = bu.brand_id
      WHERE bu.brand_id IS NULL
    )
    INSERT INTO brand_users (user_id, brand_id, role, created_at, updated_at)
    SELECT user_id, brand_id, 'owner', NOW(), NOW()
    FROM orphaned_brands
    ON CONFLICT (user_id, brand_id) DO NOTHING;
    
    GET DIAGNOSTICS orphaned_count = ROW_COUNT;
    RAISE NOTICE 'Auto-repaired % brand-user connections', orphaned_count;
  END IF;
END $$;

-- Create a trigger to automatically add brand_users entries when a brand is created
CREATE OR REPLACE FUNCTION create_brand_user_link() 
RETURNS TRIGGER AS $$
DECLARE
  profile_user_id UUID;
BEGIN
  -- Get the user_id from the associated profile
  SELECT user_id INTO profile_user_id 
  FROM profiles 
  WHERE id = NEW.profile_id;
  
  IF profile_user_id IS NOT NULL THEN
    -- Create link in brand_users
    INSERT INTO brand_users (user_id, brand_id, role, created_at, updated_at)
    VALUES (profile_user_id, NEW.id, 'owner', NOW(), NOW())
    ON CONFLICT (user_id, brand_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_brand_created ON brands;

-- Add the trigger
CREATE TRIGGER on_brand_created
AFTER INSERT ON brands
FOR EACH ROW
EXECUTE FUNCTION create_brand_user_link();

-- Update RLS policies for brand_users table
ALTER TABLE brand_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own brand links" ON brand_users;
DROP POLICY IF EXISTS "Users can insert their own brand links" ON brand_users;
DROP POLICY IF EXISTS "Users can update their own brand links" ON brand_users;
DROP POLICY IF EXISTS "Users can delete their own brand links" ON brand_users;

-- Create new policies
CREATE POLICY "Users can view their own brand links" 
ON brand_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand links" 
ON brand_users FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand links" 
ON brand_users FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand links" 
ON brand_users FOR DELETE
USING (auth.uid() = user_id);

-- Add a policy to allow users to insert records into brands table
-- This helps with brand creation in the application
DROP POLICY IF EXISTS "Users can insert their own brands" ON brands;
CREATE POLICY "Users can insert their own brands" 
ON brands FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1
  FROM profiles
  WHERE profiles.id = profile_id
  AND profiles.user_id = auth.uid()
));

-- Verify table content
SELECT 'brand_users table contents:' as info;
SELECT * FROM brand_users LIMIT 10;

SELECT 'orphaned brands (no users):' as info;
SELECT b.id, b.name, b.profile_id
FROM brands b
LEFT JOIN brand_users bu ON b.id = bu.brand_id
WHERE bu.brand_id IS NULL;

SELECT 'Brand profiles status:' as info;
SELECT p.id, p.user_id, p.email, p.role, p.status
FROM profiles p
WHERE p.role = 'brand'
LIMIT 10;

-- Check if brands table has records for all brand profiles
SELECT 'Profiles missing brand records:' as info;
SELECT p.id, p.user_id, p.email, p.role 
FROM profiles p
WHERE p.role = 'brand'
AND NOT EXISTS (
  SELECT 1 FROM brands b WHERE b.profile_id = p.id
)
LIMIT 10;

-- Success message
SELECT 'Brand users table fix script completed successfully' as result;

-- Create a diagnostic view to help identify relationship issues
CREATE OR REPLACE VIEW brand_relationship_diagnostic AS
SELECT
    u.id AS user_id,
    u.email AS user_email,
    u.raw_app_meta_data->'role' AS user_role,
    p.id AS profile_id,
    p.role AS profile_role,
    p.status AS profile_status,
    b.id AS brand_id,
    b.name AS brand_name,
    b.profile_id AS brand_profile_id,
    bu.brand_id AS brand_user_brand_id,
    bu.user_id AS brand_user_user_id,
    bu.role AS brand_user_role,
    CASE
        WHEN p.id IS NULL THEN 'Missing profile'
        WHEN b.id IS NULL THEN 'Missing brand'
        WHEN bu.brand_id IS NULL THEN 'Missing brand_user link'
        ELSE 'Complete'
    END AS relationship_status
FROM
    auth.users u
LEFT JOIN
    profiles p ON u.id = p.user_id
LEFT JOIN
    brands b ON p.id = b.profile_id
LEFT JOIN
    brand_users bu ON u.id = bu.user_id AND b.id = bu.brand_id
WHERE
    (u.raw_app_meta_data->>'role' = 'brand' OR p.role = 'brand')
ORDER BY
    relationship_status,
    u.email;

-- Show diagnostic information
SELECT 'Brand relationship diagnostic:' as info;
SELECT * FROM brand_relationship_diagnostic LIMIT 20;
