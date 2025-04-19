-- Function to set admin role in auth.users metadata
CREATE OR REPLACE FUNCTION public.set_admin_role(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Update the app_metadata JSONB to include role: 'admin'
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
  WHERE id = user_id;
  
  -- Return success based on if a row was updated
  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set appropriate permissions
GRANT EXECUTE ON FUNCTION public.set_admin_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_role(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.set_admin_role IS 'Sets the role to admin in the auth.users metadata for the given user ID'; 