CREATE TYPE "public"."billing_type" AS ENUM('subscription', 'credits');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('text', 'visual', 'video', 'audio', 'research', 'production');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('email', 'whatsapp');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'team');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('generating', 'ready', 'pdf_failed');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('ok', 'sync_error', 'never_synced');--> statement-breakpoint
CREATE TYPE "public"."sync_type" AS ENUM('api', 'manual');--> statement-breakpoint
CREATE TYPE "public"."trigger_type" AS ENUM('threshold_high', 'threshold_low', 'unused');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"connected_tool_id" uuid NOT NULL,
	"trigger_type" "trigger_type" NOT NULL,
	"threshold_percent" integer,
	"unused_days" integer,
	"channels" text[] NOT NULL,
	"cooldown_hours" integer DEFAULT 24 NOT NULL,
	"last_fired_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connected_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tool_slug" text NOT NULL,
	"display_name" text NOT NULL,
	"category" "category" NOT NULL,
	"sync_type" "sync_type" NOT NULL,
	"encrypted_api_key" text,
	"billing_type" "billing_type" NOT NULL,
	"plan_monthly_cost" numeric(10, 2),
	"credit_limit" integer,
	"renewal_date" date,
	"sync_status" "sync_status" DEFAULT 'never_synced' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"total_spend" numeric(10, 2) NOT NULL,
	"report_data" jsonb NOT NULL,
	"pdf_url" text,
	"status" "report_status" DEFAULT 'generating' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_reports_org_period_unique" UNIQUE("organization_id","period_start")
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_rule_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"status" "delivery_status" NOT NULL,
	"fallback_used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"stripe_customer_id" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connected_tool_id" uuid NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"credits_used" integer,
	"credits_remaining" integer,
	"cost_to_date" numeric(10, 2) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"email" text,
	"whatsapp_phone" text,
	"whatsapp_opted_in" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_connected_tool_id_connected_tools_id_fk" FOREIGN KEY ("connected_tool_id") REFERENCES "public"."connected_tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_tools" ADD CONSTRAINT "connected_tools_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_snapshots" ADD CONSTRAINT "usage_snapshots_connected_tool_id_connected_tools_id_fk" FOREIGN KEY ("connected_tool_id") REFERENCES "public"."connected_tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tools_org_id_idx" ON "connected_tools" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "snapshots_tool_id_idx" ON "usage_snapshots" USING btree ("connected_tool_id");--> statement-breakpoint
CREATE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");