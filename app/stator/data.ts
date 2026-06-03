export interface Mark { letters: string; tint: string; }
export type Category = "text" | "visual" | "video" | "audio" | "research" | "production";
export type SyncStatus = "ok" | "sync_error" | "never_synced";
export type BillingType = "credits" | "subscription";
export type SyncType = "api" | "manual";
export type TriggerType = "threshold_high" | "threshold_low" | "unused";

export interface Tool {
  id: string; slug: string; name: string; category: Category;
  mark: Mark; billingType: BillingType; syncType: SyncType;
  unit: string; planMonthlyCost: number | null;
  creditLimit: number | null; creditsUsed: number; costToDate: number;
  renewalDate: string; syncStatus: SyncStatus; lastSyncedAt: string | null;
  lastUsedDaysAgo: number; momChange: number; owner: string; spark: number[];
}
export interface CatalogTool {
  slug: string; name: string; category: Category; mark: Mark;
  billingType: BillingType; desc: string; popular: boolean; isCustom?: boolean;
}
export interface AlertRule {
  id: string; toolId: string; triggerType: TriggerType;
  thresholdPercent: number | null; unusedDays: number | null;
  channels: string[]; cooldownHours: number; lastFiredAt: string | null; active: boolean;
}
export interface Notification {
  id: string; ruleId: string; toolId: string; channel: string;
  triggerType: TriggerType; sentAt: string; status: "delivered" | "failed";
  fallbackUsed: boolean; detail: string;
}
export interface Report {
  id: string; periodStart: string; periodEnd: string; label: string;
  totalSpend: number; momChange: number; status: string;
  topCategory: Category; toolCount: number; generatedAt: string;
}
export interface SpendPoint { month: string; spend: number; partial?: boolean; }

export const ORG = {
  name: "Northbeam Studio", handle: "northbeam",
  plan: "team" as "free" | "pro" | "team",
  seats: 8, members: 6, stripeCustomerId: "cus_Qw8s…2f1", createdAt: "2024-11-02",
};

export const CATEGORIES: Record<Category, { label: string; short: string; color: string }> = {
  text:       { label: "Text & Writing",  short: "Text",       color: "var(--cat-text)" },
  visual:     { label: "Visual / Image",  short: "Visual",     color: "var(--cat-visual)" },
  video:      { label: "Video",           short: "Video",      color: "var(--cat-video)" },
  audio:      { label: "Audio / Voice",   short: "Audio",      color: "var(--cat-audio)" },
  research:   { label: "Research",        short: "Research",   color: "var(--cat-research)" },
  production: { label: "Production",      short: "Production", color: "var(--cat-production)" },
};

function spark(seed: number, n: number, base: number, vol: number): number[] {
  const out: number[] = []; let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    out.push(Math.max(0, +(base * (0.5 + r * vol)).toFixed(2)));
  }
  return out;
}
function mk(letters: string, tint: string): Mark { return { letters, tint }; }

