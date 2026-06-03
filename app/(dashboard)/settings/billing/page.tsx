import { db }           from '@/lib/db';
import { auth }         from '@clerk/nextjs/server';
import { organizations, users } from '@/lib/db/schema';
import { eq }           from 'drizzle-orm';
import { redirect }     from 'next/navigation';
import { Badge }        from '@/components/ui/badge';

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const rows = await db
    .select({
      plan:             organizations.plan,
      stripeCustomerId: organizations.stripeCustomerId,
      orgId:            organizations.id,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!rows[0]) redirect('/sign-in');

  const { plan, stripeCustomerId } = rows[0];

  const planLabels: Record<string, string> = {
    free: 'Free',
    pro:  'Pro',
    team: 'Team',
  };

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
        {stripeCustomerId ? (
          <p className="text-sm text-muted-foreground">
            To manage your subscription, visit the Stripe billing portal.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active subscription found.
          </p>
        )}
      </div>
    </div>
  );
}
