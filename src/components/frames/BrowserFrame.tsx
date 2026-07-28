import React from 'react';

interface BrowserFrameProps {
  type: 'safari-light' | 'safari-dark' | 'chrome-dark';
  urlText: string;
  children: React.ReactNode;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({ type, urlText, children }) => {
  const isDark = type === 'safari-dark' || type === 'chrome-dark';
  const isChrome = type === 'chrome-dark';

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-200 ${
        isDark
          ? 'bg-slate-900 text-slate-200 border-slate-700/50'
          : 'bg-slate-100 text-slate-700 border-slate-200'
      } border rounded-xl shadow-2xl`}
    >
      {/* Header bar */}
      <div
        className={`flex items-center gap-3 px-4 py-2.5 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-200/80 border-slate-300'
        } border-b backdrop-blur-md`}
      >
        {/* Window dots */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/90 shadow-inner"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/90 shadow-inner"></div>
        </div>

        {/* Safari URL bar */}
        {!isChrome && (
          <div
            className={`flex-1 flex items-center justify-center gap-2 mx-8 px-3 py-1 rounded-md text-xs ${
              isDark
                ? 'bg-slate-800/80 text-slate-400 border-slate-700/50'
                : 'bg-white/80 text-slate-600 border-slate-300'
            } border shadow-inner font-mono tracking-tight select-none`}
          >
            <svg
              className="w-3.5 h-3.5 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="truncate max-w-[300px]">{urlText || 'https://example.com'}</span>
          </div>
        )}

        {/* Chrome Tabs */}
        {isChrome && (
          <div className="flex-1 flex items-center gap-2 ml-4">
            <div className="px-4 py-1.5 bg-slate-900 rounded-t-lg border-t border-x border-slate-700/60 text-xs font-mono text-slate-300 flex items-center gap-2 max-w-[200px]">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span className="truncate">{urlText || 'App Showcase'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Frame content */}
      <div className="relative overflow-hidden">{children}</div>
    </div>
  );
};
