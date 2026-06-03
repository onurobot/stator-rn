import Link from 'next/link';
import { db }         from '@/lib/db';
import { auth }       from '@clerk/nextjs/server';
import { connectedTools, usageSnapshots, users } from '@/lib/db/schema';
import { eq, desc }   from 'drizzle-orm';
import { redirect }   from 'next/navigation';
import { Button }     from '@/components/ui/button';
import { ToolCard }   from '@/components/tools/tool-card';

export default async function ToolsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const userRows = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!userRows[0]) redirect('/sign-in');
  const orgId = userRows[0].organizationId;

  const tools = await db.select().from(connectedTools)
    .where(eq(connectedTools.organizationId, orgId));

  const toolsWithSnap = await Promise.all(tools.map(async tool => {
    const snaps = await db.select().from(usageSnapshots)
      .where(eq(usageSnapshots.connectedToolId, tool.id))
      .orderBy(desc(usageSnapshots.recordedAt))
      .limit(1);
    return { tool, snap: snaps[0] ?? null };
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tools</h1>
        <Button render={<Link href="/tools/new" />}>+ Connect Tool</Button>
      </div>
      {toolsWithSnap.length === 0 && (
        <p className="text-muted-foreground">No tools connected yet. Add your first tool to get started.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {toolsWithSnap.map(({ tool, snap }) => (
          <ToolCard
            key={tool.id}
            id={tool.id}
            displayName={tool.displayName}
            category={tool.category}
            syncType={tool.syncType}
            syncStatus={tool.syncStatus}
            lastSyncedAt={tool.lastSyncedAt}
            creditsUsed={snap?.creditsUsed ?? null}
            creditsRemaining={snap?.creditsRemaining ?? null}
            creditLimit={tool.creditLimit}
            costToDate={parseFloat(snap?.costToDate ?? '0')}
            renewalDate={tool.renewalDate}
          />
        ))}
      </div>
    </div>
  );
}
