ALTER TABLE "subscriptions" ADD COLUMN "paypal_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "paypal_order_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "paypal_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "stripe_customer_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "stripe_subscription_id";