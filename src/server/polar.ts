import { Polar } from '@polar-sh/sdk';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { AuthUser } from './auth.js';
import { getDatabase } from './db/index.js';

export const CREDIT_PACKS = {
  starter: { credits: 900, productEnv: 'POLAR_PRODUCT_STARTER' },
  popular: { credits: 2_000, productEnv: 'POLAR_PRODUCT_POPULAR' },
  pro: { credits: 6_000, productEnv: 'POLAR_PRODUCT_PRO' },
} as const;

export const checkoutRequestSchema = z.object({
  pack: z.enum(['starter', 'popular', 'pro']),
});

export type CreditPackSlug = z.infer<typeof checkoutRequestSchema>['pack'];

const polarOrderWebhookSchema = z.object({
  type: z.enum(['order.paid', 'order.refunded']),
  timestamp: z.coerce.date(),
  data: z.object({
    id: z.string().min(1),
    checkoutId: z.string().nullable(),
    paid: z.boolean(),
    billingReason: z.string(),
    productId: z.string().nullable(),
    currency: z.string().min(1),
    netAmount: z.number().int().nonnegative(),
    totalAmount: z.number().int().nonnegative(),
    refundedAmount: z.number().int().nonnegative(),
    refundedTaxAmount: z.number().int().nonnegative(),
    metadata: z.record(z.string(), z.unknown()),
    customer: z.object({
      externalId: z.string().nullable().optional(),
    }),
  }),
});

const polarCheckoutWebhookSchema = z.object({
  type: z.enum(['checkout.updated', 'checkout.expired']),
  timestamp: z.coerce.date(),
  data: z.object({
    id: z.string().min(1),
    status: z.string(),
  }),
});

type PolarWebhookPayload =
  z.infer<typeof polarOrderWebhookSchema> | z.infer<typeof polarCheckoutWebhookSchema>;

type PaymentMutationRow = {
  result_code: string;
  balance: number | null;
  debt: number | null;
  applied_credits?: number;
  removed_credits?: number;
};

export type PaymentMutationResult = {
  resultCode: string;
  balance: number | null;
  debt: number | null;
  changedCredits: number;
};

type PurchaseHistoryRow = {
  id: string;
  checkout_id: string;
  order_id: string | null;
  pack_slug: CreditPackSlug;
  credits: number;
  removed_credits: number;
  amount: number | null;
  refunded_amount: number;
  currency: string | null;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  paid_at: Date | string | null;
  refunded_at: Date | string | null;
};

export type PurchaseHistoryItem = {
  id: string;
  checkoutId: string;
  orderId: string | null;
  pack: CreditPackSlug;
  credits: number;
  removedCredits: number;
  amount: number | null;
  refundedAmount: number;
  currency: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  refundedAt: string | null;
};

type PolarEnvironment = Record<string, string | undefined>;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

/**
 * Standard Webhooks returns Polar's raw snake_case JSON, while the Polar SDK
 * returns camelCase models. Normalize only the fields used by our processor;
 * metadata keys intentionally remain untouched.
 */
export function normalizePolarWebhookPayload(payload: unknown): unknown {
  const event = asRecord(payload);
  const rawData = asRecord(event?.data);
  if (!event || !rawData) return payload;

  const rawCustomer = asRecord(rawData.customer);
  return {
    ...event,
    data: {
      ...rawData,
      checkoutId: rawData.checkoutId ?? rawData.checkout_id,
      billingReason: rawData.billingReason ?? rawData.billing_reason,
      productId: rawData.productId ?? rawData.product_id,
      netAmount: rawData.netAmount ?? rawData.net_amount,
      totalAmount: rawData.totalAmount ?? rawData.total_amount,
      refundedAmount: rawData.refundedAmount ?? rawData.refunded_amount,
      refundedTaxAmount: rawData.refundedTaxAmount ?? rawData.refunded_tax_amount,
      customer: rawCustomer
        ? {
            ...rawCustomer,
            externalId: rawCustomer.externalId ?? rawCustomer.external_id,
          }
        : rawData.customer,
    },
  };
}

export function getPolarServer(value = process.env.POLAR_SERVER): 'sandbox' | 'production' {
  if (!value || value === 'sandbox') return 'sandbox';
  if (value === 'production') return 'production';
  throw new Error('POLAR_SERVER must be either sandbox or production');
}

export function getConfiguredCreditPacks(environment: PolarEnvironment = process.env) {
  const entries = Object.entries(CREDIT_PACKS).map(([slug, pack]) => {
    const productId = environment[pack.productEnv]?.trim();
    if (!productId) throw new Error(`${pack.productEnv} is required`);
    if (!z.string().uuid().safeParse(productId).success) {
      throw new Error(`${pack.productEnv} must contain a Polar product ID`);
    }
    return [slug, { credits: pack.credits, productId }] as const;
  });
  const configured = Object.fromEntries(entries) as Record<
    CreditPackSlug,
    { credits: number; productId: string }
  >;

  if (new Set(entries.map(([, pack]) => pack.productId)).size !== entries.length) {
    throw new Error('Each Polar credit pack must use a different product ID');
  }

  return configured;
}

