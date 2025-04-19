import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './useAuth';
import { completeNewBrandSetup } from '@/services/auth/authService';

/**
 * Hook to automatically check and fix brand record status
 * This runs on brand dashboard components to ensure all required records exist
 */
export const useBrandStatus = () => {
  const { user } = useAuth();
  const [statusChecked, setStatusChecked] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);
  const [brandId, setBrandId] = useState<string | null>(null);

  useEffect(() => {
    const checkAndFixBrandStatus = async () => {
      if (!user || statusChecked) return;
      
      console.log('[BRAND STATUS] Checking brand setup status for user:', user.id);
      
      try {
        // First check if user has a complete brand setup
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (profileError) {
          console.error('[BRAND STATUS] Error checking profile:', profileError);
          return;
        }
        
        if (profileData.role !== 'brand') {
          console.log('[BRAND STATUS] User is not a brand account');
          setStatusChecked(true);
          return;
        }
        
        // Check for "pending" status
        if (profileData.status === 'pending') {
          console.log('[BRAND STATUS] Found pending brand profile, fixing...');
          
          // Update profile to active
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', profileData.id);
            
          if (updateError) {
            console.error('[BRAND STATUS] Error updating profile status:', updateError);
          } else {
            console.log('[BRAND STATUS] Successfully updated profile status to active');
            setFixApplied(true);
          }
        }
        
        // Check if brand record exists
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('profile_id', profileData.id);
          
        if (brandError) {
          console.error('[BRAND STATUS] Error checking brand record:', brandError);
        } else if (!brandData || brandData.length === 0) {
          console.log('[BRAND STATUS] Brand record missing, will attempt to fix');
          
          // Run the complete setup function
          const setupResult = await completeNewBrandSetup(user.id, {
            full_name: profileData.full_name,
            email: profileData.email
          });
          
          if (setupResult.success) {
            console.log('[BRAND STATUS] Successfully created missing brand record:', setupResult);
            setBrandId(setupResult.brandId);
            setFixApplied(true);
          } else {
            console.error('[BRAND STATUS] Failed to create brand record:', setupResult.error);
          }
        } else {
          console.log('[BRAND STATUS] Found existing brand record:', brandData[0]);
          setBrandId(brandData[0].id);
          
          // Check brand_users link
          const { data: linkData, error: linkError } = await supabase
            .from('brand_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('brand_id', brandData[0].id);
            
          if (linkError) {
            console.error('[BRAND STATUS] Error checking brand_users link:', linkError);
          } else if (!linkData || linkData.length === 0) {
            console.log('[BRAND STATUS] Missing brand_users link, creating...');
            
            // Create link
            const { error: createLinkError } = await supabase
              .from('brand_users')
              .insert({
                user_id: user.id,
                brand_id: brandData[0].id,
                role: 'owner',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (createLinkError) {
              console.error('[BRAND STATUS] Error creating brand_users link:', createLinkError);
            } else {
              console.log('[BRAND STATUS] Successfully created brand_users link');
              setFixApplied(true);
            }
          } else {
            console.log('[BRAND STATUS] Brand_users link exists:', linkData[0]);
          }
        }
      } catch (error) {
        console.error('[BRAND STATUS] Exception in brand status check:', error);
      } finally {
        setStatusChecked(true);
      }
    };
    
    checkAndFixBrandStatus();
  }, [user, statusChecked]);
  
  return { statusChecked, fixApplied, brandId };
}; 