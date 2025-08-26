import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from '@supabase/supabase-js';

interface FreeTrialStatus {
  studiesUsed: number;
  studiesRemaining: number;
  studiesLimit: number;
  canCreateStudy: boolean;
  isPremium: boolean;
  loading: boolean;
  subscriptionTier?: string | null;
  subscriptionEnd?: string | null;
}

export const useFreeTrial = (user: User | null) => {
  const [freeTrialStatus, setFreeTrialStatus] = useState<FreeTrialStatus>({
    studiesUsed: 0,
    studiesRemaining: 3,
    studiesLimit: 3,
    canCreateStudy: true,
    isPremium: false,
    loading: true,
    subscriptionTier: null,
    subscriptionEnd: null
  });

  const fetchFreeTrialStatus = async () => {
    if (!user) {
      setFreeTrialStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('free_studies_used, free_studies_limit, is_premium, subscription_status, subscription_plan')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        const studiesUsed = profile.free_studies_used || 0;
        const studiesLimit = profile.free_studies_limit || 3;
        const studiesRemaining = Math.max(0, studiesLimit - studiesUsed);
        const canCreateStudy = profile.is_premium || studiesUsed < studiesLimit;

        setFreeTrialStatus({
          studiesUsed,
          studiesRemaining,
          studiesLimit,
          canCreateStudy,
          isPremium: profile.is_premium || false,
          loading: false,
          subscriptionTier: profile.subscription_plan,
          subscriptionEnd: null
        });
      }
    } catch (error) {
      console.error("Error fetching free trial status:", error);
      setFreeTrialStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const incrementStudyCount = async (): Promise<boolean> => {
    if (!user || freeTrialStatus.isPremium) return true;

    try {
      // Use the database function to safely increment
      const { data, error } = await supabase.rpc('increment_free_studies_used', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        const updatedStatus = {
          studiesUsed: result.studies_used,
          studiesRemaining: result.studies_remaining,
          studiesLimit: freeTrialStatus.studiesLimit,
          canCreateStudy: !result.limit_reached || freeTrialStatus.isPremium,
          isPremium: freeTrialStatus.isPremium,
          loading: false,
          subscriptionTier: freeTrialStatus.subscriptionTier,
          subscriptionEnd: freeTrialStatus.subscriptionEnd
        };

        setFreeTrialStatus(updatedStatus);

        // Trigger webhook events for N8N
        if (result.limit_reached && !freeTrialStatus.isPremium) {
          // Free trial limit reached
          await triggerWebhookEvent('free_trial_limit_reached');
        } else {
          // Study completed
          await triggerWebhookEvent('study_completed');
        }

        return !result.limit_reached;
      }
      
      return true;
    } catch (error) {
      console.error("Error incrementing study count:", error);
      return false;
    }
  };

  const triggerWebhookEvent = async (eventType: string, additionalData: any = {}) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('trigger-n8n-webhook', {
        body: {
          eventType,
          userId: user.id,
          userData: {
            email: user.email,
            ...additionalData
          }
        }
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
    }
  };

  useEffect(() => {
    fetchFreeTrialStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      if (data) {
        setFreeTrialStatus(prev => ({
          ...prev,
          isPremium: data.subscribed || false,
          subscriptionTier: data.subscription_tier,
          subscriptionEnd: data.subscription_end
        }));
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const createCheckout = async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      return data?.url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      return data?.url;
    } catch (error) {
      console.error("Error opening customer portal:", error);
      return null;
    }
  };

  return {
    ...freeTrialStatus,
    incrementStudyCount,
    triggerWebhookEvent,
    refreshStatus: fetchFreeTrialStatus,
    checkSubscriptionStatus,
    createCheckout,
    openCustomerPortal
  };
};