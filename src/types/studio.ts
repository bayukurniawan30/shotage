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
    | 'tablet';
  urlText: string;
  secondUrlText: string;
  backgroundType: 'solid' | 'gradient' | 'image' | 'transparent';
  backgroundColor: string;
  gradient: {
    color1: string;
    color2: string;
    angle: number;
  };
  bgImageUrl: string | null;
  bgBlur: number; // 0 to 20
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
    | 'yt-video';
  rotateX: number; // -30 to 30
  rotateY: number; // -30 to 30
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
  backgroundColor: '#0f172a',
  gradient: {
    color1: '#cdb4db',
    color2: '#ffafcc',
    angle: 135,
  },
  bgImageUrl: null,
  bgBlur: 0,
  aspectRatio: '16:9',
  rotateX: 0,
  rotateY: 0,
  perspective: 1000,
  offsetX: 0,
  offsetY: 0,
  slot2OffsetX: 0,
  slot2OffsetY: 0,
  exportFormat: 'png',
  exportScale: 2,
};
