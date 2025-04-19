-- Function to check if an email already exists in the auth.users table
CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if the email exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE email = p_email
  ) INTO v_exists;
  
  RETURN jsonb_build_object('exists', v_exists);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated;
-- Grant execute permissions to anon users (for registration forms)
GRANT EXECUTE ON FUNCTION check_email_exists TO anon; 