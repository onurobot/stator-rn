import { openaiIntegration }     from './openai';
import { anthropicIntegration }  from './anthropic';
import { midjourneyIntegration } from './midjourney';
import { elevenlabsIntegration } from './elevenlabs';
import { runwayIntegration }     from './runway';
import type { ToolIntegration }  from './types';

export const CATALOG: ToolIntegration[] = [
  openaiIntegration,
  anthropicIntegration,
  midjourneyIntegration,
  elevenlabsIntegration,
  runwayIntegration,
];

export const CATALOG_MAP: Record<string, ToolIntegration> = Object.fromEntries(
  CATALOG.map(t => [t.slug, t])
);

/** Returns null if slug is not in catalog (e.g., custom tool). */
export function getIntegration(slug: string): ToolIntegration | null {
  return CATALOG_MAP[slug] ?? null;
}
