# Backend Integration Setup Guide

This guide provides detailed steps to complete the backend integration and set up your admin account for the application.

## 1. Supabase Configuration

### 1.1 Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and log in or create an account
2. Create a new project with your preferred settings
3. Note down your project URL and public anon key (available in Project Settings > API)

### 1.2 Set Up Environment Variables

1. Create a `.env.local` file in the root directory of your project
2. Copy the contents from `.env.example`
3. Replace the placeholder values with your actual Supabase project URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-supabase-anon-key
   ```

## 2. Database Setup

### 2.1 Run the Migration Scripts

1. Go to your Supabase dashboard > SQL Editor
2. Create a new query
3. Copy the contents of `supabase/migrations/20240404_init.sql`
4. Run the query to set up all necessary tables with relationships and permissions

### 2.2 Create Admin Account

1. Go to your Supabase dashboard > SQL Editor
2. Create a new query
3. Copy the contents of `supabase/admin_account.sql`
4. Run the query to create a demo admin account with the following credentials:
   - Email: admin@demo.com
   - Password: admin123

## 3. Verify Integration

### 3.1 Run the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Verify that you can see the landing page

### 3.2. Test Admin Access

1. Navigate to the login page [http://localhost:3000/login](http://localhost:3000/login)
2. Log in using the admin credentials:
   - Email: admin@demo.com
   - Password: admin123
3. Verify that you can access the admin dashboard

## 4. Troubleshooting

### 4.1 Database Connection Issues

If you encounter database connection issues:

1. Check that your `.env.local` file has the correct Supabase URL and anon key
2. Ensure that the Supabase project is active and accessible
3. Check the browser console for any specific error messages

### 4.2 Login Issues

If you cannot log in with the admin account:

1. Verify that the admin_account.sql script ran successfully without errors
2. Try resetting the password through the Supabase Authentication dashboard
3. Check the RLS policies in Supabase to ensure they're not restricting access

### 4.3 API Errors

If you see API errors in the console:

1. Check that the database schema matches what's expected by the application
2. Verify that the SQL migrations ran correctly and all required tables exist
3. Look for specific error messages that might indicate missing columns or relationships

## 5. Next Steps

After completing the backend integration:

1. Create some test campaigns to verify the full functionality
2. Add platform connections to test social media integration features
3. Consider creating additional user accounts with creator and brand roles to test different workflows

For any persistent issues, check the browser console for specific error messages and review the Supabase logs in the dashboard. 