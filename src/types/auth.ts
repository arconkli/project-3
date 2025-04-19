/**
 * User role types for the application
 */
export enum UserRole {
  CREATOR = 'creator',
  BRAND = 'brand',
  ADMIN = 'admin'
}

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;  // This is the primary key that references auth.users(id)
  user_id: string;  // This is also a reference to auth.users(id)
  full_name: string;
  avatar_url?: string;
  bio?: string;
  username?: string;
  website?: string;
  email: string;
  phone?: string;
  phone_verified?: boolean;
  status?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Brand profile interface
 */
export interface BrandProfile {
  id: string;
  brand_id: string;
  title?: string;
  bio?: string;
  status?: string;
  content_type?: string;
  budget?: number;
  spent?: number;
  start_date?: string;
  end_date?: string;
  metrics?: any;
  requirements?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Brand interface
 */
export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  contact_email: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Platform connection interface
 */
export interface PlatformConnection {
  id: string;
  user_id: string;
  platform: string;
  platform_username: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 