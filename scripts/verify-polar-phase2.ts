import assert from 'node:assert/strict';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const sql = neon(databaseUrl);
const userId = `polar-test:${crypto.randomUUID()}`;
const orderIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
const checkoutIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
const productIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
const testPayload = JSON.stringify({ test_user_id: userId });

type PaymentRow = {
  result_code: string;
  balance: number | null;
  debt: number | null;
  applied_credits?: number;
  removed_credits?: number;
};

const paid = async (orderId: string, credits: number, eventId = `paid:${orderId}`) => {
  const index = orderIds.indexOf(orderId);
  assert.notEqual(index, -1);
  const amount = credits === 6_000 ? 2_500 : 500;
  const rows = await sql.query(
    `select * from public.apply_polar_purchase_paid(
       $1, $2, $3, $4, $5, $6, $7, 'usd', $8::jsonb, now()
     )`,
    [eventId, orderId, checkoutIds[index], userId, productIds[index], credits, amount, testPayload]
  );
  return rows[0] as PaymentRow;
};

const refunded = async (
  orderId: string,
  refundedAmount: number,
  netAmount: number,
  eventId = `refund:${orderId}:${refundedAmount}`
) => {
  const rows = await sql.query(
    `select * from public.apply_polar_purchase_refund(
       $1, $2, $3, $4, $5, $6, $7::jsonb, now()
     )`,
    [eventId, orderId, userId, refundedAmount, refundedAmount, netAmount, testPayload]
  );
  return rows[0] as PaymentRow;
};

try {
  await sql.query(`insert into public.user_profiles (user_id, credits_balance) values ($1, 100)`, [
    userId,
  ]);
  await sql.query(
    `insert into public.credit_purchases (
       user_id, checkout_id, product_id, pack_slug, credits
     ) values
       ($1, $2, $3, 'starter', 900),
       ($1, $4, $5, 'pro', 6000),
       ($1, $6, $7, 'starter', 900),
       ($1, $8, $9, 'popular', 2000)`,
    [
      userId,
      checkoutIds[0], productIds[0],
      checkoutIds[1], productIds[1],
      checkoutIds[2], productIds[2],
      checkoutIds[3], productIds[3],
    ]
  );

  const starterPaid = await paid(orderIds[0], 900);
  assert.deepEqual(starterPaid, {
    result_code: 'APPLIED',
    balance: 1000,
    debt: 0,
    applied_credits: 900,
  });
  assert.equal((await paid(orderIds[0], 900)).result_code, 'DUPLICATE');
  assert.equal(
    (await paid(orderIds[0], 900, `paid-redelivery:${orderIds[0]}`)).result_code,
    'DUPLICATE'
  );

  const partialRefund = await refunded(orderIds[0], 250, 500);
  assert.equal(partialRefund.result_code, 'APPLIED');
  assert.equal(partialRefund.removed_credits, 450);
  assert.equal(partialRefund.balance, 550);
  assert.equal(
    (await refunded(orderIds[0], 250, 500, `refund-redelivery:${orderIds[0]}`)).result_code,
    'DUPLICATE'
  );

  const fullRefund = await refunded(orderIds[0], 500, 500);
  assert.equal(fullRefund.removed_credits, 450);
  assert.equal(fullRefund.balance, 100);
  assert.equal(fullRefund.debt, 0);

  const proPaid = await paid(orderIds[1], 6_000);
  assert.equal(proPaid.balance, 6_100);
  await sql.query(
    `insert into public.credit_ledger (
       user_id, amount, action_type, description, idempotency_key
     ) values ($1, -6090, 'integration_test_spend', 'Phase 2 verification', $2)`,
    [userId, `test-spend:${orderIds[1]}`]
  );
  await sql.query(`update public.user_profiles set credits_balance = 10 where user_id = $1`, [
    userId,
  ]);

  const debtRefund = await refunded(orderIds[1], 2_500, 2_500);
  assert.equal(debtRefund.balance, 0);
  assert.equal(debtRefund.debt, 5_990);
  assert.equal(debtRefund.removed_credits, 6_000);

  const debtPayment = await paid(orderIds[2], 900);
  assert.equal(debtPayment.balance, 0);
  assert.equal(debtPayment.debt, 5_090);

  const [expired] = await sql.query(
    `select public.apply_polar_checkout_status($1, $2, 'expired', $3::jsonb, now()) as result_code`,
    [`checkout.expired:${checkoutIds[3]}`, checkoutIds[3], testPayload]
  );
  assert.equal(expired.result_code, 'APPLIED');
  const [expiredDuplicate] = await sql.query(
    `select public.apply_polar_checkout_status($1, $2, 'expired', $3::jsonb, now()) as result_code`,
    [`checkout.expired:${checkoutIds[3]}`, checkoutIds[3], testPayload]
  );
  assert.equal(expiredDuplicate.result_code, 'DUPLICATE');

  const [summary] = await sql.query(
    `select
       profile.credits_balance as balance,
       profile.credits_debt as debt,
       count(ledger.id) filter (where ledger.action_type = 'pack_purchase')::integer as purchases,
       count(ledger.id) filter (where ledger.action_type = 'pack_refund')::integer as refunds
     from public.user_profiles as profile
     left join public.credit_ledger as ledger on ledger.user_id = profile.user_id
     where profile.user_id = $1
     group by profile.credits_balance, profile.credits_debt`,
    [userId]
  );
  assert.deepEqual(summary, { balance: 0, debt: 5_090, purchases: 3, refunds: 3 });

  const history = await sql.query(
    `select status, count(*)::integer as count
     from public.credit_purchases
     where user_id = $1
     group by status
     order by status`,
    [userId]
  );
  assert.deepEqual(history, [
    { status: 'expired', count: 1 },
    { status: 'paid', count: 1 },
    { status: 'refunded', count: 2 },
  ]);

  console.log(
    JSON.stringify({
      paidOrder: 'passed',
      duplicateDelivery: 'passed',
      partialRefund: 'passed',
      fullRefund: 'passed',
      refundDebt: 'passed',
      debtRepayment: 'passed',
      purchaseHistory: 'passed',
      expiredCheckout: 'passed',
    })
  );
} finally {
  await sql.query(`delete from public.credit_ledger where user_id = $1`, [userId]);
  await sql.query(`delete from public.credit_purchases where user_id = $1`, [userId]);
  await sql.query(
    `delete from public.processed_webhook_events where payload ->> 'test_user_id' = $1`,
    [userId]
  );
  await sql.query(`delete from public.user_profiles where user_id = $1`, [userId]);
}
