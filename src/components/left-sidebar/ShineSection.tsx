import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { ShinePreset } from '../../types/studio';
import { MiniCanvasBackground } from './MiniCanvasBackground';
import { StepperSlider } from '../StepperSlider';

export const ShineSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const activePreset: ShinePreset = state.shinePreset || (state.enableShine ? 'diagonal-glass' : 'none');
  const opacity = state.shineOpacity ?? 35;

  const presets: { id: ShinePreset; label: string; previewGradient?: string }[] = [
    {
      id: 'none',
      label: 'None',
    },
    {
      id: 'diagonal-glass',
      label: 'Diagonal Glass',
      previewGradient:
        'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.25) 30%, transparent 60%)',
    },
    {
      id: 'apple-glare',
      label: 'Apple Glare',
      previewGradient:
        'linear-gradient(125deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 45%, transparent 46%, transparent 100%)',
    },
    {
      id: 'curved-sheen',
      label: 'Curved Sheen',
      previewGradient:
        'radial-gradient(ellipse 130% 80% at 20% -10%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 38%, transparent 75%)',
    },
    {
      id: 'top-light',
      label: 'Top Ambient',
      previewGradient:
        'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.2) 30%, transparent 70%)',
    },
    {
      id: 'dual-beam',
      label: 'Dual Ray',
      previewGradient:
        'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.15) 28%, transparent 45%), linear-gradient(315deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 22%, transparent 40%)',
    },
  ];

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Glass Reflection
        </h3>
      </div>

      {/* Preset Cards Grid */}
      <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto p-1 no-scrollbar scroll-smooth">
        {presets.map((preset) => {
          const isSelected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChange({
                  shinePreset: preset.id,
                  enableShine: preset.id !== 'none',
                })
              }
              className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
            >
              <div
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-0 transition-all overflow-hidden relative flex items-center justify-center ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 hover:scale-102'
                }`}
              >
                <MiniCanvasBackground />
                {/* Mockup Screen Preview */}
                <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700/80 overflow-hidden relative shadow-sm">
                  {preset.previewGradient && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: preset.previewGradient,
                        mixBlendMode: 'screen',
                      }}
                    />
                  )}
                </div>
              </div>
              <span
                className={`text-[10px] md:text-[11px] text-center capitalize transition-colors truncate w-full ${
                  isSelected
                    ? 'text-[#a2d2ff] font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Opacity / Intensity Slider (Shown when a preset is selected) */}
      {activePreset !== 'none' && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs items-center">
            <span className="font-medium text-slate-300">Shine Opacity</span>
            <span className="font-mono text-[11px] py-0.5">{opacity}%</span>
          </div>
          <StepperSlider
            min={5}
            max={100}
            step={1}
            value={opacity}
            onChange={(v) => onChange({ shineOpacity: v })}
            accentColor="#a2d2ff"
          />
        </div>
      )}
    </div>
  );
};
