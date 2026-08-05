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
