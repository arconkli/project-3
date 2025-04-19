-- Migration: Add metrics column to campaigns table
-- Adds a JSONB column to store various campaign performance metrics.

alter table public.campaigns
add column metrics jsonb default '{}'::jsonb;

comment on column public.campaigns.metrics is 'Stores campaign metrics like views, engagement, creator counts, etc.'; 