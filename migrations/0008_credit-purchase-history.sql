CREATE TABLE "credit_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"checkout_id" text NOT NULL,
	"order_id" text,
	"product_id" text NOT NULL,
	"pack_slug" text NOT NULL,
	"credits" integer NOT NULL,
	"removed_credits" integer DEFAULT 0 NOT NULL,
	"amount" integer,
	"refunded_amount" integer DEFAULT 0 NOT NULL,
	"currency" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	CONSTRAINT "credit_purchases_credits_positive" CHECK ("credit_purchases"."credits" > 0),
	CONSTRAINT "credit_purchases_removed_nonnegative" CHECK ("credit_purchases"."removed_credits" >= 0),
	CONSTRAINT "credit_purchases_amount_nonnegative" CHECK ("credit_purchases"."amount" is null or "credit_purchases"."amount" >= 0),
	CONSTRAINT "credit_purchases_refunded_nonnegative" CHECK ("credit_purchases"."refunded_amount" >= 0),
	CONSTRAINT "credit_purchases_status_valid" CHECK ("credit_purchases"."status" in ('pending', 'paid', 'partially_refunded', 'refunded', 'failed', 'expired'))
);
--> statement-breakpoint
ALTER TABLE "credit_purchases" ADD CONSTRAINT "credit_purchases_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_purchases_checkout_id_unique" ON "credit_purchases" USING btree ("checkout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_purchases_order_id_unique" ON "credit_purchases" USING btree ("order_id") WHERE "credit_purchases"."order_id" is not null;--> statement-breakpoint
CREATE INDEX "credit_purchases_user_created_idx" ON "credit_purchases" USING btree ("user_id","created_at");