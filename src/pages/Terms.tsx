import React from 'react';
import { Shield01, CheckCircle, Lock01, Stars02, ArrowLeft } from '@untitledui/icons';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pastel-pink/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#a2d2ff]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl py-4 px-6 md:px-12 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <img
            src="/shotage-logo-small.png"
            alt="Shotage Logo"
            className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-pastel-pinkLight transition-colors">
            Shotage
          </span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/studio"
            className="px-3.5 sm:px-4 py-2 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-2 hover:brightness-110 active:scale-95 cursor-pointer"
            style={{
              backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
            }}
          >
            <span className="hidden sm:inline">Launch Studio</span>
            <span className="sm:hidden">Launch Studio</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Title Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pastel-blue/10 border border-pastel-blue/30 text-pastel-blue text-xs font-semibold">
            <Shield01 className="w-3.5 h-3.5" />
            <span>Legal & Ownership</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Terms of Service
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Transparent, creator-first terms. Shotage is built to give you total creative freedom
            with complete data privacy.
          </p>

          <div className="pt-2 text-xs font-mono text-slate-400">Last Updated: August 2026</div>
        </div>

        {/* 3 Core Pillars Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-pink/20 text-pastel-pink flex items-center justify-center">
              <Stars02 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">100% Free to Use</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Shotage is completely free to use for both personal and commercial projects. No
              subscription, no paywalls, and no mandatory watermarks.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pastel-purple/20 text-pastel-purple flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">100% User Ownership</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              All exported images, 3D graphics, and video animation mockups remain 100% owned by
              you. You retain full copyright and commercial rights.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#a2d2ff]/20 text-[#a2d2ff] flex items-center justify-center">
              <Lock01 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">100% Local & Private</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Processing is performed locally in your browser. No screenshots, images, or media
              files are ever uploaded to external servers.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md text-xs md:text-sm leading-relaxed text-slate-300">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">1. Commercial & Personal License</h2>
            <p className="text-slate-400">
              Shotage grants you a worldwide, royalty-free, non-exclusive license to use the
              application to generate static graphics, social media banners, app store screenshots,
              and video animations for any commercial or personal purpose.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">
              2. Intellectual Property & Content Ownership
            </h2>
            <p className="text-slate-400">
              You maintain exclusive ownership of all uploaded artwork, screenshots, text overlays,
              and exported media files created with Shotage. Shotage claims zero ownership or
              copyright over content produced using our tools.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">
              3. Privacy & Zero-Server Data Guarantee
            </h2>
            <p className="text-slate-400">
              Your privacy is fundamental. All canvas manipulations, 3D perspective transforms,
              custom font styling, and video encoding loops execute strictly client-side on your
              local device. We do not store, inspect, or transmit your media.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-100">4. Service Availability</h2>
            <p className="text-slate-400">
              Shotage is provided "as is" with maximum browser compatibility and Progressive Web App
              (PWA) support for offline usage.
            </p>
          </section>
        </div>

        {/* Call to Action Bar */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-center space-y-4 shadow-xl">
          <h2 className="text-xl font-bold text-white">Ready to create stunning 3D mockups?</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Transform plain screenshots into eye-catching graphics and video animations right in
            your browser.
          </p>
          <div className="pt-2">
            <a
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pastel-pink to-[#a2d2ff] hover:brightness-110 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg"
            >
              <Stars02 className="w-4 h-4 text-slate-950" />
              <span>Launch Studio Free</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-6 px-6 md:px-12 text-xs font-medium text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a
            href="/terms"
            className="hover:text-slate-100 transition-colors cursor-pointer text-slate-300 font-semibold"
          >
            Terms of Service
          </a>
        </div>

        <div className="text-center sm:text-right">
          © {new Date().getFullYear()} Shotage — High-Resolution Screenshot Studio. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
};

export default Terms;
