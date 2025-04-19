-- Create optimized views for admin dashboard

-- View for pending campaigns with brand information
CREATE OR REPLACE VIEW admin_pending_campaigns_view AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.status,
  c.created_at,
  c.updated_at,
  c.brand_id,
  b.name AS brand_name,
  b.logo_url AS brand_logo
FROM 
  campaigns c
JOIN 
  brands b ON c.brand_id = b.id
WHERE 
  c.status IN ('pending_approval', 'draft', 'pending', 'review')
ORDER BY 
  c.created_at DESC;

-- View for active/paused campaigns with brand information and metrics
CREATE OR REPLACE VIEW admin_active_campaigns_view AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.status,
  c.budget,
  c.spent,
  c.start_date,
  c.end_date,
  c.updated_at,
  c.brand_id,
  b.name AS brand_name,
  b.logo_url AS brand_logo,
  (
    SELECT COUNT(*) 
    FROM campaign_creators cc
    WHERE cc.campaign_id = c.id
  ) AS creators_joined,
  (
    SELECT COUNT(*) 
    FROM content_submissions cs
    WHERE cs.campaign_id = c.id
  ) AS total_submissions,
  (
    SELECT COUNT(*) 
    FROM content_submissions cs
    WHERE cs.campaign_id = c.id AND cs.status = 'approved'
  ) AS approved_submissions
FROM 
  campaigns c
JOIN 
  brands b ON c.brand_id = b.id
WHERE 
  c.status IN ('active', 'paused')
ORDER BY 
  c.updated_at DESC;

-- Create RLS policies for the views
ALTER VIEW admin_pending_campaigns_view ENABLE ROW LEVEL SECURITY;
ALTER VIEW admin_active_campaigns_view ENABLE ROW LEVEL SECURITY;

-- Admin can view all pending campaigns
CREATE POLICY "Admins can view pending campaigns" 
  ON admin_pending_campaigns_view
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can view all active campaigns
CREATE POLICY "Admins can view active campaigns" 
  ON admin_active_campaigns_view
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to get cached pending campaigns with pagination
CREATE OR REPLACE FUNCTION get_admin_pending_campaigns(
  page_size INT DEFAULT 25,
  page_number INT DEFAULT 1
)
RETURNS SETOF admin_pending_campaigns_view
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT * 
  FROM admin_pending_campaigns_view
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$;

-- Function to get cached active campaigns with pagination
CREATE OR REPLACE FUNCTION get_admin_active_campaigns(
  page_size INT DEFAULT 25,
  page_number INT DEFAULT 1
)
RETURNS SETOF admin_active_campaigns_view
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT * 
  FROM admin_active_campaigns_view
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$; 