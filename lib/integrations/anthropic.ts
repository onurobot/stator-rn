import type { ToolIntegration, UsageData } from './types';

export const anthropicIntegration: ToolIntegration = {
  slug: 'anthropic',
  displayName: 'Anthropic (Claude)',
  category: 'text',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch('https://api.anthropic.com/v1/usage', {
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Anthropic API error ${res.status}`);
    }

    const data = await res.json();
    const costToDate = (data.total_cost_cents ?? 0) / 100;

    return {
      creditsUsed:      data.input_tokens  ?? null,
      creditsRemaining: null,
      costToDate,
      periodStart: start,
      periodEnd:   end,
    };
  },
};
