import React, { useState, useEffect } from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import { useStudioStore } from '../store/useStudioStore';
import { GRADIENT_PRESETS, GradientPreset } from '../utils/gradientPresets';
import { LINEAR_SWATCH_PRESETS, LinearSwatchPreset } from '../utils/linearSwatchPresets';
import { MESH_PRESETS, MeshPreset } from '../utils/meshPresets';
import { WAVE_PRESETS, WavePreset } from '../utils/wavePresets';
import { SHADESHIFTER_PRESETS, ShadeshifterPreset } from '../utils/shadeshifterPresets';
import { SPECTRAL_PRESETS, SpectralPreset } from '../utils/spectralPresets';
import { RADIANT_PRESETS, RadiantPreset } from '../utils/radiantPresets';
import { MeshBackground } from './MeshBackground';
import { WaveBackground } from './WaveBackground';
import { ShadeshifterBackground } from './ShadeshifterBackground';
import { SpectralBackground } from './SpectralBackground';
import { RadiantBackground } from './RadiantBackground';

// Solid colors palette
const SOLID_PALETTE = [
  '#0f172a',
  '#18181b',
  '#1e1b4b',
  '#ffafcc',
  '#a2d2ff',
  '#cdb4db',
  '#bde0fe',
  '#38bdf8',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
];

type BgCategoryType =
  | 'gradient'
  | 'linearSwatches'
  | 'mesh'
  | 'wave'
  | 'shadeshifter'
  | 'spectral'
  | 'radiant'
  | 'solid';

