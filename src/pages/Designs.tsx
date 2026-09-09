import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { AuthButton } from '../components/auth/AuthButton';
import { PublicHeader } from '../components/PublicHeader';
import {
  authClient,
  deleteUserDesign,
  fetchUserDesigns,
  type UserDesignItem,
  type UserDesignStatus,
} from '../lib/auth/client';

const STATUS_STYLES: Record<
  UserDesignStatus,
  { label: string; description: string; className: string }
> = {
  private: {
    label: 'Private',
    description: 'Only you can open this design.',
    className: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
  },
  pending: {
    label: 'In review',
    description: 'Submitted for review before appearing in Explore.',
    className: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  },
  published: {
    label: 'Published',
    description: 'Approved and visible in Explore.',
    className: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  },
  not_published: {
    label: 'Not published',
    description: 'Public, but currently not visible in Explore.',
    className: 'border-slate-500/40 bg-slate-700/40 text-slate-300',
  },
};

type DesignFilter = 'all' | 'private' | 'public';

function formatDate(value: string | null) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

const Designs: React.FC = () => {
  const session = authClient.useSession();
  const sessionId = session.data?.session?.id;
  const [designs, setDesigns] = useState<UserDesignItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DesignFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [designToDelete, setDesignToDelete] = useState<UserDesignItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDesigns = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setDesigns(await fetchUserDesigns());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load your designs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setDesigns([]);
      return;
    }
    void loadDesigns();
  }, [loadDesigns, sessionId]);

  const visibleDesigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return designs.filter((design) => {
      if (filter !== 'all' && design.visibility !== filter) return false;
      if (!normalizedQuery) return true;
      return (
        design.name.toLowerCase().includes(normalizedQuery) ||
        design.publisher.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [designs, filter, query]);

  const copyLink = async (design: UserDesignItem) => {
    const url = `${window.location.origin}/studio?s=${encodeURIComponent(design.identifier)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(design.id);
      window.setTimeout(
        () => setCopiedId((current) => (current === design.id ? null : current)),
        1800
      );
    } catch {
      setError('Could not copy the link. You can open the design and copy its URL instead.');
    }
  };

  const confirmDelete = async () => {
    if (!designToDelete || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUserDesign(designToDelete.id);
      setDesigns((current) => current.filter((design) => design.id !== designToDelete.id));
      setDesignToDelete(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not move the design to trash.');
      setDesignToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Head>
        <title>My designs — Shotage</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
        <div className="pointer-events-none absolute left-[12%] top-0 h-[520px] w-[520px] rounded-full bg-[#cdb4db]/10 blur-[160px]" />
        <div className="pointer-events-none absolute right-[8%] top-1/3 h-[560px] w-[560px] rounded-full bg-[#a2d2ff]/10 blur-[170px]" />

        <PublicHeader />

        <main className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#a2d2ff]/25 bg-[#a2d2ff]/10 text-[#a2d2ff]">
                <PhosphorIcons.ImagesSquareIcon className="h-5 w-5" weight="bold" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                My designs
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Open your saved designs, copy private links, and track public submissions.
              </p>
            </div>
            <div className="flex gap-2">
              {sessionId && (
                <button
                  type="button"
                  onClick={() => void loadDesigns(true)}
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
          </div>

          {session.data?.user && !loading && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <PhosphorIcons.MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your designs…"
                  className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/75 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#a2d2ff]/60 focus:ring-1 focus:ring-[#a2d2ff]/30"
                />
              </div>
              <div className="flex rounded-xl border border-slate-800 bg-slate-900/75 p-1">
                {(['all', 'private', 'public'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${
                      filter === value
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100"
            >
              <PhosphorIcons.WarningCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <section className="mt-8">
            {session.isPending || loading ? (
              <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/45 text-sm text-slate-400">
                <PhosphorIcons.CircleNotchIcon className="h-5 w-5 animate-spin text-[#ffafcc]" />
                Loading your designs…
              </div>
            ) : !session.data?.user ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/55 px-6 text-center shadow-2xl shadow-black/20">
                <PhosphorIcons.LockKeyIcon className="h-9 w-9 text-slate-500" />
                <h2 className="mt-4 text-lg font-bold text-white">Sign in to view your designs</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Your private designs and public submissions are only available to their owner.
                </p>
                <div className="mt-5">
                  <AuthButton />
                </div>
              </div>
            ) : visibleDesigns.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/45 px-6 text-center">
                <PhosphorIcons.ImageSquareIcon className="h-9 w-9 text-slate-600" />
                <h2 className="mt-4 text-base font-bold text-white">
                  {designs.length === 0 ? 'No saved designs yet' : 'No matching designs'}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  {designs.length === 0
                    ? 'Share a design from Studio as Private or Public and it will appear here.'
                    : 'Try another search term or visibility filter.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                {visibleDesigns.map((design) => {
                  const status = STATUS_STYLES[design.status];
                  const designUrl = `/studio?s=${encodeURIComponent(design.identifier)}`;
                  return (
                    <article
                      key={design.id}
                      className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 shadow-xl shadow-black/20 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900"
                    >
                      <a
                        href={designUrl}
                        className="relative block aspect-[16/9] overflow-hidden bg-slate-950"
                      >
                        {design.thumbnailUrl ? (
                          <img
                            src={design.thumbnailUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-[#a2d2ff]/10">
                            <PhosphorIcons.ImageSquareIcon className="h-10 w-10 text-slate-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent opacity-0 transition group-hover:opacity-100" />
                        <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-slate-950/85 px-2 py-1 text-[10px] font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                          Open <PhosphorIcons.ArrowUpRightIcon className="h-3 w-3" />
                        </span>
                      </a>

                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-bold text-white">{design.name}</h2>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Updated {formatDate(design.updatedAt || design.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-2 min-h-8 text-[11px] leading-4 text-slate-400">
                          {status.description}
                        </p>

                        <div className="mt-3 flex gap-1.5 border-t border-slate-800 pt-2.5">
                          <a
                            href={designUrl}
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2 text-[11px] font-semibold text-white transition hover:bg-slate-700"
                          >
                            <PhosphorIcons.PencilSimpleIcon className="h-3.5 w-3.5" /> Open
                          </a>
                          <button
                            type="button"
                            onClick={() => void copyLink(design)}
                            className="flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-700 px-2 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            aria-label={`Copy link for ${design.name}`}
                          >
                            {copiedId === design.id ? (
                              <>
                                <PhosphorIcons.CheckIcon className="h-3.5 w-3.5 text-emerald-300" />{' '}
                                Copied
                              </>
                            ) : (
                              <>
                                <PhosphorIcons.LinkIcon className="h-3.5 w-3.5" /> Copy
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesignToDelete(design)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-slate-500 transition hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-300"
                            aria-label={`Move ${design.name} to trash`}
                          >
                            <PhosphorIcons.TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {designToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-design-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDesignToDelete(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-400/10 text-rose-300">
              <PhosphorIcons.TrashIcon className="h-5 w-5" />
            </div>
            <h2 id="delete-design-title" className="mt-4 text-lg font-bold text-white">
              Move design to trash?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              “{designToDelete.name}” will disappear from Shotage and its shared link will stop
              working. You can restore it later from Trash in Morphic CMS.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDesignToDelete(null)}
                disabled={deleting}
                className="h-10 rounded-xl border border-slate-700 px-4 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="flex h-10 items-center gap-2 rounded-xl bg-rose-500 px-4 text-xs font-bold text-white transition hover:bg-rose-400 disabled:opacity-60"
              >
                {deleting && <PhosphorIcons.CircleNotchIcon className="h-4 w-4 animate-spin" />}
                {deleting ? 'Moving…' : 'Move to trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Designs;
