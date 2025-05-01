-- migration: create_social_platform_integration_schema_with_vault
-- purpose: Creates tables for managing social platform connections, content, metrics, and audience data, using Vault for token encryption. Drops existing platform_connections table.
-- affected_tables: platform_connections, content, content_metrics, audience_demographics

begin;

-- Drop existing table if it exists to ensure a clean slate
drop table if exists public.platform_connections cascade;

-- Ensure Vault and pgsodium are available (usually handled by Supabase)
-- Enable UUID generation if not already enabled
create extension if not exists "uuid-ossp";

-- ========= Table: platform_connections =========
-- Stores connection details for user-linked social media accounts. Tokens are stored securely in Vault.

create table public.platform_connections (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    platform text not null check (platform in ('tiktok', 'instagram', 'youtube', 'x')), -- Add other platforms as needed
    platform_user_id text not null, -- User's unique ID on the specific platform
    platform_username text, -- User's username/handle on the platform
    access_token_secret_id uuid not null references vault.secrets(id) on delete cascade, -- Reference to the encrypted access token in Vault
    refresh_token_secret_id uuid references vault.secrets(id) on delete cascade, -- Reference to the encrypted refresh token in Vault (nullable)
    token_expires_at timestamptz, -- Timestamp when the access token expires
    scopes text[], -- List of permissions (scopes) granted by the user
    metadata jsonb, -- For storing extra platform-specific connection info (e.g., profile picture URL)
    is_active boolean not null default true, -- Flag to indicate if the connection is currently active/usable
    last_synced_at timestamptz, -- Timestamp of the last successful data sync for this connection
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- Ensure a user can only connect one account per platform
    unique (user_id, platform)
);

comment on table public.platform_connections is 'Stores connection details for user-linked social media accounts. Tokens are stored securely in Vault.';
comment on column public.platform_connections.platform_user_id is 'User''s unique ID on the specific platform.';
comment on column public.platform_connections.access_token_secret_id is 'UUID referencing the encrypted access token in vault.secrets.';
comment on column public.platform_connections.refresh_token_secret_id is 'UUID referencing the encrypted refresh token in vault.secrets (nullable).';
comment on column public.platform_connections.scopes is 'List of permissions (scopes) granted by the user during OAuth.';
comment on column public.platform_connections.metadata is 'Extra platform-specific connection info (e.g., profile picture URL).';
comment on column public.platform_connections.is_active is 'Indicates if the connection is currently active and tokens are valid.';
comment on column public.platform_connections.last_synced_at is 'Timestamp of the last successful data sync for this connection.';

-- Enable RLS
alter table public.platform_connections enable row level security;

-- Policies: Users can manage their own connections
create policy "Allow users to manage their own platform connections"
on public.platform_connections for all
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

-- Index for faster lookups by user_id
create index idx_platform_connections_user_id on public.platform_connections(user_id);
-- Index for potential lookups by secret IDs (might be useful for maintenance)
create index idx_platform_connections_access_token_secret_id on public.platform_connections(access_token_secret_id);
create index idx_platform_connections_refresh_token_secret_id on public.platform_connections(refresh_token_secret_id);


-- ========= Table: content =========
-- Stores information about individual pieces of content (videos, posts) from connected platforms.

create table public.content (
    id uuid primary key default uuid_generate_v4(),
    platform_connection_id uuid not null references public.platform_connections(id) on delete cascade,
    campaign_id uuid references public.campaigns(id) on delete set null, -- Link to the campaign this content might belong to
    platform_content_id text not null, -- Unique ID of the content on the specific platform
    type text not null check (type in ('video', 'reel', 'short', 'story', 'image_post', 'carousel_post', 'text_post')), -- Content type
    status text not null default 'published' check (status in ('published', 'draft', 'archived', 'deleted', 'processing')), -- Status of the content
    content_url text, -- Direct URL to the content on the platform
    embed_url text, -- URL for embedding the content, if available
    thumbnail_url text, -- URL of the content's thumbnail image
    caption text, -- Caption or description of the content
    hashtags text[], -- List of hashtags used
    mentions text[], -- List of users mentioned
    duration_seconds integer, -- Duration for video/audio content
    published_at timestamptz, -- Timestamp when the content was published
    platform_specific_data jsonb, -- For fields unique to a platform (e.g., TikTok cover_image_url, YT categoryId)
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- Ensure content is unique per platform connection
    unique (platform_connection_id, platform_content_id)
);

comment on table public.content is 'Stores information about individual pieces of content (videos, posts) from connected platforms.';
comment on column public.content.campaign_id is 'Optional foreign key linking content to a specific campaign.';
comment on column public.content.platform_content_id is 'Unique ID of the content on the specific platform.';
comment on column public.content.type is 'Type of content (e.g., video, reel, short, image_post).';
comment on column public.content.status is 'Status of the content on the platform (e.g., published, deleted).';
comment on column public.content.platform_specific_data is 'JSONB field for data unique to specific platforms.';

-- Enable RLS
alter table public.content enable row level security;

-- Policies: Users can view content linked to their platform connections
create policy "Allow users to view their own content"
on public.content for select
to authenticated
using (
    exists (
        select 1 from public.platform_connections pc
        where pc.id = content.platform_connection_id
        and pc.user_id = auth.uid()
    )
);
-- Policies for content linked to campaigns might need brand/admin access too - add later if needed.

