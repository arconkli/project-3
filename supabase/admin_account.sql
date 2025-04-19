-- Create a demo admin account
-- First, create a user in auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Demo admin UUID (fixed for easy reference)
  '00000000-0000-0000-0000-000000000000', -- instance_id
  'admin@demo.com', -- email
  '$2a$10$RUmD0nFbYHXTbvRYP6G1e.qK5Oy7.U4rFJ5FMbiHMGb1H4jKE9kPu', -- encrypted password for "admin123"
  NOW(),            -- email_confirmed_at
  '{"provider": "email", "providers": ["email"], "role": "admin"}', -- app_metadata with admin role
  '{"full_name": "Admin User", "type": "admin"}', -- user_metadata with type field
  NOW(),            -- created_at
  NOW(),            -- updated_at
  NOW(),            -- last_sign_in_at
  '',               -- confirmation_token
  '',               -- email_change
  '',               -- email_change_token_new
  ''                -- recovery_token
)
ON CONFLICT (id) DO UPDATE SET 
  raw_app_meta_data = '{"provider": "email", "providers": ["email"], "role": "admin"}',
  raw_user_meta_data = '{"full_name": "Admin User", "type": "admin"}';

-- Then, create a profile for this user
INSERT INTO public.profiles (
  id,
  user_id,
  full_name,
  username,
  email,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Profile UUID
  '00000000-0000-0000-0000-000000000000', -- User UUID (matches the auth.users entry)
  'Admin User',
  'admin',
  'admin@demo.com',
  'admin',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  user_id = '00000000-0000-0000-0000-000000000000',
  full_name = 'Admin User',
  email = 'admin@demo.com',
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- ON CONFLICT for username column alternative 
-- This handles the case where the username needs to be unique but might conflict
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = 'admin' AND id != '00000000-0000-0000-0000-000000000001') THEN
    UPDATE public.profiles
    SET username = 'admin_' || gen_random_uuid()
    WHERE id = '00000000-0000-0000-0000-000000000001';
  END IF;
END $$;

-- Create admin-specific table entries if needed
-- This is a placeholder - add any other tables needed for admin functionality

-- Output login credentials for reference
DO $$
BEGIN
  RAISE NOTICE '--------------------------------------';
  RAISE NOTICE 'Demo Admin Account Created:';
  RAISE NOTICE 'Email: admin@demo.com';
  RAISE NOTICE 'Password: admin123';
  RAISE NOTICE '--------------------------------------';
END $$; 