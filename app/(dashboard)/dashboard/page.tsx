import { db }        from '@/lib/db';
import { getOrCreateUser } from '@/lib/ensure-user';
import { connectedTools, usageSnapshots } from '@/lib/db/schema';
import { eq, desc }  from 'drizzle-orm';
import { OverviewStats }         from '@/components/dashboard/overview-stats';
import { SpendByCategoryChart }  from '@/components/dashboard/spend-by-category-chart';
import { ToolsNearLimit }        from '@/components/dashboard/tools-near-limit';
import { InactiveTools }         from '@/components/dashboard/inactive-tools';

export default async function DashboardPage() {
  const { orgId } = await getOrCreateUser();

  const tools = await db.select().from(connectedTools)
    .where(eq(connectedTools.organizationId, orgId));

  const toolData = await Promise.all(tools.map(async tool => {
    const snaps = await db.select().from(usageSnapshots)
      .where(eq(usageSnapshots.connectedToolId, tool.id))
      .orderBy(desc(usageSnapshots.recordedAt))
      .limit(1);
    return { tool, snap: snaps[0] ?? null };
  }));

  const totalSpend = toolData.reduce((acc, { snap }) =>
    acc + parseFloat(snap?.costToDate ?? '0'), 0);

  const nearLimit = toolData
    .filter(({ snap, tool }) => snap?.creditsUsed != null && tool.creditLimit != null &&
      (snap.creditsUsed / tool.creditLimit) * 100 >= 70)
    .map(({ tool, snap }) => ({
      id:       tool.id,
      name:     tool.displayName,
      usagePct: Math.round((snap!.creditsUsed! / tool.creditLimit!) * 100),
    }))
    .sort((a, b) => b.usagePct - a.usagePct);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const inactive = toolData
    .filter(({ snap }) => !snap || new Date(snap.recordedAt) < sevenDaysAgo)
    .map(({ tool, snap }) => ({
      id:           tool.id,
      name:         tool.displayName,
      daysSinceUse: snap
        ? Math.floor((Date.now() - new Date(snap.recordedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999,
    }));

  const categorySpend: Record<string, number> = {};
  toolData.forEach(({ tool, snap }) => {
    if (snap) categorySpend[tool.category] = (categorySpend[tool.category] ?? 0) + parseFloat(snap.costToDate);
  });
  const categoryData = Object.entries(categorySpend).map(([category, spend]) => ({ category, spend }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <OverviewStats
        totalSpend={totalSpend}
        toolsCount={tools.length}
        nearLimit={nearLimit.length}
        inactive={inactive.length}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SpendByCategoryChart data={categoryData} />
        <div className="space-y-4">
          <ToolsNearLimit tools={nearLimit} />
          <InactiveTools tools={inactive} />
        </div>
      </div>
    </div>
  );
}
