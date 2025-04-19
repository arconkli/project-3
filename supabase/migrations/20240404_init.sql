-- Create the profiles table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  role TEXT NOT NULL CHECK (role IN ('creator', 'brand', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies for brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands are viewable by everyone"
  ON brands FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own brand"
  ON brands FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = profile_id
  ));

CREATE POLICY "Users can update their own brand"
  ON brands FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = profile_id
  ));

CREATE POLICY "Users can delete their own brand"
  ON brands FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = profile_id
  ));

-- Create creators table
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bio TEXT,
  niche TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies for creators
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators are viewable by everyone"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own creator profile"
  ON creators FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = profile_id
  ));

CREATE POLICY "Users can update their own creator profile"
  ON creators FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = profile_id
  ));

CREATE POLICY "Users can delete their own creator profile"
  ON creators FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM profiles WHERE id = profile_id
  ));

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('original', 'repurposed', 'both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'pending_approval', 'approved', 'completed', 'rejected', 'cancelled')),
  budget DECIMAL(10, 2) NOT NULL,
  spent DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies for campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns are viewable by everyone"
  ON campaigns FOR SELECT
  USING (true);

CREATE POLICY "Brand owners can insert campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN brands b ON p.id = b.profile_id 
    WHERE b.id = brand_id
  ));

CREATE POLICY "Brand owners can update campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN brands b ON p.id = b.profile_id 
    WHERE b.id = brand_id
  ));

CREATE POLICY "Brand owners can delete campaigns"
  ON campaigns FOR DELETE
  USING (auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN brands b ON p.id = b.profile_id 
    WHERE b.id = brand_id
  ));

-- Create campaign_creators join table
CREATE TABLE IF NOT EXISTS campaign_creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'approved', 'rejected', 'completed')),
  platforms TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, creator_id)
);

-- Create RLS policies for campaign_creators
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign creator entries are viewable by everyone"
  ON campaign_creators FOR SELECT
  USING (true);

CREATE POLICY "Creators can apply to campaigns"
  ON campaign_creators FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN creators c ON p.id = c.profile_id 
    WHERE c.id = creator_id
  ));

CREATE POLICY "Brand owners and creators can update campaign_creators"
  ON campaign_creators FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p 
      JOIN creators c ON p.id = c.profile_id 
      WHERE c.id = creator_id
    ) OR 
    auth.uid() IN (
      SELECT p.user_id FROM profiles p 
      JOIN brands b ON p.id = b.profile_id 
      JOIN campaigns camp ON b.id = camp.brand_id 
      WHERE camp.id = campaign_id
    )
  );

-- Create content_submissions table
CREATE TABLE IF NOT EXISTS content_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('original', 'repurposed')),
  content_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  metrics JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies for content_submissions
ALTER TABLE content_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content submissions are viewable by everyone"
  ON content_submissions FOR SELECT
  USING (true);

CREATE POLICY "Creators can submit content"
  ON content_submissions FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN creators c ON p.id = c.profile_id 
    WHERE c.id = creator_id
  ));

CREATE POLICY "Brand owners and content creators can update submissions"
  ON content_submissions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM profiles p 
      JOIN creators c ON p.id = c.profile_id 
      WHERE c.id = creator_id
    ) OR 
    auth.uid() IN (
      SELECT p.user_id FROM profiles p 
      JOIN brands b ON p.id = b.profile_id 
      JOIN campaigns camp ON b.id = camp.brand_id 
      WHERE camp.id = campaign_id
    )
  );

-- Create platform_connections table
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  platform_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, platform, platform_username)
);

-- Create RLS policies for platform_connections
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own platform connections"
  ON platform_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform connections"
  ON platform_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform connections"
  ON platform_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platform connections"
  ON platform_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  content_id UUID REFERENCES content_submissions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'deposit', 'withdrawal')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method JSONB DEFAULT '{}'::jsonb,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create RLS policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    ) OR
    (auth.uid() = user_id AND type IN ('deposit', 'withdrawal'))
  );

CREATE POLICY "Admin can update transactions"
  ON transactions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );

-- Create functions for real-time subscriptions

-- Function to handle profile changes
CREATE OR REPLACE FUNCTION public.handle_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile updates
CREATE TRIGGER profile_update_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION handle_profile_change();

-- Function to handle new user creation (from auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'creator'),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user sign ups
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 