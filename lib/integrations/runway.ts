import type { ToolIntegration, UsageData } from './types';

export const runwayIntegration: ToolIntegration = {
  slug: 'runway',
  displayName: 'Runway',
  category: 'video',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch('https://api.runwayml.com/v1/credits', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? `Runway API error ${res.status}`);
    }

    const data = await res.json();
    return {
      creditsUsed:      data.used      ?? null,
      creditsRemaining: data.remaining ?? null,
      costToDate:       0,
      periodStart: start,
      periodEnd:   end,
    };
  },
};
