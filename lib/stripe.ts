import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_live_...' || key === 'sk_test_...') {
    throw new Error('STRIPE_SECRET_KEY is not configured. Add it to your .env file.');
  }
  _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
  return _stripe;
}

export const STRIPE_PLANS: Record<string, { priceId: string; plan: string }> = {
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    plan: 'pro',
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    plan: 'enterprise',
  },
};

export function planFromPriceId(priceId: string): string {
  const entry = Object.values(STRIPE_PLANS).find((p) => p.priceId === priceId);
  return entry?.plan ?? 'free';
}
