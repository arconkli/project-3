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

-- Campaign approval function for admin users
CREATE OR REPLACE FUNCTION approve_campaign(
  campaign_id UUID,
  admin_user_id UUID
)
RETURNS SETOF campaigns
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verify the user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admin users can approve campaigns';
  END IF;
  
  -- Update the campaign status to approved
  RETURN QUERY
  UPDATE campaigns
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE 
    id = campaign_id AND
    status = 'pending_approval'
  RETURNING *;
END;
$$;

-- Campaign rejection function for admin users
CREATE OR REPLACE FUNCTION reject_campaign(
  campaign_id UUID,
  admin_user_id UUID,
  rejection_reason TEXT
)
RETURNS SETOF campaigns
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verify the user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = admin_user_id AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admin users can reject campaigns';
  END IF;
  
  -- Update the campaign status to rejected
  RETURN QUERY
  UPDATE campaigns
  SET 
    status = 'rejected',
    requirements = jsonb_set(
      COALESCE(requirements, '{}'::jsonb),
      '{rejection_reason}',
      to_jsonb(rejection_reason)
    ),
    updated_at = NOW()
  WHERE 
    id = campaign_id AND
    status = 'pending_approval'
  RETURNING *;
END;
$$;

-- Function for brands to submit a campaign for approval
CREATE OR REPLACE FUNCTION submit_campaign_for_approval(
  campaign_id UUID,
  user_id UUID
)
RETURNS SETOF campaigns
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  brand_owner BOOLEAN;
BEGIN
  -- Verify the user is the brand owner of this campaign
  SELECT EXISTS (
    SELECT 1 FROM campaigns c
    JOIN brands b ON c.brand_id = b.id
    JOIN profiles p ON b.profile_id = p.id
    WHERE c.id = campaign_id AND p.user_id = user_id
  ) INTO brand_owner;
  
  IF NOT brand_owner THEN
    RAISE EXCEPTION 'Only the brand owner can submit this campaign for approval';
  END IF;
  
  -- Update the campaign status to pending_approval
  RETURN QUERY
  UPDATE campaigns
  SET 
    status = 'pending_approval',
    updated_at = NOW()
  WHERE 
    id = campaign_id AND
    (status = 'draft' OR status = 'rejected')
  RETURNING *;
END;
$$;

-- Function for creators to join a campaign
CREATE OR REPLACE FUNCTION join_campaign(
  campaign_id UUID,
  user_id UUID,
  platforms TEXT[]
)
RETURNS SETOF campaign_creators
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  creator_id UUID;
  campaign_status TEXT;
  application_exists BOOLEAN;
BEGIN
  -- Check if the campaign is in an appropriate status
  SELECT status INTO campaign_status 
  FROM campaigns 
  WHERE id = campaign_id;
  
  IF campaign_status NOT IN ('approved', 'active') THEN
    RAISE EXCEPTION 'Cannot join campaign that is not approved or active';
  END IF;
  
  -- Get creator ID from user ID
  SELECT c.id INTO creator_id
  FROM creators c
  JOIN profiles p ON c.profile_id = p.id
  WHERE p.user_id = user_id;
  
  IF creator_id IS NULL THEN
    RAISE EXCEPTION 'Creator profile not found for this user';
  END IF;
  
  -- Check if an application already exists
  SELECT EXISTS (
    SELECT 1 FROM campaign_creators
    WHERE campaign_id = join_campaign.campaign_id
    AND creator_id = join_campaign.creator_id
  ) INTO application_exists;
  
  IF application_exists THEN
    RAISE EXCEPTION 'You have already applied to this campaign';
  END IF;
  
  -- Create the application
  RETURN QUERY
  INSERT INTO campaign_creators (
    campaign_id,
    creator_id,
    status,
    platforms,
    joined_at
  )
  VALUES (
    campaign_id,
    creator_id,
    'applied',
    platforms,
    NOW()
  )
  RETURNING *;
END;
$$;

-- Function for brands to approve creator applications
CREATE OR REPLACE FUNCTION approve_creator_application(
  application_id UUID,
  user_id UUID
)
RETURNS SETOF campaign_creators
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  brand_owner BOOLEAN;
BEGIN
  -- Verify the user is the brand owner of this campaign
  SELECT EXISTS (
    SELECT 1 FROM campaign_creators cc
    JOIN campaigns c ON cc.campaign_id = c.id
    JOIN brands b ON c.brand_id = b.id
    JOIN profiles p ON b.profile_id = p.id
    WHERE cc.id = application_id AND p.user_id = user_id
  ) INTO brand_owner;
  
  IF NOT brand_owner THEN
    RAISE EXCEPTION 'Only the brand owner can approve creator applications';
  END IF;
  
  -- Update the application status to approved
  RETURN QUERY
  UPDATE campaign_creators
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE 
    id = application_id AND
    status = 'applied'
  RETURNING *;
END;
$$;

-- Function to create a campaign (improved version to replace previous function)
CREATE OR REPLACE FUNCTION create_campaign(
  brand_id UUID,
  campaign_data JSONB
)
RETURNS SETOF campaigns
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO campaigns (
    brand_id,
    title,
    description,
    content_type,
    status,
    budget,
    spent,
    start_date,
    end_date,
    platforms,
    requirements
  )
  VALUES (
    brand_id,
    campaign_data->>'title',
    campaign_data->>'description',
    campaign_data->>'content_type',
    COALESCE(campaign_data->>'status', 'draft'),
    (campaign_data->>'budget')::DECIMAL,
    COALESCE((campaign_data->>'spent')::DECIMAL, 0),
    (campaign_data->>'start_date')::TIMESTAMP WITH TIME ZONE,
    (campaign_data->>'end_date')::TIMESTAMP WITH TIME ZONE,
    (SELECT ARRAY(SELECT jsonb_array_elements_text(campaign_data->'platforms')))::TEXT[],
    COALESCE(campaign_data->'requirements', '{}'::JSONB)
  )
  RETURNING *;
END;
$$;

-- Migrate existing brand relationships to brand_users table
DO $$
DECLARE
  brand_record RECORD;
BEGIN
  -- For each brand, find the user that created it and link them as an owner
  FOR brand_record IN 
    SELECT b.id AS brand_id, p.user_id
    FROM brands b
    JOIN profiles p ON b.profile_id = p.id
  LOOP
    -- Check if a record already exists
    IF NOT EXISTS (
      SELECT 1 FROM brand_users
      WHERE brand_id = brand_record.brand_id
      AND user_id = brand_record.user_id
    ) THEN
      -- Insert the brand-user relationship
      INSERT INTO brand_users (brand_id, user_id, role)
      VALUES (brand_record.brand_id, brand_record.user_id, 'owner');
    END IF;
  END LOOP;
END
$$; 