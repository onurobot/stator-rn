# AI Tools Usage & Cost Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant SaaS that tracks AI tool usage and spend, fires smart alerts via Email and WhatsApp, and generates monthly cost/usage reports.

**Architecture:** Next.js App Router on Vercel with Clerk auth, Neon Postgres via Drizzle ORM, and Stripe billing. Three Vercel Cron jobs handle periodic sync, alert evaluation, and monthly report generation. Notifications go through Resend (email) and Twilio (WhatsApp).

**Tech Stack:** Next.js 15 (App Router), TypeScript, Drizzle ORM, Neon Postgres, Clerk, Stripe, Resend, Twilio, shadcn/ui, Vitest, Vercel Cron

---

## File Map

```
app/
  (auth)/sign-in/[[...sign-in]]/page.tsx
  (auth)/sign-up/[[...sign-up]]/page.tsx
  (dashboard)/layout.tsx
  (dashboard)/dashboard/page.tsx
  (dashboard)/tools/page.tsx
  (dashboard)/tools/new/page.tsx
  (dashboard)/tools/[id]/page.tsx
  (dashboard)/alerts/page.tsx
  (dashboard)/reports/page.tsx
  (dashboard)/settings/page.tsx
  (dashboard)/settings/billing/page.tsx
  api/cron/sync/route.ts
  api/cron/alerts/route.ts
  api/cron/monthly-report/route.ts
  api/webhooks/stripe/route.ts
  layout.tsx

lib/
  db/index.ts              — Drizzle client (singleton)
  db/schema.ts             — All table definitions
  crypto.ts                — AES-256 encrypt/decrypt for API keys
  stripe.ts                — Stripe client + tier helpers
  auth.ts                  — Clerk session helpers (getOrgId, requireOrg)
  integrations/types.ts    — ToolIntegration interface
  integrations/openai.ts
  integrations/anthropic.ts
  integrations/midjourney.ts
  integrations/elevenlabs.ts
  integrations/runway.ts
  integrations/registry.ts — Map of slug → integration
  notifications/email.ts   — Resend wrapper
  notifications/whatsapp.ts — Twilio wrapper
  reports/generate.ts      — Monthly report data assembly
  reports/pdf.tsx          — @react-pdf/renderer template

actions/
  tools.ts    — Server actions: create, update, delete tool; manual snapshot
  alerts.ts   — Server actions: create, update, delete alert rule
  reports.ts  — Server action: trigger on-demand PDF export

components/
  dashboard/overview-stats.tsx
  dashboard/spend-by-category-chart.tsx
  dashboard/tools-near-limit.tsx
  dashboard/inactive-tools.tsx
  tools/tool-card.tsx
  tools/tool-catalog-picker.tsx
  tools/connect-tool-form.tsx
  tools/manual-usage-form.tsx
  alerts/alert-rule-form.tsx
  alerts/alert-rule-list.tsx
  reports/report-card.tsx
  reports/report-view.tsx

vercel.ts
drizzle.config.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vercel.ts`, `drizzle.config.ts`, `.env.local.example`
- Create: `app/layout.tsx`

- [ ] **Step 1: Scaffold Next.js project**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless dotenv
npm install -D drizzle-kit
npm install @clerk/nextjs
npm install stripe @stripe/stripe-js
npm install resend
npm install twilio
npm install @react-pdf/renderer
npm install recharts
npm install -D vitest @vitejs/plugin-react vitest-environment-miniflare @testing-library/react @testing-library/jest-dom
npx shadcn@latest init --yes --defaults
npx shadcn@latest add button card badge progress table dialog form input label select tabs toast
```

- [ ] **Step 3: Create `vercel.ts`**

```ts
// vercel.ts
import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  crons: [
    { path: '/api/cron/sync',           schedule: '0 * * * *'   }, // hourly
    { path: '/api/cron/alerts',         schedule: '0 * * * *'   }, // hourly
    { path: '/api/cron/monthly-report', schedule: '0 0 1 * *'   }, // 1st of month
  ],
};
```

- [ ] **Step 4: Create `drizzle.config.ts`**

```ts
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema:    './lib/db/schema.ts',
  out:       './lib/db/migrations',
  dialect:   'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 5: Create `.env.local.example`**

```bash
# .env.local.example
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_FREE_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_TEAM_PRICE_ID=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
ENCRYPTION_KEY=  # 32-byte hex string
CRON_SECRET=     # random secret to protect cron routes
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 7: Create `vitest.setup.ts`**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 8: Add test script to `package.json`**

Open `package.json` and add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

## Task 2: Database Schema

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`

- [ ] **Step 1: Write schema**

```ts
// lib/db/schema.ts
import {
  pgTable, uuid, text, timestamp, boolean,
  integer, decimal, date, pgEnum, jsonb, index
} from 'drizzle-orm/pg-core';

export const planEnum       = pgEnum('plan',        ['free', 'pro', 'team']);
export const categoryEnum   = pgEnum('category',    ['text', 'visual', 'video', 'audio', 'research', 'production']);
export const syncTypeEnum   = pgEnum('sync_type',   ['api', 'manual']);
export const billingTypeEnum= pgEnum('billing_type',['subscription', 'credits']);
export const syncStatusEnum = pgEnum('sync_status', ['ok', 'sync_error', 'never_synced']);
export const triggerTypeEnum= pgEnum('trigger_type',['threshold_high', 'threshold_low', 'unused']);
export const channelEnum    = pgEnum('channel',     ['email', 'whatsapp']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['delivered', 'failed']);
export const reportStatusEnum   = pgEnum('report_status',   ['generating', 'ready', 'pdf_failed']);
export const userRoleEnum   = pgEnum('user_role',   ['owner', 'member']);

export const organizations = pgTable('organizations', {
  id:               uuid('id').primaryKey().defaultRandom(),
  name:             text('name').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  plan:             planEnum('plan').notNull().default('free'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
});

export const users = pgTable('users', {
  id:              uuid('id').primaryKey().defaultRandom(),
  clerkId:         text('clerk_id').notNull().unique(),
  organizationId:  uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role:            userRoleEnum('role').notNull().default('member'),
  whatsappPhone:   text('whatsapp_phone'),
  whatsappOptedIn: boolean('whatsapp_opted_in').notNull().default(false),
}, t => ({ clerkIdx: index('users_clerk_id_idx').on(t.clerkId) }));

export const connectedTools = pgTable('connected_tools', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  toolSlug:         text('tool_slug').notNull(),
  displayName:      text('display_name').notNull(),
  category:         categoryEnum('category').notNull(),
  syncType:         syncTypeEnum('sync_type').notNull(),
  encryptedApiKey:  text('encrypted_api_key'),
  billingType:      billingTypeEnum('billing_type').notNull(),
  planMonthlyCost:  decimal('plan_monthly_cost', { precision: 10, scale: 2 }),
  creditLimit:      integer('credit_limit'),
  renewalDate:      date('renewal_date'),
  syncStatus:       syncStatusEnum('sync_status').notNull().default('never_synced'),
  lastSyncedAt:     timestamp('last_synced_at'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, t => ({ orgIdx: index('tools_org_id_idx').on(t.organizationId) }));

export const usageSnapshots = pgTable('usage_snapshots', {
  id:               uuid('id').primaryKey().defaultRandom(),
  connectedToolId:  uuid('connected_tool_id').notNull().references(() => connectedTools.id, { onDelete: 'cascade' }),
  recordedAt:       timestamp('recorded_at').notNull().defaultNow(),
  creditsUsed:      integer('credits_used'),
  creditsRemaining: integer('credits_remaining'),
  costToDate:       decimal('cost_to_date', { precision: 10, scale: 2 }).notNull(),
  periodStart:      date('period_start').notNull(),
  periodEnd:        date('period_end').notNull(),
}, t => ({ toolIdx: index('snapshots_tool_id_idx').on(t.connectedToolId) }));

export const alertRules = pgTable('alert_rules', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  connectedToolId:  uuid('connected_tool_id').notNull().references(() => connectedTools.id, { onDelete: 'cascade' }),
  triggerType:      triggerTypeEnum('trigger_type').notNull(),
  thresholdPercent: integer('threshold_percent'),
  unusedDays:       integer('unused_days'),
  channels:         text('channels').array().notNull(),
  cooldownHours:    integer('cooldown_hours').notNull().default(24),
  lastFiredAt:      timestamp('last_fired_at'),
  active:           boolean('active').notNull().default(true),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
});

export const notificationLogs = pgTable('notification_logs', {
  id:           uuid('id').primaryKey().defaultRandom(),
  alertRuleId:  uuid('alert_rule_id').notNull().references(() => alertRules.id, { onDelete: 'cascade' }),
  channel:      channelEnum('channel').notNull(),
  sentAt:       timestamp('sent_at').notNull().defaultNow(),
  status:       deliveryStatusEnum('status').notNull(),
  fallbackUsed: boolean('fallback_used').notNull().default(false),
});

export const monthlyReports = pgTable('monthly_reports', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  periodStart:    date('period_start').notNull(),
  periodEnd:      date('period_end').notNull(),
  totalSpend:     decimal('total_spend', { precision: 10, scale: 2 }).notNull(),
  reportData:     jsonb('report_data').notNull(),
  pdfUrl:         text('pdf_url'),
  status:         reportStatusEnum('status').notNull().default('generating'),
  generatedAt:    timestamp('generated_at').notNull().defaultNow(),
});
```

