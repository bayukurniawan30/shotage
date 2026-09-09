import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL?.trim();

export const isNeonAuthConfigured = Boolean(neonAuthUrl);

// Keep the app renderable when the environment variable is missing so the UI can
// explain the configuration problem instead of failing during module evaluation.
const authAdapter = BetterAuthReactAdapter()(
  neonAuthUrl || 'https://neon-auth-not-configured.invalid'
);

export const authClient = authAdapter.getBetterAuthInstance();

export type VerifiedAuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export type VerifiedAccount = {
  user: VerifiedAuthUser;
  credits: {
    balance: number;
    unlimited: boolean;
    exportCapacity: {
      standardImages: number;
      fourKImages: number;
      shortVideos: number;
      longVideos: number;
    };
  };
};

export type CreditPackSlug = 'starter' | 'popular' | 'pro';

export type PurchaseStatus =
  'pending' | 'paid' | 'partially_refunded' | 'refunded' | 'failed' | 'expired';

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
  status: PurchaseStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  refundedAt: string | null;
};

export type UserDesignStatus = 'private' | 'pending' | 'published' | 'not_published';

export type UserDesignItem = {
  id: string;
  name: string;
  publisher: string;
  identifier: string;
  visibility: 'private' | 'public';
  status: UserDesignStatus;
  thumbnailUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExportReservation = {
  reservationId: string;
  status: 'reserved' | 'settled' | 'released';
  creditAmount: number;
  protectedRetry: boolean;
  balance: number;
  unlimited: boolean;
  expiresAt: string;
};

export type ImageReservationRequest = {
  idempotencyKey: string;
  projectHash: string;
  kind: 'image';
  format: 'png' | 'jpeg' | 'webp';
  scale: number;
  stageScope: 'current' | 'all';
  stageCount: number;
  videoDurationSeconds: null;
};

export type VideoReservationRequest = {
  idempotencyKey: string;
  projectHash: string;
  kind: 'video';
  format: 'mp4' | 'webm';
  scale: number;
  stageScope: 'current' | 'all';
  stageCount: number;
  videoDurationSeconds: number;
};

export class CreditApiError extends Error {
  code: string;
  status: number;
  balance?: number;

  constructor(message: string, code: string, status: number, balance?: number) {
    super(message);
    this.name = 'CreditApiError';
    this.code = code;
    this.status = status;
    this.balance = balance;
  }
}

export const CREDIT_BALANCE_UPDATED_EVENT = 'shotage:credits-updated';

export function announceCreditBalanceUpdated(balance: number) {
  window.dispatchEvent(new CustomEvent(CREDIT_BALANCE_UPDATED_EVENT, { detail: { balance } }));
}

export async function getAuthToken() {
  const token = await authAdapter.getJWTToken(false);
  if (!token) throw new Error('No authenticated JWT is available.');
  return token;
}

export async function getOptionalAuthToken() {
  try {
    return (await authAdapter.getJWTToken(false)) || null;
  } catch {
    return null;
  }
}

export async function fetchVerifiedAccount(): Promise<VerifiedAccount> {
  const token = await getAuthToken();

  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Your session is no longer valid.'
        : 'Could not verify your session.'
    );
  }

  return (await response.json()) as VerifiedAccount;
}

export async function createCreditCheckout(pack: CreditPackSlug) {
  const token = await getAuthToken();
  const response = await fetch('/api/checkout/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pack }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(payload?.error?.message || 'Could not open checkout.');
  }

  return (await response.json()) as { checkoutUrl: string; checkoutId: string };
}

export async function fetchPurchaseHistory(): Promise<PurchaseHistoryItem[]> {
  const token = await getAuthToken();
  const response = await fetch('/api/user/purchases', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(payload?.error?.message || 'Could not load purchase history.');
  }

  const payload = (await response.json()) as { purchases: PurchaseHistoryItem[] };
  return payload.purchases;
}

export async function fetchUserDesigns(): Promise<UserDesignItem[]> {
  const token = await getAuthToken();
  const response = await fetch('/api/user/designs', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(payload?.error?.message || 'Could not load your designs.');
  }

  const payload = (await response.json()) as { designs: UserDesignItem[] };
  return payload.designs;
}

export async function deleteUserDesign(id: string) {
  const token = await getAuthToken();
  const response = await fetch(`/api/user/designs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(payload?.error?.message || 'Could not move the design to trash.');
  }
}

async function mutateCredits(path: string, body: unknown): Promise<ExportReservation> {
  const token = await getAuthToken();
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string; balance?: number };
    } | null;
    throw new CreditApiError(
      payload?.error?.message || 'The credit operation is temporarily unavailable.',
      payload?.error?.code || 'CREDIT_OPERATION_FAILED',
      response.status,
      payload?.error?.balance
    );
  }

  return (await response.json()) as ExportReservation;
}

export function reserveImageExport(request: ImageReservationRequest) {
  return mutateCredits('/api/export/reservations', request);
}

export function reserveVideoExport(request: VideoReservationRequest) {
  return mutateCredits('/api/export/reservations', request);
}

export function settleExportReservation(reservationId: string, idempotencyKey: string) {
  return mutateCredits(`/api/export/reservations/${reservationId}/settle`, { idempotencyKey });
}

export function releaseExportReservation(reservationId: string, idempotencyKey: string) {
  return mutateCredits(`/api/export/reservations/${reservationId}/release`, { idempotencyKey });
}
