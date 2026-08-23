import React, { useState, useEffect, useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  ChevronDown,
  Check,
  Brush03,
  Stars02,
  RefreshCw01,
  Plus,
  Trash01,
  Copy01,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type01,
} from '@untitledui/icons';
import { extractDominantColors, generateGradientVariations } from '../utils/colorExtractor';
import { WAVE_PRESETS } from '../utils/wavePresets';
import { MESH_PRESETS } from '../utils/meshPresets';
import { CONFETTI_PRESETS, generateRandomConfettiPreset } from '../utils/confettiPresets';
import { RADIANT_PRESETS } from '../utils/radiantPresets';
import { SHADESHIFTER_PRESETS } from '../utils/shadeshifterPresets';
import { SPECTRAL_PRESETS } from '../utils/spectralPresets';
import { LINEAR_SWATCH_PRESETS } from '../utils/linearSwatchPresets';
import {
  GRADIENT_PRESETS,
  parseColorAndAlpha,
  formatColorWithAlpha,
} from '../utils/gradientPresets';
import { PATTERN_PRESETS } from '../utils/patternPresets';
import { WaveBackground } from './WaveBackground';
import { MeshBackground } from './MeshBackground';
import { ConfettiBackground } from './ConfettiBackground';
import { RadiantBackground } from './RadiantBackground';
import { ShadeshifterBackground } from './ShadeshifterBackground';
import { SpectralBackground } from './SpectralBackground';
import {
  ANIMATED_GRADIENT_PRESETS,
  ANIMATED_MESH_PRESETS,
  AnimatedGradientBackground,
  AnimatedMeshBackground,
} from './AnimatedBackgrounds';
import { SocialIcon, SOCIAL_PLATFORMS, SocialPlatform } from './SocialIcons';
import { TechStackIcon, TECH_STACK_ITEMS, TechStackId } from './TechStackIcons';
import { Toggle } from './Toggle';
import * as PhosphorIcons from '@phosphor-icons/react';
import { PhosphorWeight, ShapeType, BackgroundType } from '../types/studio';
import { QuickModeSection } from './QuickModeSection';

export const GOOGLE_FONTS = [
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif' },
  { name: 'Poppins', family: 'Poppins, sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Lora', family: 'Lora, serif' },
  { name: 'Oswald', family: 'Oswald, sans-serif' },
  { name: 'Outfit', family: 'Outfit, sans-serif' },
  { name: 'Pacifico', family: 'Pacifico, cursive' },
  { name: 'Fira Code', family: "'Fira Code', monospace" },
];