export const TOOLS: Tool[] = [
  { id: "t_openai", slug: "openai", name: "OpenAI", category: "text", mark: mk("AI", "#10a37f"), billingType: "credits", syncType: "api", unit: "tokens (M)", planMonthlyCost: null, creditLimit: 50, creditsUsed: 41.8, costToDate: 836.40, renewalDate: "2026-06-18", syncStatus: "ok", lastSyncedAt: "2026-06-02T13:00:00Z", lastUsedDaysAgo: 0, momChange: 0.14, owner: "Maya R.", spark: spark(11, 14, 60, 0.9) },
  { id: "t_anthropic", slug: "anthropic", name: "Anthropic", category: "text", mark: mk("AN", "#d97757"), billingType: "credits", syncType: "api", unit: "tokens (M)", planMonthlyCost: null, creditLimit: 30, creditsUsed: 24.1, costToDate: 482.00, renewalDate: "2026-06-18", syncStatus: "ok", lastSyncedAt: "2026-06-02T13:00:00Z", lastUsedDaysAgo: 0, momChange: 0.31, owner: "Maya R.", spark: spark(23, 14, 34, 1.0) },
  { id: "t_midjourney", slug: "midjourney", name: "Midjourney", category: "visual", mark: mk("MJ", "#0e0e10"), billingType: "subscription", syncType: "manual", unit: "fast hrs", planMonthlyCost: 120.00, creditLimit: 60, creditsUsed: 54.5, costToDate: 120.00, renewalDate: "2026-06-09", syncStatus: "ok", lastSyncedAt: null, lastUsedDaysAgo: 1, momChange: 0.05, owner: "Leo K.", spark: spark(31, 14, 9, 0.6) },
  { id: "t_runway", slug: "runway", name: "Runway", category: "video", mark: mk("RW", "#0bf"), billingType: "credits", syncType: "api", unit: "credits", planMonthlyCost: 95.00, creditLimit: 9000, creditsUsed: 8190, costToDate: 384.00, renewalDate: "2026-06-21", syncStatus: "ok", lastSyncedAt: "2026-06-02T12:00:00Z", lastUsedDaysAgo: 0, momChange: 0.48, owner: "Leo K.", spark: spark(41, 14, 27, 1.3) },
  { id: "t_elevenlabs", slug: "elevenlabs", name: "ElevenLabs", category: "audio", mark: mk("EL", "#111"), billingType: "credits", syncType: "api", unit: "chars (K)", planMonthlyCost: 99.00, creditLimit: 2000, creditsUsed: 1180, costToDate: 99.00, renewalDate: "2026-06-14", syncStatus: "ok", lastSyncedAt: "2026-06-02T11:00:00Z", lastUsedDaysAgo: 2, momChange: -0.12, owner: "Priya S.", spark: spark(53, 14, 7, 0.8) },
  { id: "t_perplexity", slug: "perplexity", name: "Perplexity", category: "research", mark: mk("PX", "#20808d"), billingType: "subscription", syncType: "manual", unit: "queries", planMonthlyCost: 40.00, creditLimit: 600, creditsUsed: 312, costToDate: 40.00, renewalDate: "2026-06-26", syncStatus: "ok", lastSyncedAt: null, lastUsedDaysAgo: 1, momChange: 0.09, owner: "Dana W.", spark: spark(67, 14, 3, 0.7) },
  { id: "t_descript", slug: "descript", name: "Descript", category: "production", mark: mk("DS", "#5b5bd6"), billingType: "subscription", syncType: "manual", unit: "transcription hrs", planMonthlyCost: 50.00, creditLimit: 100, creditsUsed: 38, costToDate: 50.00, renewalDate: "2026-06-11", syncStatus: "ok", lastSyncedAt: null, lastUsedDaysAgo: 3, momChange: -0.04, owner: "Priya S.", spark: spark(73, 14, 4, 0.6) },
  { id: "t_runwaypika", slug: "pika", name: "Pika Labs", category: "video", mark: mk("PK", "#ff4d6d"), billingType: "credits", syncType: "api", unit: "credits", planMonthlyCost: 35.00, creditLimit: 2000, creditsUsed: 120, costToDate: 35.00, renewalDate: "2026-06-16", syncStatus: "ok", lastSyncedAt: "2026-06-02T10:00:00Z", lastUsedDaysAgo: 11, momChange: -0.62, owner: "Leo K.", spark: spark(83, 14, 1.4, 0.5) },
  { id: "t_suno", slug: "suno", name: "Suno", category: "audio", mark: mk("SU", "#1b1b1b"), billingType: "credits", syncType: "api", unit: "credits", planMonthlyCost: 30.00, creditLimit: 2500, creditsUsed: 2310, costToDate: 30.00, renewalDate: "2026-06-07", syncStatus: "ok", lastSyncedAt: "2026-06-02T09:00:00Z", lastUsedDaysAgo: 1, momChange: 0.22, owner: "Priya S.", spark: spark(97, 14, 2.2, 0.9) },
  { id: "t_heygen", slug: "heygen", name: "HeyGen", category: "video", mark: mk("HG", "#7c5cff"), billingType: "credits", syncType: "api", unit: "video credits", planMonthlyCost: 89.00, creditLimit: 660, creditsUsed: 430, costToDate: 89.00, renewalDate: "2026-06-13", syncStatus: "sync_error", lastSyncedAt: "2026-05-30T08:00:00Z", lastUsedDaysAgo: 4, momChange: 0.0, owner: "Dana W.", spark: spark(103, 14, 3, 0.7) },
  { id: "t_topaz", slug: "topaz", name: "Topaz Labs", category: "visual", mark: mk("TZ", "#2bb3ff"), billingType: "subscription", syncType: "manual", unit: "exports", planMonthlyCost: 24.00, creditLimit: 500, creditsUsed: 16, costToDate: 24.00, renewalDate: "2026-06-28", syncStatus: "ok", lastSyncedAt: null, lastUsedDaysAgo: 9, momChange: -0.40, owner: "Leo K.", spark: spark(113, 14, 0.8, 0.4) },
  { id: "t_cursor", slug: "cursor", name: "Cursor", category: "production", mark: mk("CR", "#0d0d0d"), billingType: "subscription", syncType: "manual", unit: "fast requests", planMonthlyCost: 40.00, creditLimit: 500, creditsUsed: 470, costToDate: 40.00, renewalDate: "2026-06-19", syncStatus: "ok", lastSyncedAt: null, lastUsedDaysAgo: 0, momChange: 0.18, owner: "Sam T.", spark: spark(127, 14, 2.6, 0.6) },
  { id: "t_synthesia", slug: "synthesia", name: "Synthesia", category: "video", mark: mk("SY", "#0a66ff"), billingType: "subscription", syncType: "manual", unit: "video minutes", planMonthlyCost: 67.00, creditLimit: 120, creditsUsed: 0, costToDate: 67.00, renewalDate: "2026-06-23", syncStatus: "never_synced", lastSyncedAt: null, lastUsedDaysAgo: 22, momChange: -1.0, owner: "Dana W.", spark: spark(131, 14, 0.2, 0.3) },
];

