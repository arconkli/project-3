-- Create a function to get database performance statistics for admin
CREATE OR REPLACE FUNCTION admin_get_db_stats()
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
    RAISE EXCEPTION 'Only admin users can access database statistics';
  END IF;
  
  -- Get database statistics in JSON format
  WITH 
    query_stats AS (
      SELECT 
        query,
        calls,
        total_time,
        rows,
        100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_ratio
      FROM 
        pg_stat_statements
      ORDER BY 
        total_time DESC
      LIMIT 10
    ),
    table_stats AS (
      SELECT 
        relname AS table_name,
        n_live_tup AS row_count,
        n_tup_ins AS rows_inserted,
        n_tup_upd AS rows_updated,
        n_tup_del AS rows_deleted,
        n_tup_hot_upd AS rows_hot_updated
      FROM 
        pg_stat_user_tables
      ORDER BY 
        n_live_tup DESC
      LIMIT 10
    ),
    index_stats AS (
      SELECT 
        indexrelname AS index_name,
        relname AS table_name,
        idx_scan AS scans,
        idx_tup_read AS tuples_read,
        idx_tup_fetch AS tuples_fetched
      FROM 
        pg_stat_user_indexes
      ORDER BY 
        idx_scan DESC
      LIMIT 10
    ),
    connection_stats AS (
      SELECT 
        datname,
        numbackends,
        xact_commit,
        xact_rollback,
        blks_read,
        blks_hit,
        blk_read_time,
        blk_write_time
      FROM 
        pg_stat_database
      WHERE 
        datname = current_database()
    ),
    lock_stats AS (
      SELECT 
        mode,
        count(*) as count
      FROM 
        pg_locks
      WHERE 
        database = (SELECT oid FROM pg_database WHERE datname = current_database())
      GROUP BY 
        mode
    )
  SELECT 
    json_build_object(
      'timestamp', NOW(),
      'database', current_database(),
      'connections', (SELECT row_to_json(t) FROM (SELECT * FROM connection_stats) t),
      'locks', (SELECT json_agg(t) FROM (SELECT * FROM lock_stats) t),
      'slow_queries', (SELECT json_agg(t) FROM (SELECT * FROM query_stats) t),
      'table_stats', (SELECT json_agg(t) FROM (SELECT * FROM table_stats) t),
      'index_stats', (SELECT json_agg(t) FROM (SELECT * FROM index_stats) t)
    ) INTO result;
  
  RETURN result;
END;
$$;

-- Create a function to optimize the database for performance
CREATE OR REPLACE FUNCTION admin_optimize_database()
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
    RAISE EXCEPTION 'Only admin users can optimize the database';
  END IF;
  
  -- Refresh materialized views concurrently
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_metrics_mv;
  
  -- Vacuum analyze the main tables
  VACUUM ANALYZE campaigns;
  VACUUM ANALYZE brands;
  VACUUM ANALYZE profiles;
  VACUUM ANALYZE campaign_creators;
  VACUUM ANALYZE content_submissions;
  
  -- Reindex tables
  REINDEX TABLE campaigns;
  REINDEX TABLE brands;
  REINDEX TABLE profiles;
  REINDEX TABLE campaign_creators;
  REINDEX TABLE content_submissions;
  
  -- Clear query planner statistics
  SELECT pg_stat_reset();
  SELECT pg_stat_reset_shared('pg_stat_statements');
  
  RETURN 'Database optimization completed at ' || NOW()::TEXT;
END;
$$; 