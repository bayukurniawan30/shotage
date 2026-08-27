import { getRandomGradientPreset } from '../utils/gradientPresets';
import { ElementLoopAnimation } from './animationTypes';

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
  'default' | 'badge-light' | 'badge-dark' | 'glass-dark' | 'glass-light';

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

export type ElementCategory = 'arrow' | 'line' | 'emoji';

export type ShapeType = 'square' | 'rectangle' | 'circle' | 'hexagon' | 'quote';

export interface ShapeLayer {
  id: string;
  shapeType: ShapeType;
  color: string;
  gradient?: { color1: string; color2: string; angle: number } | null;
  bgImage?: string | null;
  bgImageZoom?: number;
  bgImageOffsetX?: number;
  bgImageOffsetY?: number;
  bgImageRepeat?: boolean;
  width: number;
  height: number;
  borderRadius?: number;
  x: number;
  y: number;
  rotation: number;
  pitch?: number;
  yaw?: number;
  skewX?: number;
  skewY?: number;
  opacity: number;
  position: 'above' | 'underneath';
  shadow?: boolean;
  blur?: number;
  glassmorphism?: boolean;
  glassmorphismBlur?: number;
  glassmorphismBorder?: boolean;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  loopAnimation?: ElementLoopAnimation;
  animStartTime?: number;
}

export interface CanvasElement {
  id: string;
  category: ElementCategory;
  elementId: string;
  src: string;
  color: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  position: 'above' | 'underneath';
  shadow?: boolean;
  blur?: number;
  flipX?: boolean;
  flipY?: boolean;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  loopAnimation?: ElementLoopAnimation;
  animStartTime?: number;
}

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
  name?: string;
  visible?: boolean;
  locked?: boolean;
  loopAnimation?: ElementLoopAnimation;
  animStartTime?: number;
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
  gradient?: { color1: string; color2: string; angle: number } | null;
  bgImage?: string | null;
  bgImageZoom?: number;
  bgImageOffsetX?: number;
  bgImageOffsetY?: number;
  textAlign: 'left' | 'center' | 'right';
  x: number;
  y: number;
  shadow: boolean;
  opacity: number; // 0 to 100
  rotation: number; // -180 to 180 degrees
  pitch?: number;
  yaw?: number;
  skewX?: number;
  skewY?: number;
  scaleX?: number; // 0.1 to 10.0 (default 1)
  scaleY?: number; // 0.1 to 10.0 (default 1)
  position: 'above' | 'underneath'; // 'above' (front overlay) or 'underneath' (behind mockup)
  socialPlatform?: SocialPlatform;
  socialStyle?: SocialStyleVariant;
  iconColor?: string;
  iconSize?: number;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  loopAnimation?: ElementLoopAnimation;
  animStartTime?: number;
}

export type WatermarkType = 'none' | 'default' | 'dark' | 'glass' | 'badge' | 'dark-badge';
export type WatermarkPosition =
  'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center';
export type WatermarkSize = 'sm' | 'md' | 'lg';

export type BackgroundType =
  | 'solid'
  | 'gradient'
  | 'shadeshifter'
  | 'spectral'
  | 'animatedGradient'
  | 'linearSwatches'
  | 'wave'
  | 'mesh'
  | 'animatedMesh'
  | 'confetti'
  | 'radiant'
  | 'transparent'
  | 'image';

export type ShinePreset =
  | 'none'
  | 'diagonal-glass'
  | 'apple-glare'
  | 'curved-sheen'
  | 'top-light'
  | 'dual-beam';

export type FrameType =
  | 'frameless'
  | 'safari-light'
  | 'safari-dark'
  | 'chrome-dark'
  | 'macbook'
  | 'macbookair13'
  | 'iphone'
  | 'iphone14pro'
  | 'iphone16'
  | 'iphone17-dual-side'
  | 'samsung-s21'
  | 'tablet'
  | 'polaroid'
  | 'polaroid-dark'
  | 'instagram'
  | 'instagram-dark';

