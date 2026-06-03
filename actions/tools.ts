'use server';
import { db }           from '@/lib/db';
import { connectedTools, usageSnapshots, users } from '@/lib/db/schema';
import { auth }         from '@clerk/nextjs/server';
import { encrypt }      from '@/lib/crypto';
import { toolLimit }    from '@/lib/stripe';
import { organizations } from '@/lib/db/schema';
import { eq, and }      from 'drizzle-orm';

async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const result = await db
    .select({
      id:             users.id,
      organizationId: users.organizationId,
      plan:           organizations.plan,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!result[0]) throw new Error('User record not found');
  return result[0];
}

interface CreateToolInput {
  toolSlug:        string;
  displayName:     string;
  category:        'text' | 'visual' | 'video' | 'audio' | 'research' | 'production';
  syncType:        'api' | 'manual';
  apiKey?:         string;
  billingType:     'subscription' | 'credits';
  planMonthlyCost?: number;
  creditLimit?:    number;
  renewalDate?:    string;
}

export async function createTool(input: CreateToolInput) {
  const currentUser = await getCurrentUser();
  const { organizationId: orgId, plan } = currentUser;

  const existing = await db.query.connectedTools.findMany({
    where: eq(connectedTools.organizationId, orgId),
  });
  const limit = toolLimit(plan);
  if (existing.length >= limit) {
    throw new Error(`Plan is limited to ${limit} tools. Upgrade to add more.`);
  }

  const [tool] = await db.insert(connectedTools).values({
    organizationId:  orgId,
    toolSlug:        input.toolSlug,
    displayName:     input.displayName,
    category:        input.category,
    syncType:        input.syncType,
    encryptedApiKey: input.apiKey ? encrypt(input.apiKey) : null,
    billingType:     input.billingType,
    planMonthlyCost: input.planMonthlyCost?.toString(),
    creditLimit:     input.creditLimit,
    renewalDate:     input.renewalDate,
  }).returning();

  return tool;
}

export async function deleteTool(toolId: string) {
  const currentUser = await getCurrentUser();
  await db.delete(connectedTools).where(
    and(eq(connectedTools.id, toolId), eq(connectedTools.organizationId, currentUser.organizationId))
  );
}

export async function addManualSnapshot(toolId: string, input: {
  creditsUsed:      number | null;
  creditsRemaining: number | null;
  costToDate:       number;
  periodStart:      string;
  periodEnd:        string;
}) {
  const currentUser = await getCurrentUser();
  const tool = await db.query.connectedTools.findFirst({
    where: and(eq(connectedTools.id, toolId), eq(connectedTools.organizationId, currentUser.organizationId)),
  });
  if (!tool) throw new Error('Tool not found');

  await db.insert(usageSnapshots).values({
    connectedToolId:  toolId,
    creditsUsed:      input.creditsUsed,
    creditsRemaining: input.creditsRemaining,
    costToDate:       input.costToDate.toString(),
    periodStart:      input.periodStart,
    periodEnd:        input.periodEnd,
  });
}

export async function updateWhatsAppSettings(phone: string, optIn: boolean) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  await db.update(users)
    .set({ whatsappPhone: phone, whatsappOptedIn: optIn })
    .where(eq(users.clerkId, userId));
}
