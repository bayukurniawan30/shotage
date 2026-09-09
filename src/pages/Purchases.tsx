import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { AuthButton } from '../components/auth/AuthButton';
import { PublicHeader } from '../components/PublicHeader';
import {
  authClient,
  fetchPurchaseHistory,
  type PurchaseHistoryItem,
  type PurchaseStatus,
} from '../lib/auth/client';

const PACK_NAMES: Record<PurchaseHistoryItem['pack'], string> = {
  starter: 'Starter',
  popular: 'Popular',
  pro: 'Pro Pack',
};

const STATUS_STYLES: Record<PurchaseStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  },
  paid: {
    label: 'Paid',
    className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  },
  partially_refunded: {
    label: 'Partially refunded',
    className: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  },
  refunded: {
    label: 'Refunded',
    className: 'border-slate-500/40 bg-slate-700/40 text-slate-300',
  },
  failed: {
    label: 'Failed',
    className: 'border-red-400/25 bg-red-400/10 text-red-200',
  },
  expired: {
    label: 'Expired',
    className: 'border-slate-500/40 bg-slate-700/40 text-slate-300',
  },
};

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

const Purchases: React.FC = () => {
  const session = authClient.useSession();
  const sessionId = session.data?.session?.id;
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const refetchSessionRef = useRef(session.refetch);
  refetchSessionRef.current = session.refetch;

  const checkoutResult = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      state: params.get('checkout'),
      checkoutId: params.get('checkout_id'),
    };
  }, []);

  useEffect(() => {
    if (checkoutResult.state !== 'cancelled' && checkoutResult.state !== 'success') return;

    // Returning from Polar is a full cross-site navigation. Bypass Neon Auth's
    // short-lived cookie cache so the UI restores the existing session instead
    // of treating a stale empty response as a sign-out.
    let cancelled = false;
    const refreshSession = async () => {
      if (cancelled) return;
      await refetchSessionRef
        .current({ query: { disableCookieCache: true } })
        .catch(() => undefined);
    };

    void refreshSession();
    const retryTimer = window.setTimeout(() => void refreshSession(), 750);
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [checkoutResult.state]);

  const loadPurchases = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const history = await fetchPurchaseHistory();
      setPurchases(history);
      return history;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load purchase history.');
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setPurchases([]);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    const poll = async (attempt = 0) => {
      const history = await loadPurchases(attempt > 0);
      if (cancelled || !history || checkoutResult.state !== 'success') return;
      const checkout = history.find(
        (purchase) => purchase.checkoutId === checkoutResult.checkoutId
      );
      if ((!checkout || checkout.status === 'pending') && attempt < 14) {
        timer = window.setTimeout(() => poll(attempt + 1), 2_000);
      }
    };
    void poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [checkoutResult.checkoutId, checkoutResult.state, loadPurchases, sessionId]);

  const returnedPurchase = checkoutResult.checkoutId
    ? purchases.find((purchase) => purchase.checkoutId === checkoutResult.checkoutId)
    : undefined;
  const confirmingPayment =
    checkoutResult.state === 'success' &&
    (!returnedPurchase || returnedPurchase.status === 'pending');

  return (
    <>
      <Head>
        <title>Purchase history — Shotage</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
        <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-[#ffafcc]/10 blur-[150px]" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-[#a2d2ff]/10 blur-[160px]" />

        <PublicHeader />

        <main className="relative z-10 mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#ffafcc]/25 bg-[#ffafcc]/10 text-[#ffafcc]">
                <PhosphorIcons.ReceiptIcon className="h-5 w-5" weight="bold" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Purchase history
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Track your Shotage credit purchases and payment status.
              </p>
            </div>
            {sessionId && (
              <button
                type="button"
                onClick={() => void loadPurchases(true)}
                disabled={loading || refreshing}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
              >
                <PhosphorIcons.ArrowsClockwiseIcon
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            )}
          </div>

          {checkoutResult.state === 'cancelled' && (
            <div className="mt-8 flex gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-300">
              <PhosphorIcons.InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="font-semibold text-white">Checkout cancelled</p>
                <p className="mt-1 text-xs text-slate-400">No payment was taken.</p>
              </div>
            </div>
          )}

          {checkoutResult.state === 'success' && (
            <div
              className={`mt-8 flex gap-3 rounded-xl border p-4 text-sm ${
                confirmingPayment
                  ? 'border-amber-400/25 bg-amber-400/10 text-amber-100'
                  : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
              }`}
            >
              {confirmingPayment ? (
                <PhosphorIcons.CircleNotchIcon className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
              ) : (
                <PhosphorIcons.CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" weight="fill" />
              )}
              <div>
                <p className="font-semibold">
                  {confirmingPayment ? 'Confirming your payment' : 'Payment confirmed'}
                </p>
                <p className="mt-1 text-xs opacity-75">
                  {confirmingPayment
                    ? 'This page will update when Polar confirms the payment.'
                    : 'Your credits have been added to your account.'}
                </p>
              </div>
            </div>
          )}

          <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/55 shadow-2xl shadow-black/20 backdrop-blur-md">
            {session.isPending || session.isRefetching || loading ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-400">
                <PhosphorIcons.CircleNotchIcon className="h-5 w-5 animate-spin text-[#ffafcc]" />
                Loading purchases…
              </div>
            ) : !session.data?.user ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <PhosphorIcons.LockKeyIcon className="h-8 w-8 text-slate-500" />
                <h2 className="mt-4 text-lg font-bold text-white">Sign in to view purchases</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Purchase history is private and only available to the account that made the
                  payment.
                </p>
                <div className="mt-5">
                  <AuthButton />
                </div>
              </div>
            ) : error ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <PhosphorIcons.WarningCircleIcon className="h-8 w-8 text-red-300" />
                <p className="mt-4 text-sm font-semibold text-white">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadPurchases()}
                  className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Try again
                </button>
              </div>
            ) : purchases.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <PhosphorIcons.ReceiptIcon className="h-8 w-8 text-slate-600" />
                <h2 className="mt-4 text-base font-bold text-white">No purchases yet</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Your credit pack purchases will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Purchase</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Credits</th>
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {purchases.map((purchase) => {
                      const status = STATUS_STYLES[purchase.status] || STATUS_STYLES.pending;
                      return (
                        <tr key={purchase.id} className="transition hover:bg-slate-800/25">
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-white">
                              {PACK_NAMES[purchase.pack]}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-slate-500">
                              {purchase.orderId
                                ? `Order ${purchase.orderId.slice(0, 8)}`
                                : `Checkout ${purchase.checkoutId.slice(0, 8)}`}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-400">
                            {formatDate(purchase.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold tabular-nums text-white">
                              +{purchase.credits.toLocaleString()}
                            </p>
                            {purchase.removedCredits > 0 && (
                              <p className="mt-1 text-[11px] text-slate-500">
                                −{purchase.removedCredits.toLocaleString()} refunded
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold tabular-nums text-slate-200">
                            {formatMoney(purchase.amount, purchase.currency)}
                            {purchase.refundedAmount > 0 && (
                              <p className="mt-1 text-[11px] font-normal text-slate-500">
                                {formatMoney(purchase.refundedAmount, purchase.currency)} refunded
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <p className="mt-4 text-center text-[11px] text-slate-600">
            Payment processing and receipts are provided securely by Polar.
          </p>
        </main>
      </div>
    </>
  );
};

export default Purchases;
