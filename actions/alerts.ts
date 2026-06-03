'use server';
import { db }         from '@/lib/db';
import { alertRules } from '@/lib/db/schema';
import { auth }       from '@clerk/nextjs/server';
import { users } from '@/lib/db/schema';
import { eq, and }    from 'drizzle-orm';

async function getCurrentOrgId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const rows = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!rows[0]) throw new Error('User not found');
  return rows[0].organizationId;
}

interface CreateAlertInput {
  connectedToolId:   string;
  triggerType:       'threshold_high' | 'threshold_low' | 'unused';
  thresholdPercent?: number;
  unusedDays?:       number;
  channels:          string[];
  cooldownHours?:    number;
}

export async function createAlertRule(input: CreateAlertInput) {
  const orgId = await getCurrentOrgId();
  await db.insert(alertRules).values({
    organizationId:   orgId,
    connectedToolId:  input.connectedToolId,
    triggerType:      input.triggerType,
    thresholdPercent: input.thresholdPercent,
    unusedDays:       input.unusedDays,
    channels:         input.channels,
    cooldownHours:    input.cooldownHours ?? 24,
  });
}

export async function deleteAlertRule(ruleId: string) {
  const orgId = await getCurrentOrgId();
  await db.delete(alertRules).where(
    and(eq(alertRules.id, ruleId), eq(alertRules.organizationId, orgId))
  );
}

export async function toggleAlertRule(ruleId: string, active: boolean) {
  const orgId = await getCurrentOrgId();
  await db.update(alertRules)
    .set({ active })
    .where(and(eq(alertRules.id, ruleId), eq(alertRules.organizationId, orgId)));
}