-- Indexes for faster lookups
create index idx_content_platform_connection_id on public.content(platform_connection_id);
create index idx_content_campaign_id on public.content(campaign_id); -- Index for campaign-related queries
create index idx_content_platform_content_id on public.content(platform_content_id);
create index idx_content_published_at on public.content(published_at desc);


-- ========= Table: content_metrics =========
-- Stores time-series performance metrics for each piece of content.

create table public.content_metrics (
    id bigserial primary key,
    content_id uuid not null references public.content(id) on delete cascade,
    timestamp timestamptz not null default now(), -- Timestamp when these metrics were recorded/fetched
    views bigint,
    likes bigint,
    comments bigint,
    shares bigint,
    saves bigint, -- Common on Instagram/TikTok
    reach bigint, -- Estimated unique accounts reached (if available)
    impressions bigint, -- Total times content was displayed (if available)
    engagement_rate numeric(6, 4), -- (Likes + Comments + Shares + Saves) / Views or Impressions (if available)
    video_avg_watch_duration_seconds numeric, -- Average view duration for videos (if available)
    video_total_watch_time_minutes numeric, -- Total watch time for videos (if available)
    subscribers_gained integer, -- Subscribers gained from this content (YouTube specific, mostly)
    platform_specific_metrics jsonb, -- For metrics unique to a platform (e.g., TikTok unique_viewers, YT CTR)
    created_at timestamptz not null default now(),
    -- Ensure only one metrics entry per content item per timestamp (or per hour/day)
    unique (content_id, timestamp) -- Adjust timestamp precision/bucketing if needed (e.g., date_trunc('hour', timestamp))
);

comment on table public.content_metrics is 'Stores time-series performance metrics for each piece of content.';
comment on column public.content_metrics.timestamp is 'Timestamp when these metrics were recorded/fetched.';
comment on column public.content_metrics.engagement_rate is 'Calculated or API-provided engagement rate.';
comment on column public.content_metrics.platform_specific_metrics is 'JSONB field for metrics unique to specific platforms.';

-- Enable RLS
alter table public.content_metrics enable row level security;

-- Policies: Users can view metrics for their own content
create policy "Allow users to view metrics for their own content"
on public.content_metrics for select
to authenticated
using (
    exists (
        select 1
        from public.content c
        join public.platform_connections pc on c.platform_connection_id = pc.id
        where c.id = content_metrics.content_id
        and pc.user_id = auth.uid()
    )
);
-- Policies for metrics linked to campaigns might need brand/admin access too - add later if needed.

-- Indexes for faster lookups
create index idx_content_metrics_content_id_timestamp on public.content_metrics(content_id, timestamp desc);


-- ========= Table: audience_demographics =========
-- Stores aggregated audience demographic data per connected platform account.

create table public.audience_demographics (
    id bigserial primary key,
    platform_connection_id uuid not null references public.platform_connections(id) on delete cascade,
    timestamp timestamptz not null default now(), -- Timestamp when this demographic data was fetched/valid for
    data_period_days integer not null default 28, -- Period the data covers (e.g., 7, 28, 90 days)
    audience_size bigint, -- Total followers/subscribers at the time of snapshot
    gender_distribution jsonb, -- e.g., {"male": 0.45, "female": 0.55, "unknown": 0.0}
    age_distribution jsonb, -- e.g., {"13-17": 0.10, "18-24": 0.35, ...}
    top_countries jsonb, -- e.g., [{"code": "US", "percentage": 0.60}, {"code": "CA", "percentage": 0.15}]
    top_cities jsonb, -- e.g., [{"name": "New York, US", "percentage": 0.05}, ...]
    platform_specific_demographics jsonb, -- For other demographic data points unique to platforms
    created_at timestamptz not null default now(),
    -- Ensure only one entry per platform connection per timestamp (or day/month)
    unique (platform_connection_id, timestamp) -- Adjust timestamp precision if needed
);

comment on table public.audience_demographics is 'Stores aggregated audience demographic data per connected platform account.';
comment on column public.audience_demographics.timestamp is 'Timestamp when this demographic data was fetched/valid for.';
comment on column public.audience_demographics.data_period_days is 'The time period (in days) the demographic data represents (e.g., 7, 28).';
comment on column public.audience_demographics.gender_distribution is 'JSONB storing gender breakdown percentages.';
comment on column public.audience_demographics.age_distribution is 'JSONB storing age range breakdown percentages.';
comment on column public.audience_demographics.top_countries is 'JSONB array storing top countries by audience percentage.';
comment on column public.audience_demographics.top_cities is 'JSONB array storing top cities by audience percentage.';
comment on column public.audience_demographics.platform_specific_demographics is 'JSONB field for demographic data unique to specific platforms.';

-- Enable RLS
alter table public.audience_demographics enable row level security;

-- Policies: Users can view their own audience demographics
create policy "Allow users to view their own audience demographics"
on public.audience_demographics for select
to authenticated
using (
    exists (
        select 1 from public.platform_connections pc
        where pc.id = audience_demographics.platform_connection_id
        and pc.user_id = auth.uid()
    )
);

-- Indexes for faster lookups
create index idx_audience_demographics_platform_connection_id_timestamp on public.audience_demographics(platform_connection_id, timestamp desc);


-- Add trigger function to update 'updated_at' columns automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security invoker set search_path = ''; -- Use SECURITY INVOKER

-- Apply the trigger to tables with 'updated_at'
create trigger on_platform_connections_update
before update on public.platform_connections
for each row execute function public.handle_updated_at();

create trigger on_content_update
before update on public.content
for each row execute function public.handle_updated_at();

commit; 