export const ALERT_RULES: AlertRule[] = [
  { id: "r1", toolId: "t_runway",     triggerType: "threshold_high", thresholdPercent: 80, unusedDays: null, channels: ["email", "whatsapp"], cooldownHours: 24,  lastFiredAt: "2026-06-02T06:12:00Z", active: true },
  { id: "r2", toolId: "t_openai",     triggerType: "threshold_high", thresholdPercent: 80, unusedDays: null, channels: ["email", "whatsapp"], cooldownHours: 24,  lastFiredAt: "2026-06-01T22:40:00Z", active: true },
  { id: "r3", toolId: "t_suno",       triggerType: "threshold_high", thresholdPercent: 90, unusedDays: null, channels: ["email"],             cooldownHours: 12,  lastFiredAt: "2026-06-02T03:00:00Z", active: true },
  { id: "r4", toolId: "t_cursor",     triggerType: "threshold_high", thresholdPercent: 85, unusedDays: null, channels: ["email", "whatsapp"], cooldownHours: 24,  lastFiredAt: null,                    active: true },
  { id: "r5", toolId: "t_synthesia",  triggerType: "unused",         thresholdPercent: null, unusedDays: 14, channels: ["email"],             cooldownHours: 168, lastFiredAt: "2026-06-01T09:00:00Z", active: true },
  { id: "r6", toolId: "t_runwaypika", triggerType: "unused",         thresholdPercent: null, unusedDays: 7,  channels: ["email"],             cooldownHours: 168, lastFiredAt: "2026-05-31T09:00:00Z", active: true },
  { id: "r7", toolId: "t_topaz",      triggerType: "threshold_low",  thresholdPercent: 10, unusedDays: null, channels: ["email"],             cooldownHours: 168, lastFiredAt: null,                    active: true },
  { id: "r8", toolId: "t_midjourney", triggerType: "threshold_high", thresholdPercent: 90, unusedDays: null, channels: ["email", "whatsapp"], cooldownHours: 24,  lastFiredAt: null,                    active: false },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", ruleId: "r1", toolId: "t_runway",     channel: "whatsapp", triggerType: "threshold_high", sentAt: "2026-06-02T06:12:00Z", status: "delivered", fallbackUsed: false, detail: "Runway at 91% of monthly credits" },
  { id: "n2", ruleId: "r2", toolId: "t_openai",     channel: "email",    triggerType: "threshold_high", sentAt: "2026-06-01T22:40:00Z", status: "delivered", fallbackUsed: false, detail: "OpenAI at 84% of token budget" },
  { id: "n3", ruleId: "r3", toolId: "t_suno",       channel: "email",    triggerType: "threshold_high", sentAt: "2026-06-02T03:00:00Z", status: "delivered", fallbackUsed: false, detail: "Suno at 92% of credit pool" },
  { id: "n4", ruleId: "r1", toolId: "t_runway",     channel: "whatsapp", triggerType: "threshold_high", sentAt: "2026-05-31T18:05:00Z", status: "failed",    fallbackUsed: true,  detail: "WhatsApp undeliverable — fell back to email" },
  { id: "n5", ruleId: "r5", toolId: "t_synthesia",  channel: "email",    triggerType: "unused",         sentAt: "2026-06-01T09:00:00Z", status: "delivered", fallbackUsed: false, detail: "Synthesia unused for 22 days" },
  { id: "n6", ruleId: "r6", toolId: "t_runwaypika", channel: "email",    triggerType: "unused",         sentAt: "2026-05-31T09:00:00Z", status: "delivered", fallbackUsed: false, detail: "Pika Labs unused for 11 days" },
  { id: "n7", ruleId: "r2", toolId: "t_openai",     channel: "whatsapp", triggerType: "threshold_high", sentAt: "2026-05-29T14:22:00Z", status: "delivered", fallbackUsed: false, detail: "OpenAI at 80% of token budget" },
];

