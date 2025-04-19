-- Migration: Fix Creator RLS Policies
-- Purpose: Remove overly permissive public SELECT policy and add a specific policy for admins.
-- Affected Tables: public.creators

-- Drop the existing public SELECT policy
drop policy "Creators are viewable by everyone" on public.creators;

-- Allow admin users to view all creator profiles
create policy "Allow admin users to select all creators"
on public.creators
for select
to authenticated
using ( exists (select 1 from public.profiles where user_id = (select auth.uid()) and role = 'admin') ); 