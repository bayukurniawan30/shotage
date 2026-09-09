CREATE TABLE "credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"action_type" text NOT NULL,
	"description" text,
	"idempotency_key" text,
	"provider" text,
	"provider_event_id" text,
	"provider_order_id" text,
	"reservation_id" uuid,
	"project_hash" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_ledger_amount_nonzero" CHECK ("credit_ledger"."amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "credit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"project_hash" text NOT NULL,
	"export_kind" text NOT NULL,
	"export_format" text NOT NULL,
	"export_scale" integer NOT NULL,
	"stage_scope" text NOT NULL,
	"stage_count" integer DEFAULT 1 NOT NULL,
	"video_duration_seconds" numeric(8, 3),
	"credit_amount" integer NOT NULL,
	"protected_retry" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_reservations_kind_valid" CHECK ("credit_reservations"."export_kind" in ('image', 'video')),
	CONSTRAINT "credit_reservations_scope_valid" CHECK ("credit_reservations"."stage_scope" in ('current', 'all')),
	CONSTRAINT "credit_reservations_scale_positive" CHECK ("credit_reservations"."export_scale" > 0),
	CONSTRAINT "credit_reservations_stage_count_positive" CHECK ("credit_reservations"."stage_count" > 0),
	CONSTRAINT "credit_reservations_amount_nonnegative" CHECK ("credit_reservations"."credit_amount" >= 0),
	CONSTRAINT "credit_reservations_duration_nonnegative" CHECK ("credit_reservations"."video_duration_seconds" is null or "credit_reservations"."video_duration_seconds" >= 0),
	CONSTRAINT "credit_reservations_status_valid" CHECK ("credit_reservations"."status" in ('reserved', 'settled', 'released')),
	CONSTRAINT "credit_reservations_terminal_timestamp_valid" CHECK (("credit_reservations"."status" = 'reserved' and "credit_reservations"."settled_at" is null and "credit_reservations"."released_at" is null)
        or ("credit_reservations"."status" = 'settled' and "credit_reservations"."settled_at" is not null and "credit_reservations"."released_at" is null)
        or ("credit_reservations"."status" = 'released' and "credit_reservations"."released_at" is not null and "credit_reservations"."settled_at" is null))
);
--> statement-breakpoint
CREATE TABLE "processed_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"provider_event_id" text NOT NULL,
	"provider_order_id" text,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"occurred_at" timestamp with time zone,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text,
	"credits_balance" integer DEFAULT 0 NOT NULL,
	"credits_debt" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_balance_nonnegative" CHECK ("user_profiles"."credits_balance" >= 0),
	CONSTRAINT "user_profiles_debt_nonnegative" CHECK ("user_profiles"."credits_debt" >= 0)
);
--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_reservation_id_credit_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."credit_reservations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reservations" ADD CONSTRAINT "credit_reservations_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_idempotency_key_unique" ON "credit_ledger" USING btree ("idempotency_key") WHERE "credit_ledger"."idempotency_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_one_purchase_per_order" ON "credit_ledger" USING btree ("provider","provider_order_id") WHERE "credit_ledger"."action_type" = 'pack_purchase';--> statement-breakpoint
CREATE INDEX "credit_ledger_user_created_idx" ON "credit_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_ledger_reservation_idx" ON "credit_ledger" USING btree ("reservation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_reservations_idempotency_key_unique" ON "credit_reservations" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "credit_reservations_user_created_idx" ON "credit_reservations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_reservations_open_expiry_idx" ON "credit_reservations" USING btree ("expires_at") WHERE "credit_reservations"."status" = 'reserved';--> statement-breakpoint
CREATE UNIQUE INDEX "processed_webhook_events_provider_event_unique" ON "processed_webhook_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "processed_webhook_events_order_idx" ON "processed_webhook_events" USING btree ("provider","provider_order_id");--> statement-breakpoint
CREATE INDEX "processed_webhook_events_processed_at_idx" ON "processed_webhook_events" USING btree ("processed_at");