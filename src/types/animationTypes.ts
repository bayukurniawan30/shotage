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

export interface LayerKeyframe {
  id: string;
  timeSec: number; // 0 to durationSec
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  pitch?: number;
  yaw?: number;
  opacity?: number;
  borderRadius?: number;
  fontSize?: number;
  easing?: AnimationEasingType;
}

export interface LayerKeyframeResult {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  pitch?: number;
  yaw?: number;
  opacity?: number;
  borderRadius?: number;
  fontSize?: number;
}

export function evaluateLayerKeyframes<
  T extends {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    pitch?: number;
    yaw?: number;
    opacity?: number;
    borderRadius?: number;
    fontSize?: number;
    keyframes?: LayerKeyframe[];
  }
>(
  layer: T,
  currentTimeSec: number,
  defaultEasing: AnimationEasingType = 'ease-in-out'
): LayerKeyframeResult {
  const kfs = layer.keyframes;
  if (!kfs || kfs.length === 0) {
    return {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      scale: layer.scale,
      scaleX: layer.scaleX,
      scaleY: layer.scaleY,
      rotation: layer.rotation,
      pitch: layer.pitch,
      yaw: layer.yaw,
      opacity: layer.opacity,
      borderRadius: layer.borderRadius,
      fontSize: layer.fontSize,
    };
  }

  const sorted = [...kfs].sort((a, b) => a.timeSec - b.timeSec);
  const t = Math.max(0, currentTimeSec);

  // Before or at first keyframe
  if (t <= sorted[0].timeSec) {
    const first = sorted[0];
    return {
      x: first.x ?? layer.x,
      y: first.y ?? layer.y,
      width: first.width ?? layer.width,
      height: first.height ?? layer.height,
      scale: first.scale ?? layer.scale,
      scaleX: first.scaleX ?? layer.scaleX,
      scaleY: first.scaleY ?? layer.scaleY,
      rotation: first.rotation ?? layer.rotation,
      pitch: first.pitch ?? layer.pitch,
      yaw: first.yaw ?? layer.yaw,
      opacity: first.opacity ?? layer.opacity,
      borderRadius: first.borderRadius ?? layer.borderRadius,
      fontSize: first.fontSize ?? layer.fontSize,
    };
  }

  // After or at last keyframe
  if (t >= sorted[sorted.length - 1].timeSec) {
    const last = sorted[sorted.length - 1];
    return {
      x: last.x ?? layer.x,
      y: last.y ?? layer.y,
      width: last.width ?? layer.width,
      height: last.height ?? layer.height,
      scale: last.scale ?? layer.scale,
      scaleX: last.scaleX ?? layer.scaleX,
      scaleY: last.scaleY ?? layer.scaleY,
      rotation: last.rotation ?? layer.rotation,
      pitch: last.pitch ?? layer.pitch,
      yaw: last.yaw ?? layer.yaw,
      opacity: last.opacity ?? layer.opacity,
      borderRadius: last.borderRadius ?? layer.borderRadius,
      fontSize: last.fontSize ?? layer.fontSize,
    };
  }

  // Between keyframes
  let prevIdx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (t >= sorted[i].timeSec && t <= sorted[i + 1].timeSec) {
      prevIdx = i;
      break;
    }
  }

  const kf1 = sorted[prevIdx];
  const kf2 = sorted[prevIdx + 1];
  const dur = kf2.timeSec - kf1.timeSec;
  const progress = dur > 0 ? (t - kf1.timeSec) / dur : 0;
  const easing = kf1.easing || defaultEasing;
  const factor = calculateEasing(progress, easing);

  const lerpNum = (
    v1: number | undefined,
    v2: number | undefined,
    fallback: number | undefined
  ): number | undefined => {
    const start = v1 ?? fallback;
    const end = v2 ?? fallback;
    if (start === undefined && end === undefined) return undefined;
    const s = start ?? end ?? 0;
    const e = end ?? start ?? 0;
    return s + (e - s) * factor;
  };

  return {
    x: lerpNum(kf1.x, kf2.x, layer.x),
    y: lerpNum(kf1.y, kf2.y, layer.y),
    width: lerpNum(kf1.width, kf2.width, layer.width),
    height: lerpNum(kf1.height, kf2.height, layer.height),
    scale: lerpNum(kf1.scale, kf2.scale, layer.scale),
    scaleX: lerpNum(kf1.scaleX, kf2.scaleX, layer.scaleX),
    scaleY: lerpNum(kf1.scaleY, kf2.scaleY, layer.scaleY),
    rotation: lerpNum(kf1.rotation, kf2.rotation, layer.rotation),
    pitch: lerpNum(kf1.pitch, kf2.pitch, layer.pitch),
    yaw: lerpNum(kf1.yaw, kf2.yaw, layer.yaw),
    opacity: lerpNum(kf1.opacity, kf2.opacity, layer.opacity),
    borderRadius: lerpNum(kf1.borderRadius, kf2.borderRadius, layer.borderRadius),
    fontSize: lerpNum(kf1.fontSize, kf2.fontSize, layer.fontSize),
  };
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
  {
    id: 'preset-loop-isometric',
    name: 'Isometric Glide Loop',
    description: 'Sleek 3D isometric angle sweep with smooth perspective shifts and seamless return',
    keyframes: [
      { timeSec: 0, rotateX: 20, rotateY: -28, zoom: 85, offsetX: -15, offsetY: 10 },
      { timeSec: 3, rotateX: 14, rotateY: -10, zoom: 95, offsetX: 0, offsetY: -10 },
      { timeSec: 6, rotateX: 20, rotateY: 28, zoom: 85, offsetX: 15, offsetY: 10 },
      { timeSec: 9, rotateX: 14, rotateY: 10, zoom: 95, offsetX: 0, offsetY: -10 },
      { timeSec: 12, rotateX: 20, rotateY: -28, zoom: 85, offsetX: -15, offsetY: 10 },
    ],
  },
  {
    id: 'preset-loop-dolly',
    name: 'Cinematic Dolly Loop',
    description: 'Dramatic push-in macro inspection with subtle tilt and seamless pull-back',
    keyframes: [
      { timeSec: 0, rotateX: 0, rotateY: 0, zoom: 80, offsetX: 0, offsetY: 0 },
      { timeSec: 2.5, rotateX: 10, rotateY: -15, zoom: 110, offsetX: -25, offsetY: -15 },
      { timeSec: 5, rotateX: 0, rotateY: 0, zoom: 115, offsetX: 0, offsetY: 0 },
      { timeSec: 7.5, rotateX: -10, rotateY: 15, zoom: 110, offsetX: 25, offsetY: 15 },
      { timeSec: 10, rotateX: 0, rotateY: 0, zoom: 80, offsetX: 0, offsetY: 0 },
    ],
  },
  {
    id: 'preset-loop-zerog',
    name: 'Zero-G Orbit Loop',
    description: 'Dreamy multi-axis floating rotation in zero gravity with continuous gentle roll',
    keyframes: [
      { timeSec: 0, rotateX: 12, rotateY: -18, zoom: 90, offsetX: -10, offsetY: -10, slot1Rotate: 0 },
      { timeSec: 3, rotateX: -12, rotateY: -8, zoom: 98, offsetX: 12, offsetY: 15, slot1Rotate: 4 },
      { timeSec: 6, rotateX: -6, rotateY: 18, zoom: 90, offsetX: 10, offsetY: -12, slot1Rotate: 0 },
      { timeSec: 9, rotateX: 14, rotateY: 8, zoom: 98, offsetX: -12, offsetY: 10, slot1Rotate: -4 },
      { timeSec: 12, rotateX: 12, rotateY: -18, zoom: 90, offsetX: -10, offsetY: -10, slot1Rotate: 0 },
    ],
  },
];

