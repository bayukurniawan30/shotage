import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { ChevronDown, Check } from '@untitledui/icons';

export const RightSidebar: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const reset3DPerspective = state.reset3DPerspective;
  const [showAllGradients, setShowAllGradients] = useState(false);

  const gradientPresets = [
    { name: 'Indigo Cyan', c1: '#4f46e5', c2: '#06b6d4' },
    { name: 'Sunset Amber', c1: '#f43f5e', c2: '#fbbf24' },
    { name: 'Emerald Teal', c1: '#059669', c2: '#34d399' },
    { name: 'Purple Pink', c1: '#a855f7', c2: '#ec4899' },
    { name: 'Dark Slate', c1: '#1e293b', c2: '#0f172a' },
    { name: 'Ocean Blue', c1: '#2563eb', c2: '#38bdf8' },
    { name: 'Rose Gold', c1: '#f43f5e', c2: '#fda4af' },
    { name: 'Midnight Violet', c1: '#3b0764', c2: '#7c3aed' },
    { name: 'Neon Lime', c1: '#15803d', c2: '#a3e635' },
    { name: 'Warm Flame', c1: '#c2410c', c2: '#f97316' },
    { name: 'Deep Space', c1: '#000000', c2: '#434343' },
    { name: 'Cosmic Purple', c1: '#654ea3', c2: '#eaafc8' },
    { name: 'Cherry Blossom', c1: '#ffb3d9', c2: '#ff66b2' },
    { name: 'Northern Lights', c1: '#00c6ff', c2: '#0072ff' },
    { name: 'Solar Burst', c1: '#ff512f', c2: '#dd2476' },
    { name: 'Lush Forest', c1: '#134e5e', c2: '#71b280' },
    { name: 'Peachy Beach', c1: '#ffedd5', c2: '#f97316' },
    { name: 'Electric Violet', c1: '#4776e6', c2: '#8e54e9' },
    { name: 'Cyberpunk Red', c1: '#ff0055', c2: '#7a00ff' },
    { name: 'Cool Silver', c1: '#eef2f3', c2: '#8e9eab' },
    { name: 'Golden Glow', c1: '#ffe000', c2: '#799f0c' },
    { name: 'Deep Ocean', c1: '#1cb5e0', c2: '#000046' },
    { name: 'Amethyst', c1: '#9d50bb', c2: '#6e48aa' },
    { name: 'Vibrant Magenta', c1: '#ee0979', c2: '#ff6a00' },
    { name: 'Aqua Splash', c1: '#136a8a', c2: '#267871' },
    { name: 'Royal Velvet', c1: '#4e54c8', c2: '#8f94fb' },
    { name: 'Mint Fresh', c1: '#00b09b', c2: '#96c93d' },
    { name: 'Dusk Glow', c1: '#2c3e50', c2: '#fd746c' },
    { name: 'Borealis Teal', c1: '#1a2a6c', c2: '#b21f1f' },
    { name: 'Crimson Tide', c1: '#642b73', c2: '#c6426e' },
    { name: 'Tropical Island', c1: '#00f2fe', c2: '#4facfe' },
    { name: 'Dark Monochrome', c1: '#111827', c2: '#374151' },
  ];

  const visibleGradients = showAllGradients ? gradientPresets : gradientPresets.slice(0, 4);

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      {/* 1. 3D Perspective Tilt Box */}
      <div className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 space-y-4">
        <div className="border-b border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            3D Perspective Tilt
          </h3>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
            <span className="font-mono text-slate-400">{state.rotateX}°</span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            value={state.rotateX}
            onChange={(e) => onChange({ rotateX: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
            <span className="font-mono text-slate-400">{state.rotateY}°</span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            value={state.rotateY}
            onChange={(e) => onChange({ rotateY: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Perspective Depth</span>
            <span className="font-mono text-slate-400">{state.perspective}px</span>
          </div>
          <input
            type="range"
            min="500"
            max="2000"
            step="50"
            value={state.perspective}
            onChange={(e) => onChange({ perspective: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>

        <button
          onClick={reset3DPerspective}
          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700 transition-all"
        >
          Reset 3D Perspective
        </button>
      </div>

      {/* 2. Background Style Box */}
      <div className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 space-y-4">
        <div className="border-b border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Background Style
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(['gradient', 'solid', 'transparent', 'image'] as const).map((bg) => (
            <button
              key={bg}
              onClick={() => onChange({ backgroundType: bg })}
              className={`py-1.5 px-0.5 text-[10px] sm:text-[11px] font-medium capitalize rounded-lg border transition-all truncate text-center ${
                state.backgroundType === bg
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
              }`}
              title={bg === 'transparent' ? 'No BG' : bg}
            >
              {bg === 'transparent' ? 'No BG' : bg}
            </button>
          ))}
        </div>

        {state.backgroundType === 'gradient' && (
          <div className="space-y-3 pt-1 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                Gradient Palettes ({gradientPresets.length})
              </span>
              <button
                onClick={() => setShowAllGradients(!showAllGradients)}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                    showAllGradients ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {visibleGradients.map((preset) => {
                const isSelected =
                  state.gradient.color1.toLowerCase() === preset.c1.toLowerCase() &&
                  state.gradient.color2.toLowerCase() === preset.c2.toLowerCase();

                return (
                  <button
                    key={preset.name}
                    onClick={() =>
                      onChange({
                        gradient: { ...state.gradient, color1: preset.c1, color2: preset.c2 },
                      })
                    }
                    className={`h-8 rounded-lg border shadow-sm transition-all flex items-center justify-center cursor-pointer relative ${
                      isSelected
                        ? 'border-white ring-2 ring-brand-500 scale-105 shadow-md shadow-brand-500/30'
                        : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`,
                    }}
                    title={preset.name}
                  >
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Angle</span>
                <span className="font-mono text-slate-400">{state.gradient.angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={state.gradient.angle}
                onChange={(e) =>
                  onChange({ gradient: { ...state.gradient, angle: Number(e.target.value) } })
                }
                className="w-full accent-brand-500 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        )}

        {state.backgroundType === 'solid' && (
          <div className="pt-1 border-t border-slate-800/60">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Solid Color
            </label>
            <input
              type="color"
              value={state.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="w-full h-9 rounded-lg cursor-pointer bg-slate-950 border border-slate-700 p-1"
            />
          </div>
        )}
      </div>
    </div>
  );
};
