export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Users table - extends Supabase auth users
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          email: string;
          phone: string | null;
          website: string | null;
          role: 'creator' | 'brand' | 'admin';
          status: 'active' | 'pending' | 'suspended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email: string;
          phone?: string | null;
          website?: string | null;
          role: 'creator' | 'brand' | 'admin';
          status?: 'active' | 'pending' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string;
          phone?: string | null;
          website?: string | null;
          role?: 'creator' | 'brand' | 'admin';
          status?: 'active' | 'pending' | 'suspended';
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Brands table
      brands: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          website: string | null;
          industry: string | null;
          company_size: string | null;
          location: string | null;
          contact_email: string;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          logo_url?: string | null;
          description?: string | null;
          website?: string | null;
          industry?: string | null;
          company_size?: string | null;
          location?: string | null;
          contact_email: string;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          logo_url?: string | null;
          description?: string | null;
          website?: string | null;
          industry?: string | null;
          company_size?: string | null;
          location?: string | null;
          contact_email?: string;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Creators table
      creators: {
        Row: {
          id: string;
          profile_id: string;
          bio: string | null;
          niche: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio?: string | null;
          niche?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          bio?: string | null;
          niche?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Campaigns table
      campaigns: {
        Row: {
          id: string;
          brand_id: string;
          title: string;
          description: string | null;
          content_type: 'original' | 'repurposed' | 'both';
          status: 'draft' | 'active' | 'pending_approval' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          budget: number;
          spent: number;
          start_date: string;
          end_date: string;
          platforms: string[];
          requirements: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          title: string;
          description?: string | null;
          content_type: 'original' | 'repurposed' | 'both';
          status?: 'draft' | 'active' | 'pending_approval' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          budget: number;
          spent?: number;
          start_date: string;
          end_date: string;
          platforms: string[];
          requirements?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          title?: string;
          description?: string | null;
          content_type?: 'original' | 'repurposed' | 'both';
          status?: 'draft' | 'active' | 'pending_approval' | 'approved' | 'completed' | 'rejected' | 'cancelled';
          budget?: number;
          spent?: number;
          start_date?: string;
          end_date?: string;
          platforms?: string[];
          requirements?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Campaign applications linking creators to campaigns
      campaign_creators: {
        Row: {
          id: string;
          campaign_id: string;
          creator_id: string;
          status: 'applied' | 'approved' | 'rejected' | 'completed';
          platforms: string[];
          metrics: Json | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          creator_id: string;
          status?: 'applied' | 'approved' | 'rejected' | 'completed';
          platforms: string[];
          metrics?: Json | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          creator_id?: string;
          status?: 'applied' | 'approved' | 'rejected' | 'completed';
          platforms?: string[];
          metrics?: Json | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Content submissions
      content_submissions: {
        Row: {
          id: string;
          campaign_id: string;
          creator_id: string;
          platform: string;
          content_type: 'original' | 'repurposed';
          content_url: string;
          thumbnail_url: string | null;
          title: string | null;
          description: string | null;
          status: 'submitted' | 'approved' | 'rejected';
          metrics: Json | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          creator_id: string;
          platform: string;
          content_type: 'original' | 'repurposed';
          content_url: string;
          thumbnail_url?: string | null;
          title?: string | null;
          description?: string | null;
          status?: 'submitted' | 'approved' | 'rejected';
          metrics?: Json | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          creator_id?: string;
          platform?: string;
          content_type?: 'original' | 'repurposed';
          content_url?: string;
          thumbnail_url?: string | null;
          title?: string | null;
          description?: string | null;
          status?: 'submitted' | 'approved' | 'rejected';
          metrics?: Json | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Platform connections
      platform_connections: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          platform_username: string;
          platform_id: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          metadata: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          platform_username: string;
          platform_id?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          metadata?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: string;
          platform_username?: string;
          platform_id?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          metadata?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      // Transactions
      transactions: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          content_id: string | null;
          type: 'payment' | 'refund' | 'deposit' | 'withdrawal';
          amount: number;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          payment_method: Json | null;
          description: string | null;
          reference_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_id?: string | null;
          content_id?: string | null;
          type: 'payment' | 'refund' | 'deposit' | 'withdrawal';
          amount: number;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          payment_method?: Json | null;
          description?: string | null;
          reference_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_id?: string | null;
          content_id?: string | null;
          type?: 'payment' | 'refund' | 'deposit' | 'withdrawal';
          amount?: number;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          payment_method?: Json | null;
          description?: string | null;
          reference_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    
    Views: {
      // Add any views you want to create here
    };
    
    Functions: {
      // Add any database functions you may need
    };
    
    Enums: {
      // Add any custom enums if needed
    };
  };
} 