import type { ToolIntegration, UsageData } from './types';

export const midjourneyIntegration: ToolIntegration = {
  slug: 'midjourney',
  displayName: 'Midjourney',
  category: 'visual',

  async fetchUsage(_apiKey: string): Promise<UsageData> {
    throw new Error('Midjourney does not have a public usage API. Use manual tracking.');
  },
};
