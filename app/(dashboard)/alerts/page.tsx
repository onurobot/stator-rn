import { db }              from '@/lib/db';
import { getOrCreateUser } from '@/lib/ensure-user';
import { alertRules, connectedTools } from '@/lib/db/schema';
import { eq }              from 'drizzle-orm';
import { AlertRuleForm }   from '@/components/alerts/alert-rule-form';
import { AlertRuleList }   from '@/components/alerts/alert-rule-list';

export default async function AlertsPage() {
  const { orgId } = await getOrCreateUser();

  const tools = await db.select().from(connectedTools)
    .where(eq(connectedTools.organizationId, orgId));

  const rules = await db
    .select({
      id:               alertRules.id,
      triggerType:      alertRules.triggerType,
      thresholdPercent: alertRules.thresholdPercent,
      unusedDays:       alertRules.unusedDays,
      channels:         alertRules.channels,
      active:           alertRules.active,
      lastFiredAt:      alertRules.lastFiredAt,
      toolName:         connectedTools.displayName,
    })
    .from(alertRules)
    .innerJoin(connectedTools, eq(alertRules.connectedToolId, connectedTools.id))
    .where(eq(alertRules.organizationId, orgId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alert Rules</h1>
      <AlertRuleForm tools={tools.map(t => ({ id: t.id, displayName: t.displayName }))} />
      <AlertRuleList rules={rules} />
    </div>
  );
}
