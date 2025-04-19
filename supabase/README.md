# Supabase Database Setup

This directory contains migration scripts for setting up the Supabase database schema and creating admin accounts.

## Initial Database Setup

To set up the database schema, run the migration in `migrations/20240404_init.sql` through the Supabase dashboard:

1. Log in to your Supabase project dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `migrations/20240404_init.sql`
5. Run the query

This will create all required tables with appropriate relationships and permissions.

## Adding Demo Admin Account

To add a demo admin account for testing purposes, run the admin account script:

1. Log in to your Supabase project dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `admin_account.sql`
5. Run the query

This will create a demo admin account with the following credentials:

- Email: admin@demo.com
- Password: admin123

You can use this account to log in to the admin panel and manage the application.

## Important Security Note

The demo admin account has full admin privileges. In a production environment, it is recommended to:

1. Use a more secure password
2. Delete or disable the demo account after initial setup
3. Create individual admin accounts for each administrator

## Troubleshooting

If you encounter any issues with the scripts:

1. Make sure the migration script has been run first before adding the admin account
2. Check for any error messages in the SQL Editor console
3. Verify that the UUIDs used in the admin_account.sql script are unique and do not conflict with existing records 