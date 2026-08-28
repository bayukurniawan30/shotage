export type AnimationEasingType =
  | 'ease-in-out'
  | 'linear'
  | 'ease-out'
  | 'ease-in'
  | 'spring';

export interface EasingPresetOption {
  id: AnimationEasingType;
  name: string;
  description: string;
}

export const EASING_PRESET_OPTIONS: EasingPresetOption[] = [
  { id: 'ease-in-out', name: 'Ease In-Out', description: 'Smooth gentle acceleration & deceleration' },
  { id: 'linear', name: 'Linear', description: 'Even constant speed throughout' },
  { id: 'ease-out', name: 'Ease Out', description: 'Fast departure with soft smooth stop' },
  { id: 'ease-in', name: 'Ease In', description: 'Slow start accelerating smoothly to end' },
  { id: 'spring', name: 'Spring', description: 'Snappy motion with slight elastic settle' },
];

export function calculateEasing(progress: number, type: AnimationEasingType = 'ease-in-out'): number {
  const p = Math.max(0, Math.min(1, progress));
  switch (type) {
    case 'linear':
      return p;
    case 'ease-out':
      return 1 - (1 - p) * (1 - p);
    case 'ease-in':
      return p * p;
    case 'spring': {
      const c1 = 1.4;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    }
    case 'ease-in-out':
    default:
      return p < 0.5
        ? 2 * p * p
        : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }
}

export interface AnimationKeyframe {
  id: string;
  timeSec: number; // 0 to 15s
  rotateX: number;
  rotateY: number;
  zoom: number;
  slot2Zoom?: number;
  offsetX: number;
  offsetY: number;
  slot2OffsetX?: number;
  slot2OffsetY?: number;
  slot1Rotate?: number;
  slot2Rotate?: number;
}

export interface AnimationPresetTemplate {
  id: string;
  name: string;
  description: string;
  keyframes: Omit<AnimationKeyframe, 'id'>[];
}

export const ANIMATION_PRESETS: AnimationPresetTemplate[] = [
  {
    id: 'preset-tilt-zoom',
    name: 'Tilt & Zoom',
    description: 'Dynamic 3D perspective tilt with smooth push-in zoom',
    keyframes: [
      { timeSec: 0, rotateX: 18, rotateY: -15, zoom: 70, offsetX: 0, offsetY: 0 },
      { timeSec: 3, rotateX: -8, rotateY: 12, zoom: 105, offsetX: 0, offsetY: 0 },
      { timeSec: 6, rotateX: 10, rotateY: -6, zoom: 85, offsetX: 0, offsetY: 0 },
      { timeSec: 10, rotateX: 0, rotateY: 0, zoom: 95, offsetX: 0, offsetY: 0 },
    ],
  },
  {
    id: 'preset-3d-spin',
    name: '3D Spin Reveal',
    description: 'Cinematic 360-degree Y-axis spin reveal transition',
    keyframes: [
      { timeSec: 0, rotateX: 10, rotateY: -30, zoom: 65, offsetX: 0, offsetY: 0 },
      { timeSec: 4, rotateX: 5, rotateY: 0, zoom: 95, offsetX: 0, offsetY: 0 },
      { timeSec: 8, rotateX: -10, rotateY: 30, zoom: 85, offsetX: 0, offsetY: 0 },
      { timeSec: 12, rotateX: 0, rotateY: 0, zoom: 90, offsetX: 0, offsetY: 0 },
    ],
  },
  {
    id: 'preset-float-drift',
    name: 'Floating Drift',
    description: 'Gentle floating ambient motion with soft tilt sway',
    keyframes: [
      { timeSec: 0, rotateX: 8, rotateY: 8, zoom: 85, offsetX: -10, offsetY: -10 },
      { timeSec: 4, rotateX: -6, rotateY: 10, zoom: 92, offsetX: 10, offsetY: 8 },
      { timeSec: 8, rotateX: 10, rotateY: -8, zoom: 88, offsetX: -8, offsetY: 10 },
      { timeSec: 12, rotateX: -4, rotateY: -6, zoom: 95, offsetX: 8, offsetY: -8 },
      { timeSec: 15, rotateX: 8, rotateY: 8, zoom: 85, offsetX: -10, offsetY: -10 },
    ],
  },
  {
    id: 'preset-pan-zoom',
    name: 'Pan & Feature Reveal',
    description: 'Detailed camera pan across mockup with focus zoom',
    keyframes: [
      { timeSec: 0, rotateX: 12, rotateY: -20, zoom: 110, offsetX: -60, offsetY: -30 },
      { timeSec: 5, rotateX: -12, rotateY: 20, zoom: 110, offsetX: 60, offsetY: 30 },
      { timeSec: 10, rotateX: 0, rotateY: 0, zoom: 85, offsetX: 0, offsetY: 0 },
    ],
  },
  {
    id: 'preset-loop-pulse',
    name: 'Infinite Pulse Loop',
    description: 'Seamless looping push-in zoom pulse and gentle 3D tilt',
    keyframes: [
      { timeSec: 0, rotateX: 0, rotateY: 0, zoom: 85, offsetX: 0, offsetY: 0 },
      { timeSec: 3, rotateX: 12, rotateY: -10, zoom: 105, offsetX: 0, offsetY: 0 },
      { timeSec: 6, rotateX: -8, rotateY: 10, zoom: 95, offsetX: 0, offsetY: 0 },
      { timeSec: 10, rotateX: 0, rotateY: 0, zoom: 85, offsetX: 0, offsetY: 0 },
    ],
  },
  {
    id: 'preset-loop-orbit',
    name: 'Endless Orbit Loop',
    description: 'Continuous smooth 360° perspective rotation returning seamlessly',
    keyframes: [
      { timeSec: 0, rotateX: 10, rotateY: -25, zoom: 90, offsetX: 0, offsetY: 0 },
      { timeSec: 3, rotateX: -10, rotateY: 0, zoom: 98, offsetX: 15, offsetY: -10 },
      { timeSec: 6, rotateX: 10, rotateY: 25, zoom: 90, offsetX: 0, offsetY: 0 },
      { timeSec: 9, rotateX: -8, rotateY: 0, zoom: 98, offsetX: -15, offsetY: 10 },
      { timeSec: 12, rotateX: 10, rotateY: -25, zoom: 90, offsetX: 0, offsetY: 0 },
    ],
  },
  {
    id: 'preset-loop-breathing',
    name: 'Breathing Hover Loop',
    description: 'Subtle organic up-down float with soft tilt for continuous background loop',
    keyframes: [
      { timeSec: 0, rotateX: 5, rotateY: -5, zoom: 90, offsetX: 0, offsetY: 15 },
      { timeSec: 4, rotateX: -5, rotateY: 5, zoom: 96, offsetX: 0, offsetY: -15 },
      { timeSec: 10, rotateX: 5, rotateY: -5, zoom: 90, offsetX: 0, offsetY: 15 },
    ],
  },
];

