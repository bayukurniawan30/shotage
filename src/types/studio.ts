import { getRandomGradientPreset } from '../utils/gradientPresets';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'github'
  | 'whatsapp'
  | 'x'
  | 'threads'
  | 'linkedin'
  | 'dribbble'
  | 'behance'
  | 'figma'
  | 'discord'
  | 'telegram'
  | 'reddit'
  | 'twitch'
  | 'spotify'
  | 'pinterest'
  | 'producthunt'
  | 'medium'
  | 'substack';

export type SocialStyleVariant =
  | 'default'
  | 'badge-light'
  | 'badge-dark'
  | 'glass-dark'
  | 'glass-light';

export type TechStackPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type TechStackLayoutStyle = 'row' | 'column';

export interface TechStackConfig {
  enabled: boolean;
  selectedIcons: import('../components/TechStackIcons').TechStackId[];
  size: number;
  gap: number;
  style: TechStackLayoutStyle;
  position: TechStackPosition;
  badgeStyle: 'plain' | 'glass-dark' | 'glass-light' | 'badge-dark' | 'badge-light';
  xOffset: number;
  yOffset: number;
}

export type PhosphorWeight = 'regular' | 'fill' | 'duotone';

export type PhosphorBadgeStyle =
  | 'plain'
  | 'glass-dark'
  | 'glass-light'
  | 'badge-dark'
  | 'badge-light'
  | 'circle-dark'
  | 'circle-light';

export interface PhosphorIconLayer {
  id: string;
  iconId: string;
  weight: PhosphorWeight;
  size: number;
  color: string;
  badgeStyle: PhosphorBadgeStyle;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  position: 'above' | 'underneath';
  shadow?: boolean;
}

export interface PhosphorIconConfig {
  enabled: boolean;
  selectedIcons: string[];
  weight: PhosphorWeight;
  size: number;
  gap: number;
  color: string;
  style: TechStackLayoutStyle;
  position: TechStackPosition;
  badgeStyle: 'plain' | 'glass-dark' | 'glass-light' | 'badge-dark' | 'badge-light';
  xOffset: number;
  yOffset: number;
}

export interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  x: number;
  y: number;
  shadow: boolean;
  opacity: number; // 0 to 100
  rotation: number; // -180 to 180 degrees
  position: 'above' | 'underneath'; // 'above' (front overlay) or 'underneath' (behind mockup)
  socialPlatform?: SocialPlatform;
  socialStyle?: SocialStyleVariant;
  iconColor?: string;
  iconSize?: number;
}

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
  shadowOverlay: 'none' | 'shadow-overlay-1' | 'shadow-overlay-2' | 'shadow-overlay-3' | 'shadow-overlay-4' | 'shadow-overlay-5' | 'shadow-overlay-6';
  shadowOverlayOpacity?: number; // 0 to 100
  shadowOverlayPosition?: 'behind' | 'above';
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
    | 'polaroid-dark'
    | 'instagram'
    | 'instagram-dark';
  samsungStatusBar?: 'none' | 'light' | 'dark';
  iphoneStatusBar?: 'none' | 'light' | 'dark';
  urlText: string;
  secondUrlText: string;
  backgroundType:
    | 'solid'
    | 'gradient'
    | 'linearSwatches'
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
  linearSwatchesPreset: string;
  backgroundColor: string;
  gradient: {
    color1: string;
    color2: string;
    angle: number;
  };
  bgImageUrl: string | null;
  bgBlur: number; // 0 to 20
  bgGrain: number; // 0 to 100
  lensBlurEnabled: boolean;
  lensBlurAmount: number; // 0 to 50
  lensBlurFocalX: number; // 0 to 100 (%)
  lensBlurFocalY: number; // 0 to 100 (%)
  lensBlurRadius: number; // 0 to 100 (%)
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
    | '3:2'
    | '3:4'
    | '5:4'
    | '4:5'
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
  mediaType: 'image' | 'video';
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
  // Text Layers
  textLayers: TextLayer[];
  selectedTextLayerId: string | null;
  // Phosphor Icon Layers (Independent canvas layers)
  phosphorIconLayers: PhosphorIconLayer[];
  selectedPhosphorIconLayerId: string | null;
  // Tech Stack Overlay
  techStackConfig: TechStackConfig;
  // Phosphor Icons Overlay (Grouped)
  phosphorIconConfig: PhosphorIconConfig;
  resetKey: number;
}

export const DEFAULT_STUDIO_STATE: StudioState = {
  imageSrc: null,
  imageName: 'screenshot.png',
  secondImageSrc: null,
  secondImageName: 'screenshot-2.png',
  layoutCount: 1,
  mediaType: 'image',
  layoutPreset: 'side-by-side',
  zoom: 100,
  slot2Zoom: 100,
  previewCanvasZoom: 100,
  alignment: 'center',
  padding: 48,
  borderRadius: 16,
  framelessStyle: 'default',
  shadow: 'floating',
  shadowOverlay: 'none',
  shadowOverlayOpacity: 85,
  shadowOverlayPosition: 'above',
  frameType: 'frameless',
  samsungStatusBar: 'none',
  iphoneStatusBar: 'none',
  urlText: 'shotage.app/preview',
  secondUrlText: 'shotage.app/demo',
  backgroundType: 'gradient',
  wavePreset: 'wave-1',
  meshPreset: 'mesh-1',
  confettiPreset: 'confetti-1',
  customConfettiObj: null,
  radiantPreset: 'radiant-1',
  linearSwatchesPreset: 'ls-1',
  backgroundColor: '#0f172a',
  bgGrain: 0,
  gradient: (() => {
    const initialPreset = getRandomGradientPreset();
    return {
      color1: initialPreset.c1,
      color2: initialPreset.c2,
      angle: 135,
    };
  })(),
  bgImageUrl: null,
  bgBlur: 0,
  lensBlurEnabled: false,
  lensBlurAmount: 24,
  lensBlurFocalX: 50,
  lensBlurFocalY: 50,
  lensBlurRadius: 20,
  isPositionDragging: false,
  watermarkType: 'none',
  watermarkPosition: 'bottom-right',
  watermarkSize: 'md',
  customWidth: 1280,
  customHeight: 720,
  aspectRatio: 'auto',
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
  textLayers: [],
  selectedTextLayerId: null,
  phosphorIconLayers: [],
  selectedPhosphorIconLayerId: null,
  techStackConfig: {
    enabled: false,
    selectedIcons: ['react', 'nextjs', 'typescript', 'tailwindcss'],
    size: 28,
    gap: 12,
    style: 'row',
    position: 'bottom-left',
    badgeStyle: 'glass-dark',
    xOffset: 0,
    yOffset: 0,
  },
  phosphorIconConfig: {
    enabled: false,
    selectedIcons: ['Sparkle', 'Heart', 'Cube'],
    weight: 'duotone',
    size: 28,
    gap: 12,
    color: '#a2d2ff',
    style: 'row',
    position: 'top-right',
    badgeStyle: 'glass-dark',
    xOffset: 0,
    yOffset: 0,
  },
  resetKey: 0,
};
