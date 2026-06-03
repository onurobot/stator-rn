// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { organizations, users, connectedTools, usageSnapshots, alertRules, notificationLogs, monthlyReports } from './schema';

describe('schema exports', () => {
  it('exports all tables', () => {
    expect(organizations).toBeDefined();
    expect(users).toBeDefined();
    expect(connectedTools).toBeDefined();
    expect(usageSnapshots).toBeDefined();
    expect(alertRules).toBeDefined();
    expect(notificationLogs).toBeDefined();
    expect(monthlyReports).toBeDefined();
  });
});
