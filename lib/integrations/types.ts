export interface UsageData {
  creditsUsed:      number | null;
  creditsRemaining: number | null;
  costToDate:       number;
  periodStart:      string; // ISO date YYYY-MM-DD
  periodEnd:        string;
}

export interface ToolIntegration {
  slug:        string;
  displayName: string;
  category:    'text' | 'visual' | 'video' | 'audio' | 'research' | 'production';
  /**
   * Fetch current usage. Throws on auth failure or API error.
   */
  fetchUsage(apiKey: string): Promise<UsageData>;
}