export function getCreditPackByProductId(
  productId: string,
  environment: PolarEnvironment = process.env
) {
  const packs = getConfiguredCreditPacks(environment);
  const match = Object.entries(packs).find(([, pack]) => pack.productId === productId);
  if (!match) return null;
  return { slug: match[0] as CreditPackSlug, ...match[1] };
}

export function resolveCheckoutOrigin(requestUrl: string, configuredUrl = process.env.APP_URL) {
  const origin = configuredUrl?.trim() || new URL(requestUrl).origin;
  const parsed = new URL(origin);
  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:')) {
    throw new Error('APP_URL must use HTTPS, except for local development');
  }
  return parsed.origin;
}

export async function createPolarCheckout(
  user: AuthUser,
  packSlug: CreditPackSlug,
  requestUrl: string,
  customerIpAddress?: string
) {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error('POLAR_ACCESS_TOKEN is required');

  const pack = getConfiguredCreditPacks()[packSlug];
  const origin = resolveCheckoutOrigin(requestUrl);
  const polar = new Polar({ accessToken, server: getPolarServer() });
  const checkout = await polar.checkouts.create({
    products: [pack.productId],
    externalCustomerId: user.id,
    customerEmail: user.email || undefined,
    customerName: user.name || undefined,
    customerIpAddress,
    allowDiscountCodes: true,
    embedOrigin: origin,
    returnUrl: `${origin}/purchases?checkout=cancelled`,
    successUrl: `${origin}/purchases?checkout=success&checkout_id={CHECKOUT_ID}`,
    metadata: {
      shotage_user_id: user.id,
      shotage_pack: packSlug,
      shotage_credits: pack.credits,
    },
  });

  await getDatabase().execute(sql`
    insert into public.credit_purchases (
      user_id,
      checkout_id,
      product_id,
      pack_slug,
      credits,
      created_at,
      updated_at
    ) values (
      ${user.id},
      ${checkout.id},
      ${pack.productId},
      ${packSlug},
      ${pack.credits},
      ${checkout.createdAt},
      now()
    )
  `);

  return { checkoutUrl: checkout.url, checkoutId: checkout.id };
}

async function applyPaidOrder(
  eventId: string,
  orderId: string,
  checkoutId: string,
  userId: string,
  productId: string,
  packSlug: CreditPackSlug,
  credits: number,
  amount: number,
  currency: string,
  payload: PolarWebhookPayload,
  occurredAt: Date
) {
  // Recover safely if a checkout was opened immediately before this table was
  // deployed, or if recording it failed after Polar created the session.
  await getDatabase().execute(sql`
    insert into public.credit_purchases (
      user_id, checkout_id, product_id, pack_slug, credits, created_at, updated_at
    ) values (
      ${userId}, ${checkoutId}, ${productId}, ${packSlug}, ${credits}, ${occurredAt}, now()
    )
    on conflict (checkout_id) do nothing
  `);

  const result = await getDatabase().execute<PaymentMutationRow>(sql`
    select *
    from public.apply_polar_purchase_paid(
      ${eventId},
      ${orderId},
      ${checkoutId},
      ${userId},
      ${productId},
      ${credits},
      ${amount},
      ${currency},
      ${JSON.stringify(payload)}::jsonb,
      ${occurredAt}
    )
  `);
  return mapPaymentMutation(result.rows[0], 'applied_credits');
}

async function applyRefundedOrder(
  eventId: string,
  orderId: string,
  userId: string,
  refundedAmount: number,
  refundedTotal: number,
  netAmount: number,
  payload: PolarWebhookPayload,
  occurredAt: Date
) {
  const result = await getDatabase().execute<PaymentMutationRow>(sql`
    select *
    from public.apply_polar_purchase_refund(
      ${eventId},
      ${orderId},
      ${userId},
      ${refundedAmount},
      ${refundedTotal},
      ${netAmount},
      ${JSON.stringify(payload)}::jsonb,
      ${occurredAt}
    )
  `);
  return mapPaymentMutation(result.rows[0], 'removed_credits');
}

async function applyCheckoutStatus(
  eventId: string,
  checkoutId: string,
  status: 'failed' | 'expired',
  payload: PolarWebhookPayload,
  occurredAt: Date
) {
  const result = await getDatabase().execute<{ result_code: string }>(sql`
    select public.apply_polar_checkout_status(
      ${eventId},
      ${checkoutId},
      ${status},
      ${JSON.stringify(payload)}::jsonb,
      ${occurredAt}
    ) as result_code
  `);
  return {
    resultCode: result.rows[0]?.result_code || 'UNKNOWN',
    balance: null,
    debt: null,
    changedCredits: 0,
  };
}

