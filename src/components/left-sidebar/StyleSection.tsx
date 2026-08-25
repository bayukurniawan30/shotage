import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { useMiniCanvasBgStyle } from './utils';

export const StyleSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const miniCanvasBgStyle = useMiniCanvasBgStyle();

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Style</h3>
      </div>
      <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto p-1 no-scrollbar scroll-smooth">
        {[
          { id: 'default', label: 'Default' },
          { id: 'glass-light', label: 'Glass Light' },
          { id: 'glass-dark', label: 'Glass Dark' },
          { id: 'inset-light', label: 'Inset Light' },
          { id: 'inset-dark', label: 'Inset Dark' },
          { id: 'card', label: 'Card' },
        ].map((st) => {
          const isSelected = (state.framelessStyle || 'default') === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onChange({ framelessStyle: st.id as any })}
              className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
            >
              <div
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-0 flex items-end justify-start transition-all overflow-hidden relative ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 hover:scale-102'
                }`}
                style={miniCanvasBgStyle}
              >
                {/* Masked Top-Right Corner Style Illustration Preview Diagrams */}
                {st.id === 'default' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md">
                    <div className="w-full h-full rounded-lg bg-slate-800 border border-slate-700/50" />
                  </div>
                )}

                {st.id === 'glass-light' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-white/40 backdrop-blur-xs border border-white/70 shadow-lg">
                    <div className="w-full h-full rounded-lg bg-slate-900/90 border border-slate-700/60" />
                  </div>
                )}

                {st.id === 'glass-dark' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-black/60 backdrop-blur-xs border border-white/25 shadow-xl">
                    <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-700/60" />
                  </div>
                )}

                {st.id === 'inset-light' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-slate-200/95 border border-slate-300 shadow-inner">
                    <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-800" />
                  </div>
                )}

                {st.id === 'inset-dark' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-slate-900/95 border border-slate-800 shadow-inner">
                    <div className="w-full h-full rounded-lg bg-slate-950 border border-slate-800" />
                  </div>
                )}

                {st.id === 'card' && (
                  <div className="absolute top-5 -left-3 w-14 h-14">
                    {/* Tilted background card */}
                    <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                    {/* Foreground main card */}
                    <div className="relative z-10 w-full h-full rounded-xl bg-slate-900 border border-slate-700 shadow-md" />
                  </div>
                )}
              </div>
              <span
                className={`text-[10px] md:text-[11px] text-center capitalize transition-colors truncate w-full ${
                  isSelected
                    ? 'text-[#a2d2ff] font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {st.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
