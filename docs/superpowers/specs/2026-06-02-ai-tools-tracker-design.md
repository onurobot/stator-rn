# AI Tools Usage & Cost Tracker — Design Spec

**Date:** 2026-06-02  
**Status:** Approved  

---

## Overview

A multi-tenant SaaS product that helps individuals and companies track usage, remaining credits/tokens, upcoming payment dates, and cumulative spend across all the AI tools they use (visual, video, audio, production, text writing, research, etc.).

The defining feature is a smart alert system: users define rules per tool, and the system notifies them via Email and WhatsApp when they are nearing a limit, have exceeded a limit, or have not used a tool at all (or very little). Monthly cost and usage reports are generated automatically and available for on-demand export.

---

## Target Users

Individuals and companies that use multiple AI tools and want centralized visibility into their spend and usage. Sold as a SaaS with Free, Pro, and Team subscription tiers.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Deployment | Vercel |
| Auth | Clerk (supports orgs/teams natively) |
| Database | PostgreSQL via Neon (Vercel Marketplace) |
| Billing | Stripe |
| Email notifications | Resend |
| WhatsApp notifications | Twilio WhatsApp Business API |
| PDF generation | `@react-pdf/renderer` |
| UI components | shadcn/ui |
| Config | `vercel.ts` |

---

## Architecture

The application has three runtime contexts:

1. **Next.js App (Vercel)** — serves the UI and handles all user-facing API routes and server actions.
2. **Sync Worker (Vercel Cron)** — runs on a schedule to pull usage data from connected tool APIs and write `UsageSnapshot` records to the database. Frequency: hourly for Pro/Team orgs, daily for Free orgs.
3. **Alert Engine (Vercel Cron)** — runs hourly, evaluates all active `AlertRule` records against the latest usage data, and fires notifications where conditions are met.

A fourth cron job runs at the start of each month to generate `MonthlyReport` records for all organizations.

---

## Data Model

### Organization
Top-level tenant unit. Owns all tools, users, alert rules, and reports.

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | string | |
| stripeCustomerId | string | |
| plan | enum | `free`, `pro`, `team` |
| createdAt | timestamp | |

### User
Managed by Clerk. A user belongs to one or more organizations.

| Field | Type | Notes |
|---|---|---|
| clerkId | string | Primary key |
| organizationId | uuid | FK → Organization |
| role | enum | `owner`, `member` |
| whatsappPhone | string | nullable; required for WhatsApp alerts |
| whatsappOptedIn | boolean | default false |

### ConnectedTool
Represents one AI tool tracked by an organization.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| organizationId | uuid | FK → Organization |
| toolSlug | string | e.g. `openai`, `midjourney`, `custom` |
| displayName | string | User-defined label |
| category | enum | `text`, `visual`, `video`, `audio`, `research`, `production` |
| syncType | enum | `api`, `manual` |
| encryptedApiKey | string | nullable; AES-256 encrypted |
| billingType | enum | `subscription`, `credits` |
| planMonthlyCost | decimal | nullable |
| creditLimit | integer | nullable |
| renewalDate | date | nullable |
| syncStatus | enum | `ok`, `sync_error`, `never_synced` |
| lastSyncedAt | timestamp | nullable |

### UsageSnapshot
Time-series usage record per tool. Created by the sync worker (API tools) or by the user (manual tools).

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| connectedToolId | uuid | FK → ConnectedTool |
| recordedAt | timestamp | |
| creditsUsed | integer | nullable |
| creditsRemaining | integer | nullable |
| costToDate | decimal | Cost in current billing period |
| periodStart | date | |
| periodEnd | date | |

### AlertRule
A notification trigger defined by the user for a specific tool.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| organizationId | uuid | FK → Organization |
| connectedToolId | uuid | FK → ConnectedTool |
| triggerType | enum | `threshold_high`, `threshold_low`, `unused` |
| thresholdPercent | integer | nullable; e.g. 80 means "80% used" |
| unusedDays | integer | nullable; e.g. 7 means "no use in 7 days" |
| channels | string[] | `["email", "whatsapp"]` |
| cooldownHours | integer | default 24; prevents duplicate alerts |
| lastFiredAt | timestamp | nullable |
| active | boolean | default true |

### NotificationLog
Audit trail for every alert sent.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| alertRuleId | uuid | FK → AlertRule |
| channel | enum | `email`, `whatsapp` |
| sentAt | timestamp | |
| status | enum | `delivered`, `failed` |
| fallbackUsed | boolean | true if WhatsApp failed and email was used instead |

### MonthlyReport
Snapshot of a billing period for an organization.

| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| organizationId | uuid | FK → Organization |
| periodStart | date | |
| periodEnd | date | |
| totalSpend | decimal | |
| reportData | jsonb | Full breakdown: per-tool spend, usage, categories |
| pdfUrl | string | nullable; Vercel Blob URL |
| status | enum | `generating`, `ready`, `pdf_failed` |
| generatedAt | timestamp | |