export const REPORTS: Report[] = [
  { id: "rep_2605", periodStart: "2026-05-01", periodEnd: "2026-05-31", label: "May 2026",      totalSpend: 2103.40, momChange: 0.12,  status: "ready", topCategory: "text",   toolCount: 13, generatedAt: "2026-06-01T00:14:00Z" },
  { id: "rep_2604", periodStart: "2026-04-01", periodEnd: "2026-04-30", label: "April 2026",    totalSpend: 1878.00, momChange: 0.21,  status: "ready", topCategory: "text",   toolCount: 12, generatedAt: "2026-05-01T00:12:00Z" },
  { id: "rep_2603", periodStart: "2026-03-01", periodEnd: "2026-03-31", label: "March 2026",    totalSpend: 1551.20, momChange: 0.07,  status: "ready", topCategory: "visual", toolCount: 11, generatedAt: "2026-04-01T00:10:00Z" },
  { id: "rep_2602", periodStart: "2026-02-01", periodEnd: "2026-02-28", label: "February 2026", totalSpend: 1449.60, momChange: 0.15,  status: "ready", topCategory: "text",   toolCount: 10, generatedAt: "2026-03-01T00:09:00Z" },
  { id: "rep_2601", periodStart: "2026-01-01", periodEnd: "2026-01-31", label: "January 2026",  totalSpend: 1260.00, momChange: 0.0,   status: "ready", topCategory: "text",   toolCount: 9,  generatedAt: "2026-02-01T00:08:00Z" },
  { id: "rep_2512", periodStart: "2025-12-01", periodEnd: "2025-12-31", label: "December 2025", totalSpend: 1188.50, momChange: -0.06, status: "ready", topCategory: "visual", toolCount: 9,  generatedAt: "2026-01-01T00:08:00Z" },
];

export const SPEND_TREND: SpendPoint[] = [
  { month: "Dec", spend: 1188.5 },
  { month: "Jan", spend: 1260.0 },
  { month: "Feb", spend: 1449.6 },
  { month: "Mar", spend: 1551.2 },
  { month: "Apr", spend: 1878.0 },
  { month: "May", spend: 2103.4 },
  { month: "Jun", spend: 1325.4, partial: true },
];

