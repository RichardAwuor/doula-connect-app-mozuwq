CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"doula_id" uuid NOT NULL,
	"parent_name" text NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"doula_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doula_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"state" text NOT NULL,
	"town" text NOT NULL,
	"zip_code" text NOT NULL,
	"payment_preferences" jsonb NOT NULL,
	"drive_distance" integer NOT NULL,
	"spoken_languages" jsonb NOT NULL,
	"hourly_rate_min" numeric(10, 2) NOT NULL,
	"hourly_rate_max" numeric(10, 2) NOT NULL,
	"service_categories" jsonb NOT NULL,
	"certifications" jsonb NOT NULL,
	"profile_picture_url" text,
	"certification_documents" jsonb,
	"referees" jsonb,
	"accepted_terms" boolean DEFAULT false NOT NULL,
	"subscription_active" boolean DEFAULT false NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doula_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "parent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"state" text NOT NULL,
	"town" text NOT NULL,
	"zip_code" text NOT NULL,
	"service_categories" jsonb NOT NULL,
	"financing_type" jsonb NOT NULL,
	"service_period_start" timestamp,
	"service_period_end" timestamp,
	"preferred_languages" jsonb,
	"desired_days" jsonb,
	"desired_start_time" timestamp,
	"desired_end_time" timestamp,
	"accepted_terms" boolean DEFAULT false NOT NULL,
	"subscription_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parent_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text NOT NULL,
	"plan_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_doula_id_users_id_fk" FOREIGN KEY ("doula_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_doula_id_users_id_fk" FOREIGN KEY ("doula_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doula_profiles" ADD CONSTRAINT "doula_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_contract_id_idx" ON "comments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "comment_doula_id_idx" ON "comments" USING btree ("doula_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_contract_parent_idx" ON "comments" USING btree ("contract_id","parent_id");--> statement-breakpoint
CREATE INDEX "contract_parent_id_idx" ON "contracts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "contract_doula_id_idx" ON "contracts" USING btree ("doula_id");--> statement-breakpoint
CREATE INDEX "contract_status_idx" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "doula_user_id_idx" ON "doula_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "doula_state_town_idx" ON "doula_profiles" USING btree ("state","town");--> statement-breakpoint
CREATE INDEX "doula_subscription_idx" ON "doula_profiles" USING btree ("subscription_active");--> statement-breakpoint
CREATE INDEX "parent_user_id_idx" ON "parent_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "parent_state_town_idx" ON "parent_profiles" USING btree ("state","town");--> statement-breakpoint
CREATE INDEX "subscription_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "email_unique_idx" ON "users" USING btree ("email");