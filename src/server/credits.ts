import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { AuthUser } from './auth.js';
import { getDatabase } from './db/index.js';
import {
  EXPORT_COSTS,
  MAX_PAID_VIDEO_DURATION_SECONDS,
  getExportCapacity,
} from '../lib/credits.js';

export {
  EXPORT_COSTS,
  MAX_PAID_VIDEO_DURATION_SECONDS,
  getExportCapacity,
  getImageExportCost,
  getVideoExportCost,
} from '../lib/credits.js';

export const WELCOME_CREDITS = 100;

export function isUnlimitedUser(
  userId: string,
  configuredIds = process.env.UNLIMITED_USER_IDS
): boolean {
  if (!configuredIds) return false;
  return configuredIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
}

const reservationFields = {
  idempotencyKey: z.string().uuid(),
  projectHash: z.string().regex(/^[0-9a-f]{64}$/),
  scale: z.number().int().min(1).max(4),
  stageScope: z.enum(['current', 'all']),
  stageCount: z.number().int().min(1).max(100),
} as const;

export const reservationRequestSchema = z.discriminatedUnion('kind', [
  z.object({
    ...reservationFields,
    kind: z.literal('image'),
    format: z.enum(['png', 'jpeg', 'webp']),
    videoDurationSeconds: z.null().optional().default(null),
  }),
  z.object({
    ...reservationFields,
    kind: z.literal('video'),
    format: z.enum(['mp4', 'webm']),
    videoDurationSeconds: z.number().min(1).max(MAX_PAID_VIDEO_DURATION_SECONDS),
  }),
]);

export const reservationOperationSchema = z.object({
  idempotencyKey: z.string().uuid(),
});

export type ReservationRequest = z.infer<typeof reservationRequestSchema>;

export type CreditProfile = {
  userId: string;
  email: string | null;
  creditsBalance: number;
  creditsDebt: number;
  createdAt: Date;
  updatedAt: Date;
};

type OnboardingRow = {
  user_id: string;
  email: string | null;
  credits_balance: number;
  credits_debt: number;
  created_at: Date;
  updated_at: Date;
};

type ReservationRow = {
  result_code: string;
  reservation_id: string | null;
  reservation_status: string | null;
  credit_amount: number | null;
  protected_retry: boolean;
  balance: number | null;
  expires_at: Date | string | null;
  replayed: boolean;
};

export type ReservationResult = {
  resultCode: string;
  reservationId: string | null;
  status: string | null;
  creditAmount: number | null;
  protectedRetry: boolean;
  balance: number | null;
  expiresAt: string | null;
  replayed: boolean;
};

function mapReservationRow(row: ReservationRow | undefined): ReservationResult {
  if (!row) throw new Error('Credit operation did not return a result');

  return {
    resultCode: row.result_code,
    reservationId: row.reservation_id,
    status: row.reservation_status,
    creditAmount: row.credit_amount,
    protectedRetry: row.protected_retry,
    balance: row.balance,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    replayed: row.replayed,
  };
}

export async function ensureUserOnboarded(user: AuthUser): Promise<CreditProfile> {
  const result = await getDatabase().execute<OnboardingRow>(sql`
    select *
    from public.ensure_user_onboarded(${user.id}, ${user.email})
  `);
  const row = result.rows[0];

  if (!row) {
    throw new Error('Onboarding did not return a user profile');
  }

  return {
    userId: row.user_id,
    email: row.email,
    creditsBalance: row.credits_balance,
    creditsDebt: row.credits_debt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function reserveExportCredits(
  userId: string,
  request: ReservationRequest,
  unlimited = false
): Promise<ReservationResult> {
  const result = await getDatabase().execute<ReservationRow>(sql`
    select *
    from ${unlimited ? sql`public.reserve_unlimited_export` : sql`public.reserve_export_credits`}(
      ${userId},
      ${request.idempotencyKey},
      ${request.projectHash},
      ${request.kind},
      ${request.format},
      ${request.scale},
      ${request.stageScope},
      ${request.stageCount},
      ${request.videoDurationSeconds}
    )
  `);

  return mapReservationRow(result.rows[0]);
}

export async function settleExportReservation(
  userId: string,
  reservationId: string,
  idempotencyKey: string
): Promise<ReservationResult> {
  const result = await getDatabase().execute<ReservationRow>(sql`
    select *
    from public.settle_export_reservation(${userId}, ${reservationId}::uuid, ${idempotencyKey})
  `);

  return mapReservationRow(result.rows[0]);
}

export async function releaseExportReservation(
  userId: string,
  reservationId: string,
  idempotencyKey: string
): Promise<ReservationResult> {
  const result = await getDatabase().execute<ReservationRow>(sql`
    select *
    from public.release_export_reservation(${userId}, ${reservationId}::uuid, ${idempotencyKey})
  `);

  return mapReservationRow(result.rows[0]);
}
