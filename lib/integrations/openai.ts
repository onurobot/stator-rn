import type { ToolIntegration, UsageData } from './types';

export const openaiIntegration: ToolIntegration = {
  slug: 'openai',
  displayName: 'OpenAI',
  category: 'text',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const year  = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const start = `${year}-${month}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch(
      `https://api.openai.com/v1/usage?start_date=${start}&end_date=${end}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `OpenAI API error ${res.status}`);
    }

    const data = await res.json();
    // total_usage is in units of 0.0001 USD (1/100 cent)
    const costToDate = (data.total_usage ?? 0) / 10000;

    return {
      creditsUsed:      null,
      creditsRemaining: null,
      costToDate,
      periodStart: start,
      periodEnd:   end,
    };
  },
};
