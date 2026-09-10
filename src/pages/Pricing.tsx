import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { SignInDialog } from '../components/auth/AuthButton';
import { Footer } from '../components/Footer';
import { PublicHeader } from '../components/PublicHeader';
import {
  authClient,
  createCreditCheckout,
  fetchVerifiedAccount,
  type CreditPackSlug,
  type VerifiedAccount,
} from '../lib/auth/client';
import { CREDIT_PACK_OPTIONS } from '../lib/creditPacks';
import { EXPORT_COSTS, MAX_PAID_VIDEO_DURATION_SECONDS, getExportCapacity } from '../lib/credits';

const exportTypes = [
  {
    name: 'Standard image',
    detail: 'Up to 2× resolution',
    credits: EXPORT_COSTS.imageStandard,
    icon: PhosphorIcons.ImageIcon,
    color: 'text-[#ffafcc]',
    background: 'bg-[#ffafcc]/10',
  },
  {
    name: '4K image',
    detail: '4× resolution',
    credits: EXPORT_COSTS.image4k,
    icon: PhosphorIcons.FrameCornersIcon,
    color: 'text-[#cdb4db]',
    background: 'bg-[#cdb4db]/10',
  },
  {
    name: 'Short video',
    detail: '5–10 seconds',
    credits: EXPORT_COSTS.videoShort,
    icon: PhosphorIcons.VideoCameraIcon,
    color: 'text-[#a2d2ff]',
    background: 'bg-[#a2d2ff]/10',
  },
  {
    name: 'Long video',
    detail: `11–${MAX_PAID_VIDEO_DURATION_SECONDS} seconds`,
    credits: EXPORT_COSTS.videoLong,
    icon: PhosphorIcons.FilmStripIcon,
    color: 'text-[#bde0fe]',
    background: 'bg-[#bde0fe]/10',
  },
];

const faqs = [
  {
    question: 'Is this a subscription?',
    answer: 'No. Every credit pack is a one-time purchase with no recurring charge.',
  },
  {
    question: 'Do credits expire?',
    answer: 'No. Purchased credits remain available in your Shotage account until you use them.',
  },
  {
    question: 'How are exports charged?',
    answer:
      'The exact cost is shown before you export. Multi-stage image exports are charged for each exported stage.',
  },
  {
    question: 'Who handles payment?',
    answer:
      'Secure checkout, payment processing, applicable taxes, and receipts are handled by Polar, our merchant of record.',
  },
];