export type ElementLoopAnimation = 'none' | 'pulse' | 'float' | 'spin' | 'blink' | 'wiggle' | 'counter';

export type MotionCategory = 'entrance' | 'emphasis' | 'exit';

export type MotionPresetId =
  // Entrances (In)
  | 'pop-in'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'fade-in'
  | 'drop-bounce'
  | 'flip-in'
  | 'blur-in'
  | 'typeahead'
  // Emphasis & Loops
  | 'pulse'
  | 'float'
  | 'spin'
  | 'wiggle'
  | 'blink'
  | 'heartbeat'
  | 'swing'
  | 'counter'
  // Exits (Out)
  | 'fade-out'
  | 'slide-out-left'
  | 'slide-out-right'
  | 'slide-out-down'
  | 'slide-out-up'
  | 'pop-out'
  | 'blur-out';

export interface LayerMotionBlock {
  id: string;
  preset: MotionPresetId;
  startTimeSec: number;
  durationSec: number;
  easing?: AnimationEasingType;
}

export interface MotionPresetMeta {
  id: MotionPresetId;
  name: string;
  category: MotionCategory;
  description: string;
  defaultDurationSec: number;
  badge: string;
  textOnly?: boolean;
}

export const MOTION_PRESETS: MotionPresetMeta[] = [
  // --- ENTRANCES ---
  {
    id: 'pop-in',
    name: 'Pop In',
    category: 'entrance',
    description: 'Quick spring scale reveal with slight overshoot',
    defaultDurationSec: 0.8,
    badge: 'Pop In',
  },
  {
    id: 'slide-in-left',
    name: 'Slide from Left',
    category: 'entrance',
    description: 'Smooth slide-in from the left edge',
    defaultDurationSec: 1.0,
    badge: 'Slide L',
  },
  {
    id: 'slide-in-right',
    name: 'Slide from Right',
    category: 'entrance',
    description: 'Smooth slide-in from the right edge',
    defaultDurationSec: 1.0,
    badge: 'Slide R',
  },
  {
    id: 'slide-in-up',
    name: 'Slide from Bottom',
    category: 'entrance',
    description: 'Smooth upward glide into view',
    defaultDurationSec: 1.0,
    badge: 'Slide Up',
  },
  {
    id: 'slide-in-down',
    name: 'Slide from Top',
    category: 'entrance',
    description: 'Downward drop glide into view',
    defaultDurationSec: 1.0,
    badge: 'Slide Down',
  },
  {
    id: 'fade-in',
    name: 'Fade In',
    category: 'entrance',
    description: 'Gentle opacity fade into visibility',
    defaultDurationSec: 0.8,
    badge: 'Fade In',
  },
  {
    id: 'drop-bounce',
    name: 'Drop & Bounce',
    category: 'entrance',
    description: 'Playful gravity fall with elastic ground bounce',
    defaultDurationSec: 1.2,
    badge: 'Bounce',
  },
  {
    id: 'flip-in',
    name: '3D Flip In',
    category: 'entrance',
    description: 'Perspective 3D flip unfold into place',
    defaultDurationSec: 0.9,
    badge: '3D Flip',
  },
  {
    id: 'blur-in',
    name: 'Blur In',
    category: 'entrance',
    description: 'Smooth camera focus blur dissolving into crisp focus',
    defaultDurationSec: 0.9,
    badge: 'Blur In',
  },
  {
    id: 'typeahead',
    name: 'Typeahead (Typewriter)',
    category: 'entrance',
    description: 'Types text character-by-character into view with blinking cursor',
    defaultDurationSec: 1.5,
    badge: 'Typeahead',
    textOnly: true,
  },

  // --- EMPHASIS & LOOPS ---
  {
    id: 'float',
    name: 'Float (Hover)',
    category: 'emphasis',
    description: 'Gentle organic vertical floating wave motion',
    defaultDurationSec: 2.5,
    badge: 'Float',
  },
  {
    id: 'pulse',
    name: 'Pulse (Zoom)',
    category: 'emphasis',
    description: 'Smooth pulsing push-in and push-out rhythmic zoom',
    defaultDurationSec: 2.0,
    badge: 'Pulse',
  },
  {
    id: 'spin',
    name: 'Spin 360°',
    category: 'emphasis',
    description: 'Continuous smooth 360-degree rotation',
    defaultDurationSec: 2.0,
    badge: 'Spin',
  },
  {
    id: 'wiggle',
    name: 'Wiggle (Shake)',
    category: 'emphasis',
    description: 'Playful oscillating wobble tilt loop',
    defaultDurationSec: 1.5,
    badge: 'Wiggle',
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    category: 'emphasis',
    description: 'Dynamic double-thump scale punch emphasis',
    defaultDurationSec: 1.5,
    badge: 'Heartbeat',
  },
  {
    id: 'swing',
    name: 'Swing Pendulum',
    category: 'emphasis',
    description: 'Subtle pendulum hanging swing motion',
    defaultDurationSec: 2.0,
    badge: 'Swing',
  },
  {
    id: 'blink',
    name: 'Fade Shimmer',
    category: 'emphasis',
    description: 'Rhythmic opacity fading shimmer breath',
    defaultDurationSec: 2.0,
    badge: 'Shimmer',
  },
  {
    id: 'counter',
    name: 'Counter (0 → N)',
    category: 'emphasis',
    description: 'Fast animated number roll from 0 to target value',
    defaultDurationSec: 1.2,
    badge: 'Counter',
    textOnly: true,
  },

  // --- EXITS ---
  {
    id: 'fade-out',
    name: 'Fade Out',
    category: 'exit',
    description: 'Softly fades layer to transparent',
    defaultDurationSec: 0.8,
    badge: 'Fade Out',
  },
  {
    id: 'slide-out-left',
    name: 'Slide to Left',
    category: 'exit',
    description: 'Glides away to the left edge and fades',
    defaultDurationSec: 1.0,
    badge: 'Slide Out L',
  },
  {
    id: 'slide-out-right',
    name: 'Slide to Right',
    category: 'exit',
    description: 'Glides away to the right edge and fades',
    defaultDurationSec: 1.0,
    badge: 'Slide Out R',
  },
  {
    id: 'slide-out-down',
    name: 'Slide to Bottom',
    category: 'exit',
    description: 'Drops downward off screen and disappears',
    defaultDurationSec: 1.0,
    badge: 'Slide Out Down',
  },
  {
    id: 'slide-out-up',
    name: 'Slide to Top',
    category: 'exit',
    description: 'Floats upward and disappears',
    defaultDurationSec: 1.0,
    badge: 'Slide Out Up',
  },
  {
    id: 'pop-out',
    name: 'Pop Out (Shrink)',
    category: 'exit',
    description: 'Snappily scales down to zero',
    defaultDurationSec: 0.6,
    badge: 'Pop Out',
  },
  {
    id: 'blur-out',
    name: 'Blur Out',
    category: 'exit',
    description: 'Defocuses smoothly into blur and dissolves away',
    defaultDurationSec: 0.8,
    badge: 'Blur Out',
  },
];