- [ ] **Step 2: Create Drizzle client**

```ts
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
export type DB = typeof db;
```

- [ ] **Step 3: Generate and run migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: migration files created in `lib/db/migrations/`, applied to Neon DB.

- [ ] **Step 4: Write schema smoke test**

```ts
// lib/db/schema.test.ts
import { describe, it, expect } from 'vitest';
import { organizations, users, connectedTools, usageSnapshots, alertRules, notificationLogs, monthlyReports } from './schema';

describe('schema exports', () => {
  it('exports all tables', () => {
    expect(organizations).toBeDefined();
    expect(users).toBeDefined();
    expect(connectedTools).toBeDefined();
    expect(usageSnapshots).toBeDefined();
    expect(alertRules).toBeDefined();
    expect(notificationLogs).toBeDefined();
    expect(monthlyReports).toBeDefined();
  });
});
```

- [ ] **Step 5: Run test**

```bash
npm test lib/db/schema.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add database schema and Drizzle client"
```

---

## Task 3: Crypto Utilities

**Files:**
- Create: `lib/crypto.ts`
- Create: `lib/crypto.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/crypto.test.ts
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './crypto';

describe('encrypt / decrypt', () => {
  it('round-trips a string', () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32-byte hex
    const plaintext = 'sk-abc123supersecret';
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    const a = encrypt('same');
    const b = encrypt('same');
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test lib/crypto.test.ts
```

Expected: FAIL — `encrypt` not found

- [ ] **Step 3: Implement**

```ts
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string {
  const iv  = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(ciphertext: string): string {
  const [ivHex, dataHex] = ciphertext.split(':');
  const iv   = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test lib/crypto.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/crypto.ts lib/crypto.test.ts
git commit -m "feat: add AES-256 encrypt/decrypt for API key storage"
```

---

## Task 4: Auth Helpers

**Files:**
- Create: `lib/auth.ts`
- Create: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- Create: `middleware.ts`

- [ ] **Step 1: Configure Clerk middleware**

```ts
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/cron/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect();
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
```

- [ ] **Step 2: Create auth helpers**

```ts
// lib/auth.ts
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getOrgId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });
  if (!user) throw new Error('User record not found');
  return user.organizationId;
}

export async function requireOrg(): Promise<{ orgId: string; userId: string; plan: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    with: { organization: true },
  });
  if (!user) throw new Error('User record not found');
  return {
    orgId:  user.organizationId,
    userId: user.id,
    plan:   (user as any).organization.plan as string,
  };
}
```

- [ ] **Step 3: Create sign-in page**

```tsx
// app/(auth)/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

- [ ] **Step 4: Create sign-up page**

```tsx
// app/(auth)/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

- [ ] **Step 5: Add ClerkProvider to root layout**

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = { title: 'AI Tracker' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Clerk auth with middleware and sign-in/up pages"
```

---

## Task 5: Stripe Billing

**Files:**
- Create: `lib/stripe.ts`
- Create: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Write failing test for tier helper**

```ts
// lib/stripe.test.ts
import { describe, it, expect } from 'vitest';
import { planFromPriceId, toolLimit, syncFrequency } from './stripe';

describe('plan helpers', () => {
  it('maps price IDs to plan names', () => {
    process.env.STRIPE_FREE_PRICE_ID = 'price_free';
    process.env.STRIPE_PRO_PRICE_ID  = 'price_pro';
    process.env.STRIPE_TEAM_PRICE_ID = 'price_team';
    expect(planFromPriceId('price_free')).toBe('free');
    expect(planFromPriceId('price_pro')).toBe('pro');
    expect(planFromPriceId('price_team')).toBe('team');
    expect(planFromPriceId('price_unknown')).toBeNull();
  });

  it('returns correct tool limits per plan', () => {
    expect(toolLimit('free')).toBe(3);
    expect(toolLimit('pro')).toBe(Infinity);
    expect(toolLimit('team')).toBe(Infinity);
  });

  it('returns correct sync frequency in hours', () => {
    expect(syncFrequency('free')).toBe(24);
    expect(syncFrequency('pro')).toBe(1);
    expect(syncFrequency('team')).toBe(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test lib/stripe.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export function planFromPriceId(priceId: string): 'free' | 'pro' | 'team' | null {
  if (priceId === process.env.STRIPE_FREE_PRICE_ID) return 'free';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)  return 'pro';
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return 'team';
  return null;
}

export function toolLimit(plan: string): number {
  return plan === 'free' ? 3 : Infinity;
}

export function syncFrequency(plan: string): number {
  return plan === 'free' ? 24 : 1;
}

export function canUseWhatsApp(plan: string): boolean {
  return plan === 'pro' || plan === 'team';
}

export function canExportPdf(plan: string): boolean {
  return plan === 'pro' || plan === 'team';
}

export function reportHistoryMonths(plan: string): number {
  return plan === 'free' ? 0 : 12;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test lib/stripe.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Create Stripe webhook handler**

```ts
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe, planFromPriceId } from '@/lib/stripe';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature')!;

  let event: ReturnType<typeof stripe.webhooks.constructEvent> extends Promise<infer T> ? T : never;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub       = event.data.object as any;
    const priceId   = sub.items.data[0]?.price?.id;
    const plan      = planFromPriceId(priceId);
    const customerId = sub.customer as string;
    if (plan) {
      await db.update(organizations)
        .set({ plan })
        .where(eq(organizations.stripeCustomerId, customerId));
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Stripe billing helpers and webhook handler"
```

---

## Task 6: Tool Integration Interface + OpenAI

**Files:**
- Create: `lib/integrations/types.ts`
- Create: `lib/integrations/openai.ts`
- Create: `lib/integrations/openai.test.ts`

- [ ] **Step 1: Define integration interface**

```ts
// lib/integrations/types.ts
export interface UsageData {
  creditsUsed:      number | null;
  creditsRemaining: number | null;
  costToDate:       number;
  periodStart:      string; // ISO date YYYY-MM-DD
  periodEnd:        string;
}

export interface ToolIntegration {
  slug:        string;
  displayName: string;
  category:    'text' | 'visual' | 'video' | 'audio' | 'research' | 'production';
  /**
   * Fetch current usage. Throws on auth failure or API error.
   * The caller is responsible for catching and marking sync_error.
   */
  fetchUsage(apiKey: string): Promise<UsageData>;
}
```

- [ ] **Step 2: Write failing test for OpenAI integration**

```ts
// lib/integrations/openai.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openaiIntegration } from './openai';

describe('openaiIntegration', () => {
  it('has correct slug and category', () => {
    expect(openaiIntegration.slug).toBe('openai');
    expect(openaiIntegration.category).toBe('text');
  });

  it('throws on 401 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    } as any);
    await expect(openaiIntegration.fetchUsage('bad-key')).rejects.toThrow('Invalid API key');
  });

  it('maps API response to UsageData', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ cost: 5.42 }],
        total_usage: 5420, // in cents * 100
      }),
    } as any);
    const result = await openaiIntegration.fetchUsage('sk-test');
    expect(result.costToDate).toBeCloseTo(5.42, 1);
    expect(result.creditsUsed).toBeNull();    // OpenAI uses $ not credits
    expect(result.creditsRemaining).toBeNull();
    expect(result.periodStart).toMatch(/^\d{4}-\d{2}-01$/);
    expect(result.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
npm test lib/integrations/openai.test.ts
```

Expected: FAIL

- [ ] **Step 4: Implement OpenAI integration**

```ts
// lib/integrations/openai.ts
import type { ToolIntegration, UsageData } from './types';

export const openaiIntegration: ToolIntegration = {
  slug: 'openai',
  displayName: 'OpenAI',
  category: 'text',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const year  = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const start = `${year}-${month}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch(
      `https://api.openai.com/v1/usage?start_date=${start}&end_date=${end}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `OpenAI API error ${res.status}`);
    }

    const data = await res.json();
    // total_usage is in units of 0.0001 USD (1/100 cent)
    const costToDate = (data.total_usage ?? 0) / 10000;

    return {
      creditsUsed:      null,
      creditsRemaining: null,
      costToDate,
      periodStart: start,
      periodEnd:   end,
    };
  },
};
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npm test lib/integrations/openai.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/integrations/
git commit -m "feat: add ToolIntegration interface and OpenAI integration"
```

---

## Task 7: Remaining Integrations + Registry

**Files:**
- Create: `lib/integrations/anthropic.ts`
- Create: `lib/integrations/midjourney.ts`
- Create: `lib/integrations/elevenlabs.ts`
- Create: `lib/integrations/runway.ts`
- Create: `lib/integrations/registry.ts`

- [ ] **Step 1: Implement Anthropic integration**

```ts
// lib/integrations/anthropic.ts
import type { ToolIntegration, UsageData } from './types';

export const anthropicIntegration: ToolIntegration = {
  slug: 'anthropic',
  displayName: 'Anthropic (Claude)',
  category: 'text',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch('https://api.anthropic.com/v1/usage', {
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Anthropic API error ${res.status}`);
    }

    const data = await res.json();
    // Anthropic returns total cost in USD cents
    const costToDate = (data.total_cost_cents ?? 0) / 100;

    return {
      creditsUsed:      data.input_tokens  ?? null,
      creditsRemaining: null,
      costToDate,
      periodStart: start,
      periodEnd:   end,
    };
  },
};
```

- [ ] **Step 2: Implement ElevenLabs integration**

```ts
// lib/integrations/elevenlabs.ts
import type { ToolIntegration, UsageData } from './types';

export const elevenlabsIntegration: ToolIntegration = {
  slug: 'elevenlabs',
  displayName: 'ElevenLabs',
  category: 'audio',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.detail ?? `ElevenLabs API error ${res.status}`);
    }

    const data = await res.json();
    const used      = data.character_count         ?? 0;
    const limit     = data.character_limit         ?? null;
    const remaining = limit !== null ? limit - used : null;

    return {
      creditsUsed:      used,
      creditsRemaining: remaining,
      costToDate:       0, // ElevenLabs is subscription-based; cost tracked via planMonthlyCost
      periodStart: start,
      periodEnd:   end,
    };
  },
};
```

- [ ] **Step 3: Implement Midjourney integration (manual-only — no public API)**

```ts
// lib/integrations/midjourney.ts
// Midjourney has no public API for usage data.
// This entry exists in the registry so users can add it as a manual tool
// with a pre-filled category. fetchUsage is not callable.
import type { ToolIntegration, UsageData } from './types';

