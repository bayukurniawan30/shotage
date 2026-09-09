import React, { type ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import { Shield01 } from '@untitledui/icons';
import { Footer } from './Footer';
import { PublicHeader } from './PublicHeader';

interface LegalPageLayoutProps {
  title: string;
  description: string;
  badge: string;
  updated: string;
  path: string;
  children: ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  description,
  badge,
  updated,
  path,
  children,
}) => (
  <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100 selection:bg-brand-500 selection:text-white">
    <Head>
      <title>{`${title} — Shotage`}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`https://shotage.studio${path}`} />
    </Head>

    <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-pastel-pink/10 blur-[140px]" />
    <div className="pointer-events-none absolute right-1/4 top-1/3 h-[600px] w-[600px] rounded-full bg-[#a2d2ff]/10 blur-[160px]" />

    <PublicHeader activePath={path} />

    <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 space-y-10 px-6 py-12 md:py-16">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-pastel-blue/30 bg-pastel-blue/10 px-3 py-1 text-xs font-semibold text-pastel-blue">
          <Shield01 className="h-3.5 w-3.5" />
          <span>{badge}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
          {description}
        </p>
        <div className="pt-2 font-mono text-xs text-slate-500">Last updated: {updated}</div>
      </div>

      <article className="space-y-8 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 text-xs leading-relaxed text-slate-300 backdrop-blur-md md:p-8 md:text-sm">
        {children}
      </article>
    </main>

    <Footer className="w-full" />
  </div>
);

export default LegalPageLayout;
