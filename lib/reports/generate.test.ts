import { describe, it, expect } from 'vitest';
import { assembleReportData } from './generate';

describe('assembleReportData', () => {
  it('sums total spend across tools', () => {
    const snapshots = [
      { toolId: 'a', toolName: 'OpenAI',    category: 'text',  costToDate: '12.50', creditsUsed: 100, creditLimit: 200 },
      { toolId: 'b', toolName: 'Runway',    category: 'video', costToDate: '30.00', creditsUsed: 50,  creditLimit: 100 },
      { toolId: 'c', toolName: 'ElevenLabs', category: 'audio', costToDate: '0.00', creditsUsed: 200, creditLimit: 1000 },
    ];
    const data = assembleReportData(snapshots);
    expect(data.totalSpend).toBeCloseTo(42.50, 2);
  });

  it('groups spend by category', () => {
    const snapshots = [
      { toolId: 'a', toolName: 'OpenAI', category: 'text',  costToDate: '10.00', creditsUsed: null, creditLimit: null },
      { toolId: 'b', toolName: 'Runway', category: 'video', costToDate: '20.00', creditsUsed: null, creditLimit: null },
    ];
    const data = assembleReportData(snapshots);
    expect(data.byCategory.text).toBeCloseTo(10.00, 2);
    expect(data.byCategory.video).toBeCloseTo(20.00, 2);
  });
});
