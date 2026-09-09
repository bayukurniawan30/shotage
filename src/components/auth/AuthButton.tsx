import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  CoinsStacked02,
  CreditCardPlus,
  InfoCircle,
  Loading01,
  LogOut01,
  Mail01,
  User01,
  XClose,
} from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import {
  authClient,
  CREDIT_BALANCE_UPDATED_EVENT,
  createCreditCheckout,
  fetchVerifiedAccount,
  isNeonAuthConfigured,
  type CreditPackSlug,
  type VerifiedAccount,
} from '../../lib/auth/client';
import { getExportCapacity } from '../../lib/credits';
import { CREDIT_PACK_OPTIONS } from '../../lib/creditPacks';

type AuthButtonProps = {
  compact?: boolean;
  variant?: 'default' | 'studio';
};

type AuthError = { message?: string } | null | undefined;

function errorMessage(error: AuthError, fallback: string) {
  return error?.message || fallback;
}

export function CreditPackDialog({
  onClose,
  variant,
}: {
  onClose: () => void;
  variant: 'default' | 'studio';
}) {
  const titleId = useId();
  const [pending, setPending] = useState<CreditPackSlug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isStudio = variant === 'studio';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const openCheckout = async (pack: CreditPackSlug) => {
    setPending(pack);
    setError(null);
    try {
      const { checkoutUrl } = await createCreditCheckout(pack);
      window.location.assign(checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open checkout.');
      setPending(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 backdrop-blur-sm cursor-default ${
          isStudio ? 'bg-neutral-950/85' : 'bg-slate-950/80'
        }`}
        onClick={onClose}
        aria-label="Close credit packs"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-x-hidden overflow-y-auto rounded-2xl border shadow-2xl shadow-black/60 ${
          isStudio ? 'border-neutral-700/80 bg-neutral-900' : 'border-slate-700/80 bg-slate-900'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:text-white cursor-pointer ${
            isStudio ? 'hover:bg-neutral-800' : 'hover:bg-slate-800'
          }`}
          aria-label="Close"
        >
          <XClose className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#ffafcc]/30 bg-[#ffafcc]/10">
            <CoinsStacked02 className="h-5 w-5 text-[#ffafcc]" />
          </div>
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-white">
            Buy Shotage credits
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            One-time payment. Credits do not expire.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {CREDIT_PACK_OPTIONS.map((pack) => {
              const capacity = getExportCapacity(pack.credits);
              return (
                <button
                  key={pack.slug}
                  type="button"
                  disabled={Boolean(pending)}
                  onClick={() => openCheckout(pack.slug)}
                  className={`relative rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
                    pack.featured
                      ? 'border-[#ffafcc]/60 bg-[#ffafcc]/10 hover:bg-[#ffafcc]/15'
                      : isStudio
                        ? 'border-neutral-700 bg-neutral-950/50 hover:border-neutral-600 hover:bg-neutral-800'
                        : 'border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {pack.featured && (
                    <span className="absolute -top-2 right-2 rounded-full bg-[#ffafcc] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-950">
                      Most popular
                    </span>
                  )}
                  <span className="block text-xs font-semibold text-slate-300">{pack.name}</span>
                  <span className="mt-2 block text-lg font-bold text-white">{pack.price}</span>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    {pack.credits.toLocaleString()} credits
                  </span>

                  <span
                    className={`my-3 block h-px ${isStudio ? 'bg-neutral-700/70' : 'bg-slate-700/70'}`}
                  />
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Export up to
                  </span>
                  <span className="mt-2 flex items-start gap-2 text-[11px] leading-4 text-slate-300">
                    <PhosphorIcons.ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ffafcc]" />
                    <span>
                      <strong className="font-semibold text-white">
                        {capacity.standardImages}
                      </strong>{' '}
                      standard or{' '}
                      <strong className="font-semibold text-white">{capacity.fourKImages}</strong>{' '}
                      4K images
                    </span>
                  </span>
                  <span className="mt-2 flex items-start gap-2 text-[11px] leading-4 text-slate-300">
                    <PhosphorIcons.VideoCameraIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a2d2ff]" />
                    <span>
                      <strong className="font-semibold text-white">{capacity.shortVideos}</strong>{' '}
                      short or{' '}
                      <strong className="font-semibold text-white">{capacity.longVideos}</strong>{' '}
                      long videos
                    </span>
                  </span>
                  {pending === pack.slug && (
                    <Loading01 className="absolute bottom-3 right-3 h-4 w-4 animate-spin text-[#ffafcc]" />
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-center text-xs text-red-300">
              {error}
            </p>
          )}
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
            Secure checkout and tax calculation are handled by Polar. See our{' '}
            <a href="/refund-policy" className="text-slate-300 hover:text-white hover:underline">
              Refund Policy
            </a>
            .
          </p>
        </div>
      </section>
    </div>,
    document.body
  );
}

export function SignInDialog({
  onClose,
  variant,
}: {
  onClose: () => void;
  variant: 'default' | 'studio';
}) {
  const titleId = useId();
  const emailInput = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState<'google' | 'github' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const isStudio = variant === 'studio';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    emailInput.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const callbackURL = window.location.href;

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setPending(provider);
    setError(null);
    try {
      const result = await authClient.signIn.social({ provider, callbackURL });
      if (result.error) setError(errorMessage(result.error, `Could not sign in with ${provider}.`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Could not sign in with ${provider}.`);
    } finally {
      setPending(null);
    }
  };

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending('email');
    setError(null);
    try {
      const result = await authClient.signIn.magicLink({ email: email.trim(), callbackURL });
      if (result.error) {
        setError(errorMessage(result.error, 'Could not send the magic link.'));
      } else {
        setSent(true);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send the magic link.');
    } finally {
      setPending(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className={`absolute inset-0 backdrop-blur-sm cursor-default ${
          isStudio ? 'bg-neutral-950/85' : 'bg-slate-950/80'
        }`}
        onClick={onClose}
        aria-label="Close sign in"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl shadow-black/60 ${
          isStudio ? 'border-neutral-700/80 bg-neutral-900' : 'border-slate-700/80 bg-slate-900'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:text-white cursor-pointer ${
            isStudio ? 'hover:bg-neutral-800' : 'hover:bg-slate-800'
          }`}
          aria-label="Close"
        >
          <XClose className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-[#ffafcc]/30 bg-[#ffafcc]/10">
            <User01 className="h-5 w-5 text-[#ffafcc]" />
          </div>
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-white">
            Sign in to Shotage
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Save your work and keep your credits available across devices.
          </p>

          {!isNeonAuthConfigured && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
              Neon Auth is unavailable because <code>VITE_NEON_AUTH_URL</code> is not configured.
            </div>
          )}

          {sent ? (
            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-emerald-100">Check your inbox</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-200/70">
                    We sent a secure sign-in link to {email}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={Boolean(pending) || !isNeonAuthConfigured}
                  onClick={() => signInWithProvider('google')}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold text-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                    isStudio
                      ? 'border-neutral-700 bg-neutral-950/50 hover:border-neutral-600 hover:bg-neutral-800'
                      : 'border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {pending === 'google' ? (
                    <Loading01 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PhosphorIcons.GoogleLogoIcon className="h-4 w-4" weight="bold" />
                  )}
                  Google
                </button>
                <button
                  type="button"
                  disabled={Boolean(pending) || !isNeonAuthConfigured}
                  onClick={() => signInWithProvider('github')}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold text-slate-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                    isStudio
                      ? 'border-neutral-700 bg-neutral-950/50 hover:border-neutral-600 hover:bg-neutral-800'
                      : 'border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {pending === 'github' ? (
                    <Loading01 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PhosphorIcons.GithubLogoIcon className="h-4 w-4" weight="bold" />
                  )}
                  GitHub
                </button>
              </div>

              <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                <span className={`h-px flex-1 ${isStudio ? 'bg-neutral-800' : 'bg-slate-800'}`} />{' '}
                or continue with email{' '}
                <span className={`h-px flex-1 ${isStudio ? 'bg-neutral-800' : 'bg-slate-800'}`} />
              </div>

              <form onSubmit={sendMagicLink}>
                <label
                  htmlFor={`${titleId}-email`}
                  className="text-xs font-semibold text-slate-300"
                >
                  Email address
                </label>
                <div className="relative mt-2">
                  <Mail01 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    ref={emailInput}
                    id={`${titleId}-email`}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={`h-11 w-full rounded-xl border pl-10 pr-3 text-sm text-white outline-none transition focus:border-[#ffafcc] focus:ring-2 focus:ring-[#ffafcc]/20 ${
                      isStudio
                        ? 'border-neutral-700 bg-neutral-950/70'
                        : 'border-slate-700 bg-slate-950/70'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={Boolean(pending) || !isNeonAuthConfigured}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {pending === 'email' && <Loading01 className="h-4 w-4 animate-spin" />}
                  Send magic link
                </button>
              </form>
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 text-center text-xs text-red-300">
              {error}
            </p>
          )}
          <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">
            By continuing, you agree to the{' '}
            <a href="/terms" className="text-slate-300 hover:text-white">
              Terms
            </a>{' '}
            and acknowledge the{' '}
            <a href="/privacy" className="text-slate-300 hover:text-white">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </div>,
    document.body
  );
}

export function AuthButton({ compact = false, variant = 'default' }: AuthButtonProps) {
  const session = authClient.useSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);
  const [accountPending, setAccountPending] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sessionId = session.data?.session?.id;
  const isStudio = variant === 'studio';
  const triggerClassName = isStudio
    ? 'border-neutral-700 bg-neutral-800 text-slate-200 hover:border-neutral-600 hover:bg-neutral-700 hover:text-white'
    : 'border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white';
  const menuClassName = isStudio
    ? 'border-neutral-800 bg-neutral-900'
    : 'border-slate-700 bg-slate-900';
  const menuItemClassName = isStudio
    ? 'hover:bg-neutral-800 hover:text-white'
    : 'hover:bg-slate-800 hover:text-white';
  const accountTriggerClassName = isStudio ? 'hover:bg-neutral-800/80' : 'hover:bg-slate-800/80';

  useEffect(() => {
    if (!sessionId) {
      setVerifiedAccount(null);
      setAccountPending(false);
      return;
    }
    let cancelled = false;
    setAccountPending(true);
    fetchVerifiedAccount()
      .then((account) => !cancelled && setVerifiedAccount(account))
      .catch(() => !cancelled && setVerifiedAccount(null))
      .finally(() => !cancelled && setAccountPending(false));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const refreshBalance = () => {
      fetchVerifiedAccount()
        .then(setVerifiedAccount)
        .catch(() => undefined);
    };
    window.addEventListener(CREDIT_BALANCE_UPDATED_EVENT, refreshBalance);
    return () => window.removeEventListener(CREDIT_BALANCE_UPDATED_EVENT, refreshBalance);
  }, [sessionId]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', closeOutside);
    return () => window.removeEventListener('mousedown', closeOutside);
  }, [menuOpen]);

  if (session.isPending) {
    return (
      <div
        className={`h-9 w-9 shrink-0 animate-pulse rounded-xl border ${
          isStudio ? 'border-neutral-700 bg-neutral-800' : 'border-slate-700 bg-slate-800'
        }`}
        aria-label="Loading session"
      />
    );
  }

  const sessionUser = session.data?.user;
  if (!sessionUser) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className={`h-9 shrink-0 rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${triggerClassName}`}
        >
          {compact ? <User01 className="h-4 w-4" /> : 'Sign in'}
        </button>
        {dialogOpen && <SignInDialog variant={variant} onClose={() => setDialogOpen(false)} />}
      </>
    );
  }

  const user = verifiedAccount
    ? {
        ...sessionUser,
        ...verifiedAccount.user,
        name: verifiedAccount.user.name || sessionUser.name,
        email: verifiedAccount.user.email || sessionUser.email,
        image: verifiedAccount.user.image || sessionUser.image,
      }
    : sessionUser;
  const label = user.name || user.email || 'Account';
  const initials = label.slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        className={`flex h-10 items-center gap-1.5 rounded-full border-0 bg-transparent p-1 pr-2 text-xs font-semibold transition-colors cursor-pointer ${accountTriggerClassName}`}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-[2px] shadow-[0_0_14px_rgba(255,175,204,0.42)] transition-shadow hover:shadow-[0_0_18px_rgba(162,210,255,0.55)]"
          style={{ backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)' }}
        >
          {user.image ? (
            <img
              src={user.image}
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full rounded-full bg-neutral-900 object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-[#ffafcc]">
              {initials}
            </span>
          )}
        </span>
        {/* {!compact && <span className="hidden max-w-24 truncate sm:block">{label}</span>} */}
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {menuOpen && (
        <div
          className={`absolute right-0 top-11 z-[210] w-64 rounded-xl border p-1.5 shadow-2xl shadow-black/50 ${menuClassName}`}
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-white">
              {user.name || 'Shotage user'}
            </p>
            {user.email && (
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{user.email}</p>
            )}
          </div>
          <div className="my-1 h-px bg-slate-800" />
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
            <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <CoinsStacked02 className="h-4 w-4 text-[#ffafcc]" />{' '}
              {verifiedAccount?.credits.unlimited ? 'Creator plan' : 'Credits'}
              <span className="group/tooltip relative flex">
                <button
                  type="button"
                  className="rounded text-slate-500 outline-none transition-colors hover:text-slate-200 focus-visible:text-slate-200 focus-visible:ring-2 focus-visible:ring-[#ffafcc]/50 cursor-help"
                  aria-label="What can I export with my credits?"
                  aria-describedby="credit-capacity-tooltip"
                >
                  <InfoCircle className="h-3.5 w-3.5" />
                </button>
                <span
                  id="credit-capacity-tooltip"
                  role="tooltip"
                  className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border px-3 py-2.5 text-left text-[11px] font-normal leading-5 text-slate-300 opacity-0 shadow-xl transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${
                    isStudio ? 'border-neutral-700 bg-neutral-950' : 'border-slate-700 bg-slate-950'
                  }`}
                >
                  {verifiedAccount?.credits.unlimited ? (
                    <>
                      Your Creator plan includes unlimited image and video exports. No credits are
                      deducted.
                    </>
                  ) : verifiedAccount ? (
                    <>
                      Your balance can export up to{' '}
                      <strong className="font-semibold text-white">
                        {verifiedAccount.credits.exportCapacity.standardImages} standard images
                      </strong>
                      ,{' '}
                      <strong className="font-semibold text-white">
                        {verifiedAccount.credits.exportCapacity.fourKImages} 4K images
                      </strong>
                      , or{' '}
                      <strong className="font-semibold text-white">
                        {verifiedAccount.credits.exportCapacity.shortVideos} short video
                        {verifiedAccount.credits.exportCapacity.shortVideos === 1 ? '' : 's'}
                      </strong>
                      .
                    </>
                  ) : (
                    'Export estimates are unavailable while your balance is loading.'
                  )}
                </span>
              </span>
            </span>
            {accountPending ? (
              <span
                className="h-4 w-10 animate-pulse rounded bg-slate-700"
                aria-label="Loading credits"
              />
            ) : (
              <span className="text-xs font-bold tabular-nums text-white">
                {verifiedAccount?.credits.unlimited
                  ? '∞ Unlimited'
                  : (verifiedAccount?.credits.balance.toLocaleString() ?? '—')}
              </span>
            )}
          </div>
          <div className="my-1 h-px bg-slate-800" />
          {!verifiedAccount?.credits.unlimited && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setCreditDialogOpen(true);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 transition-colors cursor-pointer ${menuItemClassName}`}
            >
              <CreditCardPlus className="h-4 w-4" /> Buy credits
            </button>
          )}
          <a
            href="/designs"
            onClick={() => setMenuOpen(false)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 transition-colors ${menuItemClassName}`}
          >
            <PhosphorIcons.ImagesSquareIcon className="h-4 w-4" /> My designs
          </a>
          <a
            href="/purchases"
            onClick={() => setMenuOpen(false)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 transition-colors ${menuItemClassName}`}
          >
            <PhosphorIcons.ReceiptIcon className="h-4 w-4" /> Purchase history
          </a>
          <button
            type="button"
            onClick={async () => {
              setMenuOpen(false);
              await authClient.signOut();
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-300 transition-colors cursor-pointer ${menuItemClassName}`}
          >
            <LogOut01 className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
      {creditDialogOpen && !verifiedAccount?.credits.unlimited && (
        <CreditPackDialog variant={variant} onClose={() => setCreditDialogOpen(false)} />
      )}
    </div>
  );
}
