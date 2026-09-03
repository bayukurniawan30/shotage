import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { MiniCanvasBackground } from './MiniCanvasBackground';

export const ShadowSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Shadow Elevation
        </h3>
      </div>
      <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto p-1 no-scrollbar scroll-smooth">
        {(['none', 'soft', 'medium', 'hard', 'floating'] as const).map((sh) => {
          const isSelected = state.shadow === sh;
          const getShadowPreviewClass = () => {
            switch (sh) {
              case 'soft':
                return 'shadow-md shadow-black/60';
              case 'medium':
                return 'shadow-lg shadow-black/80';
              case 'hard':
                return 'shadow-2xl shadow-black/95';
              case 'floating':
                return 'shadow-[0_25px_40px_-5px_rgba(0,0,0,0.95)] -translate-y-1';
              case 'none':
              default:
                return 'shadow-none';
            }
          };

          return (
            <button
              key={sh}
              onClick={() => onChange({ shadow: sh })}
              className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
            >
              <div
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-0 transition-all overflow-hidden relative ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 hover:scale-102'
                }`}
              >
                <MiniCanvasBackground />
                {/* Masked Bottom-Left Corner Screenshot Box with Elevation Shadow */}
                <div
                  className={`absolute -top-3 -right-3 w-14 h-14 rounded-xl bg-slate-900 transition-all ${getShadowPreviewClass()}`}
                >
                  <div className="w-full h-full rounded-lg bg-white" />
                </div>
              </div>
              <span
                className={`text-[10px] md:text-[11px] text-center capitalize transition-colors truncate w-full ${
                  isSelected
                    ? 'text-[#a2d2ff] font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {sh}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
