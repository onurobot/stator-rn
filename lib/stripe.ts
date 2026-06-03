import Stripe from 'stripe';

// Lazy-initialize to avoid constructor throw when STRIPE_SECRET_KEY is undefined at import time
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: '2026-05-27.dahlia' as any,
    });
  }
  return _stripe;
}

// Convenience accessor (lazy)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export function planFromPriceId(priceId: string): 'free' | 'pro' | 'team' | null {
  if (priceId === process.env.STRIPE_FREE_PRICE_ID) return 'free';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)  return 'pro';
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return 'team';
  return null;
}

export function toolLimit(plan: string): number {
  return plan === 'free' ? 3 : Infinity;
}

export function syncFrequency(plan: string): number {
  return plan === 'free' ? 24 : 1;
}

export function canUseWhatsApp(plan: string): boolean {
  return plan === 'pro' || plan === 'team';
}

export function canExportPdf(plan: string): boolean {
  return plan === 'pro' || plan === 'team';
}

export function reportHistoryMonths(plan: string): number {
  return plan === 'free' ? 0 : 12;
}
