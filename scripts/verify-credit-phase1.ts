import assert from 'node:assert/strict';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const sql = neon(databaseUrl);
const userId = `phase1-test:${crypto.randomUUID()}`;

type OperationRow = {
  result_code: string;
  reservation_id: string | null;
  credit_amount: number | null;
  protected_retry: boolean;
  balance: number | null;
  replayed: boolean;
};

const reserve = async (
  idempotencyKey: string,
  projectHash: string,
  kind: 'image' | 'video' = 'image'
) => {
  const format = kind === 'image' ? 'png' : 'mp4';
  const duration = kind === 'video' ? 10 : null;
  const rows = await sql.query(
    `select * from public.reserve_export_credits($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [userId, idempotencyKey, projectHash, kind, format, 2, 'current', 1, duration]
  );
  return rows[0] as OperationRow;
};

const operate = async (
  operation: 'settle' | 'release',
  reservationId: string,
  idempotencyKey = crypto.randomUUID()
) => {
  const rows = await sql.query(
    `select * from public.${operation}_export_reservation($1, $2::uuid, $3)`,
    [userId, reservationId, idempotencyKey]
  );
  return rows[0] as OperationRow;
};

try {
  await sql.query(`insert into public.user_profiles (user_id, credits_balance) values ($1, 100)`, [
    userId,
  ]);

  const duplicateKey = crypto.randomUUID();
  const duplicateHash = 'a'.repeat(64);
  const duplicateResults = await Promise.all([
    reserve(duplicateKey, duplicateHash),
    reserve(duplicateKey, duplicateHash),
  ]);
  assert.deepEqual(
    duplicateResults.map((row) => row.result_code),
    ['OK', 'OK']
  );
  assert.equal(duplicateResults.filter((row) => row.replayed).length, 1);
  assert.equal(duplicateResults[0].reservation_id, duplicateResults[1].reservation_id);

  const conflictingReplay = await reserve(duplicateKey, 'b'.repeat(64));
  assert.equal(conflictingReplay.result_code, 'IDEMPOTENCY_CONFLICT');

  const duplicateReservationId = duplicateResults[0].reservation_id;
  assert.ok(duplicateReservationId);
  const releaseKey = crypto.randomUUID();
  const releaseResults = await Promise.all([
    operate('release', duplicateReservationId, releaseKey),
    operate('release', duplicateReservationId, releaseKey),
  ]);
  assert.deepEqual(
    releaseResults.map((row) => row.result_code),
    ['OK', 'OK']
  );
  assert.equal(releaseResults.filter((row) => row.replayed).length, 1);

  const videoResults = await Promise.all([
    reserve(crypto.randomUUID(), 'c'.repeat(64), 'video'),
    reserve(crypto.randomUUID(), 'd'.repeat(64), 'video'),
  ]);
  assert.equal(videoResults.filter((row) => row.result_code === 'OK').length, 1);
  assert.equal(videoResults.filter((row) => row.result_code === 'INSUFFICIENT_CREDITS').length, 1);
  const videoReservation = videoResults.find((row) => row.result_code === 'OK');
  assert.ok(videoReservation?.reservation_id);
  await operate('release', videoReservation.reservation_id);

  const paid = await reserve(crypto.randomUUID(), 'e'.repeat(64));
  assert.equal(paid.credit_amount, 15);
  assert.ok(paid.reservation_id);
  const settled = await operate('settle', paid.reservation_id);
  assert.equal(settled.result_code, 'OK');

  const invalidRelease = await operate('release', paid.reservation_id);
  assert.equal(invalidRelease.result_code, 'INVALID_STATE');

  const retry = await reserve(crypto.randomUUID(), 'e'.repeat(64));
  assert.equal(retry.result_code, 'OK');
  assert.equal(retry.credit_amount, 0);
  assert.equal(retry.protected_retry, true);

  const [summary] = await sql.query(
    `select
      profile.credits_balance as balance,
      count(ledger.id) filter (where ledger.action_type = 'export_reservation')::integer as debits,
      count(ledger.id) filter (
        where ledger.action_type = 'export_reservation_release'
      )::integer as refunds
    from public.user_profiles as profile
    left join public.credit_ledger as ledger on ledger.user_id = profile.user_id
    where profile.user_id = $1
    group by profile.credits_balance`,
    [userId]
  );
  assert.equal(summary.balance, 85);
  assert.equal(summary.debits, 3);
  assert.equal(summary.refunds, 2);

  const rls = await sql.query(
    `select bool_and(relrowsecurity) as enabled
     from pg_class
     where oid in (
       'public.user_profiles'::regclass,
       'public.credit_ledger'::regclass,
       'public.credit_reservations'::regclass,
       'public.processed_webhook_events'::regclass
     )`,
    []
  );
  assert.equal(rls[0].enabled, true);

  console.log(
    JSON.stringify({
      concurrentReplay: 'passed',
      insufficientFundsRace: 'passed',
      idempotentRefund: 'passed',
      protectedRetry: 'passed',
      rowLevelSecurity: 'enabled',
    })
  );
} finally {
  await sql.query(`delete from public.credit_ledger where user_id = $1`, [userId]);
  await sql.query(`delete from public.credit_reservations where user_id = $1`, [userId]);
  await sql.query(`delete from public.user_profiles where user_id = $1`, [userId]);
}
