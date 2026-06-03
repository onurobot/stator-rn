import { describe, it, expect } from 'vitest';
import { evaluateRule } from './conditions';

describe('evaluateRule', () => {
  it('fires threshold_high when usage >= threshold', () => {
    expect(evaluateRule({
      triggerType: 'threshold_high',
      thresholdPercent: 80,
      creditsUsed: 85, creditLimit: 100,
      unusedDays: null, lastSnapshotAt: new Date(),
    })).toBe(true);
  });

  it('does not fire threshold_high below threshold', () => {
    expect(evaluateRule({
      triggerType: 'threshold_high',
      thresholdPercent: 80,
      creditsUsed: 70, creditLimit: 100,
      unusedDays: null, lastSnapshotAt: new Date(),
    })).toBe(false);
  });

  it('fires threshold_low when usage < threshold', () => {
    expect(evaluateRule({
      triggerType: 'threshold_low',
      thresholdPercent: 10,
      creditsUsed: 5, creditLimit: 100,
      unusedDays: null, lastSnapshotAt: new Date(),
    })).toBe(true);
  });

  it('fires unused when no snapshot within unusedDays', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    expect(evaluateRule({
      triggerType: 'unused',
      thresholdPercent: null,
      creditsUsed: null, creditLimit: null,
      unusedDays: 7, lastSnapshotAt: old,
    })).toBe(true);
  });

  it('does not fire unused when snapshot is recent', () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(evaluateRule({
      triggerType: 'unused',
      thresholdPercent: null,
      creditsUsed: null, creditLimit: null,
      unusedDays: 7, lastSnapshotAt: recent,
    })).toBe(false);
  });
});
