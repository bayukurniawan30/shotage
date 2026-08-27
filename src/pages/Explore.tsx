import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Footer } from '../components/Footer';

export interface ShotageShareablesContent {
  name: string;
  thumbnail?: {
    id: number;
    secureUrl: string;
    filename: string;
    mimeType: string;
    size: number;
    width: number | null;
    height: number | null;
  };
  publisher?: string;
  identifier: string;
  json_string: string;
  is_in_review: string;
  is_in_explore: string;
}

export interface ShotageShareablesEntry {
  id: number;
  content: ShotageShareablesContent;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  type: string;
  entries: ShotageShareablesEntry[];
}

export const Explore: React.FC = () => {
  const [entries, setEntries] = useState<ShotageShareablesEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function fetchExploreEntries() {
      setLoading(true);
      setError(null);
      try {
        const morphicUrl =
          (typeof process !== 'undefined' && process.env?.MORPHIC_API_URL) ||
          import.meta.env?.VITE_MORPHIC_API_URL ||
          'https://main-workspace.morphic-cms.com';

        let response = await fetch('/api/explore');
        if (!response.ok) {
          throw new Error(`Failed to load community designs (HTTP ${response.status})`);
        }

        const data: ApiResponse = await response.json();
        if (isCancelled) return;

        const rawEntries = Array.isArray(data?.entries) ? data.entries : [];

        // Filter strictly by is_in_review === "no" AND is_in_explore === "yes"
        const filtered = rawEntries.filter((item) => {
          const c = item?.content || (item as any);
          const inReview =
            String(c?.is_in_review || '')
              .toLowerCase()
              .trim() === 'no';
          const inExplore =
            String(c?.is_in_explore || '')
              .toLowerCase()
              .trim() === 'yes';
          const hasIdentifier = Boolean(c?.identifier);
          return inReview && inExplore && hasIdentifier;
        });

        setEntries(filtered);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Error fetching explore shareables:', err);
          setError(err?.message || 'Unable to load explore designs. Please try again later.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchExploreEntries();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      const name = (e.content?.name || '').toLowerCase();
      const pub = (e.content?.publisher || '').toLowerCase();
      return name.includes(q) || pub.includes(q);
    });
  }, [entries, searchQuery]);

  return (
    <>
      <Head>
        <title>Explore Community Mockup Designs — Shotage Studio</title>
        <meta
          name="description"
          content="Discover and customize presentation-ready 3D mockups, device layouts, and motion animations created by the Shotage community."
        />
        <link rel="canonical" href="https://shotage.studio/explore" />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#ffafcc] selection:text-slate-950 relative overflow-x-hidden">
        {/* Dynamic Background Ambient Gradient Orbs */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 w-[350px] sm:w-[700px] h-[300px] sm:h-[500px] bg-[#cdb4db]/10 sm:bg-[#cdb4db]/15 blur-[60px] sm:blur-[160px] rounded-full sm:animate-pulse duration-3000" />
          <div className="absolute top-1/3 -right-20 sm:-right-40 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#ffafcc]/10 sm:bg-[#ffafcc]/12 blur-[60px] sm:blur-[180px] rounded-full" />
          <div className="absolute bottom-10 left-10 w-[350px] sm:w-[800px] h-[300px] sm:h-[500px] bg-[#a2d2ff]/8 sm:bg-[#a2d2ff]/10 blur-[60px] sm:blur-[170px] rounded-full" />
        </div>

        {/* Global Navigation Header */}
        <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <img
                src="/shotage-logo-small.png"
                alt="Shotage Logo"
                className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#ffafcc] transition-colors">
                Shotage
              </span>
            </a>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
              <a href="/#frames" className="hover:text-white transition-colors">
                Device Frames
              </a>
              <a href="/#animation" className="hover:text-white transition-colors">
                Animation & Video
              </a>
              <a href="/#features" className="hover:text-white transition-colors">
                Features
              </a>
              <a href="/explore" className="text-white font-bold flex items-center gap-1.5">
                <span>Explore</span>
              </a>
              <a href="/faq" className="hover:text-white transition-colors">
                FAQ
              </a>
            </div>

            {/* Launch Studio CTA */}
            <a
              href="/studio"
              className="px-4 py-2 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-2 hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
              style={{
                backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
              }}
            >
              <span>Launch Studio</span>
              <PhosphorIcons.ArrowRightIcon className="w-3.5 h-3.5" weight="bold" />
            </a>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-16 space-y-10 w-full">
          {/* Header Title & Intro */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Explore Featured Mockups
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Browse curated 3D designs, multi-stage social carousels, and motion animations. Click
              any template to customize it in Shotage Studio.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <PhosphorIcons.MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search templates or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-neutral-900/90 border border-neutral-800 focus:border-[#a2d2ff] focus:ring-1 focus:ring-[#a2d2ff] rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <PhosphorIcons.XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-neutral-800 bg-neutral-950/60 p-3.5 sm:p-4 flex items-center gap-4 animate-pulse"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl bg-neutral-900/80 aspect-square" />
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="h-4 w-3/4 bg-neutral-800 rounded-md" />
                    <div className="h-3 w-1/2 bg-neutral-900 rounded-md" />
                    <div className="h-3 w-2/3 bg-neutral-900/60 rounded-md pt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-8 rounded-3xl border border-rose-500/30 bg-rose-500/10 text-center max-w-lg mx-auto space-y-3">
              <PhosphorIcons.WarningCircle
                className="w-8 h-8 text-rose-400 mx-auto"
                weight="duotone"
              />
              <h3 className="text-base font-bold text-white">Unable to Load Designs</h3>
              <p className="text-xs text-rose-200/80 leading-relaxed">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 mt-2"
              >
                <PhosphorIcons.ArrowClockwiseIcon className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredEntries.length === 0 && (
            <div className="p-12 rounded-3xl border border-neutral-800 bg-neutral-950/60 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pastel-pink/15 border border-pastel-pink/30 flex items-center justify-center mx-auto text-pastel-pink">
                <PhosphorIcons.SparkleIcon className="w-6 h-6" weight="duotone" />
              </div>
              <h3 className="text-lg font-bold text-white">No Designs Found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchQuery
                  ? `No community templates matched "${searchQuery}". Try a different search keyword.`
                  : 'No community designs have been approved for Explore yet. Check back soon!'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {/* 3-Column Responsive Grid */}
          {!loading && !error && filteredEntries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredEntries.map((entry) => {
                const content = entry.content || (entry as any);
                const identifier = content.identifier;
                const name = content.name?.trim() || 'Untitled Mockup';
                const publisher = content.publisher?.trim() || 'Community Creator';
                const thumbnailUrl =
                  content.thumbnail?.secureUrl ||
                  (typeof content.thumbnail === 'string' ? content.thumbnail : null);

                return (
                  <a
                    key={entry.id || identifier}
                    href={`/studio?s=${encodeURIComponent(identifier)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-row items-center gap-4 rounded-3xl border border-neutral-800/80 bg-neutral-950/70 hover:bg-neutral-900/90 hover:border-pastel-pink/50 backdrop-blur-xl p-3.5 sm:p-4 transition-all duration-300 shadow-xl shadow-black/60 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#ffafcc]/10 cursor-pointer overflow-hidden relative"
                  >
                    {/* Left Thumbnail Frame (Square Aspect Ratio) */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/90 flex items-center justify-center">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={name}
                          loading="lazy"
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-900 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                          <PhosphorIcons.Image className="w-6 h-6 opacity-60" />
                          <span className="text-[10px] font-medium">Shotage</span>
                        </div>
                      )}

                      {/* Hover Overlay Badge */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 rounded-xl bg-white/95 text-neutral-950 font-extrabold text-xs shadow-lg flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                          <PhosphorIcons.ArrowUpRightIcon className="w-4 h-4" weight="bold" />
                        </span>
                      </div>
                    </div>

                    {/* Right Meta & Details */}
                    <div className="flex flex-col justify-between flex-1 min-w-0 h-full py-0.5 space-y-2.5">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-pastel-pink transition-colors truncate">
                          {name}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1 truncate">
                          <PhosphorIcons.UserCircleIcon
                            className="w-3.5 h-3.5 text-slate-500 shrink-0"
                            weight="fill"
                          />
                          <span className="truncate">{publisher}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-900/90 flex items-center justify-between text-xs text-slate-400">
                        <span className="text-[11px] text-slate-500">Shared Design</span>
                        <div className="flex items-center gap-1 text-pastel-pink group-hover:text-white font-semibold text-xs">
                          <span>Customize</span>
                          <PhosphorIcons.ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer className="w-full mt-16" />
      </div>
    </>
  );
};

export default Explore;
