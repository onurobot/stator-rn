import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_user_1' }),
}));

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'user-uuid-1',
              organizationId: 'org-uuid-1',
              plan: 'pro',
            }]),
          }),
        }),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 'user-uuid-1',
            organizationId: 'org-uuid-1',
          }]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'tool-uuid-1' }]),
      }),
    }),
    query: {
      connectedTools: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-key'),
}));

vi.mock('@/lib/stripe', () => ({
  toolLimit: vi.fn().mockReturnValue(Infinity),
}));

import { createTool } from './tools';

describe('createTool', () => {
  it('encrypts API key before inserting', async () => {
    const { encrypt } = await import('@/lib/crypto');
    await createTool({
      toolSlug:    'openai',
      displayName: 'OpenAI',
      category:    'text',
      syncType:    'api',
      apiKey:      'sk-secret',
      billingType: 'subscription',
    });
    expect(encrypt).toHaveBeenCalledWith('sk-secret');
  });

  it('throws if free org already has 3 tools', async () => {
    const { toolLimit } = await import('@/lib/stripe');
    (toolLimit as any).mockReturnValueOnce(3);
    const { db } = await import('@/lib/db');
    (db.query.connectedTools.findMany as any).mockResolvedValueOnce([{}, {}, {}]);
    await expect(createTool({
      toolSlug: 'openai', displayName: 'OpenAI', category: 'text',
      syncType: 'api', billingType: 'subscription',
    })).rejects.toThrow(/limited to 3 tools/);
  });
});
