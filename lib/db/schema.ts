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
