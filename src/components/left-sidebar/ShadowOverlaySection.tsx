import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { useMiniCanvasBgStyle } from './utils';

export const ShadowOverlaySection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const miniCanvasBgStyle = useMiniCanvasBgStyle();

  const overlays = [
    { id: 'none', label: 'None' },
    { id: 'shadow-overlay-1', label: 'Overlay 1' },
    { id: 'shadow-overlay-2', label: 'Overlay 2' },
    { id: 'shadow-overlay-3', label: 'Overlay 3' },
    { id: 'shadow-overlay-4', label: 'Overlay 4' },
    { id: 'shadow-overlay-5', label: 'Overlay 5' },
    { id: 'shadow-overlay-6', label: 'Overlay 6' },
  ] as const;

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Shadow Overlay
        </h3>
      </div>
      <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto p-1 no-scrollbar scroll-smooth">
        {overlays.map((item) => {
          const isSelected = (state.shadowOverlay || 'none') === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange({ shadowOverlay: item.id as any })}
              className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
            >
              <div
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-0 transition-all overflow-hidden relative ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 hover:scale-102'
                }`}
                style={miniCanvasBgStyle}
              >
                {item.id !== 'none' && (
                  <img
                    src={`/overlay/${item.id}.png`}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                )}
              </div>
              <span
                className={`text-[10px] md:text-[11px] text-center capitalize transition-colors truncate w-full ${
                  isSelected
                    ? 'text-[#a2d2ff] font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {state.shadowOverlay && state.shadowOverlay !== 'none' && (
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Opacity</span>
              <span className="font-mono text-slate-400">
                {state.shadowOverlayOpacity ?? 85}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={state.shadowOverlayOpacity ?? 85}
              onChange={(e) => onChange({ shadowOverlayOpacity: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Layering Depth */}
          <div>
            <span className="block text-xs font-medium text-slate-300 mb-1.5">
              Layering Depth
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ shadowOverlayPosition: 'behind' })}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  (state.shadowOverlayPosition || 'above') === 'behind'
                    ? 'bg-pastel-pink/20 text-[#ffafcc] border-[#ffafcc] shadow-sm'
                    : 'bg-neutral-900 text-slate-400 border-neutral-800 hover:border-neutral-700 hover:text-slate-200'
                }`}
              >
                Behind Mockup
              </button>
              <button
                type="button"
                onClick={() => onChange({ shadowOverlayPosition: 'above' })}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  (state.shadowOverlayPosition || 'above') === 'above'
                    ? 'bg-pastel-pink/20 text-[#ffafcc] border-[#ffafcc] shadow-sm'
                    : 'bg-neutral-900 text-slate-400 border-neutral-800 hover:border-neutral-700 hover:text-slate-200'
                }`}
              >
                Above Mockup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
