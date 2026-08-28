import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import { BackgroundType, ShapeType } from '../../types/studio';
import { SocialIcon, SOCIAL_PLATFORMS, SocialPlatform } from '../SocialIcons';

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

export const FontSelect: React.FC<{
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

export const BackgroundStyleSelect: React.FC<{
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

export const MiniFocalPad: React.FC<{
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

export const SocialPlatformSelect: React.FC<{
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

export const ShapePreview: React.FC<{
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

export interface TiltValues {
  rotateX: number;
  rotateY: number;
  skewX: number;
  skewY: number;
  perspective: number;
  rotation: number;
}

export interface TiltHandlers {
  onRotateX: (v: number) => void;
  onRotateY: (v: number) => void;
  onSkewX: (v: number) => void;
  onSkewY: (v: number) => void;
  onPerspective: (v: number) => void;
  onRotation: (v: number) => void;
}

export const TiltSliderGroup: React.FC<{
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

export interface PositionValues {
  offsetX: number;
  offsetY: number;
}

export interface PositionHandlers {
  onOffsetX: (v: number) => void;
  onOffsetY: (v: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const PositionSliderGroup: React.FC<{
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
          min="-800"
          max="800"
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
          min="-800"
          max="800"
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
