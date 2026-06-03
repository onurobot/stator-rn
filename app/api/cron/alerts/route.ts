import { NextRequest, NextResponse }   from 'next/server';
import { db }                          from '@/lib/db';
import { alertRules, notificationLogs, connectedTools, usageSnapshots, users, organizations } from '@/lib/db/schema';
import { eq, desc, and }               from 'drizzle-orm';
import { evaluateRule }                from '@/lib/alerts/conditions';
import { sendAlertEmail }              from '@/lib/notifications/email';
import { sendAlertWhatsApp }           from '@/lib/notifications/whatsapp';
import { canUseWhatsApp }              from '@/lib/stripe';

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET environment variable is not set');
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function buildMessage(
  triggerType: string,
  toolName: string,
  thresholdPercent: number | null,
  unusedDays: number | null
): string {
  if (triggerType === 'threshold_high') return `⚠️ ${toolName}: You've used ${thresholdPercent}%+ of your limit.`;
  if (triggerType === 'threshold_low')  return `💤 ${toolName}: Usage is below ${thresholdPercent}% — underutilised this period.`;
  if (triggerType === 'unused')         return `🔇 ${toolName}: No activity detected in the last ${unusedDays} days.`;
  return `Alert triggered for ${toolName}.`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch active alert rules with their tool and org
  const rules = await db
    .select({
      ruleId:           alertRules.id,
      triggerType:      alertRules.triggerType,
      thresholdPercent: alertRules.thresholdPercent,
      unusedDays:       alertRules.unusedDays,
      channels:         alertRules.channels,
      cooldownHours:    alertRules.cooldownHours,
      lastFiredAt:      alertRules.lastFiredAt,
      toolId:           connectedTools.id,
      toolName:         connectedTools.displayName,
      creditLimit:      connectedTools.creditLimit,
      orgId:            organizations.id,
      orgPlan:          organizations.plan,
    })
    .from(alertRules)
    .innerJoin(connectedTools, eq(alertRules.connectedToolId, connectedTools.id))
    .innerJoin(organizations, eq(alertRules.organizationId, organizations.id))
    .where(eq(alertRules.active, true));

  let fired = 0;

  for (const rule of rules) {
    // Cooldown check
    if (rule.lastFiredAt) {
      const hoursSince = (Date.now() - new Date(rule.lastFiredAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < rule.cooldownHours) continue;
    }

    // Get latest snapshot for this tool
    const snaps = await db
      .select()
      .from(usageSnapshots)
      .where(eq(usageSnapshots.connectedToolId, rule.toolId))
      .orderBy(desc(usageSnapshots.recordedAt))
      .limit(1);
    const snap = snaps[0] ?? null;

    const shouldFire = evaluateRule({
      triggerType:      rule.triggerType as 'threshold_high' | 'threshold_low' | 'unused',
      thresholdPercent: rule.thresholdPercent,
      creditsUsed:      snap?.creditsUsed ?? null,
      creditLimit:      rule.creditLimit,
      unusedDays:       rule.unusedDays,
      lastSnapshotAt:   snap ? new Date(snap.recordedAt) : null,
    });

    if (!shouldFire) continue;

    // Get org owner email
    // TODO: In production, fetch owner email from Clerk's API instead of the users table,
    // since Clerk manages email addresses and they are not stored in our DB.
    const ownerRows = await db
      .select()
      .from(users)
      .where(and(eq(users.organizationId, rule.orgId), eq(users.role, 'owner')))
      .limit(1);
    const owner = ownerRows[0] ?? null;
    if (!owner) continue;

    const message = buildMessage(rule.triggerType, rule.toolName, rule.thresholdPercent, rule.unusedDays);

    for (const channel of rule.channels) {
      let success      = false;
      let fallbackUsed = false;

      if (channel === 'email') {
        if (!owner.email) {
          // Email not yet stored for this user — skip rather than send to wrong address.
          // Email is populated when the user signs up via the Clerk webhook.
          console.warn(`Skipping email alert for owner ${owner.id}: no email stored`);
        } else {
          const result = await sendAlertEmail({
            to:          owner.email,
            toolName:    rule.toolName,
            triggerType: rule.triggerType,
            message,
          });
          success = result.success;
        }
      }

      if (channel === 'whatsapp' && canUseWhatsApp(rule.orgPlan)) {
        if (owner.whatsappOptedIn && owner.whatsappPhone) {
          const result = await sendAlertWhatsApp({ to: owner.whatsappPhone, message });
          success = result.success;
          if (!result.success && owner.email) {
            // Fallback to email when WhatsApp delivery fails
            const fb = await sendAlertEmail({
              to:          owner.email,
              toolName:    rule.toolName,
              triggerType: rule.triggerType,
              message,
            });
            success      = fb.success;
            fallbackUsed = true;
          }
        }
      }

      await db.insert(notificationLogs).values({
        alertRuleId:  rule.ruleId,
        channel:      channel as 'email' | 'whatsapp',
        status:       success ? 'delivered' : 'failed',
        fallbackUsed,
      });
    }

    await db.update(alertRules)
      .set({ lastFiredAt: new Date() })
      .where(eq(alertRules.id, rule.ruleId));

    fired++;
  }

  return NextResponse.json({ fired });
}
