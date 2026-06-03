import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getOrgId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const user = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!user[0]) throw new Error('User record not found');
  return user[0].organizationId;
}

export async function requireOrg(): Promise<{ orgId: string; userId: string; plan: string }> {
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
  return {
    orgId:  result[0].organizationId,
    userId: result[0].id,
    plan:   result[0].plan,
  };
}
