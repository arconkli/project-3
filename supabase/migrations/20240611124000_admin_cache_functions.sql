-- Create a function for admins to manually refresh the materialized view
CREATE OR REPLACE FUNCTION admin_refresh_campaign_metrics()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verify the user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admin users can refresh campaign metrics';
  END IF;
  
  -- Refresh the materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_metrics_mv;
  
  RETURN 'Campaign metrics refreshed successfully at ' || NOW()::TEXT;
END;
$$;

-- Create a function to count campaigns by status
CREATE OR REPLACE FUNCTION admin_count_campaigns_by_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_admin BOOLEAN;
  result JSON;
BEGIN
  -- Verify the user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admin users can access campaign counts';
  END IF;
  
  -- Create a JSON object with counts
  SELECT json_build_object(
    'total', COUNT(*),
    'pending_approval', COUNT(*) FILTER (WHERE status = 'pending_approval'),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'paused', COUNT(*) FILTER (WHERE status = 'paused'),
    'draft', COUNT(*) FILTER (WHERE status = 'draft'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'last_updated', NOW()
  )
  FROM campaigns
  INTO result;
  
  RETURN result;
END;
$$;

-- Create a function to get admin dashboard summary data
CREATE OR REPLACE FUNCTION admin_dashboard_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_admin BOOLEAN;
  result JSON;
BEGIN
  -- Verify the user is an admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admin users can access dashboard summary';
  END IF;
  
  -- Create a JSON object with various summary data
  SELECT json_build_object(
    'campaigns', json_build_object(
      'total', (SELECT COUNT(*) FROM campaigns),
      'pending_approval', (SELECT COUNT(*) FROM campaigns WHERE status = 'pending_approval'),
      'active', (SELECT COUNT(*) FROM campaigns WHERE status = 'active'),
      'paused', (SELECT COUNT(*) FROM campaigns WHERE status = 'paused')
    ),
    'users', json_build_object(
      'total', (SELECT COUNT(*) FROM profiles),
      'creators', (SELECT COUNT(*) FROM profiles WHERE role = 'creator'),
      'brands', (SELECT COUNT(*) FROM profiles WHERE role = 'brand'),
      'admins', (SELECT COUNT(*) FROM profiles WHERE role = 'admin')
    ),
    'content', json_build_object(
      'total_submissions', (SELECT COUNT(*) FROM content_submissions),
      'pending_review', (SELECT COUNT(*) FROM content_submissions WHERE status = 'submitted'),
      'approved', (SELECT COUNT(*) FROM content_submissions WHERE status = 'approved'),
      'rejected', (SELECT COUNT(*) FROM content_submissions WHERE status = 'rejected')
    ),
    'last_updated', NOW()
  )
  INTO result;
  
  RETURN result;
END;
$$; 