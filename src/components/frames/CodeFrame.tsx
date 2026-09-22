import React, { useEffect, useMemo, useState } from 'react';
import { MinusIcon, SquareIcon, XIcon } from '@phosphor-icons/react';
import type { CodeLanguage, CodeTheme, CodeWindowStyle } from '../../types/studio';
import { highlightSourceCode } from '../../utils/codeHighlight';

interface CodeFrameProps {
  code: string;
  language: CodeLanguage;
  theme: CodeTheme;
  windowStyle: CodeWindowStyle;
  filename: string;
  width: number;
  height: number;
  fontSize: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
}

export const CodeFrame: React.FC<CodeFrameProps> = ({
  code,
  language,
  theme,
  windowStyle,
  filename,
  width,
  height,
  fontSize,
  showLineNumbers,
  wordWrap,
}) => {
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const [isReady, setIsReady] = useState(false);
  const isDark = theme === 'dark';
  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(1, code.split('\n').length) }, (_, index) => index + 1),
    [code]
  );

  useEffect(() => {
    let cancelled = false;
    setIsReady(false);
    highlightSourceCode(code, language, theme).then((html) => {
      if (cancelled) return;
      setHighlightedHtml(html);
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [code, language, theme]);

  const surfaceBackground = isDark ? '#0d1117' : '#ffffff';
  const chromeBackground = isDark ? '#161b22' : '#f3f4f6';
  const chromeBorder = isDark ? '#30363d' : '#d1d5db';
  const mutedColor = isDark ? '#8b949e' : '#6b7280';

  return (
    <div
      className="shotage-code-frame overflow-hidden border shadow-2xl"
      data-code-highlight-ready={isReady ? 'true' : 'false'}
      data-word-wrap={wordWrap ? 'true' : 'false'}
      style={{
        width: `${Math.max(360, Math.min(1400, width))}px`,
        height: `${Math.max(100, Math.min(1000, height))}px`,
        borderRadius: '12px',
        borderColor: chromeBorder,
        background: surfaceBackground,
      }}
    >
      <div
        className="relative flex h-10 items-center border-b px-3"
        style={{ background: chromeBackground, borderColor: chromeBorder }}
      >
        {windowStyle === 'macos' ? (
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-1" aria-hidden="true">
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ color: mutedColor }}
            >
              <MinusIcon className="h-3.5 w-3.5" weight="bold" />
            </span>
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ color: mutedColor }}
            >
              <SquareIcon className="h-3 w-3" weight="regular" />
            </span>
            <span
              className="flex h-7 w-7 items-center justify-center"
              style={{ color: mutedColor }}
            >
              <XIcon className="h-3 w-3" weight="bold" />
            </span>
          </div>
        )}

        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center px-32 text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
        >
          <span className="truncate">{filename || `untitled.${language}`}</span>
        </div>
      </div>

      <div
        className="flex overflow-hidden"
        style={{ height: 'calc(100% - 40px)', background: surfaceBackground }}
      >
        {showLineNumbers && (
          <div
            className="shrink-0 select-none overflow-hidden border-r py-5 pl-4 pr-3 text-right font-mono"
            style={{
              borderColor: chromeBorder,
              color: mutedColor,
              fontSize: `${fontSize}px`,
              lineHeight: 1.65,
            }}
          >
            {lineNumbers.map((lineNumber) => (
              <div key={lineNumber}>{lineNumber}</div>
            ))}
          </div>
        )}

        <div
          className="shotage-code-surface min-w-0 flex-1 overflow-hidden p-5 font-mono"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.65, background: surfaceBackground }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>
    </div>
  );
};