export const midjourneyIntegration: ToolIntegration = {
  slug: 'midjourney',
  displayName: 'Midjourney',
  category: 'visual',

  async fetchUsage(_apiKey: string): Promise<UsageData> {
    throw new Error('Midjourney does not have a public usage API. Use manual tracking.');
  },
};
```

- [ ] **Step 4: Implement Runway integration**

```ts
// lib/integrations/runway.ts
import type { ToolIntegration, UsageData } from './types';

export const runwayIntegration: ToolIntegration = {
  slug: 'runway',
  displayName: 'Runway',
  category: 'video',

  async fetchUsage(apiKey: string): Promise<UsageData> {
    const now   = new Date();
    const start = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
    const end   = now.toISOString().slice(0, 10);

    const res = await fetch('https://api.runwayml.com/v1/credits', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? `Runway API error ${res.status}`);
    }

    const data = await res.json();
    return {
      creditsUsed:      data.used      ?? null,
      creditsRemaining: data.remaining ?? null,
      costToDate:       0,
      periodStart: start,
      periodEnd:   end,
    };
  },
};
```

- [ ] **Step 5: Create registry**

```ts
// lib/integrations/registry.ts
import { openaiIntegration }     from './openai';
import { anthropicIntegration }  from './anthropic';
import { midjourneyIntegration } from './midjourney';
import { elevenlabsIntegration } from './elevenlabs';
import { runwayIntegration }     from './runway';
import type { ToolIntegration }  from './types';

export const CATALOG: ToolIntegration[] = [
  openaiIntegration,
  anthropicIntegration,
  midjourneyIntegration,
  elevenlabsIntegration,
  runwayIntegration,
];

export const CATALOG_MAP: Record<string, ToolIntegration> = Object.fromEntries(
  CATALOG.map(t => [t.slug, t])
);

/** Returns null if slug is not in catalog (e.g., custom tool). */
export function getIntegration(slug: string): ToolIntegration | null {
  return CATALOG_MAP[slug] ?? null;
}
```

- [ ] **Step 6: Write registry test**

```ts
// lib/integrations/registry.test.ts
import { describe, it, expect } from 'vitest';
import { CATALOG, getIntegration } from './registry';

describe('integration registry', () => {
  it('contains 5 catalog entries', () => {
    expect(CATALOG).toHaveLength(5);
  });

  it('looks up by slug', () => {
    expect(getIntegration('openai')?.displayName).toBe('OpenAI');
    expect(getIntegration('elevenlabs')?.displayName).toBe('ElevenLabs');
  });

  it('returns null for unknown slug', () => {
    expect(getIntegration('unknown-tool')).toBeNull();
  });
});
```

- [ ] **Step 7: Run tests**

```bash
npm test lib/integrations/registry.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add lib/integrations/
git commit -m "feat: add Anthropic, ElevenLabs, Midjourney, Runway integrations and registry"
```

---

## Task 8: Notification Senders

**Files:**
- Create: `lib/notifications/email.ts`
- Create: `lib/notifications/whatsapp.ts`
- Create: `lib/notifications/email.test.ts`
- Create: `lib/notifications/whatsapp.test.ts`

- [ ] **Step 1: Write failing email test**

```ts
// lib/notifications/email.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }),
    },
  })),
}));

import { sendAlertEmail } from './email';

describe('sendAlertEmail', () => {
  it('calls resend with correct fields', async () => {
    process.env.RESEND_API_KEY = 'test';
    const result = await sendAlertEmail({
      to:          'user@example.com',
      toolName:    'OpenAI',
      triggerType: 'threshold_high',
      message:     'You have used 85% of your OpenAI credits.',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('email-123');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test lib/notifications/email.test.ts
```

- [ ] **Step 3: Implement email sender**

```ts
// lib/notifications/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AlertEmailParams {
  to:          string;
  toolName:    string;
  triggerType: string;
  message:     string;
}

interface SendResult {
  success:    boolean;
  messageId?: string;
  error?:     string;
}

export async function sendAlertEmail(params: AlertEmailParams): Promise<SendResult> {
  const subject = `AI Tracker Alert: ${params.toolName}`;
  const html = `
    <h2>Alert: ${params.toolName}</h2>
    <p>${params.message}</p>
    <p style="color:#888;font-size:12px">You're receiving this because you set up an alert in AI Tracker.</p>
  `;

  const { data, error } = await resend.emails.send({
    from:    'AI Tracker <alerts@yourdomain.com>',
    to:      params.to,
    subject,
    html,
  });

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Unknown error' };
  }
  return { success: true, messageId: data.id };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test lib/notifications/email.test.ts
```

- [ ] **Step 5: Write failing WhatsApp test**

```ts
// lib/notifications/whatsapp.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('twilio', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({ sid: 'SM123', status: 'queued' }),
    },
  })),
}));

import { sendAlertWhatsApp } from './whatsapp';

describe('sendAlertWhatsApp', () => {
  it('calls Twilio with whatsapp: prefix on both numbers', async () => {
    process.env.TWILIO_ACCOUNT_SID   = 'AC_test';
    process.env.TWILIO_AUTH_TOKEN    = 'token';
    process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';

    const result = await sendAlertWhatsApp({
      to:      '+905001234567',
      message: 'OpenAI: 85% credits used.',
    });
    expect(result.success).toBe(true);
    expect(result.sid).toBe('SM123');
  });
});
```

- [ ] **Step 6: Run test — expect FAIL**

```bash
npm test lib/notifications/whatsapp.test.ts
```

- [ ] **Step 7: Implement WhatsApp sender**

```ts
// lib/notifications/whatsapp.ts
import twilio from 'twilio';

interface WhatsAppParams {
  to:      string; // e.g. "+905001234567"
  message: string;
}

interface SendResult {
  success: boolean;
  sid?:    string;
  error?:  string;
}

export async function sendAlertWhatsApp(params: WhatsAppParams): Promise<SendResult> {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM!,
      to:   `whatsapp:${params.to}`,
      body: params.message,
    });
    return { success: true, sid: msg.sid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
```

- [ ] **Step 8: Run all notification tests**

```bash
npm test lib/notifications/
```

Expected: PASS (2 test files)

- [ ] **Step 9: Commit**

```bash
git add lib/notifications/
git commit -m "feat: add Resend email and Twilio WhatsApp notification senders"
```

---

## Task 9: Server Actions — Tools

**Files:**
- Create: `actions/tools.ts`
- Create: `actions/tools.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// actions/tools.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_user_1' }),
}));

// Mock db
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'user-uuid-1',
          organizationId: 'org-uuid-1',
          organization: { plan: 'pro' },
        }),
      },
      connectedTools: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'tool-uuid-1' }]),
      }),
    }),
  },
}));

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn().mockReturnValue('encrypted-key'),
}));

import { createTool } from './tools';

