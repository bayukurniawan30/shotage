import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';

export const WatermarkSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Watermark</h3>
      </div>

      {/* Watermark Variant Options */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Style Variant
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'none', label: 'None' },
            { id: 'default', label: 'Default' },
            { id: 'dark', label: 'Dark' },
            { id: 'glass', label: 'Glass' },
            { id: 'badge', label: 'Badge' },
            { id: 'dark-badge', label: 'Dark Badge' },
          ].map((wt) => {
            const isSelected = (state.watermarkType || 'none') === wt.id;
            return (
              <button
                key={wt.id}
                onClick={() => onChange({ watermarkType: wt.id as any })}
                className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-all truncate text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                    : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {wt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Position and Size options (Only shown if watermarkType !== 'none') */}
      {state.watermarkType !== 'none' && (
        <div className="space-y-3.5 pt-2 border-t border-neutral-800/80 animate-in fade-in duration-150">
          {/* Watermark Position */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Position
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'top-left', label: 'Top Left', dotPos: 'top-1 left-1' },
                {
                  id: 'top-center',
                  label: 'Top Center',
                  dotPos: 'top-1 left-1/2 -translate-x-1/2',
                },
                { id: 'top-right', label: 'Top Right', dotPos: 'top-1 right-1' },
                { id: 'bottom-left', label: 'Bottom Left', dotPos: 'bottom-1 left-1' },
                {
                  id: 'bottom-center',
                  label: 'Bottom Center',
                  dotPos: 'bottom-1 left-1/2 -translate-x-1/2',
                },
                { id: 'bottom-right', label: 'Bottom Right', dotPos: 'bottom-1 right-1' },
              ].map((pos) => {
                const isSelected = (state.watermarkPosition || 'bottom-right') === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => onChange({ watermarkPosition: pos.id as any })}
                    className={`h-11 rounded-lg border transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs ring-1 ring-pastel-pink'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                    }`}
                    title={pos.label}
                  >
                    {/* Outer Canvas Representation Box */}
                    <div
                      className={`w-8 h-6 rounded border relative transition-colors ${
                        isSelected
                          ? 'border-pastel-pink bg-pastel-pink/10'
                          : 'border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      {/* Inner Watermark Location Box Indicator */}
                      <div
                        className={`absolute w-1.5 h-1 rounded-xs transition-colors ${pos.dotPos} ${
                          isSelected ? 'bg-pastel-pink' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watermark Size */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Size
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'sm', label: 'Small' },
                { id: 'md', label: 'Medium' },
                { id: 'lg', label: 'Large' },
              ].map((sz) => {
                const isSelected = (state.watermarkSize || 'md') === sz.id;
                return (
                  <button
                    key={sz.id}
                    onClick={() => onChange({ watermarkSize: sz.id as any })}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
