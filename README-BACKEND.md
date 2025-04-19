# Backend Setup Instructions

This project uses Supabase for its backend. Follow these instructions to set up your database and API.

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/migrations/20240404_init.sql` into the SQL editor
4. Run the script to create all necessary tables and set up Row Level Security policies

## Environment Variables

Make sure you have the following environment variables in your `.env.local` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under Project Settings > API.

## Available API Models

Our backend is structured around the following models:

- **Auth**: User authentication and profile management
- **Brands**: Brand profiles and information
- **Creators**: Creator profiles and information
- **Campaigns**: Campaign management
- **Content**: Content submissions and management
- **Platforms**: Social media platform connections
- **Transactions**: Financial transactions

## Usage Examples

### Authentication

```typescript
import { signIn, signUp } from '@/lib/models';

// Sign up a new user
const { user, profile } = await signUp('email@example.com', 'password', {
  full_name: 'John Doe',
  role: 'creator'
});

// Sign in a user
const { session, user } = await signIn('email@example.com', 'password');
```

### Creating a Campaign

```typescript
import { createCampaign } from '@/lib/models';

const { campaign } = await createCampaign({
  brand_id: 'brand-uuid',
  title: 'My Campaign',
  description: 'Campaign description',
  content_type: 'both',
  budget: 5000,
  start_date: '2023-05-01T00:00:00Z',
  end_date: '2023-06-01T00:00:00Z',
  platforms: ['instagram', 'tiktok'],
  requirements: {
    contentGuidelines: ['Keep it family friendly', 'Mention the product name'],
    hashtags: {
      original: '#brandcampaign',
      repurposed: '#brandcampaignrepost'
    }
  }
});
```

### Getting Campaign Data

```typescript
import { getCampaigns } from '@/lib/models';

// Get active campaigns with pagination and filtering
const { campaigns, pagination } = await getCampaigns({
  page: 1,
  limit: 10,
  status: 'active',
  platform: 'instagram'
});
```

## Data Models

For detailed type definitions of all data models, refer to `src/types/database.types.ts`.

For documentation on all available API functions, see the corresponding files in `src/lib/models/`.

## Row Level Security

All tables have Row Level Security (RLS) policies applied, ensuring that:

- Users can only access their own data
- Public data is appropriately exposed
- Admins have additional permissions where needed

These policies are defined in the migration SQL file and are automatically applied when you run the database setup.

## Troubleshooting

If you encounter issues with database connectivity:

1. Check your environment variables are correctly set
2. Ensure your Supabase project is active
3. Verify your IP address is not blocked in the Supabase dashboard
4. Check browser console for any CORS-related errors 