export const TOOL_CATALOG: CatalogTool[] = [
  { slug: "openai",      name: "OpenAI",         category: "text",       mark: mk("AI", "#10a37f"), billingType: "credits",      desc: "GPT-4o, o-series, embeddings & images", popular: true },
  { slug: "anthropic",   name: "Anthropic",       category: "text",       mark: mk("AN", "#d97757"), billingType: "credits",      desc: "Claude Opus, Sonnet & Haiku",           popular: true },
  { slug: "midjourney",  name: "Midjourney",      category: "visual",     mark: mk("MJ", "#0e0e10"), billingType: "subscription", desc: "Text-to-image generation",              popular: true },
  { slug: "elevenlabs",  name: "ElevenLabs",      category: "audio",      mark: mk("EL", "#111"),    billingType: "credits",      desc: "Voice synthesis & dubbing",             popular: true },
  { slug: "runway",      name: "Runway",           category: "video",      mark: mk("RW", "#0bf"),    billingType: "credits",      desc: "Gen-4 video generation",                popular: true },
  { slug: "gemini",      name: "Google Gemini",    category: "text",       mark: mk("GM", "#1a73e8"), billingType: "credits",      desc: "Gemini 2.5 Pro & Flash",                popular: false },
  { slug: "stability",   name: "Stability AI",    category: "visual",     mark: mk("ST", "#6b3fff"), billingType: "credits",      desc: "Stable Diffusion & SD3",                popular: false },
  { slug: "perplexity",  name: "Perplexity",      category: "research",   mark: mk("PX", "#20808d"), billingType: "subscription", desc: "Answer engine & deep research",         popular: false },
  { slug: "custom",      name: "Custom tool",     category: "production", mark: mk("+",  "#7c8190"), billingType: "subscription", desc: "Track any tool manually",               popular: false, isCustom: true },
];

/* ---------- helpers ---------- */
export const TOOL_BY_ID: Record<string, Tool> = Object.fromEntries(TOOLS.map(t => [t.id, t]));
export const RULE_BY_TOOL: Record<string, AlertRule[]> = {};
ALERT_RULES.forEach(r => { (RULE_BY_TOOL[r.toolId] = RULE_BY_TOOL[r.toolId] || []).push(r); });

export function usagePct(t: Tool): number | null {
  if (!t.creditLimit) return null;
  return Math.min(100, Math.round((t.creditsUsed / t.creditLimit) * 1000) / 10);
}
export function creditsRemaining(t: Tool): number | null {
  if (!t.creditLimit) return null;
  return Math.max(0, +(t.creditLimit - t.creditsUsed).toFixed(1));
}
export function fmtMoney(n: number | null, dp = 2): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}
export function fmtNum(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
export function fmtPct(n: number): string {
  const s = n > 0 ? "+" : "";
  return s + Math.round(n * 100) + "%";
}
export function daysUntil(dateStr: string): number {
  const now = new Date("2026-06-02T13:30:00Z");
  const d = new Date(dateStr + "T00:00:00Z");
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}
export function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.length <= 10 ? "T00:00:00Z" : ""));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}
export function relTime(iso: string | null): string | null {
  if (!iso) return null;
  const now = new Date("2026-06-02T13:30:00Z");
  const d = new Date(iso);
  const mins = Math.round((now.getTime() - d.getTime()) / 60000);
  if (mins < 60) return mins + "m ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.round(hrs / 24);
  return days + "d ago";
}
export function usageState(t: Tool): "critical" | "warn" | "low" | "inactive" | "error" | "ok" {
  const p = usagePct(t);
  if (t.syncStatus === "sync_error" || t.syncStatus === "never_synced") return "error";
  if (t.lastUsedDaysAgo >= 7) return "inactive";
  if (p == null) return "ok";
  if (p >= 90) return "critical";
  if (p >= 70) return "warn";
  if (p < 10) return "low";
  return "ok";
}

export function dashboardStats() {
  const totalSpend = TOOLS.reduce((s, t) => s + (t.costToDate || 0), 0);
  const byCat: Record<string, number> = {};
  Object.keys(CATEGORIES).forEach(k => byCat[k] = 0);
  TOOLS.forEach(t => byCat[t.category] += (t.costToDate || 0));
  const nearLimit = TOOLS.filter(t => { const p = usagePct(t); return p != null && p >= 70 && usageState(t) !== "error"; }).sort((a, b) => (usagePct(b) || 0) - (usagePct(a) || 0));
  const inactive = TOOLS.filter(t => t.lastUsedDaysAgo >= 7);
  const errors = TOOLS.filter(t => t.syncStatus === "sync_error" || t.syncStatus === "never_synced");
  return { totalSpend, byCat, nearLimit, inactive, errors, projected: 2890.0 };
}
