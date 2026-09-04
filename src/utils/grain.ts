export type GrainSize = 'fine' | 'medium' | 'coarse' | 'dot';
export type GrainBlendMode = 'overlay' | 'soft-light' | 'screen' | 'multiply';
export type GrainColor = 'monochrome' | 'chromatic';

export interface GrainTextureConfig {
  baseFrequency: number;
  numOctaves: number;
  tileSize: number;
  label: string;
  desc: string;
}

export const GRAIN_SIZES: Record<GrainSize, GrainTextureConfig> = {
  fine: {
    baseFrequency: 0.85,
    numOctaves: 4,
    tileSize: 140,
    label: 'Fine',
    desc: 'Silky micro-grain',
  },
  medium: {
    baseFrequency: 0.65,
    numOctaves: 3,
    tileSize: 180,
    label: 'Medium',
    desc: 'Classic gradient grain',
  },
  coarse: {
    baseFrequency: 0.42,
    numOctaves: 3,
    tileSize: 220,
    label: 'Coarse',
    desc: 'Tactile editorial grit',
  },
  dot: {
    baseFrequency: 0.95,
    numOctaves: 2,
    tileSize: 120,
    label: 'Stipple',
    desc: 'Crisp pinpoint dots',
  },
};

export const GRAIN_BLEND_MODES: { id: GrainBlendMode; label: string; desc: string }[] = [
  { id: 'overlay', label: 'Overlay', desc: 'Vibrant, high contrast' },
  { id: 'soft-light', label: 'Soft Light', desc: 'Velvety, subtle blend' },
  { id: 'multiply', label: 'Multiply', desc: 'Best for white / light bgs' },
  { id: 'screen', label: 'Screen', desc: 'Best for dark / night bgs' },
];

// Cache generated data URIs to avoid rebuilding strings on every render
const grainCache = new Map<string, string>();

/**
 * Generates an optimized, seamless SVG data URI for organic analog/gradient grain.
 * Uses fractalNoise with seamless tile stitching, luminance saturation matrix,
 * and contrast correction for tangible depth.
 */
export const getGrainSvgUrl = (
  size: GrainSize = 'fine',
  color: GrainColor = 'monochrome'
): string => {
  const cacheKey = `${size}-${color}`;
  const cached = grainCache.get(cacheKey);
  if (cached) return cached;

  const cfg = GRAIN_SIZES[size] || GRAIN_SIZES.fine;
  const isMonochrome = color !== 'chromatic';

  // SVG filter with stitchTiles="stitch" for seamless tiling
  // contrast curve: 1.4 * value - 0.2 expands dynamic range around 0.5 mid-gray
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${cfg.tileSize}' height='${cfg.tileSize}' viewBox='0 0 ${cfg.tileSize} ${cfg.tileSize}'>` +
    `<filter id='grain' x='0%' y='0%' width='100%' height='100%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${cfg.baseFrequency}' numOctaves='${cfg.numOctaves}' stitchTiles='stitch'/>` +
    (isMonochrome ? `<feColorMatrix type='saturate' values='0'/>` : '') +
    `<feColorMatrix type='matrix' values='1.4 0 0 0 -0.2 0 1.4 0 0 -0.2 0 0 1.4 0 -0.2 0 0 0 1 0'/>` +
    `</filter>` +
    `<rect width='100%' height='100%' filter='url(#grain)'/>` +
    `</svg>`;

  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  grainCache.set(cacheKey, uri);
  return uri;
};

export const getGrainTileSize = (size: GrainSize = 'fine'): string => {
  const cfg = GRAIN_SIZES[size] || GRAIN_SIZES.fine;
  return `${cfg.tileSize}px ${cfg.tileSize}px`;
};
