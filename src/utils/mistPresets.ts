export interface MistPreset {
  id: string;
  name: string;
  stops: string[];
  ranges: number; // 3 to 9 (mountain ranges)
  horizon: number; // 20 to 58 (% sky share)
  peaks: number; // 0 to 100 (% peak height)
  sharp: number; // 0 to 100 (% peak profile / alpine)
  haze: number; // 0 to 100 (% fog density)
  seed: number;
}

export const MIST_PRESETS: MistPreset[] = [
  {
    id: 'morning-mist',
    name: 'Morning Mist',
    stops: ['#FBF2E2', '#F3DDC2', '#D9BCAE', '#B08F9B', '#7A6483', '#463A5E'],
    ranges: 5,
    horizon: 42,
    peaks: 50,
    sharp: 55,
    haze: 50,
    seed: 7,
  },
  {
    id: 'blue-hour',
    name: 'Blue Hour',
    stops: ['#EAF2F9', '#D3E3F0', '#A9C4DB', '#7FA0C2', '#54779F', '#324E78'],
    ranges: 5,
    horizon: 40,
    peaks: 60,
    sharp: 45,
    haze: 50,
    seed: 21,
  },
  {
    id: 'ink-wash',
    name: 'Ink Wash',
    stops: ['#F8F6F0', '#EAE5D9', '#C8C2B3', '#9A9483', '#6B6558', '#3B362E'],
    ranges: 4,
    horizon: 44,
    peaks: 45,
    sharp: 30,
    haze: 62,
    seed: 3,
  },
  {
    id: 'dusk-ember',
    name: 'Dusk Ember',
    stops: ['#FBE7CD', '#F5C8A1', '#DD9B88', '#B06E80', '#7A4B6F', '#452F56'],
    ranges: 6,
    horizon: 38,
    peaks: 62,
    sharp: 62,
    haze: 50,
    seed: 12,
  },
  {
    id: 'pine-wind',
    name: 'Pine Wind',
    stops: ['#F2F7ED', '#DEEBD5', '#B6CFB1', '#88AB8D', '#5C8267', '#375343'],
    ranges: 5,
    horizon: 42,
    peaks: 52,
    sharp: 50,
    haze: 45,
    seed: 33,
  },
  {
    id: 'moonlit',
    name: 'Moonlit',
    stops: ['#101828', '#3A4A6B', '#33415F', '#26324C', '#1B2439', '#111826'],
    ranges: 5,
    horizon: 40,
    peaks: 58,
    sharp: 68,
    haze: 50,
    seed: 51,
  },
];

export const getRandomMistPreset = (): MistPreset => {
  const index = Math.floor(Math.random() * MIST_PRESETS.length);
  return MIST_PRESETS[index];
};

// ==========================================
// Color Math & Oklab Blending
// ==========================================

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n =
    parseInt(
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean,
      16
    ) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToOklab(hex: string): [number, number, number] {
  const [r8, g8, b8] = hexToRgb(hex);
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(r8);
  const g = toLinear(g8);
  const b = toLinear(b8);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m_ = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s_ = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);

  const rLin = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const gLin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const bLin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;

  const toGamma = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    const s = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(255, s * 255)));
  };

  return [toGamma(rLin), toGamma(gLin), toGamma(bLin)];
}