const FontSelect: React.FC<{
  value: string;
  onChange: (fontName: string) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedFont = GOOGLE_FONTS.find((f) => f.name === value) || GOOGLE_FONTS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-2 text-xs text-pastel-blue font-bold flex items-center justify-between cursor-pointer hover:border-neutral-700 transition-colors"
        style={{ fontFamily: selectedFont.family }}
      >
        <span className="truncate">{selectedFont.name}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-pastel-pink' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-2xl max-h-56 overflow-y-auto space-y-0.5 backdrop-blur-md">
          {GOOGLE_FONTS.map((font) => {
            const isSelected = font.name === value;
            return (
              <button
                key={font.name}
                type="button"
                onClick={() => {
                  onChange(font.name);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors text-left ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 text-pastel-blue font-bold'
                    : 'text-slate-200 hover:bg-neutral-800 hover:text-white'
                }`}
                style={{ fontFamily: font.family }}
              >
                <span style={{ fontFamily: font.family }}>{font.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-pastel-blue shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export interface BackgroundStyleOption {
  id: BackgroundType;
  label: string;
  category: 'Animated & Dynamic' | 'Colors & Gradients' | 'Patterns & Shapes' | 'Special & Custom';
  desc?: string;
  iconNode?: React.ReactNode;
}

export const BACKGROUND_STYLE_OPTIONS: BackgroundStyleOption[] = [
  {
    id: 'animatedGradient',
    label: 'Animated Gradient',
    category: 'Animated & Dynamic',
    desc: 'Fluid shifting color waves',
    iconNode: <PhosphorIcons.Sparkle className="w-4 h-4 text-pastel-pink shrink-0" />,
  },
  {
    id: 'animatedMesh',
    label: 'Animated Mesh',
    category: 'Animated & Dynamic',
    desc: 'Flowing organic gradient blobs',
    iconNode: <PhosphorIcons.Planet className="w-4 h-4 text-pastel-blue shrink-0" />,
  },
  {
    id: 'gradient',
    label: 'Curated Gradient',
    category: 'Colors & Gradients',
    desc: 'Smooth 2-3 stop color blends',
    iconNode: <PhosphorIcons.Gradient className="w-4 h-4 text-pastel-green shrink-0" />,
  },
  {
    id: 'shadeshifter',
    label: 'Shadeshifter (Grainient)',
    category: 'Colors & Gradients',
    desc: 'Grainy iridescent multi-mesh gradients',
    iconNode: <PhosphorIcons.Sparkle className="w-4 h-4 text-violet-400 shrink-0" />,
  },
  {
    id: 'spectral',
    label: 'Spectral Prism',
    category: 'Colors & Gradients',
    desc: 'Chromatic prism refractions (Dark & Light)',
    iconNode: <PhosphorIcons.Rainbow className="w-4 h-4 text-emerald-400 shrink-0" />,
  },
  {
    id: 'linearSwatches',
    label: 'Linear Swatches',
    category: 'Colors & Gradients',
    desc: 'Multi-stop designer color bars',
    iconNode: <PhosphorIcons.Palette className="w-4 h-4 text-amber-300 shrink-0" />,
  },
  {
    id: 'solid',
    label: 'Solid Color',
    category: 'Colors & Gradients',
    desc: 'Single flat background color',
    iconNode: <PhosphorIcons.PaintBrush className="w-4 h-4 text-slate-300 shrink-0" />,
  },
  {
    id: 'wave',
    label: 'Wave Pattern',
    category: 'Patterns & Shapes',
    desc: 'Layered vector curves',
    iconNode: <PhosphorIcons.Waves className="w-4 h-4 text-cyan-300 shrink-0" />,
  },
  {
    id: 'mesh',
    label: 'Mesh Gradient',
    category: 'Patterns & Shapes',
    desc: 'Multi-point blend gradients',
    iconNode: <PhosphorIcons.CirclesFour className="w-4 h-4 text-violet-300 shrink-0" />,
  },
  {
    id: 'radiant',
    label: 'Radiant Glow',
    category: 'Patterns & Shapes',
    desc: 'Luminous center radiance',
    iconNode: <PhosphorIcons.SunHorizon className="w-4 h-4 text-amber-400 shrink-0" />,
  },
  {
    id: 'confetti',
    label: 'Confetti Shapes',
    category: 'Patterns & Shapes',
    desc: 'Scattered decorative geometry',
    iconNode: <PhosphorIcons.Confetti className="w-4 h-4 text-rose-300 shrink-0" />,
  },
  {
    id: 'image',
    label: 'Custom Image',
    category: 'Special & Custom',
    desc: 'Upload custom photo or wallpaper',
    iconNode: <PhosphorIcons.Image className="w-4 h-4 text-emerald-300 shrink-0" />,
  },
  {
    id: 'transparent',
    label: 'Transparent (No BG)',
    category: 'Special & Custom',
    desc: 'Export with transparent background',
    iconNode: <PhosphorIcons.Checkerboard className="w-4 h-4 text-slate-400 shrink-0" />,
  },
];

const BackgroundStyleSelect: React.FC<{
  value: BackgroundType;
  onChange: (bg: BackgroundType) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    BACKGROUND_STYLE_OPTIONS.find((opt) => opt.id === value) || BACKGROUND_STYLE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    'Animated & Dynamic',
    'Colors & Gradients',
    'Patterns & Shapes',
    'Special & Custom',
  ] as const;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs flex items-center justify-between cursor-pointer hover:border-neutral-700 transition-all shadow-sm group"
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption.iconNode}
          <div className="flex flex-col text-left truncate">
            <span className="font-bold text-slate-100 group-hover:text-pastel-blue transition-colors truncate">
              {selectedOption.label}
            </span>
            <span className="text-[10px] text-slate-400 truncate">{selectedOption.desc}</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-pastel-pink' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-neutral-900/95 border border-neutral-800 rounded-xl p-1.5 shadow-2xl max-h-72 overflow-y-auto space-y-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 no-scrollbar">
          {categories.map((cat) => {
            const items = BACKGROUND_STYLE_OPTIONS.filter((opt) => opt.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {cat}
                </div>
                {items.map((opt) => {
                  const isSelected = opt.id === value;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange(opt.id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors text-left ${
                        isSelected
                          ? 'bg-[#a2d2ff]/20 text-pastel-blue font-bold border border-[#a2d2ff]/30 shadow-xs'
                          : 'text-slate-200 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {opt.iconNode}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{opt.label}</span>
                          {opt.desc && (
                            <span className="text-[10px] text-slate-400 font-normal truncate">
                              {opt.desc}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-pastel-blue shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MiniFocalPad: React.FC<{
  focalX: number;
  focalY: number;
  onChange: (x: number, y: number) => void;
}> = ({ focalX, focalY, onChange }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointer = (e: React.PointerEvent) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    onChange(x, y);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">Focal Target Pad</span>
        <span className="font-mono text-[11px] text-pastel-pink">
          {focalX}% / {focalY}%
        </span>
      </div>
      <div
        ref={padRef}
        onPointerDown={(e) => {
          setIsDragging(true);
          e.currentTarget.setPointerCapture?.(e.pointerId);
          handlePointer(e);
        }}
        onPointerMove={(e) => {
          if (isDragging) handlePointer(e);
        }}
        onPointerUp={(e) => {
          setIsDragging(false);
          e.currentTarget.releasePointerCapture?.(e.pointerId);
        }}
        className="relative w-full h-28 bg-neutral-950 rounded-xl border border-neutral-800 cursor-crosshair overflow-hidden select-none shadow-inner group hover:border-pastel-pink/50 transition-colors"
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-25">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border-r border-b border-slate-700/40" />
          ))}
        </div>

        {/* Center Crosshairs */}
        <div className="absolute left-1/2 top-0 bottom-0 border-r border-dashed border-slate-700/60 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-700/60 pointer-events-none" />

        {/* Focal point target reticle */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
          style={{ left: `${focalX}%`, top: `${focalY}%` }}
        >
          <div className="w-7 h-7 rounded-full border-2 border-pastel-pink bg-pastel-pink/20 shadow-lg shadow-pastel-pink/50 flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialPlatformSelect: React.FC<{
  value: SocialPlatform;
  onChange: (platform: SocialPlatform) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPlat = SOCIAL_PLATFORMS.find((p) => p.id === value) || SOCIAL_PLATFORMS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium flex items-center justify-between cursor-pointer hover:border-neutral-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <SocialIcon platform={selectedPlat.id} size={16} color="#a2d2ff" />
          <span className="font-semibold">{selectedPlat.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-pastel-pink' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-2xl max-h-56 overflow-y-auto space-y-0.5 backdrop-blur-md">
          {SOCIAL_PLATFORMS.map((plat) => {
            const isSelected = plat.id === value;
            return (
              <button
                key={plat.id}
                type="button"
                onClick={() => {
                  onChange(plat.id);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors text-left ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 text-[#a2d2ff] font-bold'
                    : 'text-slate-200 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SocialIcon
                    platform={plat.id}
                    size={16}
                    color={isSelected ? '#a2d2ff' : '#94a3b8'}
                  />
                  <span>{plat.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#a2d2ff] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ShapePreview: React.FC<{
  type: ShapeType;
  color?: string;
  className?: string;
}> = ({ type, color = '#a2d2ff', className = 'w-7 h-7' }) => {
  const common = {
    viewBox: '0 0 24 24',
    className,
    fill: 'none',
  };
  switch (type) {
    case 'circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill={color} />
        </svg>
      );
    case 'hexagon':
      return (
        <svg {...common}>
          <polygon points="12,2.5 20.5,7.25 20.5,16.75 12,21.5 3.5,16.75 3.5,7.25" fill={color} />
        </svg>
      );
    case 'quote':
      return (
        <svg {...common}>
          <path
            d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"
            fill={color}
          />
        </svg>
      );
    case 'rectangle':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" fill={color} />
        </svg>
      );
    case 'square':
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" fill={color} />
        </svg>
      );
  }
};

interface TiltValues {
  rotateX: number;
  rotateY: number;
  skewX: number;
  skewY: number;
  perspective: number;
  rotation: number;
}

interface TiltHandlers {
  onRotateX: (v: number) => void;
  onRotateY: (v: number) => void;
  onSkewX: (v: number) => void;
  onSkewY: (v: number) => void;
  onPerspective: (v: number) => void;
  onRotation: (v: number) => void;
}

const TiltSliderGroup: React.FC<{
  slotLabel?: string;
  values: TiltValues;
  handlers: TiltHandlers;
  defaultCollapsed?: boolean;
}> = ({ slotLabel, values, handlers, defaultCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  const sliders = (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
          <span className="font-mono text-slate-400">{values.rotateX}°</span>
        </div>
        <input
          type="range"
          min="-30"
          max="30"
          value={values.rotateX}
          onChange={(e) => handlers.onRotateX(Number(e.target.value))}
          className="w-full bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
          <span className="font-mono text-slate-400">{values.rotateY}°</span>
        </div>
        <input
          type="range"
          min="-30"
          max="30"
          value={values.rotateY}
          onChange={(e) => handlers.onRotateY(Number(e.target.value))}
          className="w-full bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Skew X</span>
            <span className="font-mono text-slate-400">{values.skewX}°</span>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            value={values.skewX}
            onChange={(e) => handlers.onSkewX(Number(e.target.value))}
            className="w-full bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Skew Y</span>
            <span className="font-mono text-slate-400">{values.skewY}°</span>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            value={values.skewY}
            onChange={(e) => handlers.onSkewY(Number(e.target.value))}
            className="w-full bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-300">Perspective Depth</span>
          <span className="font-mono text-slate-400">{values.perspective}px</span>
        </div>
        <input
          type="range"
          min="500"
          max="2000"
          step="50"
          value={values.perspective}
          onChange={(e) => handlers.onPerspective(Number(e.target.value))}
          className="w-full bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-300">Rotation</span>
          <span className="font-mono text-slate-400">{values.rotation}°</span>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          value={values.rotation}
          onChange={(e) => handlers.onRotation(Number(e.target.value))}
          className="w-full bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );

  if (!slotLabel) return sliders;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center gap-2 pt-1 cursor-pointer group"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-pastel-pink">
          {slotLabel}
        </span>
        <div className="flex-1 h-px bg-slate-800/70" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-pastel-pink' : ''
          }`}
        />
      </button>
      {isOpen && sliders}
    </div>
  );
};

interface PositionValues {
  offsetX: number;
  offsetY: number;
}

interface PositionHandlers {
  onOffsetX: (v: number) => void;
  onOffsetY: (v: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const PositionSliderGroup: React.FC<{
  slotLabel?: string;
  values: PositionValues;
  handlers: PositionHandlers;
  defaultCollapsed?: boolean;
}> = ({ slotLabel, values, handlers, defaultCollapsed = false }) => {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  const sliders = (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-300">Horizontal Offset</span>
          <span className="font-mono text-slate-400">{values.offsetX}px</span>
        </div>
        <input
          type="range"
          min="-200"
          max="200"
          value={values.offsetX}
          onChange={(e) => handlers.onOffsetX(Number(e.target.value))}
          onPointerDown={handlers.onDragStart}
          onPointerUp={handlers.onDragEnd}
          onPointerCancel={handlers.onDragEnd}
          className="w-full bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-slate-300">Vertical Offset</span>
          <span className="font-mono text-slate-400">{values.offsetY}px</span>
        </div>
        <input
          type="range"
          min="-200"
          max="200"
          value={values.offsetY}
          onChange={(e) => handlers.onOffsetY(Number(e.target.value))}
          onPointerDown={handlers.onDragStart}
          onPointerUp={handlers.onDragEnd}
          onPointerCancel={handlers.onDragEnd}
          className="w-full bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );

  if (!slotLabel) return sliders;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center gap-2 pt-1 cursor-pointer group"
      >
        <span className="text-[11px] font-bold uppercase tracking-wider text-pastel-pink">
          {slotLabel}
        </span>
        <div className="flex-1 h-px bg-slate-800/70" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-pastel-pink' : ''
          }`}
        />
      </button>
      {isOpen && sliders}
    </div>
  );
};

interface RightSidebarProps {
  mobileSection?:
    | 'quick'
    | 'perspective'
    | 'watermark'
    | 'background'
    | 'text'
    | 'social'
    | 'techstack'
    | 'icons'
    | 'elements'
    | 'layers';
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ mobileSection }) => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const reset3DPerspective = state.reset3DPerspective;
  const [showAllGradients, setShowAllGradients] = useState(false);
  const [showAllShapeGradients, setShowAllShapeGradients] = useState(false);
  const [showAllShadeshifter, setShowAllShadeshifter] = useState(false);
  const [showAllSpectral, setShowAllSpectral] = useState(false);
  const [showAllAnimatedGradients, setShowAllAnimatedGradients] = useState(false);
  const [showAllAnimatedMeshes, setShowAllAnimatedMeshes] = useState(false);
  const [showAllWaves, setShowAllWaves] = useState(false);
  const [showAllMeshes, setShowAllMeshes] = useState(false);
  const [showAllConfetti, setShowAllConfetti] = useState(false);
  const [showAllRadiant, setShowAllRadiant] = useState(false);
  const [showAllLinearSwatches, setShowAllLinearSwatches] = useState(false);
  const [showAllPatterns, setShowAllPatterns] = useState(false);
  const [activeTab, setActiveTab] = useState<'scaling' | 'tilt' | 'position'>('scaling');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [phosphorSelectedCategory, setPhosphorSelectedCategory] = useState<string>('all');
  const [phosphorSearchQuery, setPhosphorSearchQuery] = useState<string>('');
  const [autoGradients, setAutoGradients] = useState<{ name: string; c1: string; c2: string }[]>(
    []
  );
  // Layer drag-and-drop state (lifted to component level — hooks must not be called inside render fns)
  const layerDragSrcKey = useRef<string | null>(null);
  const layerDragOverKey = useRef<string | null>(null);
  const [layerDropIndicator, setLayerDropIndicator] = useState<string | null>(null);

  // Automatically extract primary image colors when imageSrc changes
  useEffect(() => {
    if (!state.imageSrc || state.mediaType === 'video') {
      setAutoGradients([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const colors = extractDominantColors(img, 3);
      const variations = generateGradientVariations(colors);
      setAutoGradients(variations);
    };
    img.src = state.imageSrc;
  }, [state.imageSrc, state.mediaType]);

  const renderPerspectiveSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          3D Perspective & Canvas
        </h3>
      </div>

      {/* 3 Tabs Header: Scaling | Tilt | Position */}
      <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
        {(['scaling', 'tilt', 'position'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 text-[11px] font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#a2d2ff]/20 text-[#a2d2ff] border border-[#a2d2ff]/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Scaling & Canvas Padding */}
      {activeTab === 'scaling' && (
        <div className="space-y-3.5 pt-1">
          {/* Zoom Level */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">
                {state.layoutCount === 2 ? 'Zoom (Slot 1)' : 'Zoom Level'}
              </span>
              <span className="font-mono text-slate-400">{state.zoom}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={state.zoom}
              onChange={(e) => onChange({ zoom: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slot 2 Zoom Level */}
          {state.layoutCount === 2 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Zoom (Slot 2)</span>
                <span className="font-mono text-slate-400">{state.slot2Zoom}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={state.slot2Zoom}
                onChange={(e) => onChange({ slot2Zoom: Number(e.target.value) })}
                className="w-full bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Outer Canvas Padding */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Canvas Padding</span>
              {/* <span className="font-mono text-slate-400">{state.padding}px</span> */}
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={state.padding}
              onChange={(e) => onChange({ padding: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 2: 3D Tilt & Rotation */}
      {activeTab === 'tilt' && (
        <div className="space-y-3.5 pt-1">
          {state.layoutCount === 2 ? (
            <>
              <TiltSliderGroup
                slotLabel="Slot 1"
                values={{
                  rotateX: state.rotateX,
                  rotateY: state.rotateY,
                  skewX: state.skewX,
                  skewY: state.skewY,
                  perspective: state.perspective,
                  rotation: state.slot1Rotate || 0,
                }}
                handlers={{
                  onRotateX: (v) => onChange({ rotateX: v }),
                  onRotateY: (v) => onChange({ rotateY: v }),
                  onSkewX: (v) => onChange({ skewX: v }),
                  onSkewY: (v) => onChange({ skewY: v }),
                  onPerspective: (v) => onChange({ perspective: v }),
                  onRotation: (v) => onChange({ slot1Rotate: v }),
                }}
              />
              <TiltSliderGroup
                slotLabel="Slot 2"
                defaultCollapsed
                values={{
                  rotateX: state.slot2RotateX ?? 0,
                  rotateY: state.slot2RotateY ?? 0,
                  skewX: state.slot2SkewX ?? 0,
                  skewY: state.slot2SkewY ?? 0,
                  perspective: state.slot2Perspective ?? 1000,
                  rotation: state.slot2Rotate || 0,
                }}
                handlers={{
                  onRotateX: (v) => onChange({ slot2RotateX: v }),
                  onRotateY: (v) => onChange({ slot2RotateY: v }),
                  onSkewX: (v) => onChange({ slot2SkewX: v }),
                  onSkewY: (v) => onChange({ slot2SkewY: v }),
                  onPerspective: (v) => onChange({ slot2Perspective: v }),
                  onRotation: (v) => onChange({ slot2Rotate: v }),
                }}
              />
            </>
          ) : (
            <TiltSliderGroup
              values={{
                rotateX: state.rotateX,
                rotateY: state.rotateY,
                skewX: state.skewX,
                skewY: state.skewY,
                perspective: state.perspective,
                rotation: state.slot1Rotate || 0,
              }}
              handlers={{
                onRotateX: (v) => onChange({ rotateX: v }),
                onRotateY: (v) => onChange({ rotateY: v }),
                onSkewX: (v) => onChange({ skewX: v }),
                onSkewY: (v) => onChange({ skewY: v }),
                onPerspective: (v) => onChange({ perspective: v }),
                onRotation: (v) => onChange({ slot1Rotate: v }),
              }}
            />
          )}
        </div>
      )}

      {/* Tab 3: Position Offset & Alignment */}
      {activeTab === 'position' && (
        <div className="space-y-3.5 pt-1">
          {state.layoutCount === 2 ? (
            <>
              <PositionSliderGroup
                slotLabel="Slot 1"
                values={{ offsetX: state.offsetX, offsetY: state.offsetY }}
                handlers={{
                  onOffsetX: (v) => onChange({ offsetX: v }),
                  onOffsetY: (v) => onChange({ offsetY: v }),
                  onDragStart: () => onChange({ isPositionDragging: true }),
                  onDragEnd: () => onChange({ isPositionDragging: false }),
                }}
              />
              <PositionSliderGroup
                slotLabel="Slot 2"
                defaultCollapsed
                values={{ offsetX: state.slot2OffsetX, offsetY: state.slot2OffsetY }}
                handlers={{
                  onOffsetX: (v) => onChange({ slot2OffsetX: v }),
                  onOffsetY: (v) => onChange({ slot2OffsetY: v }),
                  onDragStart: () => onChange({ isPositionDragging: true }),
                  onDragEnd: () => onChange({ isPositionDragging: false }),
                }}
              />
            </>
          ) : (
            <PositionSliderGroup
              values={{ offsetX: state.offsetX, offsetY: state.offsetY }}
              handlers={{
                onOffsetX: (v) => onChange({ offsetX: v }),
                onOffsetY: (v) => onChange({ offsetY: v }),
                onDragStart: () => onChange({ isPositionDragging: true }),
                onDragEnd: () => onChange({ isPositionDragging: false }),
              }}
            />
          )}
        </div>
      )}

      <button
        onClick={reset3DPerspective}
        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
      >
        Reset 3D & Position
      </button>
    </div>
  );

  const renderBackgroundSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Background Style
        </h3>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Style Type
        </label>
        <BackgroundStyleSelect
          value={state.backgroundType}
          onChange={(type) => {
            if (type === 'shadeshifter' && (state.bgGrain === undefined || state.bgGrain === 0)) {
              onChange({ backgroundType: type, bgGrain: 35 });
            } else {
              onChange({ backgroundType: type });
            }
          }}
        />
      </div>

      {state.backgroundType === 'animatedGradient' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Animated Gradient Presets ({ANIMATED_GRADIENT_PRESETS.length})
            </span>
            {showAllAnimatedGradients && (
              <button
                type="button"
                onClick={() => setShowAllAnimatedGradients(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2 ${
              showAllAnimatedGradients ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllAnimatedGradients
              ? ANIMATED_GRADIENT_PRESETS.slice(0, 3)
              : ANIMATED_GRADIENT_PRESETS
            ).map((preset) => {
              const isSelected = (state.animatedGradientPreset || 'anim-grad-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ animatedGradientPreset: preset.id })}
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <AnimatedGradientBackground presetId={preset.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllAnimatedGradients && ANIMATED_GRADIENT_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllAnimatedGradients(true)}
                  title={`Show all ${ANIMATED_GRADIENT_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <AnimatedGradientBackground presetId={ANIMATED_GRADIENT_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{ANIMATED_GRADIENT_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'animatedMesh' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Animated Mesh Presets ({ANIMATED_MESH_PRESETS.length})
            </span>
            {showAllAnimatedMeshes && (
              <button
                type="button"
                onClick={() => setShowAllAnimatedMeshes(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllAnimatedMeshes ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllAnimatedMeshes
              ? ANIMATED_MESH_PRESETS.slice(0, 3)
              : ANIMATED_MESH_PRESETS
            ).map((preset) => {
              const isSelected = (state.animatedMeshPreset || 'anim-mesh-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ animatedMeshPreset: preset.id })}
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <AnimatedMeshBackground presetId={preset.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllAnimatedMeshes && ANIMATED_MESH_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllAnimatedMeshes(true)}
                  title={`Show all ${ANIMATED_MESH_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <AnimatedMeshBackground presetId={ANIMATED_MESH_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{ANIMATED_MESH_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'shadeshifter' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Shadeshifter Styles ({SHADESHIFTER_PRESETS.length})
            </span>
            {showAllShadeshifter && (
              <button
                type="button"
                onClick={() => setShowAllShadeshifter(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllShadeshifter ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllShadeshifter ? SHADESHIFTER_PRESETS.slice(0, 3) : SHADESHIFTER_PRESETS).map(
              (preset) => {
                const isSelected = (state.shadeshifterPreset || 'shadeshifter-1') === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => onChange({ shadeshifterPreset: preset.id })}
                    className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                        : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    title={preset.name}
                  >
                    <ShadeshifterBackground
                      presetId={preset.id}
                      grainOpacity={state.bgGrain ?? 35}
                      blur={state.shadeshifterBlur ?? 40}
                    />
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                        <Check className="w-3 h-3 text-pastel-pink" />
                      </div>
                    )}
                  </button>
                );
              }
            )}

            {!showAllShadeshifter && SHADESHIFTER_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllShadeshifter(true)}
                  title={`Show all ${SHADESHIFTER_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <ShadeshifterBackground
                    presetId={SHADESHIFTER_PRESETS[3].id}
                    grainOpacity={state.bgGrain ?? 35}
                    blur={state.shadeshifterBlur ?? 40}
                  />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{SHADESHIFTER_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Mesh Blur Depth Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Mesh Blur Depth</span>
              <span className="font-mono text-slate-400">{state.shadeshifterBlur ?? 40}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={state.shadeshifterBlur ?? 40}
              onChange={(e) => onChange({ shadeshifterBlur: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {state.backgroundType === 'spectral' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Spectral Styles ({SPECTRAL_PRESETS.length})
            </span>
            {showAllSpectral && (
              <button
                type="button"
                onClick={() => setShowAllSpectral(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllSpectral ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllSpectral ? SPECTRAL_PRESETS.slice(0, 3) : SPECTRAL_PRESETS).map((preset) => {
              const isSelected = (state.spectralPreset || 'spectral-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() =>
                    onChange({
                      spectralPreset: preset.id,
                      spectralAngle: preset.angle ?? 135,
                      spectralBlur: preset.blur ?? 45,
                    })
                  }
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={`${preset.name} (${preset.theme === 'dark' ? 'Dark' : 'Light'})`}
                >
                  <SpectralBackground
                    presetId={preset.id}
                    blur={state.spectralBlur}
                    angle={state.spectralAngle}
                  />

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllSpectral && SPECTRAL_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllSpectral(true)}
                  title={`Show all ${SPECTRAL_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <SpectralBackground
                    presetId={SPECTRAL_PRESETS[3].id}
                    blur={state.spectralBlur}
                    angle={state.spectralAngle}
                  />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{SPECTRAL_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Spectrum Angle Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Spectrum Angle</span>
              <span className="font-mono text-slate-400">{state.spectralAngle ?? 135}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={state.spectralAngle ?? 135}
              onChange={(e) => onChange({ spectralAngle: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Prism Blur Depth Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Prism Blur Depth</span>
              <span className="font-mono text-slate-400">{state.spectralBlur ?? 45}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={state.spectralBlur ?? 45}
              onChange={(e) => onChange({ spectralBlur: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {state.backgroundType === 'radiant' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Radiant Styles ({RADIANT_PRESETS.length})
            </span>
            {showAllRadiant && (
              <button
                type="button"
                onClick={() => setShowAllRadiant(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllRadiant ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllRadiant ? RADIANT_PRESETS.slice(0, 3) : RADIANT_PRESETS).map((radiant) => {
              const isSelected = (state.radiantPreset || 'radiant-1') === radiant.id;

              return (
                <button
                  key={radiant.id}
                  onClick={() => onChange({ radiantPreset: radiant.id })}
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={radiant.name}
                >
                  <RadiantBackground presetId={radiant.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllRadiant && RADIANT_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllRadiant(true)}
                  title={`Show all ${RADIANT_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <RadiantBackground presetId={RADIANT_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{RADIANT_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'confetti' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          {/* Randomize Confetti Generator Button */}
          <button
            onClick={() => {
              const randomPreset = generateRandomConfettiPreset();
              onChange({
                confettiPreset: randomPreset.id,
                customConfettiObj: randomPreset,
              });
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-pastel-pink/20 to-[#a2d2ff]/20 hover:from-pastel-pink/30 hover:to-[#a2d2ff]/30 border border-pastel-pink/40 hover:border-pastel-pink rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer group"
          >
            <RefreshCw01 className="w-3.5 h-3.5 text-pastel-pink group-hover:rotate-180 transition-transform duration-500" />
            <span>Randomize Confetti</span>
          </button>

          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Preset Styles ({CONFETTI_PRESETS.length})
            </span>
            {showAllConfetti && (
              <button
                type="button"
                onClick={() => setShowAllConfetti(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllConfetti ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllConfetti ? CONFETTI_PRESETS.slice(0, 3) : CONFETTI_PRESETS).map(
              (confetti) => {
                const isSelected =
                  !state.customConfettiObj &&
                  (state.confettiPreset || 'confetti-1') === confetti.id;

                return (
                  <button
                    key={confetti.id}
                    onClick={() =>
                      onChange({
                        confettiPreset: confetti.id,
                        customConfettiObj: null,
                      })
                    }
                    className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                        : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    title={confetti.name}
                  >
                    <ConfettiBackground presetId={confetti.id} />
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                        <Check className="w-3 h-3 text-pastel-pink" />
                      </div>
                    )}
                  </button>
                );
              }
            )}

            {!showAllConfetti && CONFETTI_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllConfetti(true)}
                  title={`Show all ${CONFETTI_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <ConfettiBackground presetId={CONFETTI_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{CONFETTI_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'mesh' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Mesh Styles ({MESH_PRESETS.length})
            </span>
            {showAllMeshes && (
              <button
                type="button"
                onClick={() => setShowAllMeshes(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllMeshes ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllMeshes ? MESH_PRESETS.slice(0, 3) : MESH_PRESETS).map((mesh) => {
              const isSelected = (state.meshPreset || 'mesh-1') === mesh.id;

              return (
                <button
                  key={mesh.id}
                  onClick={() => onChange({ meshPreset: mesh.id })}
                  className={`h-9 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={mesh.name}
                >
                  <MeshBackground presetId={mesh.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllMeshes && MESH_PRESETS.length > 3 && (
              <div className="relative h-9">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllMeshes(true)}
                  title={`Show all ${MESH_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <MeshBackground presetId={MESH_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{MESH_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'wave' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Wave Styles ({WAVE_PRESETS.length})
            </span>
            {showAllWaves && (
              <button
                type="button"
                onClick={() => setShowAllWaves(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllWaves ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllWaves ? WAVE_PRESETS.slice(0, 3) : WAVE_PRESETS).map((wave) => {
              const isSelected = (state.wavePreset || 'wave-1') === wave.id;

              return (
                <button
                  key={wave.id}
                  onClick={() => onChange({ wavePreset: wave.id })}
                  className={`h-9 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={wave.name}
                >
                  <WaveBackground presetId={wave.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllWaves && WAVE_PRESETS.length > 3 && (
              <div className="relative h-9">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllWaves(true)}
                  title={`Show all ${WAVE_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <WaveBackground presetId={WAVE_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{WAVE_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'gradient' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          {/* Dynamic Colors Extracted from Uploaded Image */}
          {autoGradients.length > 0 && (
            <div className="space-y-2 pb-2 border-b border-neutral-800/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Stars02 className="w-3.5 h-3.5 text-pastel-pink" />
                <span className="uppercase tracking-wider text-[11px]">Auto Color Match</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {autoGradients.map((preset) => {
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
                          ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                          : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`,
                      }}
                      title={`Extracted: ${preset.name}`}
                    >
                      {isSelected && (
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                          <Check className="w-2.5 h-2.5 text-pastel-pink" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Gradient Palettes ({GRADIENT_PRESETS.length})
            </span>
            {showAllGradients && (
              <button
                type="button"
                onClick={() => setShowAllGradients(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllGradients ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllGradients ? GRADIENT_PRESETS.slice(0, 3) : GRADIENT_PRESETS).map((preset) => {
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
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`,
                  }}
                  title={preset.name}
                >
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllGradients && GRADIENT_PRESETS.length > 3 && (
              <div className="relative h-8">
                {/* Tilted background card matching LeftSidebar card style */}
                <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                {/* Foreground main card */}
                <button
                  type="button"
                  onClick={() => setShowAllGradients(true)}
                  title={`Show all ${GRADIENT_PRESETS.length} gradients`}
                  className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${GRADIENT_PRESETS[3].c1}, ${GRADIENT_PRESETS[3].c2})`,
                  }}
                >
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{GRADIENT_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
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
              className="w-full bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      )}

      {state.backgroundType === 'linearSwatches' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Linear Swatches ({LINEAR_SWATCH_PRESETS.length})
            </span>
            {showAllLinearSwatches && (
              <button
                type="button"
                onClick={() => setShowAllLinearSwatches(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllLinearSwatches ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllLinearSwatches
              ? LINEAR_SWATCH_PRESETS.slice(0, 3)
              : LINEAR_SWATCH_PRESETS
            ).map((preset) => {
              const isSelected = (state.linearSwatchesPreset || 'ls-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ linearSwatchesPreset: preset.id })}
                  className={`h-8 rounded-lg border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  style={{ background: preset.css }}
                  title={preset.name}
                >
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllLinearSwatches && LINEAR_SWATCH_PRESETS.length > 3 && (
              <div className="relative h-8">
                <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllLinearSwatches(true)}
                  title={`Show all ${LINEAR_SWATCH_PRESETS.length} swatches`}
                  className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                  style={{ background: LINEAR_SWATCH_PRESETS[3].css }}
                >
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{LINEAR_SWATCH_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'solid' && (
        <div className="pt-2 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Solid Color
            </label>
            <span className="font-mono text-xs text-slate-300 uppercase">
              {state.backgroundColor}
            </span>
          </div>

          {/* Untitled UI Style Color Picker Input */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner group hover:border-slate-600 transition-colors">
            <label
              className="w-7 h-7 rounded-lg cursor-pointer border border-slate-700 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative"
              style={{ backgroundColor: state.backgroundColor }}
              title="Choose custom color"
            >
              <input
                type="color"
                value={state.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
            <div className="flex-1 flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
              <span className="text-slate-500">#</span>
              <input
                type="text"
                value={state.backgroundColor.replace('#', '')}
                onChange={(e) => {
                  const hex = e.target.value.trim();
                  onChange({ backgroundColor: `#${hex}` });
                }}
                className="w-full bg-transparent text-slate-200 focus:outline-none uppercase font-mono"
                maxLength={6}
              />
            </div>
          </div>

          {/* Untitled UI Preset Color Swatches */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Swatches
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {[
                '#cdb4db',
                '#ffc8dd',
                '#ffafcc',
                '#bde0fe',
                '#a2d2ff',
                '#0f172a',
                '#1e293b',
                '#334155',
                '#0284c7',
                '#7c3aed',
                '#db2777',
                '#059669',
              ].map((color) => {
                const isSelected = state.backgroundColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    onClick={() => onChange({ backgroundColor: color })}
                    className={`h-6 rounded-md border shadow-xs transition-all cursor-pointer flex items-center justify-center relative ${
                      isSelected
                        ? 'border-white ring-2 ring-pastel-pink scale-110'
                        : 'border-slate-700/70 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {state.backgroundType === 'image' && (
        <div className="pt-2 border-t border-slate-800/60 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Background Image (Upload or URL)
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-center p-2.5 border-2 border-dashed border-neutral-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-neutral-950/80 hover:bg-neutral-800/80 transition-all text-center">
                <span className="text-xs font-medium text-slate-300">
                  {state.bgImageUrl ? 'Change Background File' : 'Upload Background Image File'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          onChange({ bgImageUrl: ev.target.result as string });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={state.bgImageUrl || ''}
                  onChange={(e) => onChange({ bgImageUrl: e.target.value })}
                  placeholder="Or paste image URL (https://...)"
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pastel-pink transition-colors"
                />
                {state.bgImageUrl && (
                  <button
                    onClick={() => onChange({ bgImageUrl: null })}
                    className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors shrink-0"
                    title="Clear Image URL"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Background Adjustments (Grain & Blur) */}
      <div className="pt-3 border-t border-slate-800/60 space-y-3">
        {/* Grain Effect Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Grain Effect</span>
            <span className="font-mono text-slate-400">{state.bgGrain || 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={state.bgGrain || 0}
            onChange={(e) => onChange({ bgGrain: Number(e.target.value) })}
            className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
          />
        </div>

        {/* Background Blur Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Background Blur</span>
            <span className="font-mono text-slate-400">{state.bgBlur || 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={state.bgBlur || 0}
            onChange={(e) => onChange({ bgBlur: Number(e.target.value) })}
            className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
          />
        </div>

        {/* Lens Blur (Depth of Field) Controls */}
        <div className="pt-3 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <Toggle
              isSelected={state.lensBlurEnabled}
              onChange={(checked) => onChange({ lensBlurEnabled: checked })}
              label="LENS BLUR (DEPTH OF FIELD)"
              size="sm"
            />
          </div>

          {state.lensBlurEnabled && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* 2D Mini Pad for Focal Point */}
              <MiniFocalPad
                focalX={state.lensBlurFocalX ?? 50}
                focalY={state.lensBlurFocalY ?? 50}
                onChange={(x, y) => onChange({ lensBlurFocalX: x, lensBlurFocalY: y })}
              />

              {/* Quick Focal Position Presets */}
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Target Presets:</span>
                <div className="flex items-center gap-1">
                  {[
                    { label: 'TL', x: 25, y: 25 },
                    { label: 'TR', x: 75, y: 25 },
                    { label: 'Center', x: 50, y: 50 },
                    { label: 'BL', x: 25, y: 75 },
                    { label: 'BR', x: 75, y: 75 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onChange({ lensBlurFocalX: p.x, lensBlurFocalY: p.y })}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-800 hover:border-pastel-pink/50 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lens Blur Amount Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Blur Intensity</span>
                  <span className="font-mono text-slate-400">{state.lensBlurAmount || 0}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={state.lensBlurAmount || 24}
                  onChange={(e) => onChange({ lensBlurAmount: Number(e.target.value) })}
                  className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
                />
              </div>

              {/* Focus Clear Radius Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Focal Sharp Area</span>
                  <span className="font-mono text-slate-400">{state.lensBlurRadius || 20}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={state.lensBlurRadius || 20}
                  onChange={(e) => onChange({ lensBlurRadius: Number(e.target.value) })}
                  className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pattern Overlay Add-on Controls */}
        <div className="pt-3 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <Toggle
              isSelected={state.bgPatternEnabled}
              onChange={(checked) => onChange({ bgPatternEnabled: checked })}
              label="PATTERN OVERLAY"
              size="sm"
            />
          </div>

          {state.bgPatternEnabled && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Pattern Presets Grid with Box Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                    Pattern Styles ({PATTERN_PRESETS.length})
                  </span>
                  {showAllPatterns && (
                    <button
                      type="button"
                      onClick={() => setShowAllPatterns(false)}
                      className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Collapse patterns"
                    >
                      <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
                    </button>
                  )}
                </div>

                <div
                  className={`grid grid-cols-4 gap-2.5 ${
                    showAllPatterns ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
                  }`}
                >
                  {(!showAllPatterns ? PATTERN_PRESETS.slice(0, 3) : PATTERN_PRESETS).map(
                    (pattern) => {
                      const isSelected = (state.bgPatternPreset || 'pattern-1') === pattern.id;

                      return (
                        <button
                          key={pattern.id}
                          type="button"
                          onClick={() => onChange({ bgPatternPreset: pattern.id })}
                          className={`h-8 rounded-lg border shadow-sm transition-all flex items-center justify-center cursor-pointer relative bg-slate-900 overflow-hidden ${
                            isSelected
                              ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                              : 'border-slate-700/80 hover:border-slate-500 hover:scale-105 opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            backgroundImage: pattern.getSvgUrl(state.bgPatternColor || '#9C92AC'),
                            backgroundRepeat: 'repeat',
                          }}
                          title={pattern.name}
                        >
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                              <Check className="w-3 h-3 text-pastel-pink" />
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}

                  {!showAllPatterns && PATTERN_PRESETS.length > 3 && (
                    <div className="relative h-8">
                      {/* Tilted background card */}
                      <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                      {/* Foreground main card */}
                      <button
                        type="button"
                        onClick={() => setShowAllPatterns(true)}
                        title={`Show all ${PATTERN_PRESETS.length} patterns`}
                        className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden bg-slate-900"
                        style={{
                          backgroundImage: PATTERN_PRESETS[3].getSvgUrl(
                            state.bgPatternColor || '#9C92AC'
                          ),
                          backgroundRepeat: 'repeat',
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                          <span className="text-[10px] font-bold tracking-tight">
                            +{PATTERN_PRESETS.length - 3}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Color Picker */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-300">Pattern Color</span>
                  <span className="font-mono text-xs text-slate-300 uppercase">
                    {state.bgPatternColor || '#9C92AC'}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner group hover:border-slate-600 transition-colors">
                  <label
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-700 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative"
                    style={{ backgroundColor: state.bgPatternColor || '#9C92AC' }}
                    title="Choose pattern color"
                  >
                    <input
                      type="color"
                      value={state.bgPatternColor || '#9C92AC'}
                      onChange={(e) => onChange({ bgPatternColor: e.target.value })}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <div className="flex-1 flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                    <span className="text-slate-500">#</span>
                    <input
                      type="text"
                      value={(state.bgPatternColor || '#9C92AC').replace('#', '')}
                      onChange={(e) => {
                        const hex = e.target.value.trim();
                        onChange({ bgPatternColor: `#${hex}` });
                      }}
                      className="w-full bg-transparent text-slate-200 focus:outline-none uppercase font-mono"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Pattern Color Quick Swatches */}
                <div className="grid grid-cols-7 gap-1.5 mt-2">
                  {[
                    '#9C92AC',
                    '#FFFFFF',
                    '#94A3B8',
                    '#F472B6',
                    '#38BDF8',
                    '#F59E0B',
                    '#0F172A',
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onChange({ bgPatternColor: color })}
                      className={`h-6 rounded-md border transition-all cursor-pointer ${
                        (state.bgPatternColor || '#9C92AC').toLowerCase() === color.toLowerCase()
                          ? 'border-pastel-pink ring-2 ring-pastel-pink/30 scale-105'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Pattern Opacity Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Pattern Opacity</span>
                  <span className="font-mono text-slate-400">{state.bgPatternOpacity ?? 40}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={state.bgPatternOpacity ?? 40}
                  onChange={(e) => onChange({ bgPatternOpacity: Number(e.target.value) })}
                  className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderWatermarkSection = () => (
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
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
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

  const renderSocialSection = () => {
    const socialLayers = state.textLayers.filter((l) => l.socialPlatform !== undefined);
    const selectedLayer = state.textLayers.find(
      (l) => l.id === state.selectedTextLayerId && l.socialPlatform !== undefined
    );

    const presetColors = [
      '#ffffff',
      '#000000',
      '#ffafcc',
      '#a2d2ff',
      '#cdb4db',
      '#fef08a',
      '#4ade80',
      '#f87171',
      '#38bdf8',
    ];

    return (
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
        <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SocialIcon platform="instagram" size={16} color="#a2d2ff" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Social Media
            </h3>
          </div>
          <button
            onClick={() => state.addSocialLayer('instagram', '@username')}
            className="px-2.5 py-1 bg-pastel-blue/20 hover:bg-pastel-blue/30 text-pastel-blue border border-pastel-blue/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Social</span>
          </button>
        </div>

        {/* Social Layers List */}
        {socialLayers.length === 0 ? (
          <div className="text-center py-6 px-3 bg-neutral-950/80 rounded-xl border border-dashed border-neutral-800 space-y-1.5">
            <p className="text-xs font-medium text-slate-400">No social media handles added</p>
            <p className="text-[11px] text-slate-500">
              Click "+ Add Social" to overlay Instagram, Twitter, TikTok, or YouTube handles.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Social Layers ({socialLayers.length}):
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {socialLayers.map((layer) => {
                const isSelected = layer.id === state.selectedTextLayerId;
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-neutral-900 border-pastel-blue text-white shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800/80 text-slate-400 hover:bg-neutral-800/60 hover:text-slate-200'
                    }`}
                    onClick={() => state.selectTextLayer(layer.id)}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                      <SocialIcon
                        platform={layer.socialPlatform || 'instagram'}
                        size={14}
                        color={'#cbd5e1'}
                      />
                      <span className="font-semibold truncate">{layer.text}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Duplicate"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.duplicateTextLayer(layer.id);
                        }}
                        className="p-1 hover:bg-neutral-800 text-slate-400 hover:text-white rounded transition-colors"
                      >
                        <Copy01 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.removeTextLayer(layer.id);
                        }}
                        className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash01 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Social Layer Settings */}
        {selectedLayer && (
          <div className="pt-3 border-t border-neutral-800/80 space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-pastel-blue uppercase tracking-wider">
                Edit Social Layer
              </span>
              <button
                onClick={() => state.selectTextLayer(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
              >
                Deselect
              </button>
            </div>

            {/* Platform Select with Icons */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Social Platform Icon
              </label>
              <SocialPlatformSelect
                value={selectedLayer.socialPlatform || 'instagram'}
                onChange={(platform) =>
                  state.updateTextLayer(selectedLayer.id, { socialPlatform: platform })
                }
              />
            </div>

            {/* Social Style Variant */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Badge & Card Style
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                {[
                  { id: 'default', label: 'Default' },
                  { id: 'badge-dark', label: 'Dark Badge' },
                  { id: 'badge-light', label: 'Light Badge' },
                  { id: 'glass-dark', label: 'Glass Dark' },
                  { id: 'glass-light', label: 'Glass Light' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      const updates: any = { socialStyle: st.id };
                      if (st.id === 'badge-light' || st.id === 'glass-light') {
                        updates.color = '#0f172a';
                        updates.iconColor = '#0f172a';
                      } else if (st.id === 'badge-dark' || st.id === 'glass-dark') {
                        updates.color = '#ffffff';
                        updates.iconColor = '#ffffff';
                      }
                      state.updateTextLayer(selectedLayer.id, updates);
                    }}
                    className={`py-1.5 text-[10px] font-medium rounded-lg transition-all text-center cursor-pointer ${
                      (selectedLayer.socialStyle || 'default') === st.id
                        ? 'bg-[#a2d2ff]/20 border border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800/50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Handle / Account Text */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Account Handle / Username
              </label>
              <input
                type="text"
                value={selectedLayer.text}
                onChange={(e) => state.updateTextLayer(selectedLayer.id, { text: e.target.value })}
                placeholder="@username"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-pastel-blue transition-colors font-mono"
              />
            </div>

            {/* Icon Color & Text Color */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs items-center">
                <span className="font-semibold text-slate-300">Icon Color</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-neutral-700 shadow-inner"
                    style={{ backgroundColor: selectedLayer.iconColor || selectedLayer.color }}
                  />
                  <input
                    type="color"
                    value={selectedLayer.iconColor || selectedLayer.color}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, { iconColor: e.target.value })
                    }
                    className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs items-center">
                <span className="font-semibold text-slate-300">Text Color</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-neutral-700 shadow-inner"
                    style={{ backgroundColor: selectedLayer.color }}
                  />
                  <input
                    type="color"
                    value={selectedLayer.color}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, { color: e.target.value })
                    }
                    className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      state.updateTextLayer(selectedLayer.id, {
                        color: c,
                        iconColor: c,
                      })
                    }
                    className="w-5 h-5 rounded-full border border-neutral-700 shrink-0 transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Size & Font Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Icon Size</span>
                  <span className="font-mono text-slate-400">
                    {selectedLayer.iconSize || Math.round(selectedLayer.fontSize * 1.1)}px
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={selectedLayer.iconSize || Math.round(selectedLayer.fontSize * 1.1)}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, {
                      iconSize: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Font Size</span>
                  <span className="font-mono text-slate-400">{selectedLayer.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={selectedLayer.fontSize}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Font Family
              </label>
              <FontSelect
                value={selectedLayer.fontFamily}
                onChange={(fontName) =>
                  state.updateTextLayer(selectedLayer.id, { fontFamily: fontName })
                }
              />
            </div>

            {/* X & Y Position */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position X (Horizontal)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.x}px</span>
                </div>
                <input
                  type="range"
                  min={-400}
                  max={400}
                  value={selectedLayer.x}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { x: Number(e.target.value) })
                  }
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position Y (Vertical)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.y}px</span>
                </div>
                <input
                  type="range"
                  min={-400}
                  max={400}
                  value={selectedLayer.y}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { y: Number(e.target.value) })
                  }
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTechStackSection = () => {
    const config = state.techStackConfig || {
      enabled: false,
      selectedIcons: ['react', 'nextjs', 'typescript', 'tailwindcss'],
      size: 28,
      gap: 12,
      style: 'row',
      position: 'bottom-left',
      badgeStyle: 'glass-dark',
      xOffset: 0,
      yOffset: 0,
    };

    const updateConfig = (updates: Partial<import('../types/studio').TechStackConfig>) => {
      onChange({
        techStackConfig: {
          ...config,
          ...updates,
        },
      });
    };

    const toggleIcon = (iconId: TechStackId) => {
      const current = config.selectedIcons || [];
      const updated = current.includes(iconId)
        ? current.filter((id) => id !== iconId)
        : [...current, iconId];
      updateConfig({ selectedIcons: updated });
    };

    const positionGrid: {
      id: import('../types/studio').TechStackPosition;
      label: string;
      dotPos: string;
    }[] = [
      { id: 'top-left', label: 'Top Left', dotPos: 'top-1 left-1' },
      { id: 'top-center', label: 'Top Center', dotPos: 'top-1 left-1/2 -translate-x-1/2' },
      { id: 'top-right', label: 'Top Right', dotPos: 'top-1 right-1' },
      { id: 'center-left', label: 'Mid Left', dotPos: 'top-1/2 left-1 -translate-y-1/2' },
      {
        id: 'center',
        label: 'Center',
        dotPos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      { id: 'center-right', label: 'Mid Right', dotPos: 'top-1/2 right-1 -translate-y-1/2' },
      { id: 'bottom-left', label: 'Bottom Left', dotPos: 'bottom-1 left-1' },
      { id: 'bottom-center', label: 'Bottom Center', dotPos: 'bottom-1 left-1/2 -translate-x-1/2' },
      { id: 'bottom-right', label: 'Bottom Right', dotPos: 'bottom-1 right-1' },
    ];

    return (
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
        {/* Header */}
        <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <TechStackIcon id="react" size={16} />
              <TechStackIcon id="typescript" size={16} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Tech Stack
            </h3>
          </div>
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => updateConfig({ enabled: !config.enabled })}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
              config.enabled ? 'bg-pastel-blue' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                config.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {config.enabled && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Tech Stack Icons Selector */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 items-center">
                <span className="font-semibold text-slate-300">Select Tech Stack Logos</span>
                <span className="text-[10px] font-mono text-pastel-blue">
                  {config.selectedIcons?.length || 0} selected
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-2 bg-neutral-950 rounded-xl border border-neutral-800 no-scrollbar">
                {TECH_STACK_ITEMS.map((item) => {
                  const isSelected = config.selectedIcons?.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onClick={() => toggleIcon(item.id)}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-white shadow-xs scale-105'
                          : 'bg-neutral-900/60 border-neutral-800/80 text-slate-500 hover:border-neutral-700 hover:text-slate-300'
                      }`}
                    >
                      <TechStackIcon id={item.id} size={22} />
                      <span className="text-[9px] font-medium mt-1 truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout Style: Row vs Column */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Layout Direction
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateConfig({ style: 'row' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    config.style === 'row'
                      ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Horizontal Row
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig({ style: 'column' })}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    config.style === 'column'
                      ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Vertical Column
                </button>
              </div>
            </div>

            {/* 9 Grid Position Preset Options */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 items-center">
                <span className="font-semibold text-slate-300">Preset Position</span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {config.position}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {positionGrid.map((pos) => {
                  const isSelected = config.position === pos.id;
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => updateConfig({ position: pos.id })}
                      className={`h-11 rounded-lg border transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-[#a2d2ff]/15 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs ring-1 ring-[#a2d2ff]'
                          : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                      }`}
                      title={pos.label}
                    >
                      {/* Outer Canvas Representation Box */}
                      <div
                        className={`w-8 h-6 rounded border relative transition-colors ${
                          isSelected
                            ? 'border-[#a2d2ff] bg-[#a2d2ff]/10'
                            : 'border-slate-700 bg-slate-900/60'
                        }`}
                      >
                        {/* Inner Location Box Indicator */}
                        <div
                          className={`absolute w-1.5 h-1 rounded-xs transition-colors ${pos.dotPos} ${
                            isSelected ? 'bg-[#a2d2ff]' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Badge & Card Background Style */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Badge & Background Style
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                {[
                  { id: 'plain', label: 'Default' },
                  { id: 'glass-dark', label: 'Dark Glass' },
                  { id: 'glass-light', label: 'Light Glass' },
                  { id: 'badge-dark', label: 'Dark Badge' },
                  { id: 'badge-light', label: 'Light Badge' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => updateConfig({ badgeStyle: bg.id as any })}
                    className={`py-1.5 text-[10px] font-medium rounded-lg transition-all text-center cursor-pointer ${
                      config.badgeStyle === bg.id
                        ? 'bg-[#a2d2ff]/20 border border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800/50'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size & Gap Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Logo Size</span>
                  <span className="font-mono text-slate-400">{config.size || 28}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={64}
                  value={config.size || 28}
                  onChange={(e) => updateConfig({ size: Number(e.target.value) })}
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Gap</span>
                  <span className="font-mono text-slate-400">{config.gap || 12}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={36}
                  value={config.gap || 12}
                  onChange={(e) => updateConfig({ gap: Number(e.target.value) })}
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>

            {/* Fine Position Offset (X & Y) */}
            <div className="space-y-2 pt-1 border-t border-neutral-800/60">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Offset X</span>
                  <span className="font-mono text-slate-400">{config.xOffset || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  value={config.xOffset || 0}
                  onChange={(e) => updateConfig({ xOffset: Number(e.target.value) })}
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Offset Y</span>
                  <span className="font-mono text-slate-400">{config.yOffset || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  value={config.yOffset || 0}
                  onChange={(e) => updateConfig({ yOffset: Number(e.target.value) })}
                  className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPhosphorIconsSection = () => {
    const iconLayers = state.phosphorIconLayers || [];
    const selectedLayer = iconLayers.find((l) => l.id === state.selectedPhosphorIconLayerId);
    const selectedCategory = phosphorSelectedCategory;
    const setSelectedCategory = setPhosphorSelectedCategory;
    const searchQuery = phosphorSearchQuery;
    const setSearchQuery = setPhosphorSearchQuery;

    const categories = [
      { id: 'all', label: 'All' },
      { id: 'ui', label: 'UI & Web' },
      { id: 'shapes', label: 'Shapes' },
      { id: 'arrows', label: 'Arrows' },
      { id: 'brands', label: 'Brands' },
      { id: 'social', label: 'Social' },
      { id: 'maps', label: 'Maps' },
      { id: 'tech', label: 'Tech' },
      { id: 'media', label: 'Media' },
      { id: 'commerce', label: 'Commerce' },
    ];

    const phosphorIconItems: { id: string; label: string; category: string }[] = [
      // UI & Web (including Bookmarks!)
      { id: 'Bookmark', label: 'Bookmark', category: 'ui' },
      { id: 'BookmarkSimple', label: 'Simple Bookmark', category: 'ui' },
      { id: 'Bookmarks', label: 'Bookmarks', category: 'ui' },
      { id: 'Gear', label: 'Gear', category: 'ui' },
      { id: 'Sliders', label: 'Sliders', category: 'ui' },
      { id: 'Funnel', label: 'Filter', category: 'ui' },
      { id: 'MagnifyingGlass', label: 'Search', category: 'ui' },
      { id: 'Check', label: 'Check', category: 'ui' },
      { id: 'X', label: 'Close', category: 'ui' },
      { id: 'Plus', label: 'Plus', category: 'ui' },
      { id: 'LockKey', label: 'Lock', category: 'ui' },
      { id: 'Key', label: 'Key', category: 'ui' },
      { id: 'Trash', label: 'Trash', category: 'ui' },
      { id: 'PencilSimple', label: 'Edit', category: 'ui' },
      { id: 'Copy', label: 'Copy', category: 'ui' },
      { id: 'Share', label: 'Share', category: 'ui' },
      { id: 'DownloadSimple', label: 'Download', category: 'ui' },

      // Shapes & Badges
      { id: 'Sparkle', label: 'Sparkle', category: 'shapes' },
      { id: 'Star', label: 'Star', category: 'shapes' },
      { id: 'Heart', label: 'Heart', category: 'shapes' },
      { id: 'Lightning', label: 'Lightning', category: 'shapes' },
      { id: 'Fire', label: 'Fire', category: 'shapes' },
      { id: 'Cube', label: 'Cube', category: 'shapes' },
      { id: 'Circle', label: 'Circle', category: 'shapes' },
      { id: 'Square', label: 'Square', category: 'shapes' },
      { id: 'Triangle', label: 'Triangle', category: 'shapes' },
      { id: 'Polygon', label: 'Polygon', category: 'shapes' },
      { id: 'Diamond', label: 'Diamond', category: 'shapes' },
      { id: 'ShieldCheck', label: 'Shield', category: 'shapes' },
      { id: 'SealCheck', label: 'Seal Check', category: 'shapes' },
      { id: 'Crown', label: 'Crown', category: 'shapes' },
      { id: 'Planet', label: 'Planet', category: 'shapes' },

      // Arrows (Direction, Carets, Chevrons & Variations)
      { id: 'ArrowUp', label: 'Arrow Up', category: 'arrows' },
      { id: 'ArrowDown', label: 'Arrow Down', category: 'arrows' },
      { id: 'ArrowLeft', label: 'Arrow Left', category: 'arrows' },
      { id: 'ArrowRight', label: 'Arrow Right', category: 'arrows' },
      { id: 'ArrowUpRight', label: 'Arrow Up Right', category: 'arrows' },
      { id: 'ArrowUpLeft', label: 'Arrow Up Left', category: 'arrows' },
      { id: 'ArrowDownRight', label: 'Arrow Down Right', category: 'arrows' },
      { id: 'ArrowDownLeft', label: 'Arrow Down Left', category: 'arrows' },
      { id: 'ArrowCircleUp', label: 'Circle Up', category: 'arrows' },
      { id: 'ArrowCircleDown', label: 'Circle Down', category: 'arrows' },
      { id: 'ArrowCircleLeft', label: 'Circle Left', category: 'arrows' },
      { id: 'ArrowCircleRight', label: 'Circle Right', category: 'arrows' },
      { id: 'ArrowSquareUp', label: 'Square Up', category: 'arrows' },
      { id: 'ArrowSquareDown', label: 'Square Down', category: 'arrows' },
      { id: 'ArrowSquareLeft', label: 'Square Left', category: 'arrows' },
      { id: 'ArrowSquareRight', label: 'Square Right', category: 'arrows' },
      { id: 'ArrowLineUp', label: 'Line Up', category: 'arrows' },
      { id: 'ArrowLineDown', label: 'Line Down', category: 'arrows' },
      { id: 'ArrowLineLeft', label: 'Line Left', category: 'arrows' },
      { id: 'ArrowLineRight', label: 'Line Right', category: 'arrows' },
      { id: 'ArrowFatUp', label: 'Fat Up', category: 'arrows' },
      { id: 'ArrowFatDown', label: 'Fat Down', category: 'arrows' },
      { id: 'ArrowFatLeft', label: 'Fat Left', category: 'arrows' },
      { id: 'ArrowFatRight', label: 'Fat Right', category: 'arrows' },
      { id: 'ArrowClockwise', label: 'Clockwise', category: 'arrows' },
      { id: 'ArrowCounterClockwise', label: 'Counter Clockwise', category: 'arrows' },
      { id: 'ArrowBendUpRight', label: 'Bend Up Right', category: 'arrows' },
      { id: 'ArrowBendUpLeft', label: 'Bend Up Left', category: 'arrows' },
      { id: 'ArrowBendDownRight', label: 'Bend Down Right', category: 'arrows' },
      { id: 'ArrowBendDownLeft', label: 'Bend Down Left', category: 'arrows' },
      { id: 'ArrowUDownLeft', label: 'U-Turn Left', category: 'arrows' },
      { id: 'ArrowUDownRight', label: 'U-Turn Right', category: 'arrows' },
      { id: 'ArrowElbowUpRight', label: 'Elbow Up Right', category: 'arrows' },
      { id: 'ArrowElbowUpLeft', label: 'Elbow Up Left', category: 'arrows' },
      { id: 'ArrowElbowDownRight', label: 'Elbow Down Right', category: 'arrows' },
      { id: 'ArrowElbowDownLeft', label: 'Elbow Down Left', category: 'arrows' },
      { id: 'CaretUp', label: 'Caret Up', category: 'arrows' },
      { id: 'CaretDown', label: 'Caret Down', category: 'arrows' },
      { id: 'CaretLeft', label: 'Caret Left', category: 'arrows' },
      { id: 'CaretRight', label: 'Caret Right', category: 'arrows' },
      { id: 'CaretDoubleUp', label: 'Caret Double Up', category: 'arrows' },
      { id: 'CaretDoubleDown', label: 'Caret Double Down', category: 'arrows' },
      { id: 'CaretDoubleLeft', label: 'Caret Double Left', category: 'arrows' },
      { id: 'CaretDoubleRight', label: 'Caret Double Right', category: 'arrows' },
      { id: 'CaretCircleUp', label: 'Caret Circle Up', category: 'arrows' },
      { id: 'CaretCircleDown', label: 'Caret Circle Down', category: 'arrows' },
      { id: 'CaretCircleLeft', label: 'Caret Circle Left', category: 'arrows' },
      { id: 'CaretCircleRight', label: 'Caret Circle Right', category: 'arrows' },
      { id: 'CaretCircleDoubleUp', label: 'Caret Circle Dbl Up', category: 'arrows' },
      { id: 'CaretCircleDoubleDown', label: 'Caret Circle Dbl Down', category: 'arrows' },
      { id: 'CaretCircleDoubleLeft', label: 'Caret Circle Dbl Left', category: 'arrows' },
      { id: 'CaretCircleDoubleRight', label: 'Caret Circle Dbl Right', category: 'arrows' },
      { id: 'ArrowsClockwise', label: 'Arrows Spin CW', category: 'arrows' },
      { id: 'ArrowsCounterClockwise', label: 'Arrows Spin CCW', category: 'arrows' },
      { id: 'ArrowsLeftRight', label: 'Left Right', category: 'arrows' },
      { id: 'ArrowsDownUp', label: 'Down Up', category: 'arrows' },
      { id: 'ArrowsHorizontal', label: 'Horizontal', category: 'arrows' },
      { id: 'ArrowsVertical', label: 'Vertical', category: 'arrows' },
      { id: 'ArrowsIn', label: 'Arrows In', category: 'arrows' },
      { id: 'ArrowsOut', label: 'Arrows Out', category: 'arrows' },
      { id: 'ArrowsInSimple', label: 'Arrows In Simple', category: 'arrows' },
      { id: 'ArrowsOutSimple', label: 'Arrows Out Simple', category: 'arrows' },
      { id: 'ArrowsMerge', label: 'Arrows Merge', category: 'arrows' },
      { id: 'ArrowsSplit', label: 'Arrows Split', category: 'arrows' },
      { id: 'Swap', label: 'Swap', category: 'arrows' },
      { id: 'Shuffle', label: 'Shuffle', category: 'arrows' },
      { id: 'Repeat', label: 'Repeat', category: 'arrows' },

      // Tech & Dev
      { id: 'Code', label: 'Code', category: 'tech' },
      { id: 'TerminalWindow', label: 'Terminal', category: 'tech' },
      { id: 'Cpu', label: 'CPU', category: 'tech' },
      { id: 'Database', label: 'Database', category: 'tech' },
      { id: 'GitBranch', label: 'Git Branch', category: 'tech' },
      { id: 'Cloud', label: 'Cloud', category: 'tech' },
      { id: 'Bug', label: 'Bug', category: 'tech' },
      { id: 'Desktop', label: 'Desktop', category: 'tech' },
      { id: 'Laptop', label: 'Laptop', category: 'tech' },
      { id: 'DeviceMobile', label: 'Mobile', category: 'tech' },
      { id: 'WifiHigh', label: 'Wi-Fi', category: 'tech' },
      { id: 'Broadcast', label: 'Broadcast', category: 'tech' },

      // Media
      { id: 'Image', label: 'Image', category: 'media' },
      { id: 'VideoCamera', label: 'Video', category: 'media' },
      { id: 'MusicNotes', label: 'Music', category: 'media' },
      { id: 'Microphone', label: 'Mic', category: 'media' },
      { id: 'Camera', label: 'Camera', category: 'media' },
      { id: 'Play', label: 'Play', category: 'media' },
      { id: 'Pause', label: 'Pause', category: 'media' },
      { id: 'Folder', label: 'Folder', category: 'media' },
      { id: 'FileCode', label: 'File Code', category: 'media' },

      // Commerce
      { id: 'ShoppingCart', label: 'Cart', category: 'commerce' },
      { id: 'ShoppingBag', label: 'Bag', category: 'commerce' },
      { id: 'CreditCard', label: 'Card', category: 'commerce' },
      { id: 'Tag', label: 'Tag', category: 'commerce' },
      { id: 'Receipt', label: 'Receipt', category: 'commerce' },
      { id: 'TrendUp', label: 'Trend Up', category: 'commerce' },
      { id: 'Percent', label: 'Percent', category: 'commerce' },
      { id: 'Gift', label: 'Gift', category: 'commerce' },
      { id: 'Trophy', label: 'Trophy', category: 'commerce' },
      { id: 'Bank', label: 'Bank', category: 'commerce' },

      // Brands & Logos
      { id: 'MetaLogo', label: 'Meta', category: 'brands' },
      { id: 'OpenAiLogo', label: 'OpenAI', category: 'brands' },
      { id: 'XLogo', label: 'X', category: 'brands' },
      { id: 'ThreadsLogo', label: 'Threads', category: 'brands' },
      { id: 'AmazonLogo', label: 'Amazon', category: 'brands' },
      { id: 'AppStoreLogo', label: 'App Store', category: 'brands' },
      { id: 'AngularLogo', label: 'Angular', category: 'brands' },
      { id: 'GoogleChromeLogo', label: 'Chrome', category: 'brands' },
      { id: 'CodaLogo', label: 'Coda', category: 'brands' },
      { id: 'CodepenLogo', label: 'CodePen', category: 'brands' },
      { id: 'CodesandboxLogo', label: 'CodeSandbox', category: 'brands' },
      { id: 'DevToLogo', label: 'Dev.to', category: 'brands' },
      { id: 'DropboxLogo', label: 'Dropbox', category: 'brands' },
      { id: 'FediverseLogo', label: 'Fediverse', category: 'brands' },
      { id: 'FramerLogo', label: 'Framer', category: 'brands' },
      { id: 'GitlabLogo', label: 'GitLab', category: 'brands' },
      { id: 'GitlabLogoSimple', label: 'GitLab Simple', category: 'brands' },
      { id: 'GoodreadsLogo', label: 'Goodreads', category: 'brands' },
      { id: 'GoogleDriveLogo', label: 'Google Drive', category: 'brands' },
      { id: 'GooglePhotosLogo', label: 'Google Photos', category: 'brands' },
      { id: 'GooglePlayLogo', label: 'Google Play', category: 'brands' },
      { id: 'LastfmLogo', label: 'Last.fm', category: 'brands' },
      { id: 'LinktreeLogo', label: 'Linktree', category: 'brands' },
      { id: 'LinuxLogo', label: 'Linux', category: 'brands' },
      { id: 'MarkdownLogo', label: 'Markdown', category: 'brands' },
      { id: 'MastodonLogo', label: 'Mastodon', category: 'brands' },
      { id: 'MatrixLogo', label: 'Matrix', category: 'brands' },
      { id: 'MessengerLogo', label: 'Messenger', category: 'brands' },
      { id: 'MicrosoftExcelLogo', label: 'MS Excel', category: 'brands' },
      { id: 'MicrosoftOutlookLogo', label: 'MS Outlook', category: 'brands' },
      { id: 'MicrosoftPowerpointLogo', label: 'MS PowerPoint', category: 'brands' },
      { id: 'MicrosoftTeamsLogo', label: 'MS Teams', category: 'brands' },
      { id: 'MicrosoftWordLogo', label: 'MS Word', category: 'brands' },
      { id: 'NotionLogo', label: 'Notion', category: 'brands' },
      { id: 'NyTimesLogo', label: 'NY Times', category: 'brands' },
      { id: 'PatreonLogo', label: 'Patreon', category: 'brands' },
      { id: 'PaypalLogo', label: 'PayPal', category: 'brands' },
      { id: 'PhosphorLogo', label: 'Phosphor', category: 'brands' },
      { id: 'PixLogo', label: 'Pix', category: 'brands' },
      { id: 'ReadCvLogo', label: 'Read.cv', category: 'brands' },
      { id: 'ReplitLogo', label: 'Replit', category: 'brands' },
      { id: 'SketchLogo', label: 'Sketch', category: 'brands' },
      { id: 'SkypeLogo', label: 'Skype', category: 'brands' },
      { id: 'SoundcloudLogo', label: 'SoundCloud', category: 'brands' },
      { id: 'SquareLogo', label: 'Square', category: 'brands' },
      { id: 'StackOverflowLogo', label: 'Stack Overflow', category: 'brands' },
      { id: 'SteamLogo', label: 'Steam', category: 'brands' },
      { id: 'StripeLogo', label: 'Stripe', category: 'brands' },
      { id: 'TidalLogo', label: 'Tidal', category: 'brands' },
      { id: 'TumblrLogo', label: 'Tumblr', category: 'brands' },
      { id: 'WebhooksLogo', label: 'Webhooks', category: 'brands' },
      { id: 'WechatLogo', label: 'WeChat', category: 'brands' },
      { id: 'WindowsLogo', label: 'Windows', category: 'brands' },

      // Social, Brands & Chat
      { id: 'TwitterLogo', label: 'X / Twitter', category: 'social' },
      { id: 'InstagramLogo', label: 'Instagram', category: 'social' },
      { id: 'FacebookLogo', label: 'Facebook', category: 'social' },
      { id: 'YoutubeLogo', label: 'YouTube', category: 'social' },
      { id: 'TiktokLogo', label: 'TikTok', category: 'social' },
      { id: 'LinkedinLogo', label: 'LinkedIn', category: 'social' },
      { id: 'GithubLogo', label: 'GitHub', category: 'social' },
      { id: 'DribbbleLogo', label: 'Dribbble', category: 'social' },
      { id: 'FigmaLogo', label: 'Figma', category: 'social' },
      { id: 'BehanceLogo', label: 'Behance', category: 'social' },
      { id: 'DiscordLogo', label: 'Discord', category: 'social' },
      { id: 'TelegramLogo', label: 'Telegram', category: 'social' },
      { id: 'WhatsappLogo', label: 'WhatsApp', category: 'social' },
      { id: 'RedditLogo', label: 'Reddit', category: 'social' },
      { id: 'TwitchLogo', label: 'Twitch', category: 'social' },
      { id: 'SpotifyLogo', label: 'Spotify', category: 'social' },
      { id: 'PinterestLogo', label: 'Pinterest', category: 'social' },
      { id: 'MediumLogo', label: 'Medium', category: 'social' },
      { id: 'SlackLogo', label: 'Slack', category: 'social' },
      { id: 'SnapchatLogo', label: 'Snapchat', category: 'social' },
      { id: 'GoogleLogo', label: 'Google', category: 'social' },
      { id: 'AppleLogo', label: 'Apple', category: 'social' },
      { id: 'AndroidLogo', label: 'Android', category: 'social' },
      { id: 'ChatCircleText', label: 'Chat', category: 'social' },
      { id: 'Envelope', label: 'Email', category: 'social' },
      { id: 'ShareNetwork', label: 'Network', category: 'social' },
      { id: 'ThumbsUp', label: 'Like', category: 'social' },
      { id: 'User', label: 'User', category: 'social' },
      { id: 'Users', label: 'Users', category: 'social' },
      { id: 'Globe', label: 'Globe', category: 'social' },

      // Maps & Location
      { id: 'MapTrifold', label: 'Map', category: 'maps' },
      { id: 'MapPin', label: 'Map Pin', category: 'maps' },
      { id: 'MapPinArea', label: 'Map Pin Area', category: 'maps' },
      { id: 'MapPinLine', label: 'Map Pin Line', category: 'maps' },
      { id: 'MapPinPlus', label: 'Map Pin Plus', category: 'maps' },
      { id: 'MapPinSimple', label: 'Map Pin Simple', category: 'maps' },
      { id: 'MapPinSimpleArea', label: 'Pin Area', category: 'maps' },
      { id: 'MapPinSimpleLine', label: 'Pin Line', category: 'maps' },
      { id: 'NavigationArrow', label: 'Navigation', category: 'maps' },
    ];

    const filteredItems = phosphorIconItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const weights: { id: PhosphorWeight; label: string }[] = [
      { id: 'regular', label: 'Regular' },
      { id: 'fill', label: 'Fill' },
      { id: 'duotone', label: 'Duotone' },
    ];

    const badgeStyles: { id: import('../types/studio').PhosphorBadgeStyle; label: string }[] = [
      { id: 'plain', label: 'Plain' },
      { id: 'glass-dark', label: 'Glass Dark' },
      { id: 'glass-light', label: 'Glass Light' },
      { id: 'badge-dark', label: 'Solid Dark' },
      { id: 'badge-light', label: 'Solid Light' },
      { id: 'circle-dark', label: 'Circle Dark' },
      { id: 'circle-light', label: 'Circle Light' },
    ];

    return (
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
        {/* Header */}
        <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhosphorIcons.Sparkle weight="duotone" className="w-4 h-4 text-pastel-pink" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Icons by Phosphor
            </h3>
          </div>
        </div>

        {/* Catalog Search & Add Icon Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Icon Catalog (Click to Add)</span>
            <span className="font-mono text-[10px] text-pastel-pink">
              {iconLayers.length} on stage
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 text-[11px] font-medium rounded-lg shrink-0 border transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-pastel-blue font-bold'
                    : 'bg-neutral-900 border-neutral-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search icons (e.g. Bookmark, Heart, Code)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pastel-pink"
          />

          {/* Icon Grid Picker */}
          <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-2 bg-neutral-950 rounded-xl border border-neutral-800 no-scrollbar">
            {filteredItems.map((item) => {
              const IconComp = (PhosphorIcons as any)[item.id] || PhosphorIcons.SparkleIcon;
              return (
                <button
                  key={`${item.category}-${item.id}`}
                  type="button"
                  title={`Click to add ${item.label}`}
                  onClick={() => state.addPhosphorIconLayer(item.id)}
                  className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 text-slate-300 hover:border-pastel-pink/60 hover:text-white hover:bg-pastel-pink/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
                >
                  <IconComp
                    weight="duotone"
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Existing Canvas Icon Layers List */}
        {iconLayers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Canvas Icon Layers ({iconLayers.length})
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {iconLayers.map((layer, index) => {
                const isSelected = layer.id === state.selectedPhosphorIconLayerId;
                const IconComp = (PhosphorIcons as any)[layer.iconId] || PhosphorIcons.SparkleIcon;
                return (
                  <div
                    key={layer.id}
                    onClick={() => state.selectPhosphorIconLayer(layer.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-pastel-pink/15 border-pastel-pink text-white font-bold'
                        : 'bg-neutral-900/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                        <IconComp
                          weight={layer.weight || 'duotone'}
                          size={14}
                          color={layer.color || '#a2d2ff'}
                        />
                      </div>
                      <span className="text-xs truncate">
                        {layer.iconId} #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-slate-400">
                        {layer.position === 'underneath' ? 'Behind' : 'Above'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.duplicatePhosphorIconLayer(layer.id);
                        }}
                        title="Duplicate icon"
                        className="p-1 hover:text-pastel-pink text-slate-400 transition-colors cursor-pointer"
                      >
                        <Copy01 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.removePhosphorIconLayer(layer.id);
                        }}
                        title="Delete icon"
                        className="p-1 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
                      >
                        <Trash01 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Icon Layer Editor Controls */}
        {selectedLayer && (
          <div className="space-y-4 pt-3 border-t border-neutral-800/80 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Editing: {selectedLayer.iconId}</span>
              <button
                type="button"
                onClick={() => state.selectPhosphorIconLayer(null)}
                className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Deselect
              </button>
            </div>

            {/* Icon Weight Switcher */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Icon Style / Weight
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {weights.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() =>
                      state.updatePhosphorIconLayer(selectedLayer.id, { weight: w.id })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      (selectedLayer.weight || 'duotone') === w.id
                        ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop Shadow Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] font-semibold text-slate-300">Drop Shadow</label>
              <Toggle
                isSelected={!!selectedLayer.shadow}
                onChange={(checked) =>
                  state.updatePhosphorIconLayer(selectedLayer.id, { shadow: checked })
                }
                size="sm"
              />
            </div>

            {/* Layering Depth (Above vs Behind Mockup) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Layering Depth
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    state.updatePhosphorIconLayer(selectedLayer.id, { position: 'above' })
                  }
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    (selectedLayer.position || 'above') === 'above'
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Above Mockup
                </button>
                <button
                  type="button"
                  onClick={() =>
                    state.updatePhosphorIconLayer(selectedLayer.id, { position: 'underneath' })
                  }
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selectedLayer.position === 'underneath'
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Behind Mockup
                </button>
              </div>
            </div>

            {/* Container Style Switcher (includes Circle Dark & Circle Light!) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Container Style
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {badgeStyles.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      state.updatePhosphorIconLayer(selectedLayer.id, { badgeStyle: b.id })
                    }
                    className={`py-1.5 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer truncate text-center ${
                      (selectedLayer.badgeStyle || 'circle-dark') === b.id
                        ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Color Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Icon Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedLayer.color || '#a2d2ff'}
                  onChange={(e) =>
                    state.updatePhosphorIconLayer(selectedLayer.id, { color: e.target.value })
                  }
                  className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={selectedLayer.color || '#a2d2ff'}
                  onChange={(e) =>
                    state.updatePhosphorIconLayer(selectedLayer.id, { color: e.target.value })
                  }
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-xs font-mono rounded-lg px-2.5 py-1 text-slate-200"
                />
              </div>
            </div>

            {/* Size & Opacity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Icon Size</span>
                  <span className="font-mono text-slate-400">{selectedLayer.size || 40}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={120}
                  value={selectedLayer.size || 40}
                  onChange={(e) =>
                    state.updatePhosphorIconLayer(selectedLayer.id, {
                      size: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Opacity</span>
                  <span className="font-mono text-slate-400">{selectedLayer.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={selectedLayer.opacity ?? 100}
                  onChange={(e) =>
                    state.updatePhosphorIconLayer(selectedLayer.id, {
                      opacity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Rotation</span>
                <span className="font-mono text-slate-400">{selectedLayer.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={selectedLayer.rotation || 0}
                onChange={(e) =>
                  state.updatePhosphorIconLayer(selectedLayer.id, {
                    rotation: Number(e.target.value),
                  })
                }
                className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Fine Position Offset (X & Y) */}
            <div className="space-y-2 pt-1 border-t border-neutral-800/60">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position X (Horizontal)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.x || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-400}
                  max={400}
                  value={selectedLayer.x || 0}
                  onChange={(e) =>
                    state.updatePhosphorIconLayer(selectedLayer.id, {
                      x: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position Y (Vertical)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.y || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-400}
                  max={400}
                  value={selectedLayer.y || 0}
                  onChange={(e) =>
                    state.updatePhosphorIconLayer(selectedLayer.id, {
                      y: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTextSection = () => {
    const plainTextLayers = state.textLayers.filter((l) => l.socialPlatform === undefined);
    const selectedLayer = state.textLayers.find(
      (l) => l.id === state.selectedTextLayerId && l.socialPlatform === undefined
    );

    const presetColors = [
      '#ffffff',
      '#000000',
      '#ffafcc',
      '#a2d2ff',
      '#cdb4db',
      '#fef08a',
      '#4ade80',
      '#f87171',
      '#38bdf8',
    ];

    return (
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
        <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type01 className="w-4 h-4 text-pastel-blue" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Text Layers
            </h3>
          </div>
          <button
            onClick={() => state.addTextLayer()}
            className="px-2.5 py-1 bg-pastel-blue/20 hover:bg-pastel-blue/30 text-pastel-blue border border-pastel-blue/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>
        </div>

        {/* Text Layers List */}
        {plainTextLayers.length === 0 ? (
          <div className="text-center py-6 px-3 bg-neutral-950/80 rounded-xl border border-dashed border-neutral-800 space-y-1.5">
            <p className="text-xs font-medium text-slate-400">No text layers added yet</p>
            <p className="text-[11px] text-slate-500">
              Click "+ Add Text" to overlay headlines, captions, or badges.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Layers ({plainTextLayers.length}):
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {plainTextLayers.map((layer, index) => {
                const isSelected = layer.id === state.selectedTextLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => state.selectTextLayer(layer.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pastel-blue/15 border-pastel-blue text-white shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold shrink-0">
                        #{index + 1}
                      </span>
                      <span
                        className="truncate font-medium"
                        style={{ fontFamily: layer.fontFamily }}
                      >
                        {layer.text || 'Empty Text'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          state.duplicateTextLayer(layer.id);
                        }}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                        title="Duplicate Layer"
                      >
                        <Copy01 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          state.removeTextLayer(layer.id);
                        }}
                        className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded transition-colors"
                        title="Delete Layer"
                      >
                        <Trash01 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Layer Inspector */}
        {selectedLayer && (
          <div className="pt-3 border-t border-neutral-800/80 space-y-3.5 animate-in fade-in duration-150">
            {/* Text Content Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Text Content
              </label>
              <textarea
                rows={2}
                value={selectedLayer.text}
                onChange={(e) => state.updateTextLayer(selectedLayer.id, { text: e.target.value })}
                placeholder="Enter text..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-pastel-blue transition-colors resize-none"
              />
            </div>

            {/* Font Family Selector (10 Google Fonts) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Font Family (Google Fonts)
              </label>
              <FontSelect
                value={selectedLayer.fontFamily}
                onChange={(fontName) =>
                  state.updateTextLayer(selectedLayer.id, { fontFamily: fontName })
                }
              />
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Size</span>
                  <span className="font-mono text-slate-400">{selectedLayer.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="500"
                  value={selectedLayer.fontSize}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { fontSize: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Weight
                </label>
                <select
                  value={selectedLayer.fontWeight}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, {
                      fontWeight: e.target.value as any,
                    })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="600">SemiBold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">ExtraBold (800)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>
            </div>

            {/* Alignment & Style Options */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Alignment
                </label>
                <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                  {(
                    [
                      { id: 'left', icon: AlignLeft },
                      { id: 'center', icon: AlignCenter },
                      { id: 'right', icon: AlignRight },
                    ] as const
                  ).map((align) => {
                    const Icon = align.icon;
                    const isSelected = selectedLayer.textAlign === align.id;
                    return (
                      <button
                        key={align.id}
                        onClick={() =>
                          state.updateTextLayer(selectedLayer.id, { textAlign: align.id })
                        }
                        className={`py-1 flex items-center justify-center rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-pastel-blue/20 text-pastel-blue'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Style</label>
                <button
                  onClick={() =>
                    state.updateTextLayer(selectedLayer.id, {
                      fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  className={`w-full py-1 text-xs font-semibold italic rounded-lg border transition-all cursor-pointer ${
                    selectedLayer.fontStyle === 'italic'
                      ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Italic
                </button>
              </div>
            </div>

            {/* Text Color Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Text Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => state.updateTextLayer(selectedLayer.id, { color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      selectedLayer.color === c
                        ? 'border-white scale-110 shadow-md ring-2 ring-pastel-blue/50'
                        : 'border-slate-700/60 hover:scale-105'
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={selectedLayer.color}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { color: e.target.value })
                  }
                  className="w-6 h-6 rounded-full border border-slate-700 bg-transparent cursor-pointer p-0"
                  title="Custom Color"
                />
              </div>
            </div>

            {/* Gradient Text */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Gradient Text
                </label>
                <button
                  onClick={() =>
                    state.updateTextLayer(selectedLayer.id, {
                      gradient: selectedLayer.gradient
                        ? null
                        : { color1: '#ffafcc', color2: '#a2d2ff', angle: 135 },
                    })
                  }
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    selectedLayer.gradient ? 'bg-pastel-blue' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      selectedLayer.gradient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {selectedLayer.gradient && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      Presets ({GRADIENT_PRESETS.length})
                    </span>
                    {showAllGradients && (
                      <button
                        type="button"
                        onClick={() => setShowAllGradients(false)}
                        className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Collapse presets"
                      >
                        <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
                      </button>
                    )}
                  </div>

                  <div
                    className={`grid grid-cols-4 gap-2 ${
                      showAllGradients ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
                    }`}
                  >
                    {(!showAllGradients ? GRADIENT_PRESETS.slice(0, 3) : GRADIENT_PRESETS).map(
                      (g) => {
                        const isSelected =
                          selectedLayer.gradient?.color1.toLowerCase() === g.c1.toLowerCase() &&
                          selectedLayer.gradient?.color2.toLowerCase() === g.c2.toLowerCase();
                        return (
                          <button
                            key={g.name}
                            onClick={() =>
                              state.updateTextLayer(selectedLayer.id, {
                                gradient: {
                                  ...selectedLayer.gradient!,
                                  color1: g.c1,
                                  color2: g.c2,
                                },
                              })
                            }
                            title={g.name}
                            className={`h-8 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-white ring-2 ring-pastel-pink scale-105'
                                : 'border-slate-700/80 hover:scale-105'
                            }`}
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
                            }}
                          />
                        );
                      }
                    )}

                    {!showAllGradients && GRADIENT_PRESETS.length > 3 && (
                      <div className="relative h-8">
                        {/* Tilted background card matching LeftSidebar card style */}
                        <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                        {/* Foreground main card */}
                        <button
                          type="button"
                          onClick={() => setShowAllGradients(true)}
                          title={`Show all ${GRADIENT_PRESETS.length} gradients`}
                          className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${GRADIENT_PRESETS[3].c1}, ${GRADIENT_PRESETS[3].c2})`,
                          }}
                        >
                          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                            <span className="text-[10px] font-bold tracking-tight">
                              +{GRADIENT_PRESETS.length - 3}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Color 1 */}
                    <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">Color 1</span>
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseColorAndAlpha(selectedLayer.gradient!.color1);
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color1:
                                  parsed.alpha === 0
                                    ? formatColorWithAlpha(parsed.hex, 100)
                                    : 'transparent',
                              },
                            });
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            parseColorAndAlpha(selectedLayer.gradient.color1).alpha === 0
                              ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Toggle transparent"
                        >
                          {parseColorAndAlpha(selectedLayer.gradient.color1).alpha === 0
                            ? 'Transparent'
                            : 'Make Clear'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: selectedLayer.gradient.color1 }}
                          />
                          <input
                            type="color"
                            value={parseColorAndAlpha(selectedLayer.gradient.color1).hex}
                            onChange={(e) => {
                              const currentAlpha = parseColorAndAlpha(
                                selectedLayer.gradient!.color1
                              ).alpha;
                              state.updateTextLayer(selectedLayer.id, {
                                gradient: {
                                  ...selectedLayer.gradient!,
                                  color1: formatColorWithAlpha(
                                    e.target.value,
                                    currentAlpha === 0 ? 100 : currentAlpha
                                  ),
                                },
                              });
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          value={selectedLayer.gradient.color1}
                          onChange={(e) =>
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color1: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                          <span>Opacity</span>
                          <span className="font-mono font-medium">
                            {parseColorAndAlpha(selectedLayer.gradient.color1).alpha}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={parseColorAndAlpha(selectedLayer.gradient.color1).alpha}
                          onChange={(e) => {
                            const hex = parseColorAndAlpha(selectedLayer.gradient!.color1).hex;
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color1: formatColorWithAlpha(hex, Number(e.target.value)),
                              },
                            });
                          }}
                          className="w-full accent-pastel-pink bg-neutral-800 rounded-lg cursor-pointer h-1"
                        />
                      </div>
                    </div>

                    {/* Color 2 */}
                    <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-400">Color 2</span>
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseColorAndAlpha(selectedLayer.gradient!.color2);
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color2:
                                  parsed.alpha === 0
                                    ? formatColorWithAlpha(parsed.hex, 100)
                                    : 'transparent',
                              },
                            });
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            parseColorAndAlpha(selectedLayer.gradient.color2).alpha === 0
                              ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title="Toggle transparent"
                        >
                          {parseColorAndAlpha(selectedLayer.gradient.color2).alpha === 0
                            ? 'Transparent'
                            : 'Make Clear'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: selectedLayer.gradient.color2 }}
                          />
                          <input
                            type="color"
                            value={parseColorAndAlpha(selectedLayer.gradient.color2).hex}
                            onChange={(e) => {
                              const currentAlpha = parseColorAndAlpha(
                                selectedLayer.gradient!.color2
                              ).alpha;
                              state.updateTextLayer(selectedLayer.id, {
                                gradient: {
                                  ...selectedLayer.gradient!,
                                  color2: formatColorWithAlpha(
                                    e.target.value,
                                    currentAlpha === 0 ? 100 : currentAlpha
                                  ),
                                },
                              });
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          value={selectedLayer.gradient.color2}
                          onChange={(e) =>
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color2: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                          <span>Opacity</span>
                          <span className="font-mono font-medium">
                            {parseColorAndAlpha(selectedLayer.gradient.color2).alpha}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={parseColorAndAlpha(selectedLayer.gradient.color2).alpha}
                          onChange={(e) => {
                            const hex = parseColorAndAlpha(selectedLayer.gradient!.color2).hex;
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color2: formatColorWithAlpha(hex, Number(e.target.value)),
                              },
                            });
                          }}
                          className="w-full accent-pastel-pink bg-neutral-800 rounded-lg cursor-pointer h-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Angle</span>
                      <span className="font-mono text-slate-400">
                        {selectedLayer.gradient.angle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedLayer.gradient.angle}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          gradient: {
                            ...selectedLayer.gradient!,
                            angle: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Fill (Clipping Text) */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                Image Fill (Clip Text)
              </label>

              {selectedLayer.bgImage ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg border border-slate-700 overflow-hidden shrink-0">
                    <img
                      src={selectedLayer.bgImage}
                      alt="Text fill"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-slate-500">Image fill applied</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <label className="flex-1 flex items-center justify-center py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-pastel-pink rounded-lg text-[10px] font-semibold text-slate-300 cursor-pointer transition-colors">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                state.updateTextLayer(selectedLayer.id, {
                                  bgImage: ev.target.result as string,
                                  shadow: false,
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      <button
                        onClick={() => state.updateTextLayer(selectedLayer.id, { bgImage: null })}
                        className="py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-red-400 hover:text-red-400 rounded-lg text-[10px] font-semibold text-slate-400 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center p-2.5 border-2 border-dashed border-neutral-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-neutral-950/80 hover:bg-neutral-800/80 transition-all text-center">
                  <span className="text-xs font-medium text-slate-300">
                    Upload image to clip into text
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          state.updateTextLayer(selectedLayer.id, {
                            bgImage: ev.target.result as string,
                            shadow: false,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}

              {selectedLayer.bgImage && (
                <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Zoom</span>
                      <span className="font-mono text-slate-400">
                        {selectedLayer.bgImageZoom ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="400"
                      value={selectedLayer.bgImageZoom ?? 100}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          bgImageZoom: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Offset X</span>
                        <span className="font-mono text-slate-400">
                          {selectedLayer.bgImageOffsetX || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        value={selectedLayer.bgImageOffsetX || 0}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            bgImageOffsetX: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Offset Y</span>
                        <span className="font-mono text-slate-400">
                          {selectedLayer.bgImageOffsetY || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        value={selectedLayer.bgImageOffsetY || 0}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            bgImageOffsetY: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Position Offsets X / Y */}
            <div className="space-y-2 pt-1 border-t border-neutral-800/60">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position X (Horizontal)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.x}px</span>
                </div>
                <input
                  type="range"
                  min="-300"
                  max="300"
                  value={selectedLayer.x}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { x: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position Y (Vertical)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.y}px</span>
                </div>
                <input
                  type="range"
                  min="-300"
                  max="300"
                  value={selectedLayer.y}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { y: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Rotation</span>
                  <span className="font-mono text-slate-400">{selectedLayer.rotation ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedLayer.rotation ?? 0}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, {
                      rotation: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Pitch Slider (Rotate X) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.pitch ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={selectedLayer.pitch ?? 0}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, {
                      pitch: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Yaw Slider (Rotate Y) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
                  <span className="font-mono text-slate-400">{selectedLayer.yaw ?? 0}°</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={selectedLayer.yaw ?? 0}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, {
                      yaw: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Skew Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Skew X</span>
                    <span className="font-mono text-slate-400">{selectedLayer.skewX ?? 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={selectedLayer.skewX ?? 0}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, {
                        skewX: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Skew Y</span>
                    <span className="font-mono text-slate-400">{selectedLayer.skewY ?? 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={selectedLayer.skewY ?? 0}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, {
                        skewY: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Stretch X / Stretch Y Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Stretch X</span>
                    <span className="font-mono text-slate-400">
                      {(selectedLayer.scaleX ?? 1).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="8.0"
                    step="0.05"
                    value={selectedLayer.scaleX ?? 1}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, {
                        scaleX: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Stretch Y</span>
                    <span className="font-mono text-slate-400">
                      {(selectedLayer.scaleY ?? 1).toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="8.0"
                    step="0.05"
                    value={selectedLayer.scaleY ?? 1}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, {
                        scaleY: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Opacity</span>
                  <span className="font-mono text-slate-400">{selectedLayer.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.opacity ?? 100}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { opacity: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Layer Depth Position (Above vs Behind Mockup) */}
            <div className="space-y-1.5 pt-1 border-t border-neutral-800/60">
              <label className="block text-[11px] font-semibold text-slate-300">
                Layer Layering Depth
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => state.updateTextLayer(selectedLayer.id, { position: 'above' })}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    (selectedLayer.position || 'above') === 'above'
                      ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Above Mockup
                </button>
                <button
                  type="button"
                  onClick={() =>
                    state.updateTextLayer(selectedLayer.id, { position: 'underneath' })
                  }
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selectedLayer.position === 'underneath'
                      ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Behind Mockup
                </button>
              </div>
            </div>

            {/* Text Shadow Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
              <span
                className={`text-xs font-medium ${
                  selectedLayer.bgImage ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                Drop Shadow
              </span>
              <button
                disabled={!!selectedLayer.bgImage}
                onClick={() =>
                  state.updateTextLayer(selectedLayer.id, { shadow: !selectedLayer.shadow })
                }
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  selectedLayer.bgImage
                    ? 'bg-slate-800/50 cursor-not-allowed'
                    : selectedLayer.shadow
                      ? 'bg-pastel-blue'
                      : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    selectedLayer.shadow ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderElementsSection = () => {
    const elements = state.canvasElements || [];
    const selectedElement = elements.find((el) => el.id === state.selectedElementId);

    const createSvgDataUri = (svg: string): string => {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    const arrowItems = Array.from({ length: 10 }).map((_, i) => ({
      id: `arrow-${i + 1}`,
      src: `/element/arrow/${i + 1}.svg`,
      label: `Arrow ${i + 1}`,
    }));

    const lineItems = [
      {
        id: 'line-straight',
        label: 'Straight Line',
        src: createSvgDataUri(
          `<svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="8" width="100" height="4" rx="2" fill="black"/></svg>`
        ),
      },
      {
        id: 'line-perpendicular',
        label: 'Perpendicular Cross',
        src: createSvgDataUri(
          `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="28" width="100" height="4" rx="2" fill="black"/><rect x="48" y="0" width="4" height="60" rx="2" fill="black"/></svg>`
        ),
      },
      {
        id: 'line-t-junction',
        label: 'T-Junction',
        src: createSvgDataUri(
          `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="4" rx="2" fill="black"/><rect x="48" y="0" width="4" height="60" rx="2" fill="black"/></svg>`
        ),
      },
      {
        id: 'line-dashed',
        label: 'Dashed Line',
        src: createSvgDataUri(
          `<svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="10" x2="96" y2="10" stroke="black" stroke-width="2" stroke-linecap="round" stroke-dasharray="12 10"/></svg>`
        ),
      },
      {
        id: 'line-dotted',
        label: 'Dotted Line',
        src: createSvgDataUri(
          `<svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><line x1="6" y1="10" x2="94" y2="10" stroke="black" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 14"/></svg>`
        ),
      },
      {
        id: 'line-corner',
        label: 'Corner L-Line',
        src: createSvgDataUri(
          `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        ),
      },
      {
        id: 'line-corner-dashed',
        label: 'Dashed Corner L',
        src: createSvgDataUri(
          `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="9 7"/></svg>`
        ),
      },
      {
        id: 'line-corner-rounded',
        label: 'Rounded L',
        src: createSvgDataUri(
          `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 40 A 14 14 0 0 0 20 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        ),
      },
      {
        id: 'line-corner-rounded-dashed',
        label: 'Dashed Rounded L',
        src: createSvgDataUri(
          `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 40 A 14 14 0 0 0 20 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="9 7"/></svg>`
        ),
      },
    ];

    const createEmojiSvgDataUri = (char: string): string => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50%" y="55%" dominant-baseline="central" text-anchor="middle" font-size="75">${char}</text></svg>`;
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };

    const emojiPresets = [
      // Smile & Kiss Face Family
      '😘',
      '😗',
      '😚',
      '😙',
      '🥰',
      '😍',
      '🤩',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '😋',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '😏',
      '🥳',
      '😎',
      '🤓',
      '🧐',
      '😌',
      '🤯',
      '🤠',
      '🥸',
      '😴',
      '🤤',
      '😍',
      // Hand & Gesture Family
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🫰',
      '🤟',
      '🤘',
      '🤙',
      '🫱',
      '🫲',
      '🫳',
      '🫴',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '🫵',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '🫶',
      '🤲',
      '🤝',
      '🙏',
      '✍️',
      '💅',
      '🤳',
      '💪',
      '🦾',
      '🦿',
      // Popular Reactions & Symbols
      '🔥',
      '🚀',
      '✨',
      '💡',
      '💖',
      '⭐',
      '🎉',
      '🎯',
      '⚡',
      '📌',
      '👍',
      '🙌',
      '👏',
      '👋',
      '💯',
      '🌟',
      '🎨',
      '💻',
      '📱',
      '🔒',
      '🛠️',
      '🔔',
      '💬',
      '👑',
      '🏆',
      '❤️',
      '🖤',
      '🤍',
      '🧡',
      '💛',
      '💚',
      '💙',
    ];

    return (
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
        {/* Header */}
        <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhosphorIcons.CursorClick weight="duotone" className="w-4 h-4 text-pastel-pink" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Elements</h3>
          </div>
        </div>

        {/* Emojis Category Grid */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs items-center">
            <span className="font-semibold text-slate-300">Emojis (Click to Add)</span>
            <span className="text-[10px] font-mono text-amber-300">
              {elements.filter((el) => el.category === 'emoji').length} emojis
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800 max-h-36 overflow-y-auto no-scrollbar">
            {emojiPresets.map((char, idx) => (
              <button
                key={`${char}-${idx}`}
                type="button"
                title={`Add ${char}`}
                onClick={() =>
                  state.addCanvasElement(`emoji-${idx}`, createEmojiSvgDataUri(char), 'emoji')
                }
                className="p-1.5 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-amber-400/60 hover:bg-amber-400/10 transition-all flex items-center justify-center text-xl cursor-pointer group hover:scale-125 duration-150"
              >
                <span>{char}</span>
              </button>
            ))}
          </div>

          {/* Custom Emoji Input */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={customEmojiInput}
              onChange={(e) => setCustomEmojiInput(e.target.value)}
              placeholder="Type or paste any emoji (e.g. 🤩)"
              className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pastel-pink"
            />
            <button
              type="button"
              disabled={!customEmojiInput.trim()}
              onClick={() => {
                const val = customEmojiInput.trim();
                if (val) {
                  state.addCanvasElement(
                    `emoji-custom-${Date.now()}`,
                    createEmojiSvgDataUri(val),
                    'emoji'
                  );
                  setCustomEmojiInput('');
                }
              }}
              className="px-3 py-1.5 bg-pastel-pink/20 hover:bg-pastel-pink/30 text-pastel-pink border border-pastel-pink/40 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              Add
            </button>
          </div>
        </div>

        {/* Lines Category Grid */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs items-center">
            <span className="font-semibold text-slate-300">Lines (Click to Add)</span>
            <span className="text-[10px] font-mono text-[#a2d2ff]">
              {elements.filter((el) => el.category === 'line').length} lines
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
            {lineItems.map((item) => (
              <button
                key={item.id}
                type="button"
                title={`Add ${item.label}`}
                onClick={() => state.addCanvasElement(item.id, item.src, 'line')}
                className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-pastel-blue/60 hover:bg-pastel-blue/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
              >
                <div
                  className="w-8 h-5 group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: '#a2d2ff',
                    WebkitMaskImage: `url("${item.src}")`,
                    maskImage: `url("${item.src}")`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }}
                />
                <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Arrows Category Grid */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs items-center">
            <span className="font-semibold text-slate-300">Arrows (Click to Add)</span>
            <span className="text-[10px] font-mono text-pastel-pink">
              {elements.filter((el) => el.category === 'arrow').length} arrows
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800 max-h-36 overflow-y-auto no-scrollbar">
            {arrowItems.map((item) => (
              <button
                key={item.id}
                type="button"
                title={`Add ${item.label}`}
                onClick={() => state.addCanvasElement(item.id, item.src, 'arrow')}
                className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-pastel-pink/60 hover:bg-pastel-pink/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
              >
                <div
                  className="w-6 h-6 group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: '#a2d2ff',
                    WebkitMaskImage: `url(${item.src})`,
                    maskImage: `url(${item.src})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                  }}
                />
                <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shapes Category Grid */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs items-center">
            <span className="font-semibold text-slate-300">Shapes (Click to Add)</span>
            <span className="text-[10px] font-mono text-pastel-pink">
              {(state.shapeLayers || []).length} shapes
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
            {(
              [
                { id: 'square', label: 'Square' },
                { id: 'rectangle', label: 'Rectangle' },
                { id: 'circle', label: 'Circle' },
                { id: 'hexagon', label: 'Hexagon' },
                { id: 'quote', label: 'Quote' },
              ] as { id: ShapeType; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                title={`Add ${item.label}`}
                onClick={() => state.addShapeLayer(item.id)}
                className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-pastel-blue/60 hover:bg-pastel-blue/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
              >
                <ShapePreview
                  type={item.id}
                  className="w-6 h-6 group-hover:scale-110 transition-transform"
                />
                <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Elements List */}
        {elements.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Canvas Elements ({elements.length})
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {elements.map((el, index) => {
                const isSelected = el.id === state.selectedElementId;
                return (
                  <div
                    key={el.id}
                    onClick={() => state.selectCanvasElement(el.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-pastel-pink/15 border-pastel-pink text-white font-bold'
                        : 'bg-neutral-900/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {el.category === 'emoji' ? (
                        <img
                          src={el.src}
                          alt="Emoji"
                          className="w-5 h-5 shrink-0 object-contain pointer-events-none"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 shrink-0"
                          style={{
                            backgroundColor: el.color || '#a2d2ff',
                            WebkitMaskImage: `url("${el.src}")`,
                            maskImage: `url("${el.src}")`,
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center',
                          }}
                        />
                      )}
                      <span className="text-xs truncate">
                        {el.elementId} #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-slate-400">
                        {el.position === 'underneath' ? 'Behind' : 'Above'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.duplicateCanvasElement(el.id);
                        }}
                        title="Duplicate element"
                        className="p-1 hover:text-pastel-pink text-slate-400 transition-colors cursor-pointer"
                      >
                        <Copy01 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.removeCanvasElement(el.id);
                        }}
                        title="Delete element"
                        className="p-1 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
                      >
                        <Trash01 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shapes List */}
        {(state.shapeLayers || []).length > 0 && (
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Shapes ({state.shapeLayers.length})
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
              {state.shapeLayers.map((shape, index) => {
                const isSelected = shape.id === state.selectedShapeId;
                return (
                  <div
                    key={shape.id}
                    onClick={() => state.selectShapeLayer(shape.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-pastel-pink/15 border-pastel-pink text-white font-bold'
                        : 'bg-neutral-900/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ShapePreview
                        type={shape.shapeType}
                        color={shape.color}
                        className="w-5 h-5 shrink-0"
                      />
                      <span className="text-xs truncate capitalize">
                        {shape.shapeType} #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-slate-400">
                        {shape.position === 'underneath' ? 'Behind' : 'Above'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.duplicateShapeLayer(shape.id);
                        }}
                        title="Duplicate shape"
                        className="p-1 hover:text-pastel-pink text-slate-400 transition-colors cursor-pointer"
                      >
                        <Copy01 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          state.removeShapeLayer(shape.id);
                        }}
                        title="Delete shape"
                        className="p-1 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
                      >
                        <Trash01 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Shape Editor */}
        {(() => {
          const selectedShape = (state.shapeLayers || []).find(
            (s) => s.id === state.selectedShapeId
          );
          if (!selectedShape) return null;
          const isUniform = selectedShape.shapeType !== 'rectangle';
          const supportsRadius =
            selectedShape.shapeType === 'square' || selectedShape.shapeType === 'rectangle';
          return (
            <div className="space-y-4 pt-3 border-t border-neutral-800/80 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="capitalize">Editing: {selectedShape.shapeType}</span>
                <button
                  type="button"
                  onClick={() => state.selectShapeLayer(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Deselect
                </button>
              </div>

              {/* Shape Color */}
              {/* Shape Color */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Color
                </label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {[
                    '#ffffff',
                    '#000000',
                    '#ffafcc',
                    '#a2d2ff',
                    '#cdb4db',
                    '#fef08a',
                    '#4ade80',
                    '#f87171',
                    '#38bdf8',
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        state.updateShapeLayer(selectedShape.id, { color: c, gradient: null })
                      }
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                        !selectedShape.gradient && selectedShape.color === c
                          ? 'border-white scale-110 shadow-md ring-2 ring-pastel-pink/50'
                          : 'border-slate-700/60 hover:scale-105'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedShape.color || '#a2d2ff'}
                    onChange={(e) =>
                      state.updateShapeLayer(selectedShape.id, {
                        color: e.target.value,
                        gradient: null,
                      })
                    }
                    className="w-6 h-6 rounded-full border border-slate-700 bg-transparent cursor-pointer p-0"
                    title="Custom Color"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedShape.color || '#a2d2ff'}
                    onChange={(e) =>
                      state.updateShapeLayer(selectedShape.id, {
                        color: e.target.value,
                        gradient: null,
                      })
                    }
                    placeholder="#a2d2ff"
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs font-mono rounded-lg px-2.5 py-1 text-slate-200"
                  />
                </div>
              </div>

              {/* Gradient Shape */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Gradient Fill
                  </label>
                  <button
                    onClick={() =>
                      state.updateShapeLayer(selectedShape.id, {
                        gradient: selectedShape.gradient
                          ? null
                          : { color1: '#ffafcc', color2: '#a2d2ff', angle: 135 },
                      })
                    }
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      selectedShape.gradient ? 'bg-pastel-pink' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                        selectedShape.gradient ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {selectedShape.gradient && (
                  <div className="space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Presets ({GRADIENT_PRESETS.length})
                      </span>
                      {showAllShapeGradients && (
                        <button
                          type="button"
                          onClick={() => setShowAllShapeGradients(false)}
                          className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Collapse presets"
                        >
                          <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
                        </button>
                      )}
                    </div>

                    <div
                      className={`grid grid-cols-4 gap-2 ${
                        showAllShapeGradients
                          ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5'
                          : 'p-1'
                      }`}
                    >
                      {(!showAllShapeGradients
                        ? GRADIENT_PRESETS.slice(0, 3)
                        : GRADIENT_PRESETS
                      ).map((g) => {
                        const isSelected =
                          selectedShape.gradient?.color1.toLowerCase() === g.c1.toLowerCase() &&
                          selectedShape.gradient?.color2.toLowerCase() === g.c2.toLowerCase();
                        return (
                          <button
                            key={g.name}
                            onClick={() =>
                              state.updateShapeLayer(selectedShape.id, {
                                gradient: {
                                  ...selectedShape.gradient!,
                                  color1: g.c1,
                                  color2: g.c2,
                                },
                              })
                            }
                            title={g.name}
                            className={`h-8 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-white ring-2 ring-pastel-pink scale-105'
                                : 'border-slate-700/80 hover:scale-105'
                            }`}
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
                            }}
                          />
                        );
                      })}

                      {!showAllShapeGradients && GRADIENT_PRESETS.length > 3 && (
                        <div className="relative h-8">
                          <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                          <button
                            type="button"
                            onClick={() => setShowAllShapeGradients(true)}
                            title={`Show all ${GRADIENT_PRESETS.length} gradients`}
                            className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${GRADIENT_PRESETS[3].c1}, ${GRADIENT_PRESETS[3].c2})`,
                            }}
                          >
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                              <span className="text-[10px] font-bold tracking-tight">
                                +{GRADIENT_PRESETS.length - 3}
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Color 1 */}
                      <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400">Color 1</span>
                          <button
                            type="button"
                            onClick={() => {
                              const parsed = parseColorAndAlpha(selectedShape.gradient!.color1);
                              state.updateShapeLayer(selectedShape.id, {
                                gradient: {
                                  ...selectedShape.gradient!,
                                  color1:
                                    parsed.alpha === 0
                                      ? formatColorWithAlpha(parsed.hex, 100)
                                      : 'transparent',
                                },
                              });
                            }}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                              parseColorAndAlpha(selectedShape.gradient.color1).alpha === 0
                                ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                                : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Toggle transparent"
                          >
                            {parseColorAndAlpha(selectedShape.gradient.color1).alpha === 0
                              ? 'Transparent'
                              : 'Make Clear'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: selectedShape.gradient.color1 }}
                            />
                            <input
                              type="color"
                              value={parseColorAndAlpha(selectedShape.gradient.color1).hex}
                              onChange={(e) => {
                                const currentAlpha = parseColorAndAlpha(
                                  selectedShape.gradient!.color1
                                ).alpha;
                                state.updateShapeLayer(selectedShape.id, {
                                  gradient: {
                                    ...selectedShape.gradient!,
                                    color1: formatColorWithAlpha(
                                      e.target.value,
                                      currentAlpha === 0 ? 100 : currentAlpha
                                    ),
                                  },
                                });
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                          </div>
                          <input
                            type="text"
                            value={selectedShape.gradient.color1}
                            onChange={(e) =>
                              state.updateShapeLayer(selectedShape.id, {
                                gradient: {
                                  ...selectedShape.gradient!,
                                  color1: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                            <span>Opacity</span>
                            <span className="font-mono font-medium">
                              {parseColorAndAlpha(selectedShape.gradient.color1).alpha}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={parseColorAndAlpha(selectedShape.gradient.color1).alpha}
                            onChange={(e) => {
                              const hex = parseColorAndAlpha(selectedShape.gradient!.color1).hex;
                              state.updateShapeLayer(selectedShape.id, {
                                gradient: {
                                  ...selectedShape.gradient!,
                                  color1: formatColorWithAlpha(hex, Number(e.target.value)),
                                },
                              });
                            }}
                            className="w-full accent-pastel-pink bg-neutral-800 rounded-lg cursor-pointer h-1"
                          />
                        </div>
                      </div>

                      {/* Color 2 */}
                      <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400">Color 2</span>
                          <button
                            type="button"
                            onClick={() => {
                              const parsed = parseColorAndAlpha(selectedShape.gradient!.color2);
                              state.updateShapeLayer(selectedShape.id, {
                                gradient: {
                                  ...selectedShape.gradient!,
                                  color2:
                                    parsed.alpha === 0
                                      ? formatColorWithAlpha(parsed.hex, 100)
                                      : 'transparent',
                                },
                              });
                            }}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                              parseColorAndAlpha(selectedShape.gradient.color2).alpha === 0
                                ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                                : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Toggle transparent"
                          >
                            {parseColorAndAlpha(selectedShape.gradient.color2).alpha === 0
                              ? 'Transparent'
                              : 'Make Clear'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                            <div
                              className="absolute inset-0"
                              style={{ backgroundColor: selectedShape.gradient.color2 }}
                            />
                            <input
                              type="color"
                              value={parseColorAndAlpha(selectedShape.gradient.color2).hex}
                              onChange={(e) => {
                                const currentAlpha = parseColorAndAlpha(
                                  selectedShape.gradient!.color2
                                ).alpha;
                                state.updateShapeLayer(selectedShape.id, {
                                  gradient: {
                                    ...selectedShape.gradient!,
                                    color2: formatColorWithAlpha(
                                      e.target.value,
                                      currentAlpha === 0 ? 100 : currentAlpha
                                    ),
                                  },
                                });
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                          </div>
                          <input
                            type="text"
                            value={selectedShape.gradient.color2}
                            onChange={(e) =>
                              state.updateShapeLayer(selectedShape.id, {
                                gradient: {
                                  ...selectedShape.gradient!,
                                  color2: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                            <span>Opacity</span>
                            <span className="font-mono font-medium">
                              {parseColorAndAlpha(selectedShape.gradient.color2).alpha}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={parseColorAndAlpha(selectedShape.gradient.color2).alpha}
                            onChange={(e) => {
                              const hex = parseColorAndAlpha(selectedShape.gradient!.color2).hex;
                              state.updateShapeLayer(selectedShape.id, {
                                gradient: {
                                  ...selectedShape.gradient!,
                                  color2: formatColorWithAlpha(hex, Number(e.target.value)),
                                },
                              });
                            }}
                            className="w-full accent-pastel-pink bg-neutral-800 rounded-lg cursor-pointer h-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gradient Angle */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Angle</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.gradient.angle}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedShape.gradient.angle}
                        onChange={(e) =>
                          state.updateShapeLayer(selectedShape.id, {
                            gradient: {
                              ...selectedShape.gradient!,
                              angle: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image Fill (Clip Shape) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Image Fill (Clip Shape)
                </label>

                {selectedShape.bgImage ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg border border-slate-700 overflow-hidden shrink-0">
                      <img
                        src={selectedShape.bgImage}
                        alt="Shape fill"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        Image fill applied
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <label className="flex-1 flex items-center justify-center py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-pastel-pink rounded-lg text-[10px] font-semibold text-slate-300 cursor-pointer transition-colors">
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  state.updateShapeLayer(selectedShape.id, {
                                    bgImage: ev.target.result as string,
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <button
                          onClick={() =>
                            state.updateShapeLayer(selectedShape.id, { bgImage: null })
                          }
                          className="py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-red-400 hover:text-red-400 rounded-lg text-[10px] font-semibold text-slate-400 cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-2.5 border-2 border-dashed border-neutral-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-neutral-950/80 hover:bg-neutral-800/80 transition-all text-center">
                    <span className="text-xs font-medium text-slate-300">
                      Upload image to clip into shape
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            state.updateShapeLayer(selectedShape.id, {
                              bgImage: ev.target.result as string,
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Image Fill Adjustments */}
              {selectedShape.bgImage && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Zoom</span>
                      <span className="font-mono text-slate-400">
                        {selectedShape.bgImageZoom ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="400"
                      value={selectedShape.bgImageZoom ?? 100}
                      onChange={(e) =>
                        state.updateShapeLayer(selectedShape.id, {
                          bgImageZoom: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Offset X</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.bgImageOffsetX || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        value={selectedShape.bgImageOffsetX || 0}
                        onChange={(e) =>
                          state.updateShapeLayer(selectedShape.id, {
                            bgImageOffsetX: Number(e.target.value),
                          })
                        }
                        className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Offset Y</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.bgImageOffsetY || 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        value={selectedShape.bgImageOffsetY || 0}
                        onChange={(e) =>
                          state.updateShapeLayer(selectedShape.id, {
                            bgImageOffsetY: Number(e.target.value),
                          })
                        }
                        className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>
                  </div>

                  {/* Pattern Repeat */}
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                      Pattern Repeat
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                      <button
                        type="button"
                        onClick={() =>
                          state.updateShapeLayer(selectedShape.id, { bgImageRepeat: false })
                        }
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          !selectedShape.bgImageRepeat
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                            : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        No Repeat (Single)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          state.updateShapeLayer(selectedShape.id, { bgImageRepeat: true })
                        }
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          selectedShape.bgImageRepeat
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                            : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        Repeat (Tile)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Shape Size */}
              {isUniform ? (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Size</span>
                    <span className="font-mono text-slate-400">{selectedShape.width || 120}px</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={400}
                    value={selectedShape.width || 120}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      state.updateShapeLayer(selectedShape.id, { width: v, height: v });
                    }}
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Width</span>
                      <span className="font-mono text-slate-400">
                        {selectedShape.width || 160}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={600}
                      value={selectedShape.width || 160}
                      onChange={(e) =>
                        state.updateShapeLayer(selectedShape.id, {
                          width: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Height</span>
                      <span className="font-mono text-slate-400">
                        {selectedShape.height || 100}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={600}
                      value={selectedShape.height || 100}
                      onChange={(e) =>
                        state.updateShapeLayer(selectedShape.id, {
                          height: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Border Radius (Square & Rectangle only) */}
              {supportsRadius && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Border Radius</span>
                    <span className="font-mono text-slate-400">
                      {selectedShape.borderRadius ?? 8}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    value={selectedShape.borderRadius ?? 8}
                    onChange={(e) =>
                      state.updateShapeLayer(selectedShape.id, {
                        borderRadius: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              )}

              {/* Rotation Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Rotation</span>
                  <span className="font-mono text-slate-400">{selectedShape.rotation || 0}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={selectedShape.rotation || 0}
                  onChange={(e) =>
                    state.updateShapeLayer(selectedShape.id, {
                      rotation: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              {/* Pitch Slider (Rotate X) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
                  <span className="font-mono text-slate-400">{selectedShape.pitch || 0}°</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  value={selectedShape.pitch || 0}
                  onChange={(e) =>
                    state.updateShapeLayer(selectedShape.id, {
                      pitch: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              {/* Yaw Slider (Rotate Y) */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
                  <span className="font-mono text-slate-400">{selectedShape.yaw || 0}°</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  value={selectedShape.yaw || 0}
                  onChange={(e) =>
                    state.updateShapeLayer(selectedShape.id, {
                      yaw: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              {/* Skew Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Skew X</span>
                    <span className="font-mono text-slate-400">{selectedShape.skewX || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min={-60}
                    max={60}
                    value={selectedShape.skewX || 0}
                    onChange={(e) =>
                      state.updateShapeLayer(selectedShape.id, {
                        skewX: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Skew Y</span>
                    <span className="font-mono text-slate-400">{selectedShape.skewY || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min={-60}
                    max={60}
                    value={selectedShape.skewY || 0}
                    onChange={(e) =>
                      state.updateShapeLayer(selectedShape.id, {
                        skewY: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Opacity</span>
                  <span className="font-mono text-slate-400">{selectedShape.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={selectedShape.opacity ?? 100}
                  onChange={(e) =>
                    state.updateShapeLayer(selectedShape.id, {
                      opacity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              {/* Blur Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Blur</span>
                  <span className="font-mono text-slate-400">{selectedShape.blur ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={selectedShape.blur ?? 0}
                  onChange={(e) =>
                    state.updateShapeLayer(selectedShape.id, {
                      blur: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              {/* Drop Shadow Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-[11px] font-semibold text-slate-300">Drop Shadow</label>
                <Toggle
                  isSelected={!!selectedShape.shadow}
                  onChange={(checked) =>
                    state.updateShapeLayer(selectedShape.id, { shadow: checked })
                  }
                  size="sm"
                />
              </div>

              {/* Glassmorphic Option */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">Glassmorphic</label>
                  </div>
                  <Toggle
                    isSelected={!!selectedShape.glassmorphism}
                    onChange={(checked) => {
                      state.updateShapeLayer(selectedShape.id, {
                        glassmorphism: checked,
                        // If enabling glassmorphism and opacity is 100%, set a nice translucent default
                        ...(checked && (selectedShape.opacity ?? 100) === 100
                          ? { opacity: 50 }
                          : {}),
                      });
                    }}
                    size="sm"
                  />
                </div>

                {selectedShape.glassmorphism && (
                  <div className="space-y-3 pl-2.5 border-l-2 border-pastel-pink/40 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Glass Blur Slider */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Glass Blur</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.glassmorphismBlur ?? 16}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={50}
                        value={selectedShape.glassmorphismBlur ?? 16}
                        onChange={(e) =>
                          state.updateShapeLayer(selectedShape.id, {
                            glassmorphismBlur: Number(e.target.value),
                          })
                        }
                        className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>

                    {/* Frosted Border Highlight Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Frosted Border Highlight
                      </span>
                      <Toggle
                        isSelected={selectedShape.glassmorphismBorder !== false}
                        onChange={(checked) =>
                          state.updateShapeLayer(selectedShape.id, {
                            glassmorphismBorder: checked,
                          })
                        }
                        size="sm"
                      />
                    </div>

                    {/* Quick Glass Presets */}
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Glass Presets
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            state.updateShapeLayer(selectedShape.id, {
                              color: 'rgba(255, 255, 255, 0.25)',
                              gradient: null,
                              opacity: 70,
                              glassmorphismBlur: 20,
                              glassmorphismBorder: true,
                            })
                          }
                          className="py-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-[10px] font-semibold text-slate-200 text-center transition-all cursor-pointer hover:border-pastel-pink"
                        >
                          Frosted White
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            state.updateShapeLayer(selectedShape.id, {
                              color: 'rgba(15, 23, 42, 0.45)',
                              gradient: null,
                              opacity: 80,
                              glassmorphismBlur: 24,
                              glassmorphismBorder: true,
                            })
                          }
                          className="py-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-[10px] font-semibold text-slate-200 text-center transition-all cursor-pointer hover:border-pastel-pink"
                        >
                          Smoky Dark
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            state.updateShapeLayer(selectedShape.id, {
                              color: 'rgba(255, 255, 255, 0.08)',
                              gradient: null,
                              opacity: 40,
                              glassmorphismBlur: 32,
                              glassmorphismBorder: true,
                            })
                          }
                          className="py-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-[10px] font-semibold text-slate-200 text-center transition-all cursor-pointer hover:border-pastel-pink"
                        >
                          Crystal Clear
                        </button>
                      </div>
                    </div>

                    {/* Note: Canvas handles hidden for pristine glass rendering */}
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] text-slate-400 leading-snug">
                      <PhosphorIcons.Info className="w-3.5 h-3.5 text-pastel-pink shrink-0 mt-0.5" />
                      <span>
                        When Glassmorphic is enabled, on-canvas delete, rotate, and resize handles are hidden. Use sidebar controls to adjust or delete this shape.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Layering Depth */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Layering Depth
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => state.updateShapeLayer(selectedShape.id, { position: 'above' })}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      (selectedShape.position || 'above') === 'above'
                        ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                        : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Above Mockup
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      state.updateShapeLayer(selectedShape.id, { position: 'underneath' })
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      selectedShape.position === 'underneath'
                        ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                        : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Behind Mockup
                  </button>
                </div>
              </div>

              {/* Position Offset X & Y */}
              <div className="space-y-2 pt-1 border-t border-neutral-800/60">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Position X (Horizontal)</span>
                    <span className="font-mono text-slate-400">{selectedShape.x || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={-400}
                    max={400}
                    value={selectedShape.x || 0}
                    onChange={(e) =>
                      state.updateShapeLayer(selectedShape.id, {
                        x: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Position Y (Vertical)</span>
                    <span className="font-mono text-slate-400">{selectedShape.y || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={-400}
                    max={400}
                    value={selectedShape.y || 0}
                    onChange={(e) =>
                      state.updateShapeLayer(selectedShape.id, {
                        y: Number(e.target.value),
                      })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Selected Element Editor */}
        {selectedElement && (
          <div className="space-y-4 pt-3 border-t border-neutral-800/80 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Editing: {selectedElement.elementId}</span>
              <button
                type="button"
                onClick={() => state.selectCanvasElement(null)}
                className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Deselect
              </button>
            </div>

            {/* Element Color (Only for non-emoji vector elements) */}
            {selectedElement.category !== 'emoji' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Element Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedElement.color || '#a2d2ff'}
                    onChange={(e) =>
                      state.updateCanvasElement(selectedElement.id, { color: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={selectedElement.color || '#a2d2ff'}
                    onChange={(e) =>
                      state.updateCanvasElement(selectedElement.id, { color: e.target.value })
                    }
                    className="flex-1 bg-neutral-900 border border-neutral-800 text-xs font-mono rounded-lg px-2.5 py-1 text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Rotation</span>
                <span className="font-mono text-slate-400">{selectedElement.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                value={selectedElement.rotation || 0}
                onChange={(e) =>
                  state.updateCanvasElement(selectedElement.id, {
                    rotation: Number(e.target.value),
                  })
                }
                className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Flip Horizontal / Vertical */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Flip Axis
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    state.updateCanvasElement(selectedElement.id, {
                      flipX: !selectedElement.flipX,
                    })
                  }
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedElement.flipX
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <PhosphorIcons.FlipHorizontal className="w-4 h-4" />
                  <span>Flip Horizontal</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    state.updateCanvasElement(selectedElement.id, {
                      flipY: !selectedElement.flipY,
                    })
                  }
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedElement.flipY
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <PhosphorIcons.FlipVertical className="w-4 h-4" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>

            {/* Size (Width & Height) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Width</span>
                  <span className="font-mono text-slate-400">{selectedElement.width || 90}px</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={800}
                  value={selectedElement.width || 90}
                  onChange={(e) =>
                    state.updateCanvasElement(selectedElement.id, {
                      width: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Height</span>
                  <span className="font-mono text-slate-400">{selectedElement.height || 90}px</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={800}
                  value={selectedElement.height || 90}
                  onChange={(e) =>
                    state.updateCanvasElement(selectedElement.id, {
                      height: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Opacity</span>
                <span className="font-mono text-slate-400">{selectedElement.opacity ?? 100}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={selectedElement.opacity ?? 100}
                onChange={(e) =>
                  state.updateCanvasElement(selectedElement.id, {
                    opacity: Number(e.target.value),
                  })
                }
                className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Blur Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Blur</span>
                <span className="font-mono text-slate-400">{selectedElement.blur ?? 0}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={selectedElement.blur ?? 0}
                onChange={(e) =>
                  state.updateCanvasElement(selectedElement.id, {
                    blur: Number(e.target.value),
                  })
                }
                className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Drop Shadow Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-[11px] font-semibold text-slate-300">Drop Shadow</label>
              <Toggle
                isSelected={!!selectedElement.shadow}
                onChange={(checked) =>
                  state.updateCanvasElement(selectedElement.id, { shadow: checked })
                }
                size="sm"
              />
            </div>

            {/* Layering Depth */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Layering Depth
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    state.updateCanvasElement(selectedElement.id, { position: 'above' })
                  }
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    (selectedElement.position || 'above') === 'above'
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Above Mockup
                </button>
                <button
                  type="button"
                  onClick={() =>
                    state.updateCanvasElement(selectedElement.id, { position: 'underneath' })
                  }
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    selectedElement.position === 'underneath'
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Behind Mockup
                </button>
              </div>
            </div>

            {/* Position Offset X & Y */}
            <div className="space-y-2 pt-1 border-t border-neutral-800/60">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position X (Horizontal)</span>
                  <span className="font-mono text-slate-400">{selectedElement.x || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-400}
                  max={400}
                  value={selectedElement.x || 0}
                  onChange={(e) =>
                    state.updateCanvasElement(selectedElement.id, {
                      x: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Position Y (Vertical)</span>
                  <span className="font-mono text-slate-400">{selectedElement.y || 0}px</span>
                </div>
                <input
                  type="range"
                  min={-400}
                  max={400}
                  value={selectedElement.y || 0}
                  onChange={(e) =>
                    state.updateCanvasElement(selectedElement.id, {
                      y: Number(e.target.value),
                    })
                  }
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLayersSection = () => {
    const buildRow = (
      type: 'text' | 'phosphor' | 'element' | 'shape',
      id: string,
      name: string,
      visible: boolean,
      locked: boolean,
      position: 'above' | 'underneath',
      selected: boolean,
      indicator: React.ReactNode
    ) => ({ key: `${type}-${id}`, type, id, name, visible, locked, position, selected, indicator });

    const allRows: ReturnType<typeof buildRow>[] = [];

    (state.textLayers || []).forEach((l) =>
      allRows.push(
        buildRow(
          'text',
          l.id,
          l.name || l.text || 'Text',
          l.visible !== false,
          l.locked === true,
          l.position || 'above',
          (state.selectedTextLayerIds || []).includes(l.id),
          <PhosphorIcons.TextTIcon className="w-3.5 h-3.5 text-pastel-blue shrink-0" />
        )
      )
    );

    (state.phosphorIconLayers || []).forEach((l) => {
      const IconComp = (PhosphorIcons as any)[l.iconId] || PhosphorIcons.Sparkle;
      allRows.push(
        buildRow(
          'phosphor',
          l.id,
          l.name || l.iconId || 'Icon',
          l.visible !== false,
          l.locked === true,
          l.position || 'above',
          (state.selectedPhosphorIconLayerIds || []).includes(l.id),
          <IconComp className="w-3.5 h-3.5 text-pastel-pink shrink-0" />
        )
      );
    });

    (state.canvasElements || []).forEach((el) => {
      const CatIcon =
        el.category === 'emoji'
          ? PhosphorIcons.Smiley
          : el.category === 'line'
            ? PhosphorIcons.LineSegment
            : PhosphorIcons.ArrowRight;
      allRows.push(
        buildRow(
          'element',
          el.id,
          el.name || (el.category === 'emoji' ? 'Emoji' : 'Element'),
          el.visible !== false,
          el.locked === true,
          el.position || 'above',
          (state.selectedElementIds || []).includes(el.id),
          <CatIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        )
      );
    });

    (state.shapeLayers || []).forEach((s) => {
      const ShapeCatIcon =
        s.shapeType === 'circle'
          ? PhosphorIcons.Circle
          : s.shapeType === 'hexagon'
            ? PhosphorIcons.Hexagon
            : s.shapeType === 'quote'
              ? (PhosphorIcons as any).Quotes || PhosphorIcons.ChatCircle || PhosphorIcons.Square
              : s.shapeType === 'rectangle'
                ? PhosphorIcons.Rectangle
                : PhosphorIcons.Square;
      allRows.push(
        buildRow(
          'shape',
          s.id,
          s.name || s.shapeType || 'Shape',
          s.visible !== false,
          s.locked === true,
          s.position || 'above',
          (state.selectedShapeIds || []).includes(s.id),
          <ShapeCatIcon className="w-3.5 h-3.5 text-pastel-green shrink-0" />
        )
      );
    });

    // Sort rows within each position group by layerOrder (index 0 = topmost)
    const layerOrder = state.layerOrder || [];
    const sortByOrder = (rows: typeof allRows) =>
      [...rows].sort((a, b) => {
        const ai = layerOrder.findIndex((e) => e.type === a.type && e.id === a.id);
        const bi = layerOrder.findIndex((e) => e.type === b.type && e.id === b.id);
        const ai2 = ai === -1 ? 9999 : ai;
        const bi2 = bi === -1 ? 9999 : bi;
        return ai2 - bi2;
      });

    const aboveRows = sortByOrder(allRows.filter((r) => r.position === 'above'));
    const underRows = sortByOrder(allRows.filter((r) => r.position === 'underneath'));

    const select = (row: (typeof allRows)[0]) => {
      if (row.type === 'text') state.selectTextLayer(row.id);
      else if (row.type === 'phosphor') state.selectPhosphorIconLayer(row.id);
      else if (row.type === 'shape') state.selectShapeLayer(row.id);
      else state.selectCanvasElement(row.id);
    };

    const update = (row: (typeof allRows)[0], updates: Record<string, unknown>) => {
      if (row.type === 'text') state.updateTextLayer(row.id, updates as never);
      else if (row.type === 'phosphor') state.updatePhosphorIconLayer(row.id, updates as never);
      else if (row.type === 'shape') state.updateShapeLayer(row.id, updates as never);
      else state.updateCanvasElement(row.id, updates as never);
    };

    // Use component-level drag refs (hooks cannot be called inside render functions)
    const handleDragStart = (key: string) => {
      layerDragSrcKey.current = key;
    };

    const handleDragOver = (e: React.DragEvent, key: string) => {
      e.preventDefault();
      if (layerDragOverKey.current !== key) {
        layerDragOverKey.current = key;
        setLayerDropIndicator(key);
      }
    };

    const handleDrop = (targetRow: (typeof allRows)[0]) => {
      const srcKey = layerDragSrcKey.current;
      layerDragSrcKey.current = null;
      layerDragOverKey.current = null;
      setLayerDropIndicator(null);
      if (!srcKey || srcKey === targetRow.key) return;

      const srcRow = allRows.find((r) => r.key === srcKey);
      if (!srcRow || srcRow.position !== targetRow.position) return; // no cross-group drag

      // Build new layerOrder by moving src before target within the same group
      const order = [...layerOrder];
      const srcGlobalIdx = order.findIndex((e) => e.type === srcRow.type && e.id === srcRow.id);
      const tgtGlobalIdx = order.findIndex(
        (e) => e.type === targetRow.type && e.id === targetRow.id
      );

      if (srcGlobalIdx === -1 || tgtGlobalIdx === -1) return;

      // Detect drag direction before mutating the array
      const isDraggingDown = srcGlobalIdx < tgtGlobalIdx;

      // Remove src, then find target's new index and insert:
      //   dragging UP   → insert before target (target stays in place visually)
      //   dragging DOWN → insert after  target (src lands below target)
      const [removed] = order.splice(srcGlobalIdx, 1);
      const newTgtIdx = order.findIndex((e) => e.type === targetRow.type && e.id === targetRow.id);
      order.splice(isDraggingDown ? newTgtIdx + 1 : newTgtIdx, 0, removed);

      state.reorderLayers(order);
    };

    const handleDragEnd = () => {
      layerDragSrcKey.current = null;
      layerDragOverKey.current = null;
      setLayerDropIndicator(null);
    };

    const renderRow = (row: (typeof allRows)[0]) => (
      <div
        key={row.key}
        draggable
        onDragStart={() => handleDragStart(row.key)}
        onDragOver={(e) => handleDragOver(e, row.key)}
        onDrop={() => handleDrop(row)}
        onDragEnd={handleDragEnd}
        onClick={() => select(row)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
          layerDropIndicator === row.key
            ? 'border-pastel-pink/70 bg-pastel-pink/5'
            : row.selected
              ? 'bg-[#a2d2ff]/10 border-[#a2d2ff]/40'
              : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
        } ${!row.visible ? 'opacity-40' : ''}`}
      >
        {/* Drag handle */}
        <PhosphorIcons.DotsSixVerticalIcon
          className="w-3 h-3 text-slate-600 hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        />
        {row.indicator}
        <input
          value={row.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => update(row, { name: e.target.value })}
          className="flex-1 min-w-0 bg-transparent text-xs text-slate-200 focus:outline-none truncate"
          title="Rename layer"
        />
        {/* Above/Behind toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            update(row, { position: row.position === 'above' ? 'underneath' : 'above' });
          }}
          title={
            row.position === 'above'
              ? 'Above mockup — click to move behind'
              : 'Behind mockup — click to move above'
          }
          className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            row.position === 'above'
              ? 'text-pastel-pink hover:bg-neutral-800'
              : 'text-slate-500 hover:bg-neutral-800'
          }`}
        >
          {row.position === 'above' ? (
            <PhosphorIcons.ArrowLineUpIcon className="w-3.5 h-3.5" />
          ) : (
            <PhosphorIcons.ArrowLineDownIcon className="w-3.5 h-3.5" />
          )}
        </button>
        {/* Visibility */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            update(row, { visible: !row.visible });
          }}
          title={row.visible ? 'Hide layer' : 'Show layer'}
          className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            row.visible
              ? 'text-slate-400 hover:text-white hover:bg-neutral-800'
              : 'text-slate-600 hover:bg-neutral-800'
          }`}
        >
          {row.visible ? (
            <PhosphorIcons.EyeIcon className="w-3.5 h-3.5" />
          ) : (
            <PhosphorIcons.EyeSlashIcon className="w-3.5 h-3.5" />
          )}
        </button>
        {/* Lock */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            update(row, { locked: !row.locked });
          }}
          title={row.locked ? 'Unlock layer' : 'Lock layer'}
          className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
            row.locked
              ? 'text-amber-300 hover:bg-neutral-800'
              : 'text-slate-500 hover:text-white hover:bg-neutral-800'
          }`}
        >
          {row.locked ? (
            <PhosphorIcons.LockSimpleIcon className="w-3.5 h-3.5" />
          ) : (
            <PhosphorIcons.LockSimpleOpenIcon className="w-3.5 h-3.5" />
          )}
        </button>
        {/* Duplicate */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (row.type === 'text') state.duplicateTextLayer(row.id);
            else if (row.type === 'phosphor') state.duplicatePhosphorIconLayer(row.id);
            else if (row.type === 'shape') state.duplicateShapeLayer(row.id);
            else state.duplicateCanvasElement(row.id);
          }}
          title="Duplicate layer"
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
        >
          <PhosphorIcons.CopyIcon className="w-3.5 h-3.5" />
        </button>
        {/* Delete */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (row.type === 'text') state.removeTextLayer(row.id);
            else if (row.type === 'phosphor') state.removePhosphorIconLayer(row.id);
            else if (row.type === 'shape') state.removeShapeLayer(row.id);
            else state.removeCanvasElement(row.id);
          }}
          title="Delete layer"
          className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
        >
          <PhosphorIcons.TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    );

    return (
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
        <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhosphorIcons.StackIcon className="w-4 h-4 text-pastel-pink" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Layers</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">{allRows.length}</span>
        </div>

        {allRows.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No layers yet. Add text, icons, or elements from the canvas toolbar.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar pr-1">
            {/* Above mockup group */}
            {aboveRows.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <PhosphorIcons.ArrowLineUpIcon className="w-3 h-3 text-pastel-pink/70" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Above Mockup
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 ml-auto">
                    {aboveRows.length}
                  </span>
                </div>
                <div className="space-y-1">{aboveRows.map(renderRow)}</div>
              </div>
            )}

            {/* Divider — mockup */}
            {aboveRows.length > 0 && underRows.length > 0 && (
              <div className="flex items-center gap-2 py-0.5 px-1">
                <div className="flex-1 border-t border-dashed border-neutral-700/60" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">
                  Mockup Frame
                </span>
                <div className="flex-1 border-t border-dashed border-neutral-700/60" />
              </div>
            )}

            {/* Behind mockup group */}
            {underRows.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  <PhosphorIcons.ArrowLineDownIcon className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Behind Mockup
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 ml-auto">
                    {underRows.length}
                  </span>
                </div>
                <div className="space-y-1">{underRows.map(renderRow)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (mobileSection) {
    if (mobileSection === 'quick') return <QuickModeSection />;
    if (mobileSection === 'perspective') return renderPerspectiveSection();
    if (mobileSection === 'social') return renderSocialSection();
    if (mobileSection === 'techstack') return renderTechStackSection();
    if (mobileSection === 'icons') return renderPhosphorIconsSection();
    if (mobileSection === 'text') return renderTextSection();
    if (mobileSection === 'elements') return renderElementsSection();
    if (mobileSection === 'layers') return renderLayersSection();
    if (mobileSection === 'watermark') return renderWatermarkSection();
    if (mobileSection === 'background') return renderBackgroundSection();
    return null;
  }

  const sidebarMode = state.sidebarMode || 'quick';

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      {/* Quick vs Advanced Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 shrink-0">
        <button
          type="button"
          onClick={() => onChange({ sidebarMode: 'quick' })}
          className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            sidebarMode === 'quick'
              ? 'bg-pastel-pink text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
          }`}
        >
          <PhosphorIcons.Lightning
            weight={sidebarMode === 'quick' ? 'fill' : 'bold'}
            className="w-3.5 h-3.5"
          />
          <span>Quick Mode</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ sidebarMode: 'advanced' })}
          className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            sidebarMode === 'advanced'
              ? 'bg-pastel-pink text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
          }`}
        >
          <PhosphorIcons.SlidersHorizontal
            weight={sidebarMode === 'advanced' ? 'fill' : 'bold'}
            className="w-3.5 h-3.5"
          />
          <span>Advanced</span>
        </button>
      </div>

      {/* Mode Content */}
      {sidebarMode === 'quick' ? (
        <QuickModeSection />
      ) : (
        <>
          {renderPerspectiveSection()}
          {renderBackgroundSection()}
          {renderSocialSection()}
          {renderTechStackSection()}
          {renderPhosphorIconsSection()}
          {renderTextSection()}
          {renderElementsSection()}
          {renderLayersSection()}
          {renderWatermarkSection()}
        </>
      )}
    </div>
  );
};