const Pricing: React.FC = () => {
  const session = authClient.useSession();
  const [pendingPack, setPendingPack] = useState<CreditPackSlug | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<VerifiedAccount | null>(null);
  const [accountPending, setAccountPending] = useState(false);
  const sessionId = session.data?.session?.id;

  useEffect(() => {
    if (!sessionId) {
      setAccount(null);
      setAccountPending(false);
      return;
    }

    let cancelled = false;
    setAccountPending(true);
    fetchVerifiedAccount()
      .then((verified) => !cancelled && setAccount(verified))
      .catch(() => !cancelled && setAccount(null))
      .finally(() => !cancelled && setAccountPending(false));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const buyPack = async (pack: CreditPackSlug) => {
    if (!session.data?.user) {
      setSignInOpen(true);
      return;
    }

    setPendingPack(pack);
    setError(null);
    try {
      const { checkoutUrl } = await createCreditCheckout(pack);
      window.location.assign(checkoutUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not open checkout.');
      setPendingPack(null);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 selection:bg-[#ffafcc] selection:text-slate-950">
      <Head>
        <title>Pricing — Shotage Studio Credits</title>
        <meta
          name="description"
          content="Buy one-time Shotage credit packs for high-resolution image and video exports. No subscription and no credit expiration."
        />
        <link rel="canonical" href="https://shotage.studio/pricing" />
      </Head>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 left-[12%] h-[560px] w-[560px] rounded-full bg-[#cdb4db]/12 blur-[150px]" />
        <div className="absolute right-[-10%] top-[22%] h-[620px] w-[620px] rounded-full bg-[#ffafcc]/10 blur-[170px]" />
        <div className="absolute bottom-[-15%] left-[30%] h-[620px] w-[620px] rounded-full bg-[#a2d2ff]/10 blur-[180px]" />
      </div>

      <PublicHeader activePath="/pricing" />

      <main className="relative z-10 flex-1">
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-20 text-center sm:px-6 sm:pb-20 sm:pt-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ffafcc]/25 bg-[#ffafcc]/10 px-3 py-1.5 text-xs font-semibold text-[#ffc8dd]">
            <PhosphorIcons.CoinsIcon className="h-4 w-4" weight="fill" />
            One-time credit packs
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            Pay for exports,
            <span className="block bg-gradient-to-r from-[#cdb4db] via-[#ffafcc] to-[#a2d2ff] bg-clip-text text-transparent">
              not another subscription.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Create freely in Shotage Studio, then use credits when you export polished images or
            videos. Top up only when you need to.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-300">
            {['No recurring billing', 'Credits never expire', 'Secure checkout by Polar'].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
                    <PhosphorIcons.CheckIcon className="h-3 w-3" weight="bold" />
                  </span>
                  {item}
                </span>
              )
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-6">
          <div className="grid items-stretch gap-5 lg:grid-cols-3">
            {CREDIT_PACK_OPTIONS.map((pack) => {
              const capacity = getExportCapacity(pack.credits);
              const isPro = pack.slug === 'pro';
              return (
                <article
                  key={pack.slug}
                  className={`relative flex flex-col overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-md ${
                    pack.featured
                      ? 'border-[#ffafcc]/60 bg-slate-900/90 px-6 py-9 shadow-[#ffafcc]/10 sm:px-7 sm:py-10 lg:-my-5 lg:py-12'
                      : 'border-slate-800 bg-slate-900/55 p-6 shadow-black/20 sm:p-7'
                  }`}
                >
                  {pack.featured && (
                    <div className="absolute right-5 top-5 rounded-full bg-[#ffafcc] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">
                      Most popular
                    </div>
                  )}
                  {isPro && (
                    <div className="absolute right-5 top-5 rounded-full border border-[#a2d2ff]/30 bg-[#a2d2ff]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#bde0fe]">
                      Best value
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-bold text-white">{pack.name}</p>
                    <p className="mt-2 min-h-10 text-xs leading-5 text-slate-400">
                      {pack.description}
                    </p>
                  </div>

                  <div className="mt-7 flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tight text-white">
                      {pack.price}
                    </span>
                    <span className="pb-1 text-xs font-medium text-slate-500">USD · one time</span>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Included balance
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <PhosphorIcons.CoinsIcon className="h-5 w-5 text-[#ffafcc]" weight="fill" />
                      <span className="text-xl font-extrabold text-white">
                        {pack.credits.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">credits</span>
                    </div>
                  </div>

                  <div className="mt-6 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Export up to
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                      {[
                        {
                          label: 'Standard images',
                          amount: capacity.standardImages,
                          icon: PhosphorIcons.ImageIcon,
                        },
                        {
                          label: '4K images',
                          amount: capacity.fourKImages,
                          icon: PhosphorIcons.FrameCornersIcon,
                        },
                        {
                          label: 'Short videos',
                          amount: capacity.shortVideos,
                          icon: PhosphorIcons.VideoCameraIcon,
                        },
                        {
                          label: 'Long videos',
                          amount: capacity.longVideos,
                          icon: PhosphorIcons.FilmStripIcon,
                        },
                      ].map((item) => (
                        <div key={item.label} className="flex items-start gap-2.5">
                          <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#a2d2ff]" />
                          <div>
                            <p className="text-sm font-extrabold tabular-nums text-white">
                              {item.amount}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-4 text-slate-500">
                              {item.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void buyPack(pack.slug)}
                    disabled={
                      session.isPending ||
                      accountPending ||
                      Boolean(pendingPack) ||
                      account?.credits.unlimited
                    }
                    className={`mt-7 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      pack.featured
                        ? 'bg-[#ffafcc] text-slate-950 shadow-lg shadow-[#ffafcc]/20 hover:bg-[#ffc8dd]'
                        : 'border border-slate-700 bg-slate-800 text-white hover:border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {pendingPack === pack.slug ? (
                      <PhosphorIcons.CircleNotchIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <PhosphorIcons.ArrowRightIcon className="h-4 w-4" weight="bold" />
                    )}
                    {account?.credits.unlimited
                      ? 'Included with Creator plan'
                      : session.data?.user
                        ? `Buy ${pack.name}`
                        : 'Sign in to buy'}
                  </button>
                </article>
              );
            })}
          </div>

          {error && (
            <div
              role="alert"
              className="mx-auto mt-6 max-w-xl rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-center text-xs text-red-200"
            >
              {error}
            </div>
          )}
          <p className="mx-auto mt-12 max-w-2xl text-center text-[11px] leading-5 text-slate-500 lg:mt-16">
            Export estimates assume the full pack is used for one export type. Taxes and the final
            charged amount are shown at Polar checkout.
          </p>
        </section>

        <section className="border-y border-slate-800/80 bg-slate-900/35">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffafcc]">
                Simple usage pricing
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                You always see the cost before export.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Mix image and video exports however you like. Credits are reserved while an export
                runs, released if it fails, and finalized after success. A protected matching retry
                is available when shown.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {exportTypes.map((item) => (
                <article
                  key={item.name}
                  className="rounded-2xl border border-slate-800 bg-slate-950/65 p-5"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.background} ${item.color}`}
                  >
                    <item.icon className="h-5 w-5" weight="bold" />
                  </div>
                  <h3 className="mt-5 text-sm font-bold text-white">{item.name}</h3>
                  <p className="mt-1 text-[11px] text-slate-500">{item.detail}</p>
                  <p className="mt-4 text-xl font-black text-white">
                    {item.credits}{' '}
                    <span className="text-xs font-medium text-slate-500">credits</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-16 px-5 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a2d2ff]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              From idea to export in three steps.
            </h2>
            <div className="mt-8 space-y-5">
              {[
                ['01', 'Create for free', 'Build and preview your design in Shotage Studio.'],
                ['02', 'Choose an export', 'See the exact credit cost before rendering begins.'],
                ['03', 'Top up when needed', 'Buy once through Polar and keep unused credits.'],
              ].map(([number, title, detail]) => (
                <div
                  key={number}
                  className="flex gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4"
                >
                  <span className="font-mono text-xs font-bold text-[#ffafcc]">{number}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a2d2ff]">
              Questions
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Clear before checkout.
            </h2>
            <div className="mt-8 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40 px-5 sm:px-6">
              {faqs.map((item) => (
                <article key={item.question} className="py-5">
                  <h3 className="text-sm font-bold text-white">{item.question}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{item.answer}</p>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Need more detail? Read the{' '}
              <a href="/refund-policy" className="font-semibold text-[#ffafcc] hover:underline">
                Refund Policy
              </a>{' '}
              or email{' '}
              <a
                href="mailto:support@shotage.studio"
                className="font-semibold text-[#ffafcc] hover:underline"
              >
                support@shotage.studio
              </a>
              .
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-[#ffafcc]/25 bg-slate-900/75 px-6 py-12 text-center shadow-2xl shadow-[#ffafcc]/5 sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#cdb4db]/10 via-[#ffafcc]/10 to-[#a2d2ff]/10" />
            <div className="relative">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Make something worth sharing.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">
                Start designing now. You only need credits when your export is ready.
              </p>
              <a
                href="/studio"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-xs font-extrabold text-slate-950 transition hover:bg-slate-100 active:scale-95"
              >
                Open Shotage Studio
                <PhosphorIcons.ArrowRightIcon className="h-4 w-4" weight="bold" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer className="w-full" />
      {signInOpen && <SignInDialog variant="default" onClose={() => setSignInOpen(false)} />}
    </div>
  );
};

export default Pricing;
