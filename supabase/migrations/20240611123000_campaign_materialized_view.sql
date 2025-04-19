-- Create a materialized view for campaign metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS campaign_metrics_mv AS
SELECT 
  c.id AS campaign_id,
  c.title AS campaign_title,
  c.status AS campaign_status,
  c.brand_id,
  b.name AS brand_name,
  b.logo_url AS brand_logo,
  c.start_date,
  c.end_date,
  c.budget,
  c.spent,
  c.created_at,
  c.updated_at,
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
  brands b ON c.brand_id = b.id;

-- Create a unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS campaign_metrics_mv_campaign_id_idx ON campaign_metrics_mv (campaign_id);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_campaign_metrics_mv()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_metrics_mv;
  RETURN NULL;
END;
$$;

-- Create triggers to refresh the materialized view when data changes
CREATE TRIGGER refresh_campaign_metrics_on_campaign_change
AFTER INSERT OR UPDATE OR DELETE ON campaigns
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_campaign_metrics_mv();

CREATE TRIGGER refresh_campaign_metrics_on_submission_change
AFTER INSERT OR UPDATE OR DELETE ON content_submissions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_campaign_metrics_mv();

CREATE TRIGGER refresh_campaign_metrics_on_creator_change
AFTER INSERT OR UPDATE OR DELETE ON campaign_creators
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_campaign_metrics_mv();

-- Function to get campaign metrics from the materialized view
CREATE OR REPLACE FUNCTION get_campaign_metrics(
  status_filter TEXT[] DEFAULT '{}'::TEXT[]
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_title TEXT,
  campaign_status TEXT,
  brand_id UUID,
  brand_name TEXT,
  brand_logo TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  budget DECIMAL, 
  spent DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  creators_joined BIGINT,
  total_submissions BIGINT,
  approved_submissions BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Filter by status if provided, otherwise return all campaigns
  IF array_length(status_filter, 1) > 0 THEN
    RETURN QUERY
    SELECT * FROM campaign_metrics_mv
    WHERE campaign_status = ANY(status_filter)
    ORDER BY updated_at DESC;
  ELSE
    RETURN QUERY
    SELECT * FROM campaign_metrics_mv
    ORDER BY updated_at DESC;
  END IF;
END;
$$; 