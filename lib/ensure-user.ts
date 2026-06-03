/**
 * Gets the current user's org from the DB, creating both the org and user
 * records on first login (no Clerk webhook required).
 */
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface UserContext {
  orgId:  string;
  userId: string;  // DB uuid, not Clerk ID
  plan:   string;
  email:  string | null;
}

export async function getOrCreateUser(): Promise<UserContext> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error('Unauthenticated');

  // Fast path — user already provisioned
  const existing = await db
    .select({
      id:             users.id,
      organizationId: users.organizationId,
      email:          users.email,
      plan:           organizations.plan,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  if (existing[0]) {
    return {
      orgId:  existing[0].organizationId,
      userId: existing[0].id,
      plan:   existing[0].plan,
      email:  existing[0].email,
    };
  }

  // First login — fetch Clerk profile and provision org + user
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
  const name  = clerkUser?.fullName ?? clerkUser?.username ?? email ?? 'My Organization';

  // Create org
  const [org] = await db.insert(organizations).values({
    name: `${name}'s Workspace`,
  }).returning();

  // Create user
  const [user] = await db.insert(users).values({
    clerkId,
    organizationId: org.id,
    role:           'owner',
    email,
  }).returning();

  return {
    orgId:  org.id,
    userId: user.id,
    plan:   org.plan,
    email,
  };
}
