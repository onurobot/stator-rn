import { db }              from '@/lib/db';
import { getOrCreateUser } from '@/lib/ensure-user';
import { organizations }   from '@/lib/db/schema';
import { eq }              from 'drizzle-orm';
import { Badge }           from '@/components/ui/badge';

export default async function BillingPage() {
  const { orgId, plan } = await getOrCreateUser();

  const [org] = await db.select({
    stripeCustomerId: organizations.stripeCustomerId,
  })
  .from(organizations)
  .where(eq(organizations.id, orgId));

  const planLabels: Record<string, string> = { free: 'Free', pro: 'Pro', team: 'Team' };

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Plan</span>
          <Badge className="capitalize">{planLabels[plan] ?? plan}</Badge>
        </div>
        {plan === 'free' && (
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro for unlimited tools, hourly sync, WhatsApp alerts, and PDF exports.
          </p>
        )}
        {org?.stripeCustomerId ? (
          <p className="text-sm text-muted-foreground">To manage your subscription, visit the Stripe billing portal.</p>
        ) : (
          <p className="text-sm text-muted-foreground">No active subscription found.</p>
        )}
      </div>
    </div>
  );
}
