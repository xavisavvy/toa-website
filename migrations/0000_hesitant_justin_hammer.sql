CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"user_email" text,
	"user_role" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"category" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"request_method" text,
	"request_path" text,
	"status" text NOT NULL,
	"status_code" integer,
	"error_message" text,
	"changes_before" json,
	"changes_after" json,
	"gdpr_relevant" integer DEFAULT 0 NOT NULL,
	"retention_policy" text DEFAULT 'standard',
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"event_type" text NOT NULL,
	"status" text NOT NULL,
	"message" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"printful_product_id" text NOT NULL,
	"printful_variant_id" text NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"printful_order_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_email" text NOT NULL,
	"customer_name" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"tracking_number" text,
	"tracking_url" text,
	"shipping_address" json,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'customer' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_category_idx" ON "audit_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "audit_severity_idx" ON "audit_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "audit_resource_idx" ON "audit_logs" USING btree ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "audit_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_gdpr_idx" ON "audit_logs" USING btree ("gdpr_relevant");--> statement-breakpoint
CREATE INDEX "order_event_order_id_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "event_type_idx" ON "order_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "order_event_created_at_idx" ON "order_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "stripe_session_idx" ON "orders" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_email_idx" ON "orders" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");