export async function getPurchaseHistory(userId: string): Promise<PurchaseHistoryItem[]> {
  const result = await getDatabase().execute<PurchaseHistoryRow>(sql`
    select
      history.id,
      history.checkout_id,
      history.order_id,
      history.pack_slug,
      history.credits,
      history.removed_credits,
      history.amount,
      history.refunded_amount,
      history.currency,
      history.status,
      history.created_at,
      history.updated_at,
      history.paid_at,
      history.refunded_at
    from public.credit_purchases as history
    where history.user_id = ${userId}
    order by history.created_at desc
    limit 50
  `);

  return result.rows.map((row) => ({
    id: row.id,
    checkoutId: row.checkout_id,
    orderId: row.order_id,
    pack: row.pack_slug,
    credits: row.credits,
    removedCredits: row.removed_credits,
    amount: row.amount,
    refundedAmount: row.refunded_amount,
    currency: row.currency,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    refundedAt: row.refunded_at ? new Date(row.refunded_at).toISOString() : null,
  }));
}

function mapPaymentMutation(
  row: PaymentMutationRow | undefined,
  changedField: 'applied_credits' | 'removed_credits'
): PaymentMutationResult {
  if (!row) throw new Error('Polar credit operation did not return a result');
  return {
    resultCode: row.result_code,
    balance: row.balance,
    debt: row.debt,
    changedCredits: row[changedField] ?? 0,
  };
}

export async function processPolarWebhook(payload: unknown) {
  const eventType =
    payload && typeof payload === 'object' && 'type' in payload ? payload.type : undefined;
  if (
    eventType !== 'order.paid' &&
    eventType !== 'order.refunded' &&
    eventType !== 'checkout.updated' &&
    eventType !== 'checkout.expired'
  ) {
    return { resultCode: 'IGNORED', balance: null, debt: null, changedCredits: 0 };
  }

  if (eventType === 'checkout.updated' || eventType === 'checkout.expired') {
    const event = polarCheckoutWebhookSchema.parse(payload);
    const checkoutStatus = event.type === 'checkout.expired' ? 'expired' : event.data.status;
    if (checkoutStatus !== 'failed' && checkoutStatus !== 'expired') {
      return { resultCode: 'IGNORED', balance: null, debt: null, changedCredits: 0 };
    }
    return applyCheckoutStatus(
      `${event.type}:${event.data.id}:${checkoutStatus}`,
      event.data.id,
      checkoutStatus,
      event,
      event.timestamp
    );
  }

  const event = polarOrderWebhookSchema.parse(payload);
  const order = event.data;
  if (order.billingReason !== 'purchase' || !order.productId) {
    return { resultCode: 'IGNORED', balance: null, debt: null, changedCredits: 0 };
  }

  const pack = getCreditPackByProductId(order.productId);
  if (!pack) {
    return { resultCode: 'IGNORED', balance: null, debt: null, changedCredits: 0 };
  }

  const userId = order.customer.externalId?.trim();
  if (!userId) {
    return { resultCode: 'IGNORED', balance: null, debt: null, changedCredits: 0 };
  }

  const metadataUserId = order.metadata.shotage_user_id;
  if (metadataUserId !== undefined && metadataUserId !== userId) {
    throw new Error('Polar order customer does not match checkout metadata');
  }

  if (event.type === 'order.paid') {
    // A fully discounted checkout is still a legitimate paid order. The signed
    // `paid` flag is authoritative; requiring a positive net amount would deny
    // credits for valid 100%-off purchases.
    if (!order.paid) {
      return { resultCode: 'IGNORED', balance: null, debt: null, changedCredits: 0 };
    }
    if (!order.checkoutId) {
      throw new Error('Polar paid order is missing its Shotage checkout');
    }
    const result = await applyPaidOrder(
      `order.paid:${order.id}`,
      order.id,
      order.checkoutId,
      userId,
      order.productId,
      pack.slug,
      pack.credits,
      order.totalAmount,
      order.currency,
      event,
      event.timestamp
    );
    if (result.resultCode === 'PROFILE_NOT_FOUND') {
      throw new Error('Polar customer profile is not available yet');
    }
    return result;
  }

  if (order.refundedAmount <= 0 || order.netAmount <= 0) {
    return { resultCode: 'IGNORED', balance: null, debt: null, changedCredits: 0 };
  }
  const result = await applyRefundedOrder(
    `order.refunded:${order.id}:${order.refundedAmount}`,
    order.id,
    userId,
    order.refundedAmount,
    order.refundedAmount + order.refundedTaxAmount,
    order.netAmount,
    event,
    event.timestamp
  );
  if (result.resultCode === 'PURCHASE_NOT_FOUND' || result.resultCode === 'PROFILE_NOT_FOUND') {
    throw new Error('Polar purchase is not available for refund processing yet');
  }
  return result;
}
