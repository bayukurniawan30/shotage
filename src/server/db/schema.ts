import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const userProfiles = pgTable(
  'user_profiles',
  {
    userId: text('user_id').primaryKey(),
    email: text('email'),
    creditsBalance: integer('credits_balance').notNull().default(0),
    creditsDebt: integer('credits_debt').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('user_profiles_balance_nonnegative', sql`${table.creditsBalance} >= 0`),
    check('user_profiles_debt_nonnegative', sql`${table.creditsDebt} >= 0`),
  ]
);

export const creditReservations = pgTable(
  'credit_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.userId, { onDelete: 'cascade' }),
    idempotencyKey: text('idempotency_key').notNull(),
    projectHash: text('project_hash').notNull(),
    exportKind: text('export_kind').notNull(),
    exportFormat: text('export_format').notNull(),
    exportScale: integer('export_scale').notNull(),
    stageScope: text('stage_scope').notNull(),
    stageCount: integer('stage_count').notNull().default(1),
    videoDurationSeconds: numeric('video_duration_seconds', {
      precision: 8,
      scale: 3,
      mode: 'number',
    }),
    creditAmount: integer('credit_amount').notNull(),
    protectedRetry: boolean('protected_retry').notNull().default(false),
    status: text('status').notNull().default('reserved'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    settledAt: timestamp('settled_at', { withTimezone: true }),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    settleIdempotencyKey: text('settle_idempotency_key'),
    releaseIdempotencyKey: text('release_idempotency_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('credit_reservations_idempotency_key_unique').on(table.idempotencyKey),
    uniqueIndex('credit_reservations_settle_idempotency_key_unique')
      .on(table.settleIdempotencyKey)
      .where(sql`${table.settleIdempotencyKey} is not null`),
    uniqueIndex('credit_reservations_release_idempotency_key_unique')
      .on(table.releaseIdempotencyKey)
      .where(sql`${table.releaseIdempotencyKey} is not null`),
    index('credit_reservations_user_created_idx').on(table.userId, table.createdAt),
    index('credit_reservations_open_expiry_idx')
      .on(table.expiresAt)
      .where(sql`${table.status} = 'reserved'`),
    check('credit_reservations_kind_valid', sql`${table.exportKind} in ('image', 'video')`),
    check('credit_reservations_scope_valid', sql`${table.stageScope} in ('current', 'all')`),
    check('credit_reservations_scale_positive', sql`${table.exportScale} > 0`),
    check('credit_reservations_stage_count_positive', sql`${table.stageCount} > 0`),
    check('credit_reservations_amount_nonnegative', sql`${table.creditAmount} >= 0`),
    check(
      'credit_reservations_duration_nonnegative',
      sql`${table.videoDurationSeconds} is null or ${table.videoDurationSeconds} >= 0`
    ),
    check(
      'credit_reservations_status_valid',
      sql`${table.status} in ('reserved', 'settled', 'released')`
    ),
    check(
      'credit_reservations_terminal_timestamp_valid',
      sql`(${table.status} = 'reserved' and ${table.settledAt} is null and ${table.releasedAt} is null)
        or (${table.status} = 'settled' and ${table.settledAt} is not null and ${table.releasedAt} is null)
        or (${table.status} = 'released' and ${table.releasedAt} is not null and ${table.settledAt} is null)`
    ),
  ]
);

export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.userId, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    actionType: text('action_type').notNull(),
    description: text('description'),
    idempotencyKey: text('idempotency_key'),
    provider: text('provider'),
    providerEventId: text('provider_event_id'),
    providerOrderId: text('provider_order_id'),
    reservationId: uuid('reservation_id').references(() => creditReservations.id, {
      onDelete: 'restrict',
    }),
    projectHash: text('project_hash'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('credit_ledger_idempotency_key_unique')
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    uniqueIndex('credit_ledger_one_purchase_per_order')
      .on(table.provider, table.providerOrderId)
      .where(sql`${table.actionType} = 'pack_purchase'`),
    index('credit_ledger_user_created_idx').on(table.userId, table.createdAt),
    index('credit_ledger_reservation_idx').on(table.reservationId),
    check('credit_ledger_amount_nonzero', sql`${table.amount} <> 0`),
  ]
);

export const processedWebhookEvents = pgTable(
  'processed_webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    providerOrderId: text('provider_order_id'),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('processed_webhook_events_provider_event_unique').on(
      table.provider,
      table.providerEventId
    ),
    index('processed_webhook_events_order_idx').on(table.provider, table.providerOrderId),
    index('processed_webhook_events_processed_at_idx').on(table.processedAt),
  ]
);

export const creditPurchases = pgTable(
  'credit_purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.userId, { onDelete: 'cascade' }),
    checkoutId: text('checkout_id').notNull(),
    orderId: text('order_id'),
    productId: text('product_id').notNull(),
    packSlug: text('pack_slug').notNull(),
    credits: integer('credits').notNull(),
    removedCredits: integer('removed_credits').notNull().default(0),
    amount: integer('amount'),
    refundedAmount: integer('refunded_amount').notNull().default(0),
    currency: text('currency'),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('credit_purchases_checkout_id_unique').on(table.checkoutId),
    uniqueIndex('credit_purchases_order_id_unique')
      .on(table.orderId)
      .where(sql`${table.orderId} is not null`),
    index('credit_purchases_user_created_idx').on(table.userId, table.createdAt),
    check('credit_purchases_credits_positive', sql`${table.credits} > 0`),
    check('credit_purchases_removed_nonnegative', sql`${table.removedCredits} >= 0`),
    check(
      'credit_purchases_amount_nonnegative',
      sql`${table.amount} is null or ${table.amount} >= 0`
    ),
    check('credit_purchases_refunded_nonnegative', sql`${table.refundedAmount} >= 0`),
    check(
      'credit_purchases_status_valid',
      sql`${table.status} in ('pending', 'paid', 'partially_refunded', 'refunded', 'failed', 'expired')`
    ),
  ]
);

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type CreditReservation = typeof creditReservations.$inferSelect;
export type NewCreditReservation = typeof creditReservations.$inferInsert;
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type NewCreditLedgerEntry = typeof creditLedger.$inferInsert;
export type ProcessedWebhookEvent = typeof processedWebhookEvents.$inferSelect;
export type NewProcessedWebhookEvent = typeof processedWebhookEvents.$inferInsert;
export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type NewCreditPurchase = typeof creditPurchases.$inferInsert;
