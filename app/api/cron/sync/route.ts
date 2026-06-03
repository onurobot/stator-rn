import { NextRequest, NextResponse } from 'next/server';
import { db }            from '@/lib/db';
import { connectedTools, usageSnapshots, organizations } from '@/lib/db/schema';
import { eq }            from 'drizzle-orm';
import { getIntegration } from '@/lib/integrations/registry';
import { decrypt }        from '@/lib/crypto';
import { syncFrequency }  from '@/lib/stripe';

function authorized(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all API-type tools with their org
  const apiTools = await db
    .select({
      id:               connectedTools.id,
      toolSlug:         connectedTools.toolSlug,
      encryptedApiKey:  connectedTools.encryptedApiKey,
      lastSyncedAt:     connectedTools.lastSyncedAt,
      syncStatus:       connectedTools.syncStatus,
      organizationId:   connectedTools.organizationId,
      plan:             organizations.plan,
    })
    .from(connectedTools)
    .innerJoin(organizations, eq(connectedTools.organizationId, organizations.id))
    .where(eq(connectedTools.syncType, 'api'));

  const results = { synced: 0, skipped: 0, errors: 0 };

  for (const tool of apiTools) {
    const freqH = syncFrequency(tool.plan);
    const now   = Date.now();

    // Skip if synced recently based on plan frequency
    if (tool.lastSyncedAt) {
      const msSinceSync = now - new Date(tool.lastSyncedAt).getTime();
      if (msSinceSync < freqH * 60 * 60 * 1000) {
        results.skipped++;
        continue;
      }
    }

    const integration = getIntegration(tool.toolSlug);
    if (!integration || !tool.encryptedApiKey) {
      results.skipped++;
      continue;
    }

    try {
      const apiKey = decrypt(tool.encryptedApiKey);
      const usage  = await integration.fetchUsage(apiKey);

      await db.insert(usageSnapshots).values({
        connectedToolId:  tool.id,
        creditsUsed:      usage.creditsUsed,
        creditsRemaining: usage.creditsRemaining,
        costToDate:       usage.costToDate.toString(),
        periodStart:      usage.periodStart,
        periodEnd:        usage.periodEnd,
      });

      await db.update(connectedTools)
        .set({ syncStatus: 'ok', lastSyncedAt: new Date() })
        .where(eq(connectedTools.id, tool.id));

      results.synced++;
    } catch (err: any) {
      await db.update(connectedTools)
        .set({ syncStatus: 'sync_error' })
        .where(eq(connectedTools.id, tool.id));

      results.errors++;
      console.error(`Sync error for tool ${tool.id}:`, err.message);
    }
  }

  return NextResponse.json(results);
}
