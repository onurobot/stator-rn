import { describe, it, expect } from 'vitest';
import { planFromPriceId, toolLimit, syncFrequency } from './stripe';

describe('plan helpers', () => {
  it('maps price IDs to plan names', () => {
    process.env.STRIPE_FREE_PRICE_ID = 'price_free';
    process.env.STRIPE_PRO_PRICE_ID  = 'price_pro';
    process.env.STRIPE_TEAM_PRICE_ID = 'price_team';
    expect(planFromPriceId('price_free')).toBe('free');
    expect(planFromPriceId('price_pro')).toBe('pro');
    expect(planFromPriceId('price_team')).toBe('team');
    expect(planFromPriceId('price_unknown')).toBeNull();
  });

  it('returns correct tool limits per plan', () => {
    expect(toolLimit('free')).toBe(3);
    expect(toolLimit('pro')).toBe(Infinity);
    expect(toolLimit('team')).toBe(Infinity);
  });

  it('returns correct sync frequency in hours', () => {
    expect(syncFrequency('free')).toBe(24);
    expect(syncFrequency('pro')).toBe(1);
    expect(syncFrequency('team')).toBe(1);
  });
});