---

## Core Features

### 1. Tool Management

Users connect tools from the built-in catalog or add custom tools.

**Catalog tools** (v1): OpenAI, Anthropic, Midjourney, ElevenLabs, Runway.  
Users enter their API key; the system encrypts it and runs an immediate first sync.

**Custom tools**: Users manually define the tool name, category, billing type, plan cost, credit limit, and renewal date. Usage is updated manually.

Each tool card displays:
- Current usage % (progress bar)
- Credits remaining
- Cost to date this period
- Next renewal date
- Last synced timestamp (API tools) or "manual" badge

**Tier limit:** Free tier is capped at 3 connected tools.

### 2. Alert Rules Engine

Per-tool rules with three trigger types:

- **Threshold high** — fire when `creditsUsed / creditLimit` reaches N% or above (e.g., 80% of credits consumed).
- **Threshold low** — fire when `creditsUsed / creditLimit` is below N% at the time of the check (e.g., under 10% used — tool is underutilised). Evaluated once per cooldown window to avoid repeated firing at the start of a billing period.
- **Unused** — fire when no `UsageSnapshot` in the last N days shows an increase in `creditsUsed` compared to the previous snapshot (i.e., zero net new usage recorded).

Each rule targets one or both notification channels. A cooldown period (default 24h) prevents the same rule from firing repeatedly.

The alert engine runs hourly via Vercel Cron. For each active rule, it fetches the latest `UsageSnapshot` for that tool, evaluates the condition, and fires if:
1. The condition is met, AND
2. `lastFiredAt` is null or older than `cooldownHours`

On fire, it creates a `NotificationLog` record, sends via the specified channels, and updates `lastFiredAt`.

### 3. Dashboard

Single-screen overview per organization:

- **Total monthly spend** (all tools combined)
- **Spend by category** (visual, audio, text, etc.) — bar chart
- **Tools near limit** — tools above 70% usage, sorted by urgency
- **Inactive tools** — tools with no usage in the last 7 days
- **Per-tool cards** — compact summary for every connected tool

### 4. Reports

**Automatic:** A cron job runs on the 1st of each month, generates a `MonthlyReport` for every organization covering the prior month.

**On-demand:** Users can export a report for any completed month as a PDF. PDF is generated server-side with `@react-pdf/renderer` and stored in Vercel Blob. Pro/Team only.

**Report contents:**
- Total spend and usage summary
- Per-tool breakdown (spend, usage %, credits used/remaining)
- Category breakdown
- Month-over-month spend comparison (where prior month data exists)
- List of unused or underused tools

**History retention:** Free — current month only. Pro/Team — 12 months.

---

## Notification Channels

### Email (Resend)
Available on all tiers. Sent to the organization owner's email by default, or to all members on Team tier (configurable).

### WhatsApp (Twilio WhatsApp Business API)
Available on Pro and Team tiers. Users must opt in during onboarding by providing their phone number and confirming consent. Messages use Twilio-approved templates.

**Fallback:** If a WhatsApp message fails to deliver, the system automatically sends an email instead and records `fallbackUsed: true` in the `NotificationLog`.

---

## Subscription Tiers

| Feature | Free | Pro | Team |
|---|---|---|---|
| Connected tools | 3 | Unlimited | Unlimited |
| API sync frequency | Daily | Hourly | Hourly |
| Email alerts | ✓ | ✓ | ✓ |
| WhatsApp alerts | — | ✓ | ✓ |
| PDF export | — | ✓ | ✓ |
| Report history | Current month | 12 months | 12 months |
| Team members | 1 | 1 | Multiple |
| Shared dashboard | — | — | ✓ |

---

## Security

- **API key encryption:** All stored API keys are encrypted with AES-256 using a server-side secret stored as an environment variable. Keys are never returned to the frontend.
- **Multi-tenancy isolation:** All database queries are scoped by `organizationId`. PostgreSQL row-level security (RLS) enforces this at the DB layer as a second line of defense.
- **Clerk session tokens:** All API routes validate the Clerk session and confirm the authenticated user belongs to the requested organization before processing any request.

---

## Error Handling

- **Sync failures:** When an API sync fails (invalid key, provider outage), the tool is marked `sync_error`. The user receives one email notification per day until resolved. Last known usage data remains visible with a "last synced X ago" warning badge.
- **WhatsApp opt-in enforcement:** WhatsApp alert rules silently skip users who have not completed the opt-in flow. The rule remains active; it will fire once opt-in is complete.
- **Report generation failures:** If PDF generation fails, the in-app report view remains available. The system retries PDF generation up to 3 times before marking the report as `pdf_failed`.

---

## Out of Scope (v1)

- Native mobile app
- Browser extension for automatic usage scraping
- Integrations beyond the initial 5 catalog tools
- SMS notifications
- Custom report templates
- API access for users (webhooks/REST)