// Legacy presets fallback mapping
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
  { id: 'counter', name: 'Counter (0 → N)', description: 'Fast animated number roll from 0 to target value', badge: 'Counter', textOnly: true },
];

/**
 * Evaluates the compound motion transform for any layer at exact timestamp `currentTimeSec`.
 */
export interface LayerMotionResult {
  dx: number;
  dy: number;
  scale: number;
  rotate: number;
  rotateX: number;
  rotateY: number;
  opacity: number;
  blur?: number;
  isVisible: boolean;
  animatedText?: string;
  untypedText?: string;
  showCursor?: boolean;
}

export function evaluateLayerMotion(
  motions: LayerMotionBlock[] | undefined,
  legacyAnim: ElementLoopAnimation | undefined,
  legacyStartTime = 0,
  currentTimeSec: number,
  rawText?: string
): LayerMotionResult {
  // Normalize motions array (support legacy single-anim fallback)
  let motionList: LayerMotionBlock[] = [];
  if (motions && motions.length > 0) {
    motionList = [...motions].sort((a, b) => a.startTimeSec - b.startTimeSec);
  } else if (legacyAnim && legacyAnim !== 'none') {
    motionList = [
      {
        id: 'legacy-block',
        preset: legacyAnim as MotionPresetId,
        startTimeSec: legacyStartTime,
        durationSec: legacyAnim === 'counter' ? 1.2 : 20,
      },
    ];
  }

  // Base state (default rest position)
  const defaultResult: LayerMotionResult = {
    dx: 0,
    dy: 0,
    scale: 1,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    opacity: 1,
    blur: 0,
    isVisible: true,
    animatedText: rawText,
    untypedText: '',
    showCursor: false,
  };

  if (motionList.length === 0) {
    return defaultResult;
  }

  // Determine if first block is an entrance. If current time is before first entrance, layer is hidden.
  const firstBlock = motionList[0];
  const firstMeta = MOTION_PRESETS.find((p) => p.id === firstBlock.preset);
  if (firstMeta?.category === 'entrance' && currentTimeSec < firstBlock.startTimeSec) {
    return {
      ...defaultResult,
      opacity: 0,
      isVisible: false,
      animatedText: firstBlock.preset === 'typeahead' ? '' : rawText,
    };
  }

  // Determine if last block is an exit and we are past its end time.
  const lastBlock = motionList[motionList.length - 1];
  const lastMeta = MOTION_PRESETS.find((p) => p.id === lastBlock.preset);
  if (lastMeta?.category === 'exit' && currentTimeSec >= lastBlock.startTimeSec + lastBlock.durationSec) {
    return {
      ...defaultResult,
      opacity: 0,
      isVisible: false,
    };
  }

  // Find active block at current time, or the last applicable block
  let activeBlock: LayerMotionBlock | null = null;
  for (const block of motionList) {
    if (currentTimeSec >= block.startTimeSec && currentTimeSec < block.startTimeSec + block.durationSec) {
      activeBlock = block;
      break;
    }
  }

  // If between blocks, find if we are past an entrance or before an exit
  if (!activeBlock) {
    // If before any blocks (and first wasn't entrance), default is visible rest
    // If after a block, keep the settled state
    const priorBlocks = motionList.filter((b) => currentTimeSec >= b.startTimeSec + b.durationSec);
    if (priorBlocks.length > 0) {
      const mostRecent = priorBlocks[priorBlocks.length - 1];
      const mostRecentMeta = MOTION_PRESETS.find((p) => p.id === mostRecent.preset);
      if (mostRecentMeta?.category === 'exit') {
        return { ...defaultResult, opacity: 0, isVisible: false };
      }
      if ((mostRecent.preset === 'counter' || mostRecent.preset === 'typeahead') && rawText) {
        return { ...defaultResult, animatedText: rawText };
      }
    }
    return defaultResult;
  }

  const elapsed = Math.max(0, currentTimeSec - activeBlock.startTimeSec);
  const dur = Math.max(0.1, activeBlock.durationSec);
  const progress = Math.min(1, elapsed / dur);
  const preset = activeBlock.preset;

  switch (preset) {
    // --- ENTRANCES ---
    case 'pop-in': {
      // Elastic spring scale from 0 to 1
      const p = progress;
      const c1 = 1.4;
      const c3 = c1 + 1;
      const factor = p >= 1 ? 1 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
      return {
        ...defaultResult,
        scale: Math.max(0, factor),
        opacity: Math.min(1, progress * 2.5),
      };
    }
    case 'slide-in-left': {
      const factor = 1 - Math.pow(1 - progress, 3);
      return {
        ...defaultResult,
        dx: -160 * (1 - factor),
        opacity: Math.min(1, progress * 2),
      };
    }
    case 'slide-in-right': {
      const factor = 1 - Math.pow(1 - progress, 3);
      return {
        ...defaultResult,
        dx: 160 * (1 - factor),
        opacity: Math.min(1, progress * 2),
      };
    }
    case 'slide-in-up': {
      const factor = 1 - Math.pow(1 - progress, 3);
      return {
        ...defaultResult,
        dy: 120 * (1 - factor),
        opacity: Math.min(1, progress * 2),
      };
    }
    case 'slide-in-down': {
      const factor = 1 - Math.pow(1 - progress, 3);
      return {
        ...defaultResult,
        dy: -120 * (1 - factor),
        opacity: Math.min(1, progress * 2),
      };
    }
    case 'fade-in': {
      return {
        ...defaultResult,
        opacity: Math.min(1, progress),
      };
    }
    case 'drop-bounce': {
      // Bouncing gravity fall
      let y = 0;
      if (progress < 0.6) {
        // Drop down
        const p = progress / 0.6;
        y = -200 * (1 - p * p);
      } else if (progress < 0.8) {
        // Bounce up
        const p = (progress - 0.6) / 0.2;
        y = -35 * Math.sin(p * Math.PI);
      } else {
        // Final settle
        const p = (progress - 0.8) / 0.2;
        y = -10 * Math.sin(p * Math.PI);
      }
      return {
        ...defaultResult,
        dy: y,
        opacity: Math.min(1, progress * 3),
      };
    }
    case 'flip-in': {
      const factor = 1 - Math.pow(1 - progress, 3);
      return {
        ...defaultResult,
        rotateX: 90 * (1 - factor),
        opacity: Math.min(1, progress * 2),
      };
    }
    case 'blur-in': {
      const factor = 1 - Math.pow(1 - progress, 3);
      const blur = Math.max(0, 24 * (1 - factor));
      const opacity = Math.min(1, progress * 1.8);
      const scale = 1 + 0.08 * (1 - factor);
      return {
        ...defaultResult,
        scale,
        blur,
        opacity,
      };
    }
    case 'typeahead': {
      if (!rawText) return defaultResult;
      const totalChars = rawText.length;
      if (totalChars === 0) return defaultResult;

      const charCount = Math.min(totalChars, Math.max(0, Math.floor(progress * (totalChars + 1))));
      const isTyping = progress < 1;
      const showCursor = isTyping && Math.floor(elapsed * 3.5) % 2 === 0;
      const visibleText = rawText.slice(0, charCount);
      const untypedText = isTyping ? rawText.slice(charCount) : '';

      return {
        ...defaultResult,
        animatedText: visibleText,
        untypedText,
        showCursor,
        opacity: 1,
        isVisible: true,
      };
    }

    // --- EMPHASIS & LOOPS ---
    case 'pulse': {
      const scale = 1 + 0.12 * Math.sin(elapsed * Math.PI * 2 * 0.7);
      return {
        ...defaultResult,
        scale,
      };
    }
    case 'float': {
      const dy = Math.sin(elapsed * Math.PI * 2 * 0.4) * 14;
      return {
        ...defaultResult,
        dy,
      };
    }
    case 'spin': {
      const rotate = (elapsed * (360 / dur)) % 360;
      return {
        ...defaultResult,
        rotate,
      };
    }
    case 'wiggle': {
      const rotate = Math.sin(elapsed * Math.PI * 2 * 1.5) * 12;
      return {
        ...defaultResult,
        rotate,
      };
    }
    case 'heartbeat': {
      // Periodic double beat thump
      const cycle = (elapsed % 1.2) / 1.2;
      let scale = 1;
      if (cycle < 0.15) {
        scale = 1 + 0.22 * Math.sin((cycle / 0.15) * Math.PI);
      } else if (cycle > 0.25 && cycle < 0.4) {
        scale = 1 + 0.14 * Math.sin(((cycle - 0.25) / 0.15) * Math.PI);
      }
      return {
        ...defaultResult,
        scale,
      };
    }
    case 'swing': {
      const rotate = Math.sin(elapsed * Math.PI * 2 * 0.6) * 18;
      return {
        ...defaultResult,
        rotate,
      };
    }
    case 'blink': {
      const opacity = 0.35 + 0.65 * ((Math.sin(elapsed * Math.PI * 2 * 0.6) + 1) / 2);
      return {
        ...defaultResult,
        opacity,
      };
    }
    case 'counter': {
      const text = rawText ? getAnimatedCounterValue(rawText, currentTimeSec, dur, activeBlock.startTimeSec) : rawText;
      return {
        ...defaultResult,
        animatedText: text,
      };
    }

    // --- EXITS ---
    case 'fade-out': {
      const opacity = Math.max(0, 1 - progress);
      return {
        ...defaultResult,
        opacity,
        isVisible: opacity > 0.01,
      };
    }
    case 'slide-out-left': {
      const factor = progress * progress;
      return {
        ...defaultResult,
        dx: -160 * factor,
        opacity: Math.max(0, 1 - progress),
        isVisible: progress < 1,
      };
    }
    case 'slide-out-right': {
      const factor = progress * progress;
      return {
        ...defaultResult,
        dx: 160 * factor,
        opacity: Math.max(0, 1 - progress),
        isVisible: progress < 1,
      };
    }
    case 'slide-out-down': {
      const factor = progress * progress;
      return {
        ...defaultResult,
        dy: 140 * factor,
        opacity: Math.max(0, 1 - progress),
        isVisible: progress < 1,
      };
    }
    case 'slide-out-up': {
      const factor = progress * progress;
      return {
        ...defaultResult,
        dy: -140 * factor,
        opacity: Math.max(0, 1 - progress),
        isVisible: progress < 1,
      };
    }
    case 'pop-out': {
      const scale = Math.max(0, 1 - progress * progress);
      return {
        ...defaultResult,
        scale,
        opacity: Math.max(0, 1 - progress),
        isVisible: progress < 1,
      };
    }
    case 'blur-out': {
      const factor = progress * progress;
      const blur = 24 * factor;
      const opacity = Math.max(0, 1 - progress);
      const scale = 1 + 0.08 * factor;
      return {
        ...defaultResult,
        scale,
        blur,
        opacity,
        isVisible: progress < 1,
      };
    }

    default:
      return defaultResult;
  }
}