describe('createTool', () => {
  it('encrypts API key before inserting', async () => {
    const { encrypt } = await import('@/lib/crypto');
    await createTool({
      toolSlug:    'openai',
      displayName: 'OpenAI',
      category:    'text',
      syncType:    'api',
      apiKey:      'sk-secret',
      billingType: 'subscription',
    });
    expect(encrypt).toHaveBeenCalledWith('sk-secret');
  });

  it('throws if free org already has 3 tools', async () => {
    const { db } = await import('@/lib/db');
    (db.query.users.findFirst as any).mockResolvedValueOnce({
      id: 'user-uuid-1',
      organizationId: 'org-uuid-1',
      organization: { plan: 'free' },
    });
    (db.query.connectedTools.findMany as any).mockResolvedValueOnce([{}, {}, {}]);
    await expect(createTool({
      toolSlug: 'openai', displayName: 'OpenAI', category: 'text',
      syncType: 'api', billingType: 'subscription',
    })).rejects.toThrow('Free plan is limited to 3 tools');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test actions/tools.test.ts
```

- [ ] **Step 3: Implement**

```ts
// actions/tools.ts
'use server';
import { db }           from '@/lib/db';
import { connectedTools, usageSnapshots } from '@/lib/db/schema';
import { requireOrg }   from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';
import { toolLimit }    from '@/lib/stripe';
import { eq, and }      from 'drizzle-orm';

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
  const { orgId, plan } = await requireOrg();

  const existing = await db.query.connectedTools.findMany({
    where: eq(connectedTools.organizationId, orgId),
  });
  const limit = toolLimit(plan);
  if (existing.length >= limit) {
    throw new Error(`Free plan is limited to ${limit} tools. Upgrade to add more.`);
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
  const { orgId } = await requireOrg();
  await db.delete(connectedTools).where(
    and(eq(connectedTools.id, toolId), eq(connectedTools.organizationId, orgId))
  );
}

export async function addManualSnapshot(toolId: string, input: {
  creditsUsed:      number | null;
  creditsRemaining: number | null;
  costToDate:       number;
  periodStart:      string;
  periodEnd:        string;
}) {
  const { orgId } = await requireOrg();
  // Verify ownership
  const tool = await db.query.connectedTools.findFirst({
    where: and(eq(connectedTools.id, toolId), eq(connectedTools.organizationId, orgId)),
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
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test actions/tools.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add actions/tools.ts actions/tools.test.ts
git commit -m "feat: add tool server actions with plan limit enforcement"
```

---

## Task 10: Sync Worker Cron

**Files:**
- Create: `app/api/cron/sync/route.ts`

- [ ] **Step 1: Implement**

The cron runs hourly. It only syncs API tools whose org plan warrants it (Pro/Team → every run; Free → only if last sync was >24h ago).

```ts
// app/api/cron/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db }            from '@/lib/db';
import { connectedTools, usageSnapshots, organizations } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getIntegration } from '@/lib/integrations/registry';
import { decrypt }        from '@/lib/crypto';
import { syncFrequency }  from '@/lib/stripe';
import { sendAlertEmail } from '@/lib/notifications/email';

function authorized(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiTools = await db.query.connectedTools.findMany({
    where: eq(connectedTools.syncType, 'api'),
    with:  { organization: true },
  });

  const results = { synced: 0, skipped: 0, errors: 0 };

  for (const tool of apiTools) {
    const org   = (tool as any).organization;
    const freqH = syncFrequency(org.plan);
    const now   = Date.now();

    if (tool.lastSyncedAt) {
      const msSinceSync = now - new Date(tool.lastSyncedAt).getTime();
      if (msSinceSync < freqH * 60 * 60 * 1000) {
        results.skipped++;
        continue;
      }
    }

    const integration = getIntegration(tool.toolSlug);
    if (!integration || !tool.encryptedApiKey) {
      results.skipped++;
      continue;
    }

    try {
      const apiKey = decrypt(tool.encryptedApiKey);
      const usage  = await integration.fetchUsage(apiKey);

      await db.insert(usageSnapshots).values({
        connectedToolId:  tool.id,
        creditsUsed:      usage.creditsUsed,
        creditsRemaining: usage.creditsRemaining,
        costToDate:       usage.costToDate.toString(),
        periodStart:      usage.periodStart,
        periodEnd:        usage.periodEnd,
      });

      await db.update(connectedTools)
        .set({ syncStatus: 'ok', lastSyncedAt: new Date() })
        .where(eq(connectedTools.id, tool.id));

      results.synced++;
    } catch (err: any) {
      await db.update(connectedTools)
        .set({ syncStatus: 'sync_error' })
        .where(eq(connectedTools.id, tool.id));

      // Send one error email per day (checked by caller — simplified here)
      results.errors++;
      console.error(`Sync error for tool ${tool.id}:`, err.message);
    }
  }

  return NextResponse.json(results);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/sync/route.ts
git commit -m "feat: add hourly sync worker cron route"
```

---

## Task 11: Alert Engine Cron

**Files:**
- Create: `app/api/cron/alerts/route.ts`
- Create: `app/api/cron/alerts/route.test.ts`

- [ ] **Step 1: Write failing test for alert condition logic**

```ts
// lib/alerts/conditions.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateRule } from './conditions';

describe('evaluateRule', () => {
  it('fires threshold_high when usage >= threshold', () => {
    expect(evaluateRule({
      triggerType: 'threshold_high',
      thresholdPercent: 80,
      creditsUsed: 85, creditLimit: 100,
      unusedDays: null, lastSnapshotAt: new Date(),
    })).toBe(true);
  });

  it('does not fire threshold_high below threshold', () => {
    expect(evaluateRule({
      triggerType: 'threshold_high',
      thresholdPercent: 80,
      creditsUsed: 70, creditLimit: 100,
      unusedDays: null, lastSnapshotAt: new Date(),
    })).toBe(false);
  });

  it('fires threshold_low when usage < threshold', () => {
    expect(evaluateRule({
      triggerType: 'threshold_low',
      thresholdPercent: 10,
      creditsUsed: 5, creditLimit: 100,
      unusedDays: null, lastSnapshotAt: new Date(),
    })).toBe(true);
  });

  it('fires unused when no snapshot within unusedDays', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    expect(evaluateRule({
      triggerType: 'unused',
      thresholdPercent: null,
      creditsUsed: null, creditLimit: null,
      unusedDays: 7, lastSnapshotAt: old,
    })).toBe(true);
  });

  it('does not fire unused when snapshot is recent', () => {
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(evaluateRule({
      triggerType: 'unused',
      thresholdPercent: null,
      creditsUsed: null, creditLimit: null,
      unusedDays: 7, lastSnapshotAt: recent,
    })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test lib/alerts/conditions.test.ts
```

- [ ] **Step 3: Implement condition evaluator**

```ts
// lib/alerts/conditions.ts
interface RuleContext {
  triggerType:      'threshold_high' | 'threshold_low' | 'unused';
  thresholdPercent: number | null;
  creditsUsed:      number | null;
  creditLimit:      number | null;
  unusedDays:       number | null;
  lastSnapshotAt:   Date | null;
}

export function evaluateRule(ctx: RuleContext): boolean {
  if (ctx.triggerType === 'threshold_high') {
    if (ctx.creditsUsed === null || !ctx.creditLimit || !ctx.thresholdPercent) return false;
    return (ctx.creditsUsed / ctx.creditLimit) * 100 >= ctx.thresholdPercent;
  }

  if (ctx.triggerType === 'threshold_low') {
    if (ctx.creditsUsed === null || !ctx.creditLimit || ctx.thresholdPercent === null) return false;
    return (ctx.creditsUsed / ctx.creditLimit) * 100 < ctx.thresholdPercent;
  }

  if (ctx.triggerType === 'unused') {
    if (!ctx.unusedDays || !ctx.lastSnapshotAt) return true; // never synced → treat as unused
    const daysSince = (Date.now() - ctx.lastSnapshotAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= ctx.unusedDays;
  }

  return false;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test lib/alerts/conditions.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 5: Implement alert cron route**

```ts
// app/api/cron/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db }               from '@/lib/db';
import { alertRules, notificationLogs, connectedTools, usageSnapshots, users } from '@/lib/db/schema';
import { eq, desc, and }    from 'drizzle-orm';
import { evaluateRule }     from '@/lib/alerts/conditions';
import { sendAlertEmail }   from '@/lib/notifications/email';
import { sendAlertWhatsApp } from '@/lib/notifications/whatsapp';
import { canUseWhatsApp }   from '@/lib/stripe';

function authorized(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

function buildMessage(triggerType: string, toolName: string, thresholdPercent: number | null, unusedDays: number | null): string {
  if (triggerType === 'threshold_high') return `⚠️ ${toolName}: You've used ${thresholdPercent}%+ of your limit.`;
  if (triggerType === 'threshold_low')  return `💤 ${toolName}: Usage is below ${thresholdPercent}% — underutilised this period.`;
  if (triggerType === 'unused')         return `🔇 ${toolName}: No activity detected in the last ${unusedDays} days.`;
  return `Alert triggered for ${toolName}.`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rules = await db.query.alertRules.findMany({
    where: eq(alertRules.active, true),
    with: { connectedTool: { with: { organization: true } } },
  });

  let fired = 0;

  for (const rule of rules) {
    const tool = (rule as any).connectedTool;
    const org  = tool.organization;

    // Cooldown check
    if (rule.lastFiredAt) {
      const hoursSince = (Date.now() - new Date(rule.lastFiredAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < rule.cooldownHours) continue;
    }

    // Get latest snapshot
    const [snap] = await db.select().from(usageSnapshots)
      .where(eq(usageSnapshots.connectedToolId, tool.id))
      .orderBy(desc(usageSnapshots.recordedAt))
      .limit(1);

    const shouldFire = evaluateRule({
      triggerType:      rule.triggerType as any,
      thresholdPercent: rule.thresholdPercent,
      creditsUsed:      snap?.creditsUsed ?? null,
      creditLimit:      tool.creditLimit,
      unusedDays:       rule.unusedDays,
      lastSnapshotAt:   snap ? new Date(snap.recordedAt) : null,
    });

    if (!shouldFire) continue;

    // Get org owner email
    const owner = await db.query.users.findFirst({
      where: and(eq(users.organizationId, org.id), eq(users.role, 'owner')),
    });
    if (!owner) continue;

    const message = buildMessage(rule.triggerType, tool.displayName, rule.thresholdPercent, rule.unusedDays);

    for (const channel of rule.channels) {
      let success = false;
      let fallbackUsed = false;

      if (channel === 'email') {
        const result = await sendAlertEmail({ to: '', toolName: tool.displayName, triggerType: rule.triggerType, message });
        success = result.success;
      }

      if (channel === 'whatsapp' && canUseWhatsApp(org.plan)) {
        if (owner.whatsappOptedIn && owner.whatsappPhone) {
          const result = await sendAlertWhatsApp({ to: owner.whatsappPhone, message });
          success = result.success;
          if (!result.success) {
            // Fallback to email
            const fb = await sendAlertEmail({ to: '', toolName: tool.displayName, triggerType: rule.triggerType, message });
            success = fb.success;
            fallbackUsed = true;
          }
        }
      }

      await db.insert(notificationLogs).values({
        alertRuleId:  rule.id,
        channel:      channel as any,
        status:       success ? 'delivered' : 'failed',
        fallbackUsed,
      });
    }

    await db.update(alertRules)
      .set({ lastFiredAt: new Date() })
      .where(eq(alertRules.id, rule.id));

    fired++;
  }

  return NextResponse.json({ fired });
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/alerts/ app/api/cron/alerts/
git commit -m "feat: add alert engine with condition evaluator and cron route"
```

---

## Task 12: Monthly Report Generation

**Files:**
- Create: `lib/reports/generate.ts`
- Create: `lib/reports/generate.test.ts`
- Create: `lib/reports/pdf.tsx`
- Create: `app/api/cron/monthly-report/route.ts`

- [ ] **Step 1: Write failing test for report data assembly**

```ts
// lib/reports/generate.test.ts
import { describe, it, expect } from 'vitest';
import { assembleReportData } from './generate';

describe('assembleReportData', () => {
  it('sums total spend across tools', () => {
    const snapshots = [
      { toolId: 'a', toolName: 'OpenAI',   category: 'text',   costToDate: '12.50', creditsUsed: 100, creditLimit: 200 },
      { toolId: 'b', toolName: 'Runway',   category: 'video',  costToDate: '30.00', creditsUsed: 50,  creditLimit: 100 },
      { toolId: 'c', toolName: 'ElevenLabs', category: 'audio', costToDate: '0.00', creditsUsed: 200, creditLimit: 1000 },
    ];
    const data = assembleReportData(snapshots);
    expect(data.totalSpend).toBeCloseTo(42.50, 2);
  });

  it('groups spend by category', () => {
    const snapshots = [
      { toolId: 'a', toolName: 'OpenAI', category: 'text',  costToDate: '10.00', creditsUsed: null, creditLimit: null },
      { toolId: 'b', toolName: 'Runway', category: 'video', costToDate: '20.00', creditsUsed: null, creditLimit: null },
    ];
    const data = assembleReportData(snapshots);
    expect(data.byCategory.text).toBeCloseTo(10.00, 2);
    expect(data.byCategory.video).toBeCloseTo(20.00, 2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test lib/reports/generate.test.ts
```

- [ ] **Step 3: Implement report data assembler**

```ts
// lib/reports/generate.ts
export interface ToolSnapshot {
  toolId:      string;
  toolName:    string;
  category:    string;
  costToDate:  string;
  creditsUsed: number | null;
  creditLimit: number | null;
}

export interface ReportData {
  totalSpend: number;
  byCategory: Record<string, number>;
  tools: Array<{
    toolId:      string;
    toolName:    string;
    category:    string;
    spend:       number;
    usagePercent: number | null;
  }>;
}

export function assembleReportData(snapshots: ToolSnapshot[]): ReportData {
  let totalSpend = 0;
  const byCategory: Record<string, number> = {};
  const tools = snapshots.map(s => {
    const spend = parseFloat(s.costToDate);
    totalSpend += spend;
    byCategory[s.category] = (byCategory[s.category] ?? 0) + spend;
    const usagePercent =
      s.creditsUsed !== null && s.creditLimit
        ? Math.round((s.creditsUsed / s.creditLimit) * 100)
        : null;
    return { toolId: s.toolId, toolName: s.toolName, category: s.category, spend, usagePercent };
  });
  return { totalSpend, byCategory, tools };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test lib/reports/generate.test.ts
```

- [ ] **Step 5: Implement PDF template**

```tsx
// lib/reports/pdf.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReportData } from './generate';

const styles = StyleSheet.create({
  page:    { padding: 40, fontFamily: 'Helvetica' },
  title:   { fontSize: 22, marginBottom: 20, fontWeight: 'bold' },
  section: { marginBottom: 16 },
  heading: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label:   { fontSize: 11 },
  value:   { fontSize: 11, fontWeight: 'bold' },
  total:   { fontSize: 14, fontWeight: 'bold', marginTop: 8 },
});

interface Props {
  orgName:     string;
  periodStart: string;
  periodEnd:   string;
  data:        ReportData;
}

export function MonthlyReportPDF({ orgName, periodStart, periodEnd, data }: Props) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>Monthly AI Usage Report</Text>
        <Text style={{ fontSize: 12, marginBottom: 20 }}>
          {orgName} · {periodStart} → {periodEnd}
        </Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Spend</Text>
            <Text style={styles.value}>${data.totalSpend.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Spend by Category</Text>
          {Object.entries(data.byCategory).map(([cat, spend]) => (
            <View key={cat} style={styles.row}>
              <Text style={styles.label}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              <Text style={styles.value}>${spend.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Tool Breakdown</Text>
          {data.tools.map(t => (
            <View key={t.toolId} style={styles.row}>
              <Text style={styles.label}>{t.toolName} ({t.category})</Text>
              <Text style={styles.value}>
                ${t.spend.toFixed(2)}{t.usagePercent !== null ? ` · ${t.usagePercent}% used` : ''}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 6: Implement monthly report cron**

```ts
// app/api/cron/monthly-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db }                 from '@/lib/db';
import { organizations, connectedTools, usageSnapshots, monthlyReports } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { assembleReportData } from '@/lib/reports/generate';
import { renderToBuffer }     from '@react-pdf/renderer';
import { MonthlyReportPDF }   from '@/lib/reports/pdf';
import { put }                from '@vercel/blob';
import React from 'react';

function authorized(req: NextRequest): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodStart = prevMonth.toISOString().slice(0, 10);
  const periodEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

  const orgs = await db.select().from(organizations);

  for (const org of orgs) {
    const tools = await db.query.connectedTools.findMany({
      where: eq(connectedTools.organizationId, org.id),
    });

    const snapshots = await Promise.all(tools.map(async tool => {
      const [snap] = await db.select().from(usageSnapshots)
        .where(and(
          eq(usageSnapshots.connectedToolId, tool.id),
          gte(usageSnapshots.periodStart, periodStart),
          lte(usageSnapshots.periodEnd,   periodEnd),
        ))
        .orderBy(desc(usageSnapshots.recordedAt))
        .limit(1);
      if (!snap) return null;
      return {
        toolId:      tool.id,
        toolName:    tool.displayName,
        category:    tool.category,
        costToDate:  snap.costToDate,
        creditsUsed: snap.creditsUsed,
        creditLimit: tool.creditLimit,
      };
    }));

    const validSnapshots = snapshots.filter(Boolean) as any[];
    const reportData = assembleReportData(validSnapshots);

    const [report] = await db.insert(monthlyReports).values({
      organizationId: org.id,
      periodStart,
      periodEnd,
      totalSpend: reportData.totalSpend.toString(),
      reportData,
      status: 'generating',
    }).returning();

    // Generate PDF
    try {
      const buffer = await renderToBuffer(
        React.createElement(MonthlyReportPDF, {
          orgName: org.name,
          periodStart,
          periodEnd,
          data: reportData,
        })
      );
      const blob = await put(`reports/${org.id}/${report.id}.pdf`, buffer, { access: 'private' });
      await db.update(monthlyReports)
        .set({ pdfUrl: blob.url, status: 'ready' })
        .where(eq(monthlyReports.id, report.id));
    } catch {
      await db.update(monthlyReports)
        .set({ status: 'pdf_failed' })
        .where(eq(monthlyReports.id, report.id));
    }
  }

  return NextResponse.json({ generated: orgs.length });
}
```

- [ ] **Step 7: Run all report tests**

```bash
npm test lib/reports/
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/reports/ app/api/cron/monthly-report/
git commit -m "feat: add monthly report generator with PDF export via Vercel Blob"
```

---

## Task 13: Dashboard Layout + Overview Page

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `app/(dashboard)/dashboard/page.tsx`
- Create: `components/dashboard/overview-stats.tsx`
- Create: `components/dashboard/spend-by-category-chart.tsx`
- Create: `components/dashboard/tools-near-limit.tsx`
- Create: `components/dashboard/inactive-tools.tsx`

- [ ] **Step 1: Create dashboard layout with sidebar nav**

```tsx
// app/(dashboard)/layout.tsx
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/tools',     label: 'Tools' },
  { href: '/alerts',    label: 'Alerts' },
  { href: '/reports',   label: 'Reports' },
  { href: '/settings',  label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-muted/40 flex flex-col p-4 gap-1">
        <div className="font-bold text-lg mb-6 px-2">AI Tracker</div>
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className="px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors">
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create OverviewStats component**

```tsx
// components/dashboard/overview-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  totalSpend:   number;
  toolsCount:   number;
  nearLimit:    number;
  inactive:     number;
}

export function OverviewStats({ totalSpend, toolsCount, nearLimit, inactive }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Monthly Spend</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">${totalSpend.toFixed(2)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Tools Tracked</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{toolsCount}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Near Limit</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-orange-500">{nearLimit}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Inactive Tools</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-muted-foreground">{inactive}</p></CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create SpendByCategoryChart component**

```tsx
// components/dashboard/spend-by-category-chart.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  data: Array<{ category: string; spend: number }>;
}

export function SpendByCategoryChart({ data }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>Spend by Category</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Spend']} />
            <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create ToolsNearLimit component**

```tsx
// components/dashboard/tools-near-limit.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge }    from '@/components/ui/badge';

interface Tool { id: string; name: string; usagePct: number; }

export function ToolsNearLimit({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Near Limit</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {tools.map(t => (
          <div key={t.id}>
            <div className="flex justify-between text-sm mb-1">
              <span>{t.name}</span>
              <Badge variant={t.usagePct >= 90 ? 'destructive' : 'secondary'}>{t.usagePct}%</Badge>
            </div>
            <Progress value={t.usagePct} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create InactiveTools component**

```tsx
// components/dashboard/inactive-tools.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Tool { id: string; name: string; daysSinceUse: number; }

export function InactiveTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Inactive Tools</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {tools.map(t => (
          <div key={t.id} className="flex justify-between items-center text-sm">
            <span>{t.name}</span>
            <Badge variant="outline">{t.daysSinceUse}d idle</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 6: Create dashboard page**

```tsx
// app/(dashboard)/dashboard/page.tsx
import { db }        from '@/lib/db';
import { requireOrg } from '@/lib/auth';
import { connectedTools, usageSnapshots } from '@/lib/db/schema';
import { eq, desc }  from 'drizzle-orm';
import { OverviewStats }         from '@/components/dashboard/overview-stats';
import { SpendByCategoryChart }  from '@/components/dashboard/spend-by-category-chart';
import { ToolsNearLimit }        from '@/components/dashboard/tools-near-limit';
import { InactiveTools }         from '@/components/dashboard/inactive-tools';

export default async function DashboardPage() {
  const { orgId } = await requireOrg();
  const tools = await db.query.connectedTools.findMany({
    where: eq(connectedTools.organizationId, orgId),
  });

  // Fetch latest snapshot per tool
  const toolData = await Promise.all(tools.map(async tool => {
    const [snap] = await db.select().from(usageSnapshots)
      .where(eq(usageSnapshots.connectedToolId, tool.id))
      .orderBy(desc(usageSnapshots.recordedAt))
      .limit(1);
    return { tool, snap };
  }));

  const totalSpend = toolData.reduce((acc, { snap }) => acc + parseFloat(snap?.costToDate ?? '0'), 0);

  const nearLimit = toolData
    .filter(({ snap, tool }) => {
      if (!snap?.creditsUsed || !tool.creditLimit) return false;
      return (snap.creditsUsed / tool.creditLimit) * 100 >= 70;
    })
    .map(({ tool, snap }) => ({
      id: tool.id,
      name: tool.displayName,
      usagePct: Math.round((snap!.creditsUsed! / tool.creditLimit!) * 100),
    }))
    .sort((a, b) => b.usagePct - a.usagePct);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const inactive = toolData
    .filter(({ snap }) => !snap || new Date(snap.recordedAt) < sevenDaysAgo)
    .map(({ tool, snap }) => ({
      id: tool.id,
      name: tool.displayName,
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
```

- [ ] **Step 7: Commit**

```bash
git add app/(dashboard)/ components/dashboard/
git commit -m "feat: add dashboard overview page with stats and charts"
```

---

## Task 14: Tools Management Pages

**Files:**
- Create: `components/tools/tool-card.tsx`
- Create: `components/tools/connect-tool-form.tsx`
- Create: `components/tools/manual-usage-form.tsx`
- Create: `app/(dashboard)/tools/page.tsx`
- Create: `app/(dashboard)/tools/new/page.tsx`

- [ ] **Step 1: Create ToolCard component**

```tsx
// components/tools/tool-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }    from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  id:               string;
  displayName:      string;
  category:         string;
  syncType:         string;
  syncStatus:       string;
  lastSyncedAt:     Date | null;
  creditsUsed:      number | null;
  creditsRemaining: number | null;
  creditLimit:      number | null;
  costToDate:       number;
  renewalDate:      string | null;
}

export function ToolCard(props: Props) {
  const pct = props.creditLimit && props.creditsUsed !== null
    ? Math.round((props.creditsUsed / props.creditLimit) * 100)
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{props.displayName}</CardTitle>
        <div className="flex gap-1">
          <Badge variant="outline" className="capitalize">{props.category}</Badge>
          {props.syncType === 'manual' && <Badge variant="secondary">Manual</Badge>}
          {props.syncStatus === 'sync_error' && <Badge variant="destructive">Sync Error</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pct !== null && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">
              {props.creditsRemaining?.toLocaleString()} remaining
            </p>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spend this period</span>
          <span className="font-medium">${props.costToDate.toFixed(2)}</span>
        </div>
        {props.renewalDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Renews</span>
            <span>{props.renewalDate}</span>
          </div>
        )}
        {props.lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(props.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create ConnectToolForm**

```tsx
// components/tools/connect-tool-form.tsx
'use client';
import { useTransition } from 'react';
import { useRouter }     from 'next/navigation';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTool } from '@/actions/tools';
import { CATALOG }    from '@/lib/integrations/registry';

export function ConnectToolForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd       = new FormData(e.currentTarget);
    const toolSlug = fd.get('toolSlug') as string;
    const catalog  = CATALOG.find(t => t.slug === toolSlug);
    startTransition(async () => {
      await createTool({
        toolSlug,
        displayName:     fd.get('displayName') as string || catalog?.displayName || toolSlug,
        category:        (catalog?.category ?? fd.get('category')) as any,
        syncType:        catalog && toolSlug !== 'midjourney' ? 'api' : 'manual',
        apiKey:          (fd.get('apiKey') as string) || undefined,
        billingType:     fd.get('billingType') as any,
        planMonthlyCost: fd.get('planMonthlyCost') ? Number(fd.get('planMonthlyCost')) : undefined,
        creditLimit:     fd.get('creditLimit') ? Number(fd.get('creditLimit')) : undefined,
        renewalDate:     (fd.get('renewalDate') as string) || undefined,
      });
      router.push('/tools');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="toolSlug">Tool</Label>
        <Select name="toolSlug" required>
          <SelectTrigger><SelectValue placeholder="Select a tool" /></SelectTrigger>
          <SelectContent>
            {CATALOG.map(t => <SelectItem key={t.slug} value={t.slug}>{t.displayName}</SelectItem>)}
            <SelectItem value="custom">Custom tool…</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="displayName">Display Name (optional)</Label>
        <Input name="displayName" placeholder="My OpenAI account" />
      </div>
      <div>
        <Label htmlFor="apiKey">API Key (for auto-sync tools)</Label>
        <Input name="apiKey" type="password" placeholder="sk-…" />
      </div>
      <div>
        <Label htmlFor="billingType">Billing Type</Label>
        <Select name="billingType" required>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="credits">Credits</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="planMonthlyCost">Monthly Cost ($)</Label>
        <Input name="planMonthlyCost" type="number" step="0.01" placeholder="20.00" />
      </div>
      <div>
        <Label htmlFor="creditLimit">Credit Limit</Label>
        <Input name="creditLimit" type="number" placeholder="1000" />
      </div>
      <div>
        <Label htmlFor="renewalDate">Renewal Date</Label>
        <Input name="renewalDate" type="date" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Connecting…' : 'Connect Tool'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create tools list page**

```tsx
// app/(dashboard)/tools/page.tsx
import Link from 'next/link';
import { db }          from '@/lib/db';
import { requireOrg }  from '@/lib/auth';
import { connectedTools, usageSnapshots } from '@/lib/db/schema';
import { eq, desc }    from 'drizzle-orm';
import { Button }      from '@/components/ui/button';
import { ToolCard }    from '@/components/tools/tool-card';

export default async function ToolsPage() {
  const { orgId } = await requireOrg();
  const tools = await db.query.connectedTools.findMany({
    where: eq(connectedTools.organizationId, orgId),
  });

  const toolsWithSnap = await Promise.all(tools.map(async tool => {
    const [snap] = await db.select().from(usageSnapshots)
      .where(eq(usageSnapshots.connectedToolId, tool.id))
      .orderBy(desc(usageSnapshots.recordedAt))
      .limit(1);
    return { tool, snap };
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tools</h1>
        <Button asChild><Link href="/tools/new">+ Connect Tool</Link></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {toolsWithSnap.map(({ tool, snap }) => (
          <ToolCard
            key={tool.id}
            id={tool.id}
            displayName={tool.displayName}
            category={tool.category}
            syncType={tool.syncType}
            syncStatus={tool.syncStatus}
            lastSyncedAt={tool.lastSyncedAt}
            creditsUsed={snap?.creditsUsed ?? null}
            creditsRemaining={snap?.creditsRemaining ?? null}
            creditLimit={tool.creditLimit}
            costToDate={parseFloat(snap?.costToDate ?? '0')}
            renewalDate={tool.renewalDate}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create new tool page**

```tsx
// app/(dashboard)/tools/new/page.tsx
import { ConnectToolForm } from '@/components/tools/connect-tool-form';

export default function NewToolPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Connect a Tool</h1>
      <ConnectToolForm />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/tools/ components/tools/
git commit -m "feat: add tools management pages with connect form and tool cards"
```

---

## Task 15: Alert Rules Pages

**Files:**
- Create: `actions/alerts.ts`
- Create: `components/alerts/alert-rule-form.tsx`
- Create: `components/alerts/alert-rule-list.tsx`
- Create: `app/(dashboard)/alerts/page.tsx`

- [ ] **Step 1: Create alert server actions**

```ts
// actions/alerts.ts
'use server';
import { db }          from '@/lib/db';
import { alertRules }  from '@/lib/db/schema';
import { requireOrg }  from '@/lib/auth';
import { eq, and }     from 'drizzle-orm';

interface CreateAlertInput {
  connectedToolId:  string;
  triggerType:      'threshold_high' | 'threshold_low' | 'unused';
  thresholdPercent?: number;
  unusedDays?:       number;
  channels:          string[];
  cooldownHours?:    number;
}

export async function createAlertRule(input: CreateAlertInput) {
  const { orgId } = await requireOrg();
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
  const { orgId } = await requireOrg();
  await db.delete(alertRules).where(
    and(eq(alertRules.id, ruleId), eq(alertRules.organizationId, orgId))
  );
}

export async function toggleAlertRule(ruleId: string, active: boolean) {
  const { orgId } = await requireOrg();
  await db.update(alertRules)
    .set({ active })
    .where(and(eq(alertRules.id, ruleId), eq(alertRules.organizationId, orgId)));
}
```

- [ ] **Step 2: Create AlertRuleForm component**

```tsx
// components/alerts/alert-rule-form.tsx
'use client';
import { useTransition }  from 'react';
import { useRouter }      from 'next/navigation';
import { Button }  from '@/components/ui/button';
import { Label }   from '@/components/ui/label';
import { Input }   from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAlertRule } from '@/actions/alerts';

interface Tool { id: string; displayName: string; }

export function AlertRuleForm({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd          = new FormData(e.currentTarget);
    const triggerType = fd.get('triggerType') as string;
    const channels: string[] = [];
    if (fd.get('channel_email'))    channels.push('email');
    if (fd.get('channel_whatsapp')) channels.push('whatsapp');

    startTransition(async () => {
      await createAlertRule({
        connectedToolId:  fd.get('toolId') as string,
        triggerType:      triggerType as any,
        thresholdPercent: fd.get('thresholdPercent') ? Number(fd.get('thresholdPercent')) : undefined,
        unusedDays:       fd.get('unusedDays') ? Number(fd.get('unusedDays')) : undefined,
        channels,
        cooldownHours:    fd.get('cooldownHours') ? Number(fd.get('cooldownHours')) : 24,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md border rounded-lg p-4">
      <h3 className="font-semibold">New Alert Rule</h3>
      <div>
        <Label>Tool</Label>
        <Select name="toolId" required>
          <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
          <SelectContent>
            {tools.map(t => <SelectItem key={t.id} value={t.id}>{t.displayName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Trigger</Label>
        <Select name="triggerType" required>
          <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="threshold_high">Usage above %</SelectItem>
            <SelectItem value="threshold_low">Usage below %</SelectItem>
            <SelectItem value="unused">Unused for N days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Threshold % (for usage triggers)</Label>
        <Input name="thresholdPercent" type="number" min={1} max={100} placeholder="80" />
      </div>
      <div>
        <Label>Unused days (for unused trigger)</Label>
        <Input name="unusedDays" type="number" min={1} placeholder="7" />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="channel_email" defaultChecked /> Email
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="channel_whatsapp" /> WhatsApp
        </label>
      </div>
      <div>
        <Label>Cooldown (hours, default 24)</Label>
        <Input name="cooldownHours" type="number" min={1} defaultValue={24} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Add Rule'}</Button>
    </form>
  );
}
```

- [ ] **Step 3: Create AlertRuleList component**

```tsx
// components/alerts/alert-rule-list.tsx
'use client';
import { useTransition }      from 'react';
import { useRouter }          from 'next/navigation';
import { Button }             from '@/components/ui/button';
import { Badge }              from '@/components/ui/badge';
import { deleteAlertRule, toggleAlertRule } from '@/actions/alerts';

interface Rule {
  id:               string;
  toolName:         string;
  triggerType:      string;
  thresholdPercent: number | null;
  unusedDays:       number | null;
  channels:         string[];
  active:           boolean;
  lastFiredAt:      Date | null;
}

function describeRule(r: Rule): string {
  if (r.triggerType === 'threshold_high') return `Usage ≥ ${r.thresholdPercent}%`;
  if (r.triggerType === 'threshold_low')  return `Usage < ${r.thresholdPercent}%`;
  return `Unused for ${r.unusedDays} days`;
}

export function AlertRuleList({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {rules.map(rule => (
        <div key={rule.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
          <div>
            <p className="font-medium">{rule.toolName}</p>
            <p className="text-muted-foreground">{describeRule(rule)} · {rule.channels.join(', ')}</p>
            {rule.lastFiredAt && (
              <p className="text-xs text-muted-foreground">Last fired: {new Date(rule.lastFiredAt).toLocaleString()}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={rule.active ? 'default' : 'secondary'}>{rule.active ? 'Active' : 'Paused'}</Badge>
            <Button size="sm" variant="outline" disabled={pending} onClick={() =>
              startTransition(async () => { await toggleAlertRule(rule.id, !rule.active); router.refresh(); })
            }>
              {rule.active ? 'Pause' : 'Resume'}
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={() =>
              startTransition(async () => { await deleteAlertRule(rule.id); router.refresh(); })
            }>
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create alerts page**

```tsx
// app/(dashboard)/alerts/page.tsx
import { db }         from '@/lib/db';
import { requireOrg } from '@/lib/auth';
import { alertRules, connectedTools } from '@/lib/db/schema';
import { eq }         from 'drizzle-orm';
import { AlertRuleForm } from '@/components/alerts/alert-rule-form';
import { AlertRuleList } from '@/components/alerts/alert-rule-list';

export default async function AlertsPage() {
  const { orgId } = await requireOrg();
  const tools = await db.query.connectedTools.findMany({
    where: eq(connectedTools.organizationId, orgId),
  });
  const rules = await db.query.alertRules.findMany({
    where: eq(alertRules.organizationId, orgId),
    with: { connectedTool: true },
  });

  const rulesWithToolName = rules.map(r => ({
    id:               r.id,
    toolName:         (r as any).connectedTool.displayName,
    triggerType:      r.triggerType,
    thresholdPercent: r.thresholdPercent,
    unusedDays:       r.unusedDays,
    channels:         r.channels,
    active:           r.active,
    lastFiredAt:      r.lastFiredAt,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alert Rules</h1>
      <AlertRuleForm tools={tools.map(t => ({ id: t.id, displayName: t.displayName }))} />
      <AlertRuleList rules={rulesWithToolName} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add actions/alerts.ts components/alerts/ app/(dashboard)/alerts/
git commit -m "feat: add alert rules management with create/delete/toggle"
```

---

## Task 16: Reports Page + On-Demand PDF

**Files:**
- Create: `actions/reports.ts`
- Create: `components/reports/report-card.tsx`
- Create: `app/(dashboard)/reports/page.tsx`

- [ ] **Step 1: Create report server action for on-demand PDF**

```ts
// actions/reports.ts
'use server';
import { db }           from '@/lib/db';
import { monthlyReports, connectedTools, usageSnapshots } from '@/lib/db/schema';
import { requireOrg }   from '@/lib/auth';
import { canExportPdf } from '@/lib/stripe';
import { assembleReportData } from '@/lib/reports/generate';
import { MonthlyReportPDF }   from '@/lib/reports/pdf';
import { renderToBuffer }     from '@react-pdf/renderer';
import { put }                from '@vercel/blob';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import React from 'react';

export async function exportReportPdf(reportId: string): Promise<{ url: string }> {
  const { orgId, plan } = await requireOrg();
  if (!canExportPdf(plan)) throw new Error('PDF export requires a Pro or Team plan.');

  const report = await db.query.monthlyReports.findFirst({
    where: and(eq(monthlyReports.id, reportId), eq(monthlyReports.organizationId, orgId)),
    with: { organization: true },
  });
  if (!report) throw new Error('Report not found');
  if (report.pdfUrl) return { url: report.pdfUrl };

  const buffer = await renderToBuffer(
    React.createElement(MonthlyReportPDF, {
      orgName:     (report as any).organization.name,
      periodStart: report.periodStart,
      periodEnd:   report.periodEnd,
      data:        report.reportData as any,
    })
  );

  const blob = await put(`reports/${orgId}/${reportId}.pdf`, buffer, { access: 'private' });
  await db.update(monthlyReports)
    .set({ pdfUrl: blob.url, status: 'ready' })
    .where(eq(monthlyReports.id, reportId));

  return { url: blob.url };
}
```

- [ ] **Step 2: Create ReportCard component**

```tsx
// components/reports/report-card.tsx
'use client';
import { useTransition }  from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button }         from '@/components/ui/button';
import { Badge }          from '@/components/ui/badge';
import { exportReportPdf } from '@/actions/reports';

interface Props {
  id:          string;
  periodStart: string;
  periodEnd:   string;
  totalSpend:  number;
  status:      string;
  pdfUrl:      string | null;
  canExport:   boolean;
}

export function ReportCard({ id, periodStart, periodEnd, totalSpend, status, pdfUrl, canExport }: Props) {
  const [pending, startTransition] = useTransition();

  async function handleExport() {
    startTransition(async () => {
      const { url } = await exportReportPdf(id);
      window.open(url, '_blank');
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{periodStart} → {periodEnd}</CardTitle>
        <Badge variant={status === 'ready' ? 'default' : 'secondary'}>{status}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-xl font-bold">${totalSpend.toFixed(2)}</p>
        <div className="flex gap-2">
          {pdfUrl && (
            <Button size="sm" variant="outline" onClick={() => window.open(pdfUrl, '_blank')}>
              View PDF
            </Button>
          )}
          {!pdfUrl && canExport && (
            <Button size="sm" variant="outline" disabled={pending} onClick={handleExport}>
              {pending ? 'Generating…' : 'Export PDF'}
            </Button>
          )}
          {!canExport && <span className="text-xs text-muted-foreground">Pro required</span>}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create reports page**

```tsx
// app/(dashboard)/reports/page.tsx
import { db }         from '@/lib/db';
import { requireOrg } from '@/lib/auth';
import { monthlyReports } from '@/lib/db/schema';
import { eq, desc }   from 'drizzle-orm';
import { canExportPdf } from '@/lib/stripe';
import { ReportCard } from '@/components/reports/report-card';

export default async function ReportsPage() {
  const { orgId, plan } = await requireOrg();
  const reports = await db.select().from(monthlyReports)
    .where(eq(monthlyReports.organizationId, orgId))
    .orderBy(desc(monthlyReports.periodStart));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      {reports.length === 0 && (
        <p className="text-muted-foreground">No reports yet. Your first report will be generated automatically at the end of the month.</p>
      )}
      <div className="space-y-3">
        {reports.map(r => (
          <ReportCard
            key={r.id}
            id={r.id}
            periodStart={r.periodStart}
            periodEnd={r.periodEnd}
            totalSpend={parseFloat(r.totalSpend)}
            status={r.status}
            pdfUrl={r.pdfUrl}
            canExport={canExportPdf(plan)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add actions/reports.ts components/reports/ app/(dashboard)/reports/
git commit -m "feat: add reports page with on-demand PDF export"
```

---

## Task 17: Settings Pages (WhatsApp Opt-in + Billing)

**Files:**
- Create: `app/(dashboard)/settings/page.tsx`
- Create: `app/(dashboard)/settings/billing/page.tsx`

- [ ] **Step 1: Create settings action for WhatsApp opt-in**

Add to `actions/tools.ts` (append, do not overwrite):

```ts
// Append to actions/tools.ts
export async function updateWhatsAppSettings(phone: string, optIn: boolean) {
  const { orgId, userId } = await requireOrg();
  await db.update(users)
    .set({ whatsappPhone: phone, whatsappOptedIn: optIn })
    .where(eq(users.id, userId));
}
```

- [ ] **Step 2: Create settings page**

```tsx
// app/(dashboard)/settings/page.tsx
'use client';
import { useState, useTransition } from 'react';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { updateWhatsAppSettings } from '@/actions/tools';

export default function SettingsPage() {
  const [phone, setPhone]       = useState('');
  const [optIn, setOptIn]       = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved]       = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateWhatsAppSettings(phone, optIn);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">Settings</h1>
      <form onSubmit={handleSave} className="space-y-4 border rounded-lg p-4">
        <h2 className="font-semibold">WhatsApp Notifications</h2>
        <div>
          <Label htmlFor="phone">Phone Number (with country code)</Label>
          <Input id="phone" type="tel" placeholder="+905001234567" value={phone}
            onChange={e => setPhone(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)} />
          I agree to receive WhatsApp notifications from AI Tracker
        </label>
        <Button type="submit" disabled={pending || !phone || !optIn}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        {saved && <p className="text-sm text-green-600">Saved!</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create billing page**

```tsx
// app/(dashboard)/settings/billing/page.tsx
import { db }         from '@/lib/db';
import { requireOrg } from '@/lib/auth';
import { organizations } from '@/lib/db/schema';
import { eq }         from 'drizzle-orm';
import { stripe }     from '@/lib/stripe';
import { Badge }      from '@/components/ui/badge';
import { Button }     from '@/components/ui/button';

async function createPortalSession(orgId: string, customerId: string) {
  'use server';
  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });
  return session.url;
}

export default async function BillingPage() {
  const { orgId } = await requireOrg();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Plan</span>
          <Badge className="capitalize">{org.plan}</Badge>
        </div>
        {org.stripeCustomerId && (
          <form action={async () => {
            'use server';
            const url = await createPortalSession(orgId, org.stripeCustomerId!);
            // redirect handled client-side — use a client component redirect
          }}>
            <Button type="submit" variant="outline">Manage Subscription</Button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/settings/ actions/tools.ts
git commit -m "feat: add settings page with WhatsApp opt-in and billing portal"
```

---

## Task 18: Final Wiring + Environment Setup

**Files:**
- Modify: `.env.local` (from `.env.local.example`)
- Modify: `app/layout.tsx` (add Toaster)

- [ ] **Step 1: Add Toaster to root layout**

```tsx
// app/layout.tsx — add inside <body>, after {children}:
import { Toaster } from '@/components/ui/toaster';
// ...
<body className={inter.className}>
  {children}
  <Toaster />
</body>
```

- [ ] **Step 2: Add NEXT_PUBLIC_APP_URL to env**

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Add `@vercel/blob` dependency**

```bash
npm install @vercel/blob
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Run dev server and verify pages load**

```bash
npm run dev
```

Open http://localhost:3000. Verify:
- `/sign-in` renders Clerk sign-in
- `/dashboard` redirects to sign-in if unauthenticated
- After signing in, `/dashboard` loads the overview page
- `/tools` shows the tools grid
- `/tools/new` shows the connect form
- `/alerts` shows the alert rules page
- `/reports` shows the reports page
- `/settings` shows the WhatsApp opt-in form

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete AI tools tracker MVP"
```

---

## Post-MVP Checklist

These are not in scope for v1 but should be tracked:

- [ ] Add org creation flow (currently Clerk org is created but not synced to `organizations` table — add a Clerk webhook to handle `organizationCreated` event)
- [ ] Populate owner email in `sendAlertEmail` calls (currently passes empty string — needs to be fetched from Clerk user profile)
- [ ] Add Stripe checkout flow for plan upgrades (currently assumes subscription exists)
- [ ] Add `CRON_SECRET` to Vercel environment variables and configure Vercel Cron authorization headers
- [ ] Add error boundary and loading states to dashboard pages
- [ ] Add rate limiting to cron routes
