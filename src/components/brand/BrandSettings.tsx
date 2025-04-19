import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Mail, Key, Bell, CheckCircle, XCircle, Send } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { updateBrandProfile } from '@/services/brand/brandService';

type BrandProfile = {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  industry?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

interface BrandSettingsProps {
  authUser: SupabaseUser | null;
  brandProfile: BrandProfile | null;
  onProfileUpdate?: () => void;
}

const BrandSettings: React.FC<BrandSettingsProps> = ({ 
  authUser,
  brandProfile,
  onProfileUpdate
}) => {
  const [formData, setFormData] = useState<Partial<BrandProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    console.log("[BrandSettings] useEffect triggered. brandProfile:", brandProfile);
    if (brandProfile) {
      setFormData(currentFormData => ({
        ...currentFormData,
        name: brandProfile.name || '',
        industry: brandProfile.industry || '',
        website: brandProfile.website || '',
        contact_phone: brandProfile.contact_phone || '',
        description: brandProfile.description || '',
      }));
      console.log("[BrandSettings] formData updated:", { 
          name: brandProfile.name, 
          industry: brandProfile.industry, 
          website: brandProfile.website, 
          contact_phone: brandProfile.contact_phone 
      });
    } else {
        console.log("[BrandSettings] brandProfile is null or undefined.");
    }
  }, [brandProfile]);

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!brandProfile?.id) {
      toast.error("Cannot save profile: Missing profile ID.");
      return;
    }
    setIsSaving(true);
    console.log('💾 Saving Profile Data:', formData);
    try {
      const dataToSave: Partial<BrandProfile> = {
        name: formData.name,
        industry: formData.industry,
        website: formData.website,
        contact_phone: formData.contact_phone,
        description: formData.description,
        updated_at: new Date().toISOString()
      };

      const updatedProfile = await updateBrandProfile(brandProfile.id, dataToSave);
      
      console.log("✅ Profile updated successfully in DB:", updatedProfile);
      toast.success('Profile updated successfully!');
      
      onProfileUpdate?.();

    } catch (error: any) {      
      console.error("Error saving profile:", error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!authUser?.email) {
      toast.error('Cannot resend verification: Email address not found.');
      return;
    }
    setIsResending(true);
    try {
      console.log(`📨 Resending verification email to: ${authUser.email}`);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: authUser.email
      });
      if (error) {
        throw error;
      }
      toast.success('Verification email sent! Please check your inbox (and spam folder).');
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      toast.error(`Failed to resend verification: ${error.message}`);
    } finally {
      setIsResending(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!authUser?.email) {
      toast.error('Cannot reset password: Email address not found.');
      return;
    }
    setIsResettingPassword(true);
    try {
      console.log(`🔑 Sending password reset email to: ${authUser.email}`);
      const redirectUrl = `${window.location.origin}/update-password`;
      console.log(`🔑 Using redirect URL: ${redirectUrl}`);
      const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          toast.error('Password reset email recently sent. Please wait before trying again.');
        } else {
          throw error;
        }
      } else {
        toast.success('Password reset email sent! Please check your inbox.');
      }
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast.error(`Failed to send password reset email: ${error.message}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!authUser || !brandProfile) {
    return (
      <div className="p-6 rounded-lg bg-black/40 border border-gray-800 text-center text-gray-400">
        Loading settings...
      </div>
    );
  }

  const isEmailVerified = !!authUser.email_confirmed_at;

  return (
    <div className="space-y-8">
      <section className="p-6 rounded-lg bg-black/40 border border-gray-800">
        <h3 className="text-xl font-bold mb-6">Account Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="brandName" className="block text-sm text-gray-400 mb-1">Brand Name</label>
              <input
                id="brandName"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-primary"
              />
            </div>
            
            <div>
              <label htmlFor="industryType" className="block text-sm text-gray-400 mb-1">Industry</label>
              <select
                id="industryType"
                value={formData.industry || ''}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="form-select"
              >
                <option value="">Select Industry...</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Fashion">Fashion</option>
                <option value="Technology">Technology</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Beauty">Beauty</option>
                <option value="Retail">Retail</option>
                <option value="Travel">Travel</option>
                <option value="Gaming">Gaming</option>
                <option value="Finance">Finance</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm text-gray-400 mb-1">Website</label>
              <input
                id="website"
                type="url"
                placeholder="https://yourbrand.com"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="input-primary"
              />
            </div>

             <div>
              <label htmlFor="contactPhone" className="block text-sm text-gray-400 mb-1">Contact Phone</label>
              <input
                id="contactPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.contact_phone || ''}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                className="input-primary"
              />
            </div>

             <div>
              <label htmlFor="description" className="block text-sm text-gray-400 mb-1">Brand Description (Optional)</label>
              <textarea
                id="description"
                rows={3}
                placeholder="Tell us a bit about your brand..."
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input-primary"
              />
            </div>
          </div>
          
          <div className="space-y-4 p-5 border border-gray-800 rounded-lg bg-black/20">
            <h4 className="font-medium text-lg mb-4">Brand Information</h4>
            <p className="text-sm text-gray-400">Update your brand's public details here.</p>
          </div>
        </div>
        
        <div className="mt-6 text-right">
           <button 
              className="btn-primary"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </section>
      
      <section className="p-6 rounded-lg bg-black/40 border border-gray-800">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Security Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 p-5 border border-gray-800 rounded-lg bg-black/20">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <h4 className="font-medium">Email Address</h4>
            </div>
            
            <p className="text-gray-300 break-all">{authUser.email}</p>
            
             <div className={`flex items-center gap-2 p-2 rounded ${isEmailVerified ? 'bg-green-900/30' : 'bg-yellow-900/30'}`}>
                {isEmailVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                    <XCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                )}
                 <span className={`text-sm ${isEmailVerified ? 'text-green-300' : 'text-yellow-300'}`}>
                    {isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                 </span>
             </div>

            {!isEmailVerified && (
                <button 
                    className="btn-secondary w-full"
                    onClick={handleResendVerification}
                    disabled={isResending}
                >
                    {isResending ? (
                        'Sending...'
                    ) : (
                        <><Send size={16} /> Resend Verification Email</>
                    )}
                </button>
            )}
          </div>
          
          <div className="space-y-4 p-5 border border-gray-800 rounded-lg bg-black/20">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-5 w-5 text-gray-400" />
              <h4 className="font-medium">Password</h4>
            </div>
            
            <p className="text-sm text-gray-500">To change your password, click the button below to send a password reset link to your email.</p>
            
            <button 
              className="btn-secondary w-full mt-2"
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
            >
              {isResettingPassword ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </div>
        </div>
      </section>
      
      <section className="p-6 rounded-lg bg-black/40 border border-gray-800">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Preferences (Placeholder)
        </h3>
        <p className="text-sm text-gray-500">Notification settings need to be implemented based on your specific requirements (e.g., storing preferences in the database).</p>
      </section>
    </div>
  );
};

export default BrandSettings;