-- Add indexes to campaigns table for improved query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_updated_at ON campaigns(updated_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Combined indexes for multi-column filtering
CREATE INDEX IF NOT EXISTS idx_campaigns_status_updated ON campaigns(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON campaigns(status, created_at);

-- Additional indexes for joins
CREATE INDEX IF NOT EXISTS idx_brand_users_brand_id ON brand_users(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_users_user_id ON brand_users(user_id);
CREATE INDEX IF NOT EXISTS idx_content_submissions_campaign_id ON content_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_campaign_id ON campaign_creators(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creators_creator_id ON campaign_creators(creator_id);

-- Add comment explaining the purpose of these indexes
COMMENT ON INDEX idx_campaigns_status IS 'Improves filtering performance when querying campaigns by status';
COMMENT ON INDEX idx_campaigns_brand_id IS 'Improves join performance between campaigns and brands';
COMMENT ON INDEX idx_campaigns_updated_at IS 'Improves sorting by updated_at timestamp';
COMMENT ON INDEX idx_campaigns_created_at IS 'Improves sorting by created_at timestamp';
COMMENT ON INDEX idx_campaigns_status_updated IS 'Composite index for filtering by status and sorting by updated_at';
COMMENT ON INDEX idx_campaigns_status_created IS 'Composite index for filtering by status and sorting by created_at'; 