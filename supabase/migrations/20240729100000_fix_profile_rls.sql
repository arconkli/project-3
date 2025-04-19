-- Migration: Fix Profile RLS Policies
-- Purpose: Remove overly permissive public SELECT policy and add specific policies for admins and authenticated users.
-- Affected Tables: public.profiles

-- Drop the existing public SELECT policy
drop policy "Public profiles are viewable by everyone" on public.profiles;

-- Allow authenticated users to view their own profile
create policy "Allow authenticated users to select own profile"
on public.profiles
for select
to authenticated
using ( (select auth.uid()) = user_id );

-- Allow admin users to view all profiles
create policy "Allow admin users to select all profiles"
on public.profiles
for select
to authenticated
using ( exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin') ); 