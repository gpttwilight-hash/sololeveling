-- ============================================================
-- Migration: 003_add_subscriptions.sql
-- Adds support for Hunter and Monarch subscription tiers
-- ============================================================

-- Add subscription fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'hunter' CHECK (subscription_tier IN ('hunter', 'monarch'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for checking subscription status efficiently
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier, subscription_status);
