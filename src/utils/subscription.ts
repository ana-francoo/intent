import { supabase } from '../supabaseClient';

export interface SubscriptionStatus {
  hasAccess: boolean;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  subscriptionActive: boolean;
  planType: 'trial' | 'yearly' | 'expired';
}

// 2 weeks in milliseconds
// const TRIAL_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Get the user's subscription status and access level
 * DEVELOPMENT: Always returns pro subscription for testing
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  // DEVELOPMENT: Always return pro subscription status
  
  return {
    hasAccess: true,
    isTrialActive: false,
    trialEndsAt: null,
    daysRemaining: 365, // 1 year
    subscriptionActive: true,
    planType: 'yearly'
  };
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
 * Create Stripe Checkout session for yearly subscription
 */
export const createCheckoutSession = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call your backend API to create Stripe session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        priceId: process.env.VITE_STRIPE_YEARLY_PRICE_ID,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await response.json();
    
    // Redirect to Stripe Checkout
    window.open(url, '_blank');
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Handle successful subscription (called after Stripe webhook)
 */
export const handleSubscriptionSuccess = async (subscriptionId: string, customerId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update user subscription in database
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: 'active',
        plan_type: 'yearly',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }


    
  } catch (error) {
    console.error('Error handling subscription success:', error);
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

/**
 * Get trial progress percentage (0-100)
 */
export const getTrialProgress = (daysRemaining: number): number => {
  const totalTrialDays = 14;
  const daysUsed = totalTrialDays - daysRemaining;
  return Math.min(100, Math.max(0, (daysUsed / totalTrialDays) * 100));
}; 