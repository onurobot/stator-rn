import type { ToolIntegration, UsageData } from './types';

export const elevenlabsIntegration: ToolIntegration = {
  slug: 'elevenlabs',
  displayName: 'ElevenLabs',
  category: 'audio',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.detail ?? `ElevenLabs API error ${res.status}`);
    }

    const data = await res.json();
    const used      = data.character_count         ?? 0;
    const limit     = data.character_limit         ?? null;
    const remaining = limit !== null ? limit - used : null;

    return {
      creditsUsed:      used,
      creditsRemaining: remaining,
      costToDate:       0,
      periodStart: start,
      periodEnd:   end,
    };
  },
};
