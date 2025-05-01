-- migration: add_notification_preferences_to_profiles
-- purpose: Adds a column to store user notification preferences.
-- affected_tables: public.profiles

-- Add the notification_preferences column to the profiles table
alter table public.profiles
add column notification_preferences jsonb default '{}'::jsonb;

-- Add a comment to describe the new column
comment on column public.profiles.notification_preferences is 'Stores user preferences for various notification types.'; 