interface BgCategoryDef {
  id: BgCategoryType;
  name: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const BG_CATEGORIES: BgCategoryDef[] = [
  {
    id: 'gradient',
    name: 'Gradient Presets',
    shortLabel: 'Gradient',
    icon: <PhosphorIcons.Gradient weight="duotone" className="w-5 h-5 text-pastel-pink" />,
  },
  {
    id: 'linearSwatches',
    name: 'Linear Swatches',
    shortLabel: 'Linear Swatch',
    icon: <PhosphorIcons.Palette weight="duotone" className="w-5 h-5 text-amber-300" />,
  },
  {
    id: 'mesh',
    name: 'Mesh Gradients',
    shortLabel: 'Mesh',
    icon: <PhosphorIcons.CirclesFour weight="duotone" className="w-5 h-5 text-violet-400" />,
  },
  {
    id: 'wave',
    name: 'Wave Flows',
    shortLabel: 'Wave',
    icon: <PhosphorIcons.Waves weight="duotone" className="w-5 h-5 text-cyan-300" />,
  },
  {
    id: 'shadeshifter',
    name: 'Shadeshifter',
    shortLabel: 'Shadeshifter',
    icon: <PhosphorIcons.Sparkle weight="duotone" className="w-5 h-5 text-pastel-blue" />,
  },
  {
    id: 'spectral',
    name: 'Spectral Prisms',
    shortLabel: 'Spectral',
    icon: <PhosphorIcons.Rainbow weight="duotone" className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'radiant',
    name: 'Radiant Glow',
    shortLabel: 'Radiant',
    icon: <PhosphorIcons.SunHorizon weight="duotone" className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'solid',
    name: 'Solid & Pastels',
    shortLabel: 'Solid',
    icon: <PhosphorIcons.PaintBrush weight="duotone" className="w-5 h-5 text-rose-300" />,
  },
];

// Curated Mockup Variations / Poses
interface MockupVariation {
  id: string;
  name: string;
  desc: string;
  rotateX: number;
  rotateY: number;
  slot1Rotate: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  perspective: number;
}

const MOCKUP_VARIATIONS: MockupVariation[] = [
  {
    id: 'standard-center',
    name: 'Standard Centered',
    desc: 'Balanced front-facing clean mockup',
    rotateX: 0,
    rotateY: 0,
    slot1Rotate: 0,
    zoom: 90,
    offsetX: 0,
    offsetY: 0,
    perspective: 1000,
  },
  {
    id: 'top-peek',
    name: 'Top Focus Peek',
    desc: 'Prominent upper half screen detail',
    rotateX: 0,
    rotateY: 0,
    slot1Rotate: 0,
    zoom: 145,
    offsetX: 0,
    offsetY: 130,
    perspective: 1000,
  },
  {
    id: 'tilt-15',
    name: '15° Dynamic Tilt',
    desc: 'Modern stylish angled showcase',
    rotateX: 8,
    rotateY: -10,
    slot1Rotate: -15,
    zoom: 90,
    offsetX: 0,
    offsetY: 0,
    perspective: 1000,
  },
  {
    id: 'isometric-3d',
    name: 'Isometric 3D Float',
    desc: 'Dimensional floating perspective tilt',
    rotateX: 20,
    rotateY: -22,
    slot1Rotate: -6,
    zoom: 88,
    offsetX: 0,
    offsetY: 0,
    perspective: 700,
  },
  {
    id: 'bottom-peek',
    name: 'Bottom Hero Peek',
    desc: 'Lower hero section showcase',
    rotateX: -6,
    rotateY: 0,
    slot1Rotate: 0,
    zoom: 140,
    offsetX: 0,
    offsetY: -130,
    perspective: 1000,
  },
  {
    id: 'right-pivot',
    name: 'Dramatic Right Pivot',
    desc: 'Sharp perspective side angle',
    rotateX: 12,
    rotateY: 20,
    slot1Rotate: 12,
    zoom: 90,
    offsetX: 15,
    offsetY: 0,
    perspective: 850,
  },
  {
    id: 'left-float',
    name: 'Subtle Left Float',
    desc: 'Gentle counter-clockwise float',
    rotateX: 6,
    rotateY: -14,
    slot1Rotate: -8,
    zoom: 90,
    offsetX: -12,
    offsetY: 0,
    perspective: 900,
  },
  {
    id: 'macro-zoom',
    name: 'App Detail Zoom',
    desc: 'Close-up app feature presentation',
    rotateX: 0,
    rotateY: 0,
    slot1Rotate: 0,
    zoom: 170,
    offsetX: 0,
    offsetY: 0,
    perspective: 1000,
  },
];

// Helper to get 4 random or curated items from an array
function pickRandom4<T>(items: T[]): T[] {
  if (items.length <= 4) return items;
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

export const QuickModeSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  // Track active background category index for cycling
  const [categoryIndex, setCategoryIndex] = useState<number>(0);
  const activeCategory = BG_CATEGORIES[categoryIndex];

  // Swatches for each category
  const [randomSwatches, setRandomSwatches] = useState<any[]>([]);

  // Function to refresh 4 swatches for the given category
  const refreshCategorySwatches = (catId: BgCategoryType) => {
    switch (catId) {
      case 'gradient':
        setRandomSwatches(pickRandom4(GRADIENT_PRESETS));
        break;
      case 'linearSwatches':
        setRandomSwatches(pickRandom4(LINEAR_SWATCH_PRESETS));
        break;
      case 'mesh':
        setRandomSwatches(pickRandom4(MESH_PRESETS));
        break;
      case 'wave':
        setRandomSwatches(pickRandom4(WAVE_PRESETS));
        break;
      case 'shadeshifter':
        setRandomSwatches(pickRandom4(SHADESHIFTER_PRESETS));
        break;
      case 'spectral':
        setRandomSwatches(pickRandom4(SPECTRAL_PRESETS));
        break;
      case 'radiant':
        setRandomSwatches(pickRandom4(RADIANT_PRESETS));
        break;
      case 'solid':
        setRandomSwatches(pickRandom4(SOLID_PALETTE));
        break;
      default:
        setRandomSwatches(pickRandom4(GRADIENT_PRESETS));
    }
  };

  // Sync category when user mounts or changes category
  useEffect(() => {
    refreshCategorySwatches(activeCategory.id);
  }, [categoryIndex]);

  // Cycle category button click handler
  const handleCycleCategory = () => {
    setCategoryIndex((prev) => (prev + 1) % BG_CATEGORIES.length);
  };

  // Apply chosen swatch
  const handleApplySwatch = (item: any) => {
    switch (activeCategory.id) {
      case 'gradient': {
        const g = item as GradientPreset;
        onChange({
          backgroundType: 'gradient',
          gradient: {
            color1: g.c1,
            color2: g.c2,
            angle: state.gradient?.angle ?? 135,
          },
        });
        break;
      }
      case 'linearSwatches': {
        const ls = item as LinearSwatchPreset;
        onChange({
          backgroundType: 'linearSwatches',
          linearSwatchesPreset: ls.id,
        });
        break;
      }
      case 'mesh': {
        const m = item as MeshPreset;
        onChange({
          backgroundType: 'mesh',
          meshPreset: m.id,
        });
        break;
      }
      case 'wave': {
        const w = item as WavePreset;
        onChange({
          backgroundType: 'wave',
          wavePreset: w.id,
        });
        break;
      }
      case 'shadeshifter': {
        const s = item as ShadeshifterPreset;
        onChange({
          backgroundType: 'shadeshifter',
          shadeshifterPreset: s.id,
        });
        break;
      }
      case 'spectral': {
        const sp = item as SpectralPreset;
        onChange({
          backgroundType: 'spectral',
          spectralPreset: sp.id,
        });
        break;
      }
      case 'radiant': {
        const r = item as RadiantPreset;
        onChange({
          backgroundType: 'radiant',
          radiantPreset: r.id,
        });
        break;
      }
      case 'solid': {
        const color = item as string;
        onChange({
          backgroundType: 'solid',
          backgroundColor: color,
        });
        break;
      }
    }
  };

  // Check if a swatch is active
  const isSwatchActive = (item: any) => {
    switch (activeCategory.id) {
      case 'gradient': {
        const g = item as GradientPreset;
        return (
          state.backgroundType === 'gradient' &&
          state.gradient?.color1 === g.c1 &&
          state.gradient?.color2 === g.c2
        );
      }
      case 'linearSwatches': {
        const ls = item as LinearSwatchPreset;
        return (
          state.backgroundType === 'linearSwatches' &&
          state.linearSwatchesPreset === ls.id
        );
      }
      case 'mesh': {
        const m = item as MeshPreset;
        return state.backgroundType === 'mesh' && (state.meshPreset || 'mesh-1') === m.id;
      }
      case 'wave': {
        const w = item as WavePreset;
        return state.backgroundType === 'wave' && (state.wavePreset || 'wave-1') === w.id;
      }
      case 'shadeshifter': {
        const s = item as ShadeshifterPreset;
        return (
          state.backgroundType === 'shadeshifter' &&
          (state.shadeshifterPreset || 'shadeshifter-1') === s.id
        );
      }
      case 'spectral': {
        const sp = item as SpectralPreset;
        return (
          state.backgroundType === 'spectral' &&
          (state.spectralPreset || 'spectral-1') === sp.id
        );
      }
      case 'radiant': {
        const r = item as RadiantPreset;
        return (
          state.backgroundType === 'radiant' &&
          (state.radiantPreset || 'radiant-1') === r.id
        );
      }
      case 'solid': {
        const color = item as string;
        return state.backgroundType === 'solid' && state.backgroundColor === color;
      }
      default:
        return false;
    }
  };

  // Render miniature swatch button content
  const renderSwatchPreview = (item: any) => {
    switch (activeCategory.id) {
      case 'gradient': {
        const g = item as GradientPreset;
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundImage: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
            }}
          />
        );
      }
      case 'linearSwatches': {
        const ls = item as LinearSwatchPreset;
        return (
          <div
            className="w-full h-full rounded-full"
            style={{ background: ls.css }}
          />
        );
      }
      case 'mesh': {
        const m = item as MeshPreset;
        return (
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <MeshBackground presetId={m.id} />
          </div>
        );
      }
      case 'wave': {
        const w = item as WavePreset;
        return (
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <WaveBackground presetId={w.id} />
          </div>
        );
      }
      case 'shadeshifter': {
        const s = item as ShadeshifterPreset;
        return (
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <ShadeshifterBackground presetId={s.id} blur={20} grainOpacity={0} />
          </div>
        );
      }
      case 'spectral': {
        const sp = item as SpectralPreset;
        return (
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <SpectralBackground presetId={sp.id} blur={15} />
          </div>
        );
      }
      case 'radiant': {
        const r = item as RadiantPreset;
        return (
          <div className="w-full h-full rounded-full overflow-hidden relative">
            <RadiantBackground presetId={r.id} />
          </div>
        );
      }
      case 'solid': {
        const color = item as string;
        return (
          <div
            className="w-full h-full rounded-full border border-white/10"
            style={{ backgroundColor: color }}
          />
        );
      }
    }
  };

  // Render background style for variation cards matching the current canvas background
  const renderCardBackground = () => {
    if (state.backgroundType === 'gradient') {
      return (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(${state.gradient?.angle ?? 135}deg, ${
              state.gradient?.color1 ?? '#ffafcc'
            }, ${state.gradient?.color2 ?? '#a2d2ff'})`,
          }}
        />
      );
    }
    if (state.backgroundType === 'linearSwatches') {
      const preset =
        LINEAR_SWATCH_PRESETS.find((p) => p.id === state.linearSwatchesPreset) ||
        LINEAR_SWATCH_PRESETS[0];
      return <div className="absolute inset-0" style={{ background: preset.css }} />;
    }
    if (state.backgroundType === 'mesh') {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <MeshBackground presetId={state.meshPreset || 'mesh-1'} />
        </div>
      );
    }
    if (state.backgroundType === 'wave') {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <WaveBackground presetId={state.wavePreset || 'wave-1'} />
        </div>
      );
    }
    if (state.backgroundType === 'shadeshifter') {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <ShadeshifterBackground
            presetId={state.shadeshifterPreset || 'shadeshifter-1'}
            blur={25}
            grainOpacity={0}
          />
        </div>
      );
    }
    if (state.backgroundType === 'spectral') {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <SpectralBackground presetId={state.spectralPreset || 'spectral-1'} blur={20} />
        </div>
      );
    }
    if (state.backgroundType === 'radiant') {
      return (
        <div className="absolute inset-0 overflow-hidden">
          <RadiantBackground presetId={state.radiantPreset || 'radiant-1'} />
        </div>
      );
    }
    if (state.backgroundType === 'solid') {
      return (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: state.backgroundColor || '#0f172a' }}
        />
      );
    }
    return <div className="absolute inset-0 bg-neutral-900" />;
  };

  // Check if a variation is currently applied to canvas
  const isVariationActive = (v: MockupVariation) => {
    return (
      state.rotateX === v.rotateX &&
      state.rotateY === v.rotateY &&
      (state.slot1Rotate ?? 0) === v.slot1Rotate &&
      state.zoom === v.zoom &&
      state.offsetX === v.offsetX &&
      state.offsetY === v.offsetY
    );
  };

  // Apply mockup variation to canvas
  const handleApplyVariation = (v: MockupVariation) => {
    onChange({
      rotateX: v.rotateX,
      rotateY: v.rotateY,
      slot1Rotate: v.slot1Rotate,
      zoom: v.zoom,
      offsetX: v.offsetX,
      offsetY: v.offsetY,
      perspective: v.perspective,
    });
  };

  return (
    <div className="space-y-4">
      {/* Background Selector Row */}
      <div className="border border-neutral-800 rounded-2xl bg-neutral-950/70 p-3.5 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PhosphorIcons.Palette weight="duotone" className="w-4 h-4 text-pastel-pink" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Background Style
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-slate-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
              {activeCategory.shortLabel}
            </span>
            <button
              type="button"
              onClick={() => refreshCategorySwatches(activeCategory.id)}
              title="Shuffle swatches"
              className="p-1 text-slate-400 hover:text-pastel-pink hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            >
              <PhosphorIcons.ArrowsClockwise className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Circle Buttons Row: 1 Category Cycler + 4 Swatches */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {/* Button 1: Category Cycler */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={handleCycleCategory}
              title={`Click to cycle style: ${activeCategory.name}`}
              className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-pastel-pink/70 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group relative"
            >
              {activeCategory.icon}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-pastel-pink text-neutral-950 flex items-center justify-center text-[9px] font-bold shadow-xs">
                <PhosphorIcons.ArrowsLeftRight className="w-2.5 h-2.5" />
              </div>
            </button>
            <span className="text-[9px] font-semibold text-pastel-pink/90 truncate max-w-[48px] text-center">
              Cycle
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-neutral-800" />

          {/* Buttons 2–5: 4 Random Swatches */}
          {randomSwatches.map((item, idx) => {
            const active = isSwatchActive(item);
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplySwatch(item)}
                  className={`w-10 h-10 rounded-full p-0.5 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 relative ${
                    active
                      ? 'ring-2 ring-pastel-pink ring-offset-2 ring-offset-neutral-950 scale-105'
                      : 'border border-neutral-700/80 hover:border-slate-400'
                  }`}
                >
                  {renderSwatchPreview(item)}
                  {active && (
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/25">
                      <PhosphorIcons.Check className="w-3.5 h-3.5 text-white font-bold drop-shadow-md" />
                    </div>
                  )}
                </button>
                <span className="text-[9px] font-mono text-slate-400">#{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mockup Variations Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <PhosphorIcons.DeviceMobile weight="duotone" className="w-4 h-4 text-pastel-blue" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Mockup Variations
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {MOCKUP_VARIATIONS.length} Poses
          </span>
        </div>

        {/* Scrollable List of Variation Cards */}
        <div className="space-y-2.5">
          {MOCKUP_VARIATIONS.map((v) => {
            const active = isVariationActive(v);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleApplyVariation(v)}
                className={`w-full text-left rounded-2xl border p-2.5 transition-all cursor-pointer group relative overflow-hidden ${
                  active
                    ? 'bg-neutral-900 border-pastel-pink shadow-lg shadow-pastel-pink/10 ring-1 ring-pastel-pink/50'
                    : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                }`}
              >
                {/* Visual Preview Frame */}
                <div className="w-full h-28 rounded-xl overflow-hidden relative flex items-center justify-center border border-white/5 shadow-inner">
                  {/* Canvas Background Preview */}
                  {renderCardBackground()}

                  {/* Miniature Mockup Silhouette */}
                  <div
                    className="relative transition-transform duration-300 pointer-events-none"
                    style={{
                      transform: `perspective(350px) rotateX(${v.rotateX}deg) rotateY(${
                        v.rotateY
                      }deg) scale(${v.zoom / 100}) translate(${v.offsetX * 0.35}px, ${
                        v.offsetY * 0.35
                      }px) rotate(${v.slot1Rotate}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Device Miniature Frame Box */}
                    <div className="w-20 h-36 rounded-xl border-2 border-slate-700/80 bg-slate-900/90 shadow-2xl overflow-hidden flex flex-col items-center justify-center relative">
                      {/* Dynamic Island / Camera Notch */}
                      <div className="w-6 h-1.5 rounded-full bg-neutral-950 absolute top-1.5 shadow-xs" />

                      {/* Screen Content */}
                      {state.imageSrc ? (
                        <img
                          src={state.imageSrc}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full p-2 flex flex-col justify-between bg-gradient-to-b from-slate-800/80 to-slate-900/90">
                          <div className="space-y-1 mt-3">
                            <div className="w-8 h-1 bg-white/30 rounded-full" />
                            <div className="w-12 h-1 bg-white/20 rounded-full" />
                          </div>
                          <div className="w-full h-10 rounded-lg bg-pastel-pink/20 border border-pastel-pink/30 flex items-center justify-center">
                            <PhosphorIcons.Sparkle className="w-4 h-4 text-pastel-pink" />
                          </div>
                          <div className="w-6 h-0.5 bg-white/40 rounded-full self-center mb-1" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Selection Badge */}
                  {active && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-pastel-pink text-slate-950 font-bold text-[9px] flex items-center gap-1 shadow-md animate-in fade-in">
                      <PhosphorIcons.Check className="w-2.5 h-2.5 font-bold" />
                      Applied
                    </div>
                  )}
                </div>

                {/* Card Title & Desc Footer */}
                <div className="mt-2 px-1 flex items-center justify-between">
                  <div>
                    <h4
                      className={`text-xs font-bold transition-colors ${
                        active
                          ? 'text-pastel-pink'
                          : 'text-slate-200 group-hover:text-pastel-blue'
                      }`}
                    >
                      {v.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-normal">{v.desc}</p>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity">
                    {v.rotateX !== 0 || v.rotateY !== 0 ? '3D Tilt' : `${v.zoom}% Zoom`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
