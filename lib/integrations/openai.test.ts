import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openaiIntegration } from './openai';

describe('openaiIntegration', () => {
  it('has correct slug and category', () => {
    expect(openaiIntegration.slug).toBe('openai');
    expect(openaiIntegration.category).toBe('text');
  });

  it('throws on 401 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    } as any);
    await expect(openaiIntegration.fetchUsage('bad-key')).rejects.toThrow('Invalid API key');
  });

  it('maps API response to UsageData', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ cost: 5.42 }],
        total_usage: 54200, // 54200 / 10000 = $5.42
      }),
    } as any);
    const result = await openaiIntegration.fetchUsage('sk-test');
    expect(result.costToDate).toBeCloseTo(5.42, 1);
    expect(result.creditsUsed).toBeNull();
    expect(result.creditsRemaining).toBeNull();
    expect(result.periodStart).toMatch(/^\d{4}-\d{2}-01$/);
    expect(result.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
