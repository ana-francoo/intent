# Subscription System Setup Guide

This guide will help you set up the complete subscription system with 2-week free trials and Stripe integration.

## 🗃️ Database Setup (Supabase)

### 1. Create `user_subscriptions` Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create user_subscriptions table
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due')),
  plan_type TEXT NOT NULL DEFAULT 'yearly' CHECK (plan_type IN ('yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Enable RLS (Row Level Security)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
```

### 2. Set up Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration (add these to your existing .env)
VITE_STRIPE_YEARLY_PRICE_ID=price_your_stripe_price_id_here

# You'll also need these for your backend API (if you create one):
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 🛒 Stripe Setup

### 1. Create Stripe Account
- Sign up at [stripe.com](https://stripe.com)
- Get your API keys from the Dashboard

### 2. Create Product and Price
1. In Stripe Dashboard, go to **Products**
2. Create a new product: "Intent Pro Yearly"
3. Set price: $29.00 USD, recurring yearly
4. Copy the Price ID and add it to your `.env` file

### 3. Set up Webhooks (Optional but Recommended)
- Create webhook endpoint in Stripe Dashboard
- Add events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- Copy webhook secret to your `.env` file

## 🔧 Installation

### 1. Install Dependencies

```bash
npm install
```

This will install the new `@stripe/stripe-js` dependency we added.

### 2. Update Your Backend (If Needed)

You'll need a backend API endpoint at `/api/create-checkout-session` that:
1. Creates a Stripe Checkout session
2. Returns the session URL
3. Handles webhooks to update subscription status

Example backend endpoint:

```javascript
// Example Express.js endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  const { userId, email, priceId } = req.body;
  
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.CLIENT_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}`,
    metadata: {
      userId: userId
    }
  });

  res.json({ url: session.url });
});
```

## 🎯 How It Works

### Trial System
- **14-day free trial** starts when user creates account
- Uses `user.created_at` from Supabase Auth to calculate trial expiration
- No credit card required for trial

### Access Control
- Extension checks `hasExtensionAccess()` before allowing features
- Content scripts skip intention overlays if access expired
- PopoverDashboard shows subscription status and "Level up" button

### User Experience
1. **Days 1-11**: Full access, trial badge shown
2. **Days 12-14**: "Trial ending soon" warnings with upgrade prompts
3. **Day 15+**: Trial expired, show ExpiredAccess overlay
4. **After Payment**: Full access restored, "Intent Pro" badge shown

### Subscription States
- `trial`: Free trial active (< 14 days)
- `yearly`: Paid subscription active
- `expired`: Trial ended, no active subscription

## 🚨 Important Notes

### Security
- All subscription checks happen client-side for now
- Consider adding server-side verification for production
- RLS policies protect user subscription data

### Testing
- Use Stripe test mode during development
- Test trial expiration by temporarily modifying dates
- Verify access control works properly

### Production Considerations
- Set up proper error handling
- Add loading states for Stripe operations
- Implement proper webhook handling
- Consider adding usage analytics

## 🎨 UI Components

### ExpiredAccess Component
- Beautiful modal overlay when trial expires
- Shows pricing and features
- "Level Up to Intent Pro" button opens Stripe Checkout

### PopoverDashboard Updates
- Shows trial status and days remaining
- "Level Up" action item for trial users
- "Intent Pro" badge for subscribers

### Home Component Updates
- Checks subscription status on app load
- Shows ExpiredAccess overlay when needed
- Periodic subscription status checking

---

## 🚀 Quick Start

1. **Set up Supabase table** (run SQL above)
2. **Add Stripe credentials** to `.env`
3. **Run `npm install`** to get dependencies
4. **Create Stripe product** and get Price ID
5. **Test with your Stripe account**

Your subscription system is now ready! Users will get 14 days free, then need to upgrade to continue using Intent Pro features. 