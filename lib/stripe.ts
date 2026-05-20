import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export const STRIPE_PLANS: Record<string, { priceId: string; plan: string }> = {
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    plan: 'pro',
  },
  enterprise: {
    priceId: process.env.STRIPE_PRICE_ENTERPRISE!,
    plan: 'enterprise',
  },
};

export function planFromPriceId(priceId: string): string {
  const entry = Object.values(STRIPE_PLANS).find((p) => p.priceId === priceId);
  return entry?.plan ?? 'free';
}