export interface StudioState {
  imageSrc: string | null;
  imageName: string;
  imageWidth: number | null;
  imageHeight: number | null;
  secondImageWidth: number | null;
  secondImageHeight: number | null;
  shareId: string | null;
  shareIdentifier: string | null;
  sharedDesignName?: string | null;
  sharedDesignPublisher?: string | null;
  zoom: number; // 50 to 150
  slot2Zoom: number; // 50 to 150
  previewCanvasZoom: number; // 50 to 150
  alignment: 'center' | 'top' | 'bottom';
  padding: number; // 0 to 120
  borderRadius: number; // 0 to 32
  slabThickness?: number; // 0 to 60 (for 3D extrusion)
  slabColor?: string; // 3D extrusion edge color
  enableShine?: boolean;
  shinePreset?: ShinePreset;
  shineOpacity?: number; // 0 to 100
  framelessStyle: 'default' | 'glass-light' | 'glass-dark' | 'inset-light' | 'inset-dark' | 'card';
  shadow: 'none' | 'soft' | 'medium' | 'hard' | 'floating';
  shadowOverlay?:
    | 'none'
    | 'shadow-overlay-1'
    | 'shadow-overlay-2'
    | 'shadow-overlay-3'
    | 'shadow-overlay-4'
    | 'shadow-overlay-5'
    | 'shadow-overlay-6';
  shadowOverlayOpacity?: number; // 0 to 100
  shadowOverlayPosition?: 'behind' | 'above';
  hideMockup: boolean;
  frameType: FrameType;
  samsungStatusBar?: 'none' | 'light' | 'dark';
  iphoneStatusBar?: 'none' | 'light' | 'dark';
  urlText: string;
  secondUrlText: string;
  backgroundType: BackgroundType;
  wavePreset: string;
  meshPreset: string;
  shadeshifterPreset?: string;
  shadeshifterGrain?: number;
  shadeshifterBlur?: number;
  spectralPreset?: string;
  spectralBlur?: number;
  spectralAngle?: number;
  animatedGradientPreset?: string;
  animatedMeshPreset?: string;
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
  bgPatternEnabled: boolean;
  bgPatternPreset: string;
  bgPatternColor: string;
  bgPatternOpacity: number; // 0 to 100
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
  skewX: number; // -60 to 60
  skewY: number; // -60 to 60
  slot1Rotate: number; // -180 to 180
  slot2Rotate: number; // -180 to 180
  slot2RotateX: number; // -30 to 30 (Slot 2 pitch)
  slot2RotateY: number; // -30 to 30 (Slot 2 yaw)
  slot2SkewX: number; // -60 to 60
  slot2SkewY: number; // -60 to 60
  slot2Perspective: number; // 500 to 2000
  perspective: number; // 500 to 2000
  offsetX: number; // -200 to 200
  offsetY: number; // -200 to 200
  slot2OffsetX: number; // -200 to 200
  slot2OffsetY: number; // -200 to 200
  layoutCount: 1 | 2;
  mediaType: 'image' | 'video';
  secondMediaType?: 'image' | 'video';
  videoDuration?: number;
  secondVideoDuration?: number;
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
  selectedTextLayerIds: string[];
  // Phosphor Icon Layers (Independent canvas layers)
  phosphorIconLayers: PhosphorIconLayer[];
  selectedPhosphorIconLayerId: string | null;
  selectedPhosphorIconLayerIds: string[];
  // Canvas Elements (Arrows, Stickers, Shapes)
  canvasElements: CanvasElement[];
  selectedElementId: string | null;
  selectedElementIds: string[];
  // Shape Layers (Square, Rectangle, Circle, Hexagon)
  shapeLayers: ShapeLayer[];
  selectedShapeId: string | null;
  selectedShapeIds: string[];
  sidebarMode: 'quick' | 'advanced';
  // Tech Stack Overlay
  techStackConfig: TechStackConfig;
  // Phosphor Icons Overlay (Grouped)
  phosphorIconConfig: PhosphorIconConfig;
  // Stage Manager State
  stages?: Partial<StudioState>[];
  activeStageIndex: number;
  // Global layer stack order (index 0 = topmost / highest z-index, Photoshop-style)
  layerOrder: { type: 'text' | 'phosphor' | 'element' | 'shape'; id: string }[];
  resetKey: number;
}

export const DEFAULT_STUDIO_STATE: StudioState = {
  imageSrc: null,
  imageName: 'screenshot.png',
  imageWidth: null,
  imageHeight: null,
  secondImageWidth: null,
  secondImageHeight: null,
  shareId: null,
  shareIdentifier: null,
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
  slabThickness: 12,
  slabColor: '#1e293b',
  enableShine: false,
  shinePreset: 'none',
  shineOpacity: 35,
  framelessStyle: 'default',
  shadow: 'floating',
  shadowOverlay: 'none',
  shadowOverlayOpacity: 85,
  shadowOverlayPosition: 'above',
  hideMockup: false,
  frameType: 'frameless',
  samsungStatusBar: 'none',
  iphoneStatusBar: 'none',
  urlText: 'shotage.app/preview',
  secondUrlText: 'shotage.app/demo',
  sharedDesignName: null,
  sharedDesignPublisher: null,
  backgroundType: 'gradient',
  wavePreset: 'wave-1',
  meshPreset: 'mesh-1',
  shadeshifterPreset: 'shadeshifter-1',
  shadeshifterGrain: 35,
  shadeshifterBlur: 40,
  spectralPreset: 'spectral-1',
  spectralBlur: 45,
  spectralAngle: 215,
  animatedGradientPreset: 'anim-grad-1',
  animatedMeshPreset: 'anim-mesh-1',
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
  bgPatternEnabled: false,
  bgPatternPreset: 'pattern-1',
  bgPatternColor: '#9C92AC',
  bgPatternOpacity: 40,
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
  aspectRatio: '4:3',
  rotateX: 0,
  rotateY: 0,
  skewX: 0,
  skewY: 0,
  slot1Rotate: 0,
  slot2Rotate: 0,
  slot2RotateX: 0,
  slot2RotateY: 0,
  slot2SkewX: 0,
  slot2SkewY: 0,
  slot2Perspective: 1000,
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
  selectedTextLayerIds: [],
  phosphorIconLayers: [],
  selectedPhosphorIconLayerId: null,
  selectedPhosphorIconLayerIds: [],
  canvasElements: [],
  selectedElementId: null,
  selectedElementIds: [],
  shapeLayers: [],
  selectedShapeId: null,
  selectedShapeIds: [],
  sidebarMode: 'quick',
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
    weight: 'regular',
    size: 28,
    gap: 12,
    color: '#a2d2ff',
    style: 'row',
    position: 'top-right',
    badgeStyle: 'glass-dark',
    xOffset: 0,
    yOffset: 0,
  },
  activeStageIndex: 0,
  stages: [],
  layerOrder: [],
  resetKey: 0,
};