export type ElementLoopAnimation = 'none' | 'pulse' | 'float' | 'spin' | 'blink' | 'wiggle' | 'counter';

export interface ElementLoopPreset {
  id: ElementLoopAnimation;
  name: string;
  description: string;
  badge: string;
  textOnly?: boolean;
}

export const ELEMENT_LOOP_PRESETS: ElementLoopPreset[] = [
  { id: 'none', name: 'None', description: 'Static layer (no animation)', badge: 'Static' },
  { id: 'pulse', name: 'Pulse (Zoom)', description: 'Smooth pulsing push-in and push-out loop', badge: 'Pulse' },
  { id: 'float', name: 'Float (Hover)', description: 'Gentle vertical floating wave motion', badge: 'Float' },
  { id: 'spin', name: 'Spin (360°)', description: 'Continuous smooth 360-degree rotation', badge: 'Spin' },
  { id: 'blink', name: 'Fade (Blink)', description: 'Rhythmic opacity fading in and out', badge: 'Fade' },
  { id: 'wiggle', name: 'Wiggle (Shake)', description: 'Playful oscillating wobble tilt loop', badge: 'Wiggle' },
  {
    id: 'counter',
    name: 'Counter (0 → N)',
    description: 'Fast animated number roll from 0 to target value',
    badge: 'Counter',
    textOnly: true,
  },
];

/**
 * Computes fast animated counter text from 0 to the target number(s) in `rawText`.
 * Easing: fast out deceleration (quintic ease-out) over `durationSec` (e.g. 1.2s), starting at `startTimeSec`.
 * Supports numbers with prefixes/suffixes ($200, 1,500+, 99.9%, 100k, 4.9/5, etc.).
 * Does not loop; before `startTimeSec` displays 0, after `startTimeSec + durationSec` stays at target value.
 */
export function getAnimatedCounterValue(
  rawText: string,
  currentTimeSec: number,
  durationSec = 1.2,
  startTimeSec = 0
): string {
  if (!rawText || typeof rawText !== 'string') return '';
  if (currentTimeSec < 0) currentTimeSec = 0;

  // Before the animation start time: return initial 0 values
  if (currentTimeSec <= startTimeSec) {
    return rawText.replace(/(\d+(?:,\d{3})*(?:\.\d+)?|\d+\.\d+|\d+)/g, (match) => {
      const decimalParts = match.split('.');
      const hasDecimals = decimalParts.length > 1;
      const decimalPlaces = hasDecimals ? decimalParts[1].length : 0;
      return hasDecimals ? (0).toFixed(decimalPlaces) : '0';
    });
  }

  // After the animation finishes: return exact original target text
  if (currentTimeSec >= startTimeSec + durationSec) {
    return rawText;
  }

  // Quintic ease out for an ultra-fast, snappy rolling counter feel
  const elapsed = currentTimeSec - startTimeSec;
  const progress = Math.min(Math.max(elapsed / durationSec, 0), 1);
  const easeOut = 1 - Math.pow(1 - progress, 4);

  // Regex to match numbers with optional commas or decimals: e.g. "1,250", "200", "4.9", "0.5"
  return rawText.replace(/(\d+(?:,\d{3})*(?:\.\d+)?|\d+\.\d+|\d+)/g, (match) => {
    // Remove commas to parse clean float/int
    const cleanNumStr = match.replace(/,/g, '');
    const targetNum = parseFloat(cleanNumStr);
    if (isNaN(targetNum)) return match;

    const currentVal = targetNum * easeOut;

    // Check if original had decimals
    const decimalParts = match.split('.');
    const hasDecimals = decimalParts.length > 1;
    const decimalPlaces = hasDecimals ? decimalParts[1].length : 0;

    let formattedVal: string;
    if (hasDecimals) {
      formattedVal = currentVal.toFixed(decimalPlaces);
    } else {
      const rounded = Math.round(currentVal);
      // If original had commas (e.g. 1,000 or 25,000), format with commas
      if (match.includes(',')) {
        formattedVal = rounded.toLocaleString('en-US');
      } else {
        formattedVal = String(rounded);
      }
    }

    return formattedVal;
  });
}

