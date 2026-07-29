import React from 'react';

interface BrowserFrameProps {
  type: 'safari-light' | 'safari-dark' | 'chrome-dark';
  urlText: string;
  isCompact?: boolean;
  children: React.ReactNode;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  type,
  urlText,
  isCompact = false,
  children,
}) => {
  const isDark = type === 'safari-dark' || type === 'chrome-dark';
  const isChrome = type === 'chrome-dark';

  return (
    <div
      className={`w-full overflow-hidden transition-all duration-300 ${
        isDark
          ? 'bg-neutral-900 text-neutral-200 border-neutral-800'
          : 'bg-neutral-100 text-neutral-700 border-neutral-200'
      } border shadow-2xl`}
    >
      {/* Sleek compact header bar */}
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 min-h-[18px] ${
          isDark ? 'bg-neutral-950/90 border-neutral-800' : 'bg-neutral-200 border-neutral-300'
        } border-b backdrop-blur-md`}
      >
        {/* Ultra compact macOS window dots */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#27c93f]"></div>
        </div>

        {/* Ultra compact Safari URL bar with high contrast text */}
        {!isChrome && (
          <div
            className={`flex-1 flex items-center justify-center gap-1 mx-2 px-2 py-[1px] text-[9px] rounded ${
              isDark
                ? 'bg-neutral-900 text-slate-100 border-neutral-800'
                : 'bg-white text-slate-900 border-neutral-300'
            } border font-mono font-medium tracking-tight select-none`}
          >
            <svg
              className={`w-2.5 h-2.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
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
            <span
              className={`truncate max-w-[200px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
            >
              {urlText || 'https://example.com'}
            </span>
          </div>
        )}

        {/* Compact Chrome Tab */}
        {isChrome && (
          <div className="flex-1 flex items-center gap-1 ml-1">
            <div className="px-2 py-[1px] text-[9px] max-w-[140px] bg-neutral-900 rounded-t border-t border-x border-neutral-800 font-mono font-semibold text-slate-100 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-pastel-pink shrink-0"></span>
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
