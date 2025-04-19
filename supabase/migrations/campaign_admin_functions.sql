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