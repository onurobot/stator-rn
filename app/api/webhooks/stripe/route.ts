import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe, planFromPriceId } from '@/lib/stripe';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.created'
  ) {
    const sub        = event.data.object as Stripe.Subscription;
    const priceId    = sub.items.data[0]?.price?.id;
    const plan       = planFromPriceId(priceId);
    const customerId = sub.customer as string;
    if (plan) {
      await db.update(organizations)
        .set({ plan })
        .where(eq(organizations.stripeCustomerId, customerId));
    }
  }

  return NextResponse.json({ received: true });
}
