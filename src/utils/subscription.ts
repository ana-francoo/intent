import { supabase } from '../supabaseClient';

export interface SubscriptionStatus {
  hasAccess: boolean;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  subscriptionActive: boolean;
  planType: 'trial' | 'monthly' | 'expired';
  currentPeriodEnd: Date | null;
}

const POLAR_PRODUCT_ID = import.meta.env.VITE_POLAR_PRODUCT_ID || '9d05c24b-68af-4545-84c9-db4dc75c871c';
const CHECKOUT_URL = import.meta.env.VITE_CHECKOUT_URL || 'https://useintent.app/api/checkout';

/**
 * Get the user's subscription status and access level from profiles table
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        hasAccess: false,
        isTrialActive: false,
        trialEndsAt: null,
        daysRemaining: 0,
        subscriptionActive: false,
        planType: 'expired',
        currentPeriodEnd: null
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 day trial

      await supabase
        .from('profiles')
        .insert({
          id: user.id,
          subscription_status: 'trialing',
          trial_end: trialEndDate.toISOString(),
        });

      return {
        hasAccess: true,
        isTrialActive: true,
        trialEndsAt: trialEndDate,
        daysRemaining: 14,
        subscriptionActive: false,
        planType: 'trial',
        currentPeriodEnd: null
      };
    }

    const now = new Date();
    
    const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null;
    const isTrialActive = trialEnd && trialEnd > now;
    
    const currentPeriodEnd = profile.current_period_end ? new Date(profile.current_period_end) : null;
    const hasActiveSubscription = 
      profile.subscription_status === 'active' && 
      currentPeriodEnd && 
      currentPeriodEnd > now;

    let daysRemaining = 0;
    if (isTrialActive && trialEnd) {
      daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (hasActiveSubscription && currentPeriodEnd) {
      daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const hasAccess = isTrialActive || hasActiveSubscription;
    
    let planType: 'trial' | 'monthly' | 'expired' = 'expired';
    if (isTrialActive) {
      planType = 'trial';
    } else if (hasActiveSubscription) {
      planType = 'monthly';
    }

    return {
      hasAccess,
      isTrialActive: isTrialActive || false,
      trialEndsAt: trialEnd,
      daysRemaining,
      subscriptionActive: hasActiveSubscription || false,
      planType,
      currentPeriodEnd
    };
    
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      hasAccess: false,
      isTrialActive: false,
      trialEndsAt: null,
      daysRemaining: 0,
      subscriptionActive: false,
      planType: 'expired',
      currentPeriodEnd: null
    };
  }
};

/**
 * Check if user has access to the extension
 * Returns false if trial expired and no active subscription
 */
export const hasExtensionAccess = async (): Promise<boolean> => {
  const status = await getSubscriptionStatus();
  return status.hasAccess;
};

/**
 * Redirect to Polar Checkout for monthly subscription
 */
export const createPolarCheckout = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const checkoutUrl = `${CHECKOUT_URL}?` +
      `products=${POLAR_PRODUCT_ID}&` +
      `customerExternalId=${user.id}&` +
      `customerEmail=${encodeURIComponent(user.email || '')}`;
    
    console.log('Redirecting to Polar checkout:', checkoutUrl);
    
    window.open(checkoutUrl, '_blank');
    
    return checkoutUrl;
    
  } catch (error) {
    console.error('Error creating Polar checkout:', error);
    throw error;
  }
};

/**
 * Format remaining time for display
 */
export const formatTimeRemaining = (daysRemaining: number): string => {
  if (daysRemaining <= 0) {
    return 'Trial expired';
  } else if (daysRemaining === 1) {
    return '1 day remaining';
  } else {
    return `${daysRemaining} days remaining`;
  }
}; 