ALTER TABLE "subscriptions" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "apple_transaction_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "google_purchase_token" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "platform" text;--> statement-breakpoint
CREATE INDEX "subscription_platform_idx" ON "subscriptions" USING btree ("platform");