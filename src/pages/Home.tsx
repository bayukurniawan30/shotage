import React from 'react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Header / Nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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

          <a
            href="/studio"
            className="px-4 py-2 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-[#ffafcc]/25 transition-all flex items-center gap-2 hover:brightness-110 active:scale-95 cursor-pointer"
            style={{
              backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
            }}
          >
            Launch Studio
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

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="relative pt-20 pb-16 px-6 text-center max-w-5xl mx-auto overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#ffafcc]/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs mb-8">
            <span className="w-2 h-2 rounded-full bg-[#ffafcc] animate-pulse"></span>
            100% Client-Side & High Resolution Export
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Transform Plain Screenshots into <br className="hidden md:block" />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
              }}
            >
              Stunning 3D Mockups
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create high-converting social graphics, browser mockups, and realistic 3D device
            representations directly in your browser. Zero backend latency, maximum privacy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/studio"
              className="w-full sm:w-auto px-8 py-3.5 text-slate-950 font-extrabold text-sm rounded-xl shadow-xl shadow-[#ffafcc]/30 transition-all flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 cursor-pointer"
              style={{
                backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
              }}
            >
              Open Studio Editor
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>

          {/* Interactive Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-pastel-purple/20 text-pastel-purple flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-100 text-base mb-2">
                Device & Browser Frames
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Choose between Safari, Chrome dark mode, MacBook Pro, iPhone, and Tablet mockups to
                frame your work seamlessly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-pastel-pink/20 text-pastel-pink flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-100 text-base mb-2">
                3D Pitch & Perspective
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Adjust vertical pitch, horizontal yaw, and viewing perspective to add dynamic 3D
                depth to static graphics.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-pastel-blue/20 text-pastel-blue flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-100 text-base mb-2">Retina HiDPI Export</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Export to PNG or JPEG at 1x, 2x, or 3x pixel density scaling with single-click
                clipboard copying.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Shotage — High-Resolution Screenshot Studio. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
