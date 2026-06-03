import { describe, it, expect } from 'vitest';
import { CATALOG, getIntegration } from './registry';

describe('integration registry', () => {
  it('contains 5 catalog entries', () => {
    expect(CATALOG).toHaveLength(5);
  });

  it('looks up by slug', () => {
    expect(getIntegration('openai')?.displayName).toBe('OpenAI');
    expect(getIntegration('elevenlabs')?.displayName).toBe('ElevenLabs');
  });

  it('returns null for unknown slug', () => {
    expect(getIntegration('unknown-tool')).toBeNull();
  });
});