/**
 * Computes fast animated counter text from 0 to the target number(s) in `rawText`.
 */
export function getAnimatedCounterValue(
  rawText: string,
  currentTimeSec: number,
  durationSec = 1.2,
  startTimeSec = 0
): string {
  if (!rawText || typeof rawText !== 'string') return '';
  if (currentTimeSec < 0) currentTimeSec = 0;

  if (currentTimeSec <= startTimeSec) {
    return rawText.replace(/(\d+(?:,\d{3})*(?:\.\d+)?|\d+\.\d+|\d+)/g, (match) => {
      const decimalParts = match.split('.');
      const hasDecimals = decimalParts.length > 1;
      const decimalPlaces = hasDecimals ? decimalParts[1].length : 0;
      return hasDecimals ? (0).toFixed(decimalPlaces) : '0';
    });
  }

  if (currentTimeSec >= startTimeSec + durationSec) {
    return rawText;
  }

  const elapsed = currentTimeSec - startTimeSec;
  const progress = Math.min(Math.max(elapsed / durationSec, 0), 1);
  const easeOut = 1 - Math.pow(1 - progress, 4);

  return rawText.replace(/(\d+(?:,\d{3})*(?:\.\d+)?|\d+\.\d+|\d+)/g, (match) => {
    const cleanNumStr = match.replace(/,/g, '');
    const targetNum = parseFloat(cleanNumStr);
    if (isNaN(targetNum)) return match;

    const currentVal = targetNum * easeOut;

    const decimalParts = match.split('.');
    const hasDecimals = decimalParts.length > 1;
    const decimalPlaces = hasDecimals ? decimalParts[1].length : 0;

    let formattedVal: string;
    if (hasDecimals) {
      formattedVal = currentVal.toFixed(decimalPlaces);
    } else {
      const rounded = Math.round(currentVal);
      if (match.includes(',')) {
        formattedVal = rounded.toLocaleString('en-US');
      } else {
        formattedVal = String(rounded);
      }
    }

    return formattedVal;
  });
}