export function lerpOklab(c1: string, c2: string, t: number): string {
  const [l1, a1, b1] = rgbToOklab(c1);
  const [l2, a2, b2] = rgbToOklab(c2);
  const L = l1 + (l2 - l1) * t;
  const A = a1 + (a2 - a1) * t;
  const B = b1 + (b2 - b1) * t;
  const [r, g, b] = oklabToRgb(L, A, B);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// 3-point piecewise linear interpolation
export const io = (val: number, min: number, mid: number, max: number): number =>
  val <= 50 ? min + ((mid - min) * val) / 50 : mid + ((max - mid) * (val - 50)) / 50;

// Base color for sky & mist veil falloff
export const getVeilBaseColor = (stops: string[]): string => stops[1] ?? stops[0];

// Ridge top color
export function getRidgeBaseColor(stops: string[], t: number, haze: number = 50): string {
  const o = stops.length > 2 ? stops.slice(2) : stops;
  const i = t * (o.length - 1);
  const l = Math.floor(i);
  const c = lerpOklab(o[l], o[Math.min(o.length - 1, l + 1)], i - l);
  return lerpOklab(c, getVeilBaseColor(stops), Math.min(0.82, (1 - t) * io(haze, 0.15, 0.42, 0.7)));
}

// Ridge crest stroke color
export const getRidgeStrokeColor = (stops: string[], t: number, haze: number = 50): string =>
  lerpOklab(getRidgeBaseColor(stops, t, haze), getVeilBaseColor(stops), 0.8);

export const getRidgeStrokeOpacity = (t: number): number => 0.2 + 0.22 * t;

export const getRidgeGradientEndWeight = (t: number, haze: number = 50): number =>
  Math.min(0.98, (0.95 - 0.4 * t) * io(haze, 0.85, 1, 1.12));

export const getAirHazeOpacity = (haze: number = 50): number => io(haze, 0.08, 0.26, 0.44);

export const getRidgeBlurStdDev = (t: number, h: number): number => (1 - t) * (1 - t) * 0.006 * h;

// ==========================================
// Mountain Ridges & Mist Geometry
// ==========================================

const SAMPLE_POINTS = 110;

function pseudoRandom(val: number): number {
  const s = Math.sin(val) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const xf = x - xi;
  const smooth = xf * xf * (3 - 2 * xf);
  const n = (cx: number) => pseudoRandom(cx * 127.1 + y * 311.7);
  return n(xi) + (n(xi + 1) - n(xi)) * smooth;
}

function ridgeHeightProfile(normX: number, ridgeIdx: number, seed: number, sharp: number = 55): number {
  const freq = 1.7 + ridgeIdx * 0.33;
  const phase = ridgeIdx * 7.31 + 13.7;
  const sharpNorm = sharp / 100;

  const harmonic = (f: number, p: number) => {
    const raw = smoothNoise(normX * f + seed, p) * 2 - 1;
    const peak = 1 - Math.abs(raw);
    const round = 1 - raw * raw;
    return round + (peak - round) * sharpNorm;
  };

  const combined =
    0.52 * harmonic(freq, phase) +
    0.3 * harmonic(freq * 2.15, phase + 1.77) +
    0.18 * harmonic(freq * 4.4, phase + 3.31);

  const envelope = 0.55 + 0.45 * Math.pow(smoothNoise(normX * 1.13 + seed * 0.51, phase + 5.2), 1.4);
  return Math.pow(Math.max(0, combined), 1 + sharpNorm * 0.9) * envelope;
}

export interface MistRidge {
  pts: [number, number][];
  top: number;
  base: number;
  t: number; // 0 (furthest back) to 1 (front)
  fade: number;
}

export interface MistVeil {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  a: number; // opacity
}

export interface MistGeometry {
  ridges: MistRidge[];
  veils: MistVeil[];
  hzY: number;
}

export function evaluateMistGeometry(
  width: number,
  height: number,
  rangesCount: number = 5,
  horizonPct: number = 42,
  peaks: number = 50,
  sharp: number = 55,
  haze: number = 50,
  seed: number = 7
): MistGeometry {
  const c = Math.max(3, Math.min(9, rangesCount));
  const totalCount = Math.ceil(c - 0.001);

  const horizonY = Math.max(0.14, Math.min(0.62, horizonPct / 100)) * height;
  const groundHeight = height - horizonY;

  const heightMult = io(peaks, 0.35, 1, 1.9);
  const hazeMult = io(haze, 0.25, 1, 1.6);
  const seedShift = seed * 0.73;

  const ridges: MistRidge[] = [];
  for (let b = 0; b < totalCount; b++) {
    const t = Math.min(1, b / Math.max(1e-4, c - 1));
    const fade = Math.max(0, Math.min(1, c - b));
    const base = horizonY + Math.pow((b + 1) / c, 1.3) * groundHeight;
    const peakAmp = (0.12 + 0.26 * t) * groundHeight * heightMult * 1.35;

    const pts: [number, number][] = [];
    for (let g = 0; g <= SAMPLE_POINTS; g++) {
      const frac = g / SAMPLE_POINTS;
      const x = frac * width;
      const y = base - peakAmp * ridgeHeightProfile(frac, b, seedShift, sharp);
      pts.push([x, y]);
    }
    ridges.push({ pts, top: base - peakAmp, base, t, fade });
  }

  const veils: MistVeil[] = [];
  for (let b = 0; b < totalCount; b++) {
    const prevBase = b === 0 ? horizonY : ridges[b - 1].base;
    const span = ridges[b].base - prevBase;
    const isFirst = b === 0;

    veils.push({
      cx: (b % 2 === 0 ? 0.32 : 0.68) * width + Math.sin(b * 2.1) * 0.06 * width,
      cy: ridges[b].base + (isFirst ? span * 0.22 : 0),
      rx: 0.62 * width,
      ry: isFirst ? Math.max(0.085 * height, span * 0.95) : Math.max(0.05 * height, span * 0.6),
      a: Math.min(0.92, (0.62 - 0.34 * ridges[b].t) * hazeMult) * ridges[b].fade,
    });
  }

  return { ridges, veils, hzY: horizonY };
}

// Spline path string generator (Catmull-Rom to Cubic Bezier)
export function getSplineCrestPath(pts: [number, number][]): string {
  if (!pts.length) return '';
  let path = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1);
    const cp1y = (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1);
    const cp2x = (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1);
    const cp2y = (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1);

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return path;
}

// Filled mountain body path down to bottom of canvas
export function getFilledRidgePath(ridge: MistRidge, width: number, height: number): string {
  return `${getSplineCrestPath(ridge.pts)} L${width},${height} L0,${height} Z`;
}
