-- Create the brand_users join table to link users with brands
CREATE TABLE IF NOT EXISTS brand_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('owner', 'manager', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, brand_id)
);

-- Create RLS policies for brand_users
ALTER TABLE brand_users ENABLE ROW LEVEL SECURITY;

-- Users can see their own brand associations
CREATE POLICY "Users can view their own brand associations"
  ON brand_users FOR SELECT
  USING (auth.uid() = user_id);

-- Brand owners can see all users associated with their brand
CREATE POLICY "Brand owners can view all brand associations"
  ON brand_users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT bu.user_id FROM brand_users bu
      WHERE bu.brand_id = brand_users.brand_id AND bu.role = 'owner'
    )
  );

-- Brand owners and admins can add users to brands
CREATE POLICY "Brand owners and admins can insert brand_users"
  ON brand_users FOR INSERT
  WITH CHECK (
    -- Admin users can create any association
    (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    OR
    -- Brand owners can add users to their brands
    (
      EXISTS (
        SELECT 1 FROM brand_users bu
        WHERE bu.user_id = auth.uid() 
        AND bu.brand_id = brand_users.brand_id
        AND bu.role = 'owner'
      )
    )
  );

-- Brand owners and admins can update brand user associations
CREATE POLICY "Brand owners and admins can update brand_users"
  ON brand_users FOR UPDATE
  USING (
    -- Admin users can update any association
    (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    OR
    -- Brand owners can update users in their brands
    (
      EXISTS (
        SELECT 1 FROM brand_users bu
        WHERE bu.user_id = auth.uid() 
        AND bu.brand_id = brand_users.brand_id
        AND bu.role = 'owner'
      )
    )
  );

-- Brand owners and admins can delete brand user associations
CREATE POLICY "Brand owners and admins can delete brand_users"
  ON brand_users FOR DELETE
  USING (
    -- Admin users can delete any association
    (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
    OR
    -- Brand owners can delete users from their brands
    (
      EXISTS (
        SELECT 1 FROM brand_users bu
        WHERE bu.user_id = auth.uid() 
        AND bu.brand_id = brand_users.brand_id
        AND bu.role = 'owner'
      )
    )
  );

-- Create a function to automatically link a user to a brand when they create it
CREATE OR REPLACE FUNCTION auto_link_brand_creator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO brand_users (user_id, brand_id, role)
  SELECT 
    p.user_id,
    NEW.id,
    'owner'
  FROM 
    profiles p
  WHERE 
    p.id = NEW.profile_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically link a user when they create a brand
CREATE TRIGGER on_brand_created
AFTER INSERT ON brands
FOR EACH ROW
EXECUTE FUNCTION auto_link_brand_creator(); 