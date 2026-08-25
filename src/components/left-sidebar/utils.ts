import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { LINEAR_SWATCH_PRESETS } from '../../utils/linearSwatchPresets';

export const FRAME_LABELS: Record<string, string> = {
  frameless: 'No Frame',
  'safari-light': 'Safari Light',
  'safari-dark': 'Safari Dark',
  'chrome-dark': 'Chrome Dark',
  iphone: 'iPhone 15',
  iphone14pro: 'iPhone 14 Pro',
  iphone16: 'iPhone 16',
  'iphone17-dual-side': 'iPhone 17 Pro Dual side',
  'samsung-s21': 'Samsung S21',
  macbookair13: 'MacBook Air 13"',
  macbook: 'MacBook Pro',
  tablet: 'Tablet',
  polaroid: 'Polaroid',
  'polaroid-dark': 'Polaroid Dark',
  instagram: 'Instagram Light',
  'instagram-dark': 'Instagram Dark',
};

export const getAspectRatioCategory = (aspectRatio: string) => {
  if (aspectRatio === 'custom') return 'Custom';
  if (['auto', '16:9', '1:1', '9:16', '4:3', '3:2', '3:4', '5:4', '4:5'].includes(aspectRatio))
    return 'General';
  if (aspectRatio.startsWith('ig-')) return 'Instagram';
  if (aspectRatio.startsWith('yt-')) return 'YouTube';
  return 'Custom';
};

export const getAspectRatioLabel = (
  aspectRatio: string,
  customWidth?: number,
  customHeight?: number
) => {
  switch (aspectRatio) {
    case 'custom':
      return `Custom (${customWidth || 1280}x${customHeight || 720}px)`;
    case 'auto':
      return 'Auto Fit';
    case 'ig-post':
      return 'Instagram Post (1:1)';
    case 'ig-portrait':
      return 'Instagram Portrait (4:5)';
    case 'ig-story':
      return 'Instagram Story (9:16)';
    case 'yt-banner':
      return 'YouTube Banner (16:9)';
    case 'yt-thumbnail':
      return 'YouTube Thumbnail (16:9)';
    case 'yt-video':
      return 'YouTube Video (16:9)';
    case '16:9':
      return 'Landscape (16:9)';
    case '1:1':
      return 'Square (1:1)';
    case '9:16':
      return 'Vertical (9:16)';
    case '4:3':
      return 'Standard (4:3)';
    case '3:2':
      return 'Classic (3:2)';
    case '3:4':
      return 'Portrait (3:4)';
    case '5:4':
      return 'Frame (5:4)';
    case '4:5':
      return 'Social (4:5)';
    default:
      return 'Original Ratio';
  }
};

export const getRecommendedZoomForAspect = (
  aspectRatio: string,
  customW?: number,
  customH?: number
) => {
  let ratioNum = 16 / 9;
  if (aspectRatio === '1:1' || aspectRatio === 'ig-post') ratioNum = 1;
  else if (aspectRatio === '9:16' || aspectRatio === 'ig-story') ratioNum = 9 / 16;
  else if (aspectRatio === '4:3') ratioNum = 4 / 3;
  else if (aspectRatio === '3:2') ratioNum = 3 / 2;
  else if (aspectRatio === '3:4') ratioNum = 3 / 4;
  else if (aspectRatio === '5:4') ratioNum = 5 / 4;
  else if (aspectRatio === '4:5' || aspectRatio === 'ig-portrait') ratioNum = 4 / 5;
  else if (aspectRatio === 'custom' && customW && customH) ratioNum = customW / customH;

  // Tall vertical ratios (like 9:16 or 4:5) need smaller zoom so placeholder fits within frame
  if (ratioNum < 0.6) return 60;
  if (ratioNum < 0.7) return 50;
  if (ratioNum < 0.95) return 60;
  if (ratioNum <= 1.1) return 70;
  if (ratioNum > 1.6) return 80;
  return 80;
};

export const useMiniCanvasBgStyle = (): React.CSSProperties => {
  const state = useStudioStore();
  const bgType = state.backgroundType || 'gradient';

  if (bgType === 'solid') {
    return { backgroundColor: state.backgroundColor || '#0f172a' };
  }
  if (bgType === 'gradient') {
    const angle = state.gradient?.angle ?? 135;
    const c1 = state.gradient?.color1 || '#ffafcc';
    const c2 = state.gradient?.color2 || '#a2d2ff';
    return { backgroundImage: `linear-gradient(${angle}deg, ${c1}, ${c2})` };
  }
  if (bgType === 'linearSwatches') {
    const preset =
      LINEAR_SWATCH_PRESETS.find((p) => p.id === state.linearSwatchesPreset) ||
      LINEAR_SWATCH_PRESETS[0];
    return { background: preset.css };
  }

  // Default to pastel pink for all non-solid/gradient background types (mesh, wave, confetti, radiant, image, transparent)
  return { backgroundColor: '#ffafcc' };
};
