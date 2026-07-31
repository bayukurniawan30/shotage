export type WatermarkType = 'none' | 'default' | 'dark' | 'glass' | 'badge' | 'dark-badge';
export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'bottom-center'
  | 'top-center';
export type WatermarkSize = 'sm' | 'md' | 'lg';

export interface StudioState {
  imageSrc: string | null;
  imageName: string;
  zoom: number; // 50 to 150
  slot2Zoom: number; // 50 to 150
  previewCanvasZoom: number; // 50 to 150
  alignment: 'center' | 'top' | 'bottom';
  padding: number; // 0 to 120
  borderRadius: number; // 0 to 32
  framelessStyle: 'default' | 'glass-light' | 'glass-dark' | 'inset-light' | 'inset-dark' | 'card';
  shadow: 'none' | 'soft' | 'medium' | 'hard' | 'floating';
  frameType:
    | 'frameless'
    | 'safari-light'
    | 'safari-dark'
    | 'chrome-dark'
    | 'macbook'
    | 'macbookair13'
    | 'iphone'
    | 'iphone14pro'
    | 'samsung-s21'
    | 'tablet'
    | 'polaroid'
    | 'polaroid-dark';
  urlText: string;
  secondUrlText: string;
  backgroundType:
    | 'solid'
    | 'gradient'
    | 'image'
    | 'transparent'
    | 'wave'
    | 'mesh'
    | 'confetti'
    | 'radiant';
  wavePreset: string;
  meshPreset: string;
  confettiPreset: string;
  customConfettiObj: any | null;
  radiantPreset: string;
  backgroundColor: string;
  gradient: {
    color1: string;
    color2: string;
    angle: number;
  };
  bgImageUrl: string | null;
  bgBlur: number; // 0 to 20
  isPositionDragging: boolean;
  watermarkType: WatermarkType;
  watermarkPosition: WatermarkPosition;
  watermarkSize: WatermarkSize;
  customWidth: number;
  customHeight: number;
  aspectRatio:
    | 'auto'
    | '16:9'
    | '1:1'
    | '9:16'
    | '4:3'
    | '1.91:1'
    | 'ig-post'
    | 'ig-portrait'
    | 'ig-story'
    | 'yt-banner'
    | 'yt-thumbnail'
    | 'yt-video'
    | 'custom';
  rotateX: number; // -30 to 30
  rotateY: number; // -30 to 30
  slot1Rotate: number; // -180 to 180
  slot2Rotate: number; // -180 to 180
  perspective: number; // 500 to 2000
  offsetX: number; // -200 to 200
  offsetY: number; // -200 to 200
  slot2OffsetX: number; // -200 to 200
  slot2OffsetY: number; // -200 to 200
  layoutCount: 1 | 2;
  layoutPreset: 'side-by-side' | 'overlap-right' | 'overlap-left' | 'stacked';
  secondImageSrc: string | null;
  secondImageName: string;
  exportFormat: 'png' | 'jpeg' | 'webp';
  exportScale: 1 | 2 | 3;
  // Animation System State
  isAnimationMode: boolean;
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  keyframes: import('./animationTypes').AnimationKeyframe[];
  activePresetId: string;
}

export const DEFAULT_STUDIO_STATE: StudioState = {
  imageSrc: null,
  imageName: 'screenshot.png',
  secondImageSrc: null,
  secondImageName: 'screenshot-2.png',
  layoutCount: 1,
  layoutPreset: 'side-by-side',
  zoom: 100,
  slot2Zoom: 100,
  previewCanvasZoom: 100,
  alignment: 'center',
  padding: 48,
  borderRadius: 16,
  framelessStyle: 'default',
  shadow: 'floating',
  frameType: 'frameless',
  urlText: 'shotage.app/preview',
  secondUrlText: 'shotage.app/demo',
  backgroundType: 'gradient',
  wavePreset: 'wave-1',
  meshPreset: 'mesh-1',
  confettiPreset: 'confetti-1',
  customConfettiObj: null,
  radiantPreset: 'radiant-1',
  backgroundColor: '#0f172a',
  gradient: {
    color1: '#cdb4db',
    color2: '#ffafcc',
    angle: 135,
  },
  bgImageUrl: null,
  bgBlur: 0,
  isPositionDragging: false,
  watermarkType: 'none',
  watermarkPosition: 'bottom-right',
  watermarkSize: 'md',
  customWidth: 1280,
  customHeight: 720,
  aspectRatio: '16:9',
  rotateX: 0,
  rotateY: 0,
  slot1Rotate: 0,
  slot2Rotate: 0,
  perspective: 1000,
  offsetX: 0,
  offsetY: 0,
  slot2OffsetX: 0,
  slot2OffsetY: 0,
  exportFormat: 'png',
  exportScale: 2,
  // Animation System Defaults
  isAnimationMode: false,
  isPlaying: false,
  currentTimeSec: 0,
  durationSec: 10,
  keyframes: [],
  activePresetId: '',
};
