import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { BrowserFrame } from './frames/BrowserFrame';
import { DeviceFrame } from './frames/DeviceFrame';
import { VideoCanvasScreen } from './VideoCanvasScreen';
import { isVideoFile, isValidMediaFile, validateAndLoadVideo } from '../utils/videoUpload';
import { WaveBackground } from './WaveBackground';
import { MeshBackground } from './MeshBackground';
import { ConfettiBackground } from './ConfettiBackground';
import { RadiantBackground } from './RadiantBackground';
import { ShadeshifterBackground } from './ShadeshifterBackground';
import { SpectralBackground } from './SpectralBackground';
import { AnimatedGradientBackground, AnimatedMeshBackground } from './AnimatedBackgrounds';
import { LINEAR_SWATCH_PRESETS } from '../utils/linearSwatchPresets';
import { parseColorAndAlpha, formatColorWithAlpha } from '../utils/gradientPresets';
import { getPatternSvgUrl } from '../utils/patternPresets';
import { WatermarkOverlay } from './WatermarkOverlay';
import { GOOGLE_FONTS } from './RightSidebar';
import { SocialIcon } from './SocialIcons';
import { TechStackIcon } from './TechStackIcons';
import {
  getAnimatedCounterValue,
  calculateEasing,
  evaluateLayerMotion,
  evaluateLayerKeyframes,
} from '../types/animationTypes';
import { Coolshape } from 'coolshapes-react';
import * as PhosphorIcons from '@phosphor-icons/react';
import {
  ImageUp,
  Heart,
  MessageCircle02,
  Repeat01,
  Send01,
  Bookmark,
  DotsHorizontal,
} from '@untitledui/icons';

interface CanvasStageProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onImageUpload?: (file: File) => void;
}

// Generate a data-URI SVG placeholder at the exact dimensions of the missing
// screenshot, so it occupies the same footprint the real image would.
const buildPlaceholderSrc = (width: number, height: number): string => {
  const s = Math.max(2, Math.round(Math.min(width, height) / 90));
  const cx = width / 2;
  const cy = height / 2;
  const iconSize = s * 10;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="#1e293b"/>` +
    `<rect x="${width * 0.04}" y="${height * 0.04}" width="${width * 0.92}" height="${height * 0.92}" fill="none" stroke="#334155" stroke-width="${s}" stroke-dasharray="${s * 3} ${s * 2}" rx="${s * 2}"/>` +
    `<g transform="translate(${cx - iconSize / 2}, ${cy - iconSize / 2})" fill="none" stroke="#64748b" stroke-width="${Math.max(1, s * 0.6)}" stroke-linecap="round" stroke-linejoin="round">` +
    `<rect x="0" y="0" width="${iconSize}" height="${iconSize}" rx="${s * 2}"/>` +
    `<circle cx="${iconSize * 0.3}" cy="${iconSize * 0.3}" r="${s}"/>` +
    `<path d="M0 ${iconSize * 0.7} L${iconSize * 0.28} ${iconSize * 0.42} L${iconSize * 0.45} ${iconSize * 0.6} L${iconSize * 0.62} ${iconSize * 0.38} L${iconSize} ${iconSize * 0.7}"/>` +
    `</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

interface CenterPointIndicatorProps {
  top?: string;
  left?: string;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  visible?: boolean;
}

const CenterPointIndicator: React.FC<CenterPointIndicatorProps> = ({
  top = '50%',
  left = '50%',
  rotation = 0,
  flipX = false,
  flipY = false,
  visible = true,
}) => {
  if (!visible) return null;

  const flipTransform = flipX || flipY ? `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1}) ` : '';
  const rotTransform = rotation ? `rotate(${-rotation}deg)` : '';

  return (
    <div
      style={{
        top,
        left,
        transform: `translate(-50%, -50%) ${flipTransform}${rotTransform}`.trim(),
      }}
      className="absolute w-2 h-2 rounded-full bg-pastel-pink border-2 border-white shadow-[0_0_10px_rgba(244,114,182,1)] flex items-center justify-center pointer-events-none z-50"
    />
  );
};

export const CanvasStage: React.FC<CanvasStageProps> = ({ canvasRef, onImageUpload }) => {
  const state = useStudioStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
      onImageUpload(e.target.files[0]);
    }
  };

  const getAspectRatioStyle = () => {
    const isDual = state.layoutCount === 2;
    switch (state.aspectRatio) {
      case '16:9':
      case 'yt-banner':
      case 'yt-thumbnail':
      case 'yt-video':
        return isDual ? 'aspect-[16/9] w-[960px]' : 'aspect-[16/9] w-[832px]';
      case '1:1':
      case 'ig-post':
        return isDual ? 'aspect-square w-[630px]' : 'aspect-square w-[520px]';
      case '9:16':
      case 'ig-story':
        return isDual ? 'aspect-[9/16] w-[450px]' : 'aspect-[9/16] w-[450px]';
      case '4:3':
        return isDual ? 'aspect-[4/3] w-[870px]' : 'aspect-[4/3] w-[760px]';
      case '3:2':
        return isDual ? 'aspect-[3/2] w-[900px]' : 'aspect-[3/2] w-[585px]';
      case '5:4':
        return isDual ? 'aspect-[5/4] w-[810px]' : 'aspect-[5/4] w-[526px]';
      case '3:4':
        return isDual ? 'aspect-[3/4] w-[428px]' : 'aspect-[3/4] w-[428px]';
      case '4:5':
      case 'ig-portrait':
        return isDual ? 'aspect-[4/5] w-[468px]' : 'aspect-[4/5] w-[468px]';
      case 'auto':
        return isDual
          ? 'w-auto h-auto min-h-[900px] min-w-[1560px]'
          : 'w-auto h-auto min-h-[700px] min-w-[1200px]';
      case 'custom':
        return '';
      default:
        return 'w-auto h-auto min-h-[390px]';
    }
  };

  // Background style construction
  const getBackgroundStyle = () => {
    if (state.backgroundType === 'transparent') {
      return {
        background: 'transparent',
        backgroundColor: 'transparent',
        backgroundImage: 'none',
      };
    }
    if (state.backgroundType === 'solid') {
      return { backgroundColor: state.backgroundColor };
    }
    if (state.backgroundType === 'gradient') {
      return {
        backgroundImage: `linear-gradient(${state.gradient.angle}deg, ${state.gradient.color1}, ${state.gradient.color2})`,
      };
    }
    if (state.backgroundType === 'linearSwatches') {
      const preset =
        LINEAR_SWATCH_PRESETS.find((p) => p.id === state.linearSwatchesPreset) ||
        LINEAR_SWATCH_PRESETS[0];
      return { background: preset.css };
    }
    return { backgroundColor: '#0f172a' };
  };

  // Shadow class mappings
  const getShadowClass = () => {
    if (
      [
        'iphone',
        'iphone14pro',
        'iphone16',
        'iphone16-floating',
        'iphone17-dual-side',
        'macbook',
        'macbookair13',
        'samsung-s21',
        'tablet',
      ].includes(state.frameType)
    ) {
      return '';
    }

    switch (state.shadow) {
      case 'soft':
        return 'shadow-lg shadow-black/30';
      case 'medium':
        return 'shadow-2xl shadow-black/50';
      case 'hard':
        return 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]';
      case 'floating':
        return 'shadow-[0_35px_60px_-15px_rgba(0,0,0,0.9)]';
      default:
        return '';
    }
  };

  // Interpolate keyframe parameters during animation playback
  const getAnimatedTransforms = () => {
    if (!state.isAnimationMode || !state.keyframes || state.keyframes.length === 0) {
      return {
        rotateX: state.rotateX,
        rotateY: state.rotateY,
        zoom: state.zoom,
        slot2Zoom: state.slot2Zoom,
        offsetX: state.offsetX,
        offsetY: state.offsetY,
        slot2OffsetX: state.slot2OffsetX,
        slot2OffsetY: state.slot2OffsetY,
        slot1Rotate: state.slot1Rotate || 0,
        slot2Rotate: state.slot2Rotate || 0,
      };
    }

    const keyframes = state.keyframes;
    const t = state.currentTimeSec;

    const formatKf = (kf: (typeof keyframes)[0]) => ({
      rotateX: kf.rotateX,
      rotateY: kf.rotateY,
      zoom: kf.zoom,
      slot2Zoom: kf.slot2Zoom ?? kf.zoom,
      offsetX: kf.offsetX,
      offsetY: kf.offsetY,
      slot2OffsetX: kf.slot2OffsetX ?? 0,
      slot2OffsetY: kf.slot2OffsetY ?? 0,
      slot1Rotate: kf.slot1Rotate ?? 0,
      slot2Rotate: kf.slot2Rotate ?? 0,
    });

    // Before first keyframe
    if (t <= keyframes[0].timeSec) {
      return formatKf(keyframes[0]);
    }
    // After last keyframe
    if (t >= keyframes[keyframes.length - 1].timeSec) {
      return formatKf(keyframes[keyframes.length - 1]);
    }

    // Find bounding keyframes
    let prevIndex = 0;
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (t >= keyframes[i].timeSec && t <= keyframes[i + 1].timeSec) {
        prevIndex = i;
        break;
      }
    }

    const kf1 = keyframes[prevIndex];
    const kf2 = keyframes[prevIndex + 1];
    const duration = kf2.timeSec - kf1.timeSec;
    const progress = duration > 0 ? (t - kf1.timeSec) / duration : 0;

    const factor = calculateEasing(progress, state.animationEasing || 'ease-in-out');

    const z1_1 = kf1.zoom;
    const z1_2 = kf2.zoom;
    const z2_1 = kf1.slot2Zoom ?? kf1.zoom;
    const z2_2 = kf2.slot2Zoom ?? kf2.zoom;

    const x1_1 = kf1.offsetX;
    const x1_2 = kf2.offsetX;
    const x2_1 = kf1.slot2OffsetX ?? 0;
    const x2_2 = kf2.slot2OffsetX ?? 0;

    const y1_1 = kf1.offsetY;
    const y1_2 = kf2.offsetY;
    const y2_1 = kf1.slot2OffsetY ?? 0;
    const y2_2 = kf2.slot2OffsetY ?? 0;

    const r1_1 = kf1.slot1Rotate ?? 0;
    const r1_2 = kf2.slot1Rotate ?? 0;
    const r2_1 = kf1.slot2Rotate ?? 0;
    const r2_2 = kf2.slot2Rotate ?? 0;

    return {
      rotateX: kf1.rotateX + (kf2.rotateX - kf1.rotateX) * factor,
      rotateY: kf1.rotateY + (kf2.rotateY - kf1.rotateY) * factor,
      zoom: z1_1 + (z1_2 - z1_1) * factor,
      slot2Zoom: z2_1 + (z2_2 - z2_1) * factor,
      offsetX: x1_1 + (x1_2 - x1_1) * factor,
      offsetY: y1_1 + (y1_2 - y1_1) * factor,
      slot2OffsetX: x2_1 + (x2_2 - x2_1) * factor,
      slot2OffsetY: y2_1 + (y2_2 - y2_1) * factor,
      slot1Rotate: r1_1 + (r1_2 - r1_1) * factor,
      slot2Rotate: r2_1 + (r2_2 - r2_1) * factor,
    };
  };

  const animTransform = getAnimatedTransforms();

  // Per-slot tilt values. Slot 1 reuses the shared rotateX/rotateY/skew/perspective.
  // Slot 2 defaults fall back to slot 1's values for old designs that lack the keys.
  const animRX = animTransform.rotateX;
  const animRY = animTransform.rotateY;
  const slot2RotateX = state.slot2RotateX ?? state.rotateX;
  const slot2RotateY = state.slot2RotateY ?? state.rotateY;
  const slot2SkewX = state.slot2SkewX ?? state.skewX;
  const slot2SkewY = state.slot2SkewY ?? state.skewY;
  const slot2Perspective = state.slot2Perspective ?? state.perspective;
  const slot2RX = state.isAnimationMode ? animRX : slot2RotateX;
  const slot2RY = state.isAnimationMode ? animRY : slot2RotateY;

  // 3D Perspective & Tilt is applied per mockup (slot), so the stage itself stays flat
  const transformStyle: React.CSSProperties = {
    transform: 'none',
    transformStyle: 'preserve-3d',
    transition: state.isPlaying ? 'none' : 'transform 0.15s ease-out',
  };

  // Compute z-index for a layer based on its position in layerOrder.
  // order[0] = topmost = highest z-index. Falls back gracefully for legacy designs.
  // Two separate ranges ensure the mockup frame (z-10) always sits in between:
  //   "underneath" layers → 1–9  (always behind the mockup)
  //   "above"      layers → 30+  (always in front of the mockup)
  const getLayerZIndex = (
    type: 'text' | 'phosphor' | 'element' | 'shape',
    id: string,
    position: 'above' | 'underneath'
  ): number => {
    const order = state.layerOrder || [];
    // Count only layers in the same position group
    const groupOrder = order.filter((e) => {
      const layer =
        e.type === 'text'
          ? (state.textLayers || []).find((l) => l.id === e.id)
          : e.type === 'phosphor'
            ? (state.phosphorIconLayers || []).find((l) => l.id === e.id)
            : e.type === 'element'
              ? (state.canvasElements || []).find((l) => l.id === e.id)
              : (state.shapeLayers || []).find((l) => l.id === e.id);
      if (!layer) return false;
      return ((layer as any).position || 'above') === position;
    });

    const idx = groupOrder.findIndex((e) => e.type === type && e.id === id);
    if (position === 'underneath') {
      // Range 1–9: index 0 = highest within underneath group
      if (idx === -1 || groupOrder.length === 0) return 5;
      return Math.max(1, 9 - idx);
    } else {
      // Range 30+: index 0 = highest within above group
      if (idx === -1 || groupOrder.length === 0) return 30;
      return 30 + (groupOrder.length - idx);
    }
  };

  const getElementLoopTransform = (
    anim: import('../types/animationTypes').ElementLoopAnimation | undefined,
    startTimeSec = 0
  ) => {
    if (!state.isAnimationMode || !anim || anim === 'none' || anim === 'counter') {
      return { dx: 0, dy: 0, scale: 1, rotate: 0, opacityMul: 1 };
    }
    if (state.currentTimeSec < startTimeSec) {
      return { dx: 0, dy: 0, scale: 1, rotate: 0, opacityMul: 1 };
    }
    const t = state.currentTimeSec - startTimeSec;

    switch (anim) {
      case 'pulse': {
        const scale = 1 + 0.12 * Math.sin(t * Math.PI * 2 * 0.5);
        return { dx: 0, dy: 0, scale, rotate: 0, opacityMul: 1 };
      }
      case 'float': {
        const dy = Math.sin(t * Math.PI * 2 * 0.4) * 14;
        return { dx: 0, dy, scale: 1, rotate: 0, opacityMul: 1 };
      }
      case 'spin': {
        const rotate = (t * 90) % 360;
        return { dx: 0, dy: 0, scale: 1, rotate, opacityMul: 1 };
      }
      case 'blink': {
        const opacityMul = 0.35 + 0.65 * ((Math.sin(t * Math.PI * 2 * 0.5) + 1) / 2);
        return { dx: 0, dy: 0, scale: 1, rotate: 0, opacityMul };
      }
      case 'wiggle': {
        const rotate = Math.sin(t * Math.PI * 2 * 0.8) * 12;
        return { dx: 0, dy: 0, scale: 1, rotate, opacityMul: 1 };
      }
      default:
        return { dx: 0, dy: 0, scale: 1, rotate: 0, opacityMul: 1 };
    }
  };

  const renderTextLayers = (positionFilter: 'above' | 'underneath') => {
    return state.textLayers
      .filter((layer) => (layer.position || 'above') === positionFilter && layer.visible !== false)
      .map((layer) => {
        const isSelected = (state.selectedTextLayerIds || []).includes(layer.id);
        const layerLocked = layer.locked === true;
        const fontObj = GOOGLE_FONTS.find((f) => f.name === layer.fontFamily);
        const fontFamilyCss = fontObj ? fontObj.family : layer.fontFamily;
        const motion = evaluateLayerMotion(
          layer.motions,
          layer.loopAnimation,
          layer.animStartTime || 0,
          state.currentTimeSec,
          layer.text
        );
        const kfValues = evaluateLayerKeyframes(layer, state.currentTimeSec, state.animationEasing);
        const posX = kfValues.x ?? layer.x;
        const posY = kfValues.y ?? layer.y;
        const posRot = (kfValues.rotation ?? layer.rotation ?? 0) + motion.rotate;
        const posPitch = (kfValues.pitch ?? layer.pitch ?? 0) + motion.rotateX;
        const posYaw = (kfValues.yaw ?? layer.yaw ?? 0) + motion.rotateY;
        const posOpacity = kfValues.opacity ?? layer.opacity ?? 100;
        const posFontSize = kfValues.fontSize ?? layer.fontSize;
        const sx = kfValues.scaleX ?? layer.scaleX ?? 1;
        const sy = kfValues.scaleY ?? layer.scaleY ?? 1;

        const textFillStyle: React.CSSProperties = layer.bgImage
          ? {
              backgroundImage: `url(${layer.bgImage})`,
              backgroundSize: `${layer.bgImageZoom ?? 100}%`,
              backgroundPosition: `calc(50% + ${layer.bgImageOffsetX || 0}px) calc(50% + ${layer.bgImageOffsetY || 0}px)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }
          : layer.gradient
            ? {
                backgroundImage: `linear-gradient(${layer.gradient.angle}deg, ${layer.gradient.color1}, ${layer.gradient.color2})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }
            : {
                color: layer.color || '#ffffff',
              };

        const currentText = motion.animatedText ?? layer.text;

        return (
          <div
            key={layer.id}
            data-layer-id={layer.id}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey || e.metaKey) {
                state.toggleTextLayer(layer.id);
              } else {
                state.selectTextLayer(layer.id);
              }
            }}
            className={`text-layer-item group/textlayer absolute cursor-pointer select-none rounded-sm ${layerLocked || !motion.isVisible ? 'pointer-events-none' : ''}`}
            style={{
              zIndex: getLayerZIndex('text', layer.id, positionFilter),
              transform: `translate(${posX + motion.dx}px, ${posY + motion.dy}px) perspective(1000px) rotateX(${posPitch}deg) rotateY(${posYaw}deg) rotate(${posRot}deg) skewX(${layer.skewX || 0}deg) skewY(${layer.skewY || 0}deg) scale(${sx * motion.scale}, ${sy * motion.scale})`,
              transformStyle: 'preserve-3d',
              fontFamily: fontFamilyCss,
              fontSize: `${posFontSize}px`,
              lineHeight: 1.2,
              fontWeight: layer.fontWeight,
              fontStyle: layer.fontStyle,
              textAlign: layer.textAlign,
              opacity: motion.isVisible ? (posOpacity / 100) * motion.opacity : 0,
              textShadow:
                layer.bgImage || layer.gradient
                  ? 'none'
                  : layer.shadow
                    ? '0 4px 12px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)'
                    : 'none',
              whiteSpace: currentText.includes('\n') ? 'pre-wrap' : 'pre',
              width: 'max-content',
              maxWidth: 'none',
            }}
          >
            {/* Selection Bounding Box (Constant 2px border thickness) */}
            {isSelected && (
              <div
                className="absolute -top-1 -left-1 border-2 border-pastel-blue rounded-md pointer-events-none z-30"
                style={{
                  width: `calc(100% * ${sx} + 8px)`,
                  height: `calc(100% * ${sy} + 8px)`,
                }}
              />
            )}

            {/* Hover Bounding Box (Constant 1px dashed border) */}
            {!isSelected && !layerLocked && (
              <div
                className="absolute -top-1 -left-1 border border-dashed border-slate-400 rounded-md pointer-events-none z-10 opacity-0 group-hover/textlayer:opacity-100 transition-opacity"
                style={{
                  width: `calc(100% * ${sx} + 8px)`,
                  height: `calc(100% * ${sy} + 8px)`,
                }}
              />
            )}

            {/* Stretched Text Content */}
            <div
              style={{
                transform: `scale(${sx}, ${sy})`,
                transformOrigin: 'top left',
                display: 'inline-block',
                fontFamily: 'inherit',
                ...textFillStyle,
              }}
            >
              {layer.socialPlatform ? (
                <div
                  className={`flex items-center gap-2.5 ${
                    layer.socialStyle === 'badge-light'
                      ? 'bg-white text-slate-900 border border-slate-200/90 shadow-md rounded-lg px-3.5 py-1.5'
                      : layer.socialStyle === 'badge-dark'
                        ? 'bg-neutral-950/90 text-white border border-neutral-800 shadow-md rounded-lg px-3.5 py-1.5'
                        : layer.socialStyle === 'glass-dark'
                          ? 'bg-neutral-950/40 backdrop-blur-md border border-white/15 text-white shadow-xl rounded-lg px-3.5 py-1.5'
                          : layer.socialStyle === 'glass-light'
                            ? 'bg-white/30 backdrop-blur-md border border-white/50 text-slate-900 shadow-xl rounded-lg px-3.5 py-1.5'
                            : ''
                  }`}
                >
                  <SocialIcon
                    platform={layer.socialPlatform}
                    size={layer.iconSize || layer.fontSize * 1.1}
                    color={layer.iconColor || layer.color}
                  />
                  <span style={{ fontFamily: fontFamilyCss, ...textFillStyle }}>{currentText}</span>
                </div>
              ) : (
                currentText
              )}
            </div>

            {/* Selection Action Handles at corners of the stretched bounding box */}
            {isSelected && (
              <>
                <div
                  data-action="delete"
                  title="Delete layer"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.removeTextLayer(layer.id);
                  }}
                  style={{ top: '-14px', left: '-14px' }}
                  className="delete-handle absolute w-6 h-6 rounded-full bg-rose-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.TrashIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-posRot}deg)` }}
                  />
                </div>
                <div
                  data-action="rotate"
                  title="Drag to rotate"
                  style={{
                    top: '-14px',
                    left: `calc(100% * ${sx} - 10px)`,
                  }}
                  className="rotate-handle absolute w-6 h-6 rounded-full bg-pastel-pink text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.ArrowClockwiseIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-posRot}deg)` }}
                  />
                </div>
                <div
                  data-action="resize"
                  title="Drag to stretch text (Hold Shift for proportional scale)"
                  style={{
                    top: `calc(100% * ${sy} - 10px)`,
                    left: `calc(100% * ${sx} - 10px)`,
                  }}
                  className="resize-handle absolute w-6 h-6 rounded-full bg-[#a2d2ff] text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-se-resize hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.ArrowsOutSimpleIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-posRot}deg)` }}
                  />
                </div>

                {/* Center Point Indicator when moving */}
                <CenterPointIndicator
                  top={`calc(50% * ${sy})`}
                  left={`calc(50% * ${sx})`}
                  rotation={posRot}
                  visible={
                    dragItem?.id === layer.id || groupDrag?.items.some((it) => it.id === layer.id)
                  }
                />
              </>
            )}
          </div>
        );
      });
  };

  const renderPhosphorIconLayers = (positionFilter: 'above' | 'underneath') => {
    const layers = state.phosphorIconLayers || [];
    return layers
      .filter((layer) => (layer.position || 'above') === positionFilter && layer.visible !== false)
      .map((layer) => {
        const isSelected = (state.selectedPhosphorIconLayerIds || []).includes(layer.id);
        const layerLocked = layer.locked === true;
        const IconComp = (PhosphorIcons as any)[layer.iconId] || PhosphorIcons.Sparkle;
        const motion = evaluateLayerMotion(
          layer.motions,
          layer.loopAnimation,
          layer.animStartTime || 0,
          state.currentTimeSec
        );

        const getBadgeClass = (style: import('../types/studio').PhosphorBadgeStyle) => {
          switch (style) {
            case 'circle-dark':
              return 'w-fit h-fit rounded-full bg-neutral-950/90 shadow-md p-3 flex items-center justify-center';
            case 'circle-light':
              return 'w-fit h-fit rounded-full bg-white shadow-md p-3 flex items-center justify-center';
            case 'glass-dark':
              return 'bg-neutral-950/40 backdrop-blur-md border border-white/15 shadow-xl rounded-2xl p-3 flex items-center justify-center';
            case 'glass-light':
              return 'bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl p-3 flex items-center justify-center';
            case 'badge-dark':
              return 'bg-neutral-950/90 shadow-md rounded-2xl p-3 flex items-center justify-center';
            case 'badge-light':
              return 'bg-white shadow-md rounded-2xl p-3 flex items-center justify-center';
            case 'plain':
            default:
              return 'p-1 flex items-center justify-center';
          }
        };

        const isCircle = layer.badgeStyle === 'circle-dark' || layer.badgeStyle === 'circle-light';
        const roundedClass = isCircle
          ? 'rounded-full'
          : layer.badgeStyle === 'plain'
            ? 'rounded-xl'
            : 'rounded-2xl';

        const kfValues = evaluateLayerKeyframes(layer, state.currentTimeSec, state.animationEasing);
        const posX = kfValues.x ?? layer.x;
        const posY = kfValues.y ?? layer.y;
        const iconRot = (kfValues.rotation ?? layer.rotation ?? 0) + motion.rotate;
        const iconPitch = (kfValues.pitch ?? layer.pitch ?? 0) + motion.rotateX;
        const iconYaw = (kfValues.yaw ?? layer.yaw ?? 0) + motion.rotateY;
        const iconOpacity = kfValues.opacity ?? layer.opacity ?? 100;
        const iconScale = kfValues.scale ?? 1;

        return (
          <div
            key={layer.id}
            data-layer-id={layer.id}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey || e.metaKey) {
                state.toggleSelectPhosphorIconLayer(layer.id);
              } else {
                state.selectPhosphorIconLayer(layer.id);
              }
            }}
            className={`phosphor-icon-layer-item absolute cursor-pointer select-none ${roundedClass} ${layerLocked || !motion.isVisible ? 'pointer-events-none' : ''} ${
              isSelected ? 'ring-2 ring-pastel-pink ring-offset-2 ring-offset-neutral-950/40' : ''
            }`}
            style={{
              zIndex: getLayerZIndex('phosphor', layer.id, positionFilter),
              transform: `translate(${posX + motion.dx}px, ${posY + motion.dy}px) perspective(1000px) rotateX(${iconPitch}deg) rotateY(${iconYaw}deg) rotate(${iconRot}deg) scale(${iconScale * motion.scale})`,
              opacity: motion.isVisible ? (iconOpacity / 100) * motion.opacity : 0,
              filter: layer.shadow ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.65))' : 'none',
            }}
          >
            <div className={getBadgeClass(layer.badgeStyle)}>
              <IconComp
                weight={layer.weight || 'regular'}
                size={layer.size || 36}
                color={layer.color || '#a2d2ff'}
              />
            </div>
            {isSelected && (
              <>
                <div
                  data-action="delete"
                  title="Delete layer"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.removePhosphorIconLayer(layer.id);
                  }}
                  className="delete-handle absolute -top-3 -left-3 w-6 h-6 rounded-full bg-rose-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.TrashIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-iconRot}deg)` }}
                  />
                </div>
                <div
                  data-action="rotate"
                  title="Drag to rotate"
                  className="rotate-handle absolute -top-3 -right-3 w-6 h-6 rounded-full bg-pastel-pink text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.ArrowClockwiseIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-iconRot}deg)` }}
                  />
                </div>
                <div
                  data-action="resize"
                  title="Drag to resize icon"
                  className="resize-handle absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#a2d2ff] text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-se-resize hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.ArrowsOutSimpleIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-iconRot}deg)` }}
                  />
                </div>
                {/* Center Point Indicator when moving */}
                <CenterPointIndicator
                  rotation={iconRot}
                  visible={
                    dragItem?.id === layer.id || groupDrag?.items.some((it) => it.id === layer.id)
                  }
                />
              </>
            )}
          </div>
        );
      });
  };

  const renderCanvasElements = (positionFilter: 'above' | 'underneath') => {
    const elements = state.canvasElements || [];
    return elements
      .filter((el) => (el.position || 'above') === positionFilter && el.visible !== false)
      .map((el) => {
        const isSelected = (state.selectedElementIds || []).includes(el.id);
        const layerLocked = el.locked === true;
        const motion = evaluateLayerMotion(
          el.motions,
          el.loopAnimation,
          el.animStartTime || 0,
          state.currentTimeSec
        );
        const kfValues = evaluateLayerKeyframes(el, state.currentTimeSec, state.animationEasing);
        const posX = kfValues.x ?? el.x;
        const posY = kfValues.y ?? el.y;
        const elWidth = kfValues.width ?? el.width ?? 90;
        const elHeight = kfValues.height ?? el.height ?? 90;
        const elRot = (kfValues.rotation ?? el.rotation ?? 0) + motion.rotate;
        const elPitch = (kfValues.pitch ?? el.pitch ?? 0) + motion.rotateX;
        const elYaw = (kfValues.yaw ?? el.yaw ?? 0) + motion.rotateY;
        const elOpacity = kfValues.opacity ?? el.opacity ?? 100;
        const elScaleX = (kfValues.scaleX ?? 1) * (el.flipX ? -1 : 1);
        const elScaleY = (kfValues.scaleY ?? 1) * (el.flipY ? -1 : 1);

        return (
          <div
            key={el.id}
            data-layer-id={el.id}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey || e.metaKey) {
                state.toggleSelectCanvasElement(el.id);
              } else {
                state.selectCanvasElement(el.id);
              }
            }}
            className={`canvas-element-item absolute cursor-pointer select-none rounded-lg ${layerLocked || !motion.isVisible ? 'pointer-events-none' : ''} ${
              isSelected ? 'ring-2 ring-pastel-pink ring-offset-2 ring-offset-neutral-950/40' : ''
            }`}
            style={{
              zIndex: getLayerZIndex('element', el.id, positionFilter),
              transform: `translate(${posX + motion.dx}px, ${posY + motion.dy}px) perspective(1000px) rotateX(${elPitch}deg) rotateY(${elYaw}deg) rotate(${elRot}deg) scale(${elScaleX * motion.scale}, ${elScaleY * motion.scale})`,
              opacity: motion.isVisible ? (elOpacity / 100) * motion.opacity : 0,
              filter: el.shadow ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.65))' : 'none',
              width: `${elWidth}px`,
              height: `${elHeight}px`,
            }}
          >
            {el.category === 'emoji' ? (
              <div
                className="w-full h-full flex items-center justify-center select-none pointer-events-none"
                style={{ filter: el.blur ? `blur(${el.blur}px)` : 'none' }}
              >
                <img
                  src={el.src}
                  alt="Emoji Element"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>
            ) : (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: el.color || '#a2d2ff',
                  filter: el.blur ? `blur(${el.blur}px)` : 'none',
                  WebkitMaskImage: `url("${el.src}")`,
                  maskImage: `url("${el.src}")`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
            )}

            {isSelected && (
              <>
                <div
                  data-action="delete"
                  title="Delete element"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.removeCanvasElement(el.id);
                  }}
                  className="delete-handle absolute -top-3 -left-3 w-6 h-6 rounded-full bg-rose-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform z-50 pointer-events-auto"
                  style={{
                    transform: `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`,
                  }}
                >
                  <PhosphorIcons.TrashIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-elRot}deg)` }}
                  />
                </div>
                <div
                  data-action="rotate"
                  title="Drag to rotate"
                  className="rotate-handle absolute -top-3 -right-3 w-6 h-6 rounded-full bg-pastel-pink text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-50 pointer-events-auto"
                  style={{
                    transform: `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`,
                  }}
                >
                  <PhosphorIcons.ArrowClockwiseIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-elRot}deg)` }}
                  />
                </div>
                <div
                  data-action="resize"
                  title="Drag to resize element"
                  className="resize-handle absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#a2d2ff] text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-se-resize hover:scale-125 transition-transform z-50 pointer-events-auto"
                  style={{
                    transform: `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`,
                  }}
                >
                  <PhosphorIcons.ArrowsOutSimpleIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-elRot}deg)` }}
                  />
                </div>

                {/* Center Point Indicator when moving */}
                <CenterPointIndicator
                  rotation={elRot}
                  flipX={el.flipX}
                  flipY={el.flipY}
                  visible={dragItem?.id === el.id || groupDrag?.items.some((it) => it.id === el.id)}
                />
              </>
            )}
          </div>
        );
      });
  };

  const renderShapeLayers = (positionFilter: 'above' | 'underneath') => {
    const layers = state.shapeLayers || [];
    return layers
      .filter((layer) => (layer.position || 'above') === positionFilter && layer.visible !== false)
      .map((layer) => {
        const isSelected = (state.selectedShapeIds || []).includes(layer.id);
        const layerLocked = layer.locked === true;
        const motion = evaluateLayerMotion(
          layer.motions,
          layer.loopAnimation,
          layer.animStartTime || 0,
          state.currentTimeSec
        );
        const getShapeStyle = (): React.CSSProperties => {
          switch (layer.shapeType) {
            case 'circle':
              return { borderRadius: '9999px' };
            case 'hexagon':
              return {
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                WebkitClipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              };
            case 'quote':
              return {
                WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='%23000' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z'/%3E%3C/svg%3E")`,
                maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='%23000' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z'/%3E%3C/svg%3E")`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              };
            case 'coolshape':
              return {};
            case 'rectangle':
            case 'square':
            default:
              return { borderRadius: `${layer.borderRadius ?? 8}px` };
          }
        };

        const isGlass = !!layer.glassmorphism && layer.shapeType !== 'coolshape';
        const blurAmount = layer.glassmorphismBlur ?? 16;
        const isPolygonOrMask =
          layer.shapeType === 'hexagon' ||
          layer.shapeType === 'quote' ||
          layer.shapeType === 'coolshape';

        const getGlassOrSolidBackground = (): React.CSSProperties => {
          if (layer.shapeType === 'coolshape') {
            return {
              backgroundColor: 'transparent',
              backgroundImage: 'none',
            };
          }

          if (layer.bgImage) {
            return {
              backgroundImage: `url(${layer.bgImage})`,
              backgroundSize: `${layer.bgImageZoom ?? 100}%`,
              backgroundPosition: `calc(50% + ${layer.bgImageOffsetX || 0}px) calc(50% + ${layer.bgImageOffsetY || 0}px)`,
              backgroundRepeat: layer.bgImageRepeat ? 'repeat' : 'no-repeat',
            };
          }

          if (isGlass) {
            const userOpacity = (shapeOpacity ?? 100) / 100;
            if (layer.gradient) {
              const p1 = parseColorAndAlpha(layer.gradient.color1);
              const p2 = parseColorAndAlpha(layer.gradient.color2);
              const a1 = Math.round(Math.min(60, Math.max(5, (p1.alpha < 100 ? p1.alpha : 35) * userOpacity)));
              const a2 = Math.round(Math.min(60, Math.max(5, (p2.alpha < 100 ? p2.alpha : 15) * userOpacity)));
              return {
                backgroundImage: `linear-gradient(${layer.gradient.angle}deg, ${formatColorWithAlpha(p1.hex, a1)}, ${formatColorWithAlpha(p2.hex, a2)})`,
                backgroundColor: 'transparent',
              };
            }
            const p = parseColorAndAlpha(layer.color || '#ffffff');
            const baseAlpha = p.alpha < 100 ? p.alpha : 25;
            const finalAlpha = Math.round(Math.min(70, Math.max(5, baseAlpha * userOpacity)));
            return {
              backgroundColor: formatColorWithAlpha(p.hex, finalAlpha),
            };
          }

          if (layer.gradient) {
            return {
              backgroundImage: `linear-gradient(${layer.gradient.angle}deg, ${layer.gradient.color1}, ${layer.gradient.color2})`,
            };
          }

          return {
            backgroundColor: layer.color || '#a2d2ff',
          };
        };

        const kfValues = evaluateLayerKeyframes(layer, state.currentTimeSec, state.animationEasing);
        const posX = kfValues.x ?? layer.x;
        const posY = kfValues.y ?? layer.y;
        const shapeWidth = kfValues.width ?? layer.width ?? 120;
        const shapeHeight = kfValues.height ?? layer.height ?? 120;
        const shapeRot = (kfValues.rotation ?? layer.rotation ?? 0) + motion.rotate;
        const shapePitch = (kfValues.pitch ?? layer.pitch ?? 0) + motion.rotateX;
        const shapeYaw = (kfValues.yaw ?? layer.yaw ?? 0) + motion.rotateY;
        const shapeScaleX = kfValues.scaleX ?? 1;
        const shapeScaleY = kfValues.scaleY ?? 1;
        const shapeOpacity = kfValues.opacity ?? layer.opacity ?? 100;
        const shapeBorderRadius = kfValues.borderRadius ?? layer.borderRadius ?? 0;

        const has3D =
          shapePitch !== 0 ||
          shapeYaw !== 0;
        const transformStr = has3D
          ? `translate(${posX + motion.dx}px, ${posY + motion.dy}px) perspective(1000px) rotateX(${shapePitch}deg) rotateY(${shapeYaw}deg) rotate(${shapeRot}deg) skewX(${layer.skewX || 0}deg) skewY(${layer.skewY || 0}deg) scale(${shapeScaleX * motion.scale}, ${shapeScaleY * motion.scale})`
          : `translate(${posX + motion.dx}px, ${posY + motion.dy}px) rotate(${shapeRot}deg) skewX(${layer.skewX || 0}deg) skewY(${layer.skewY || 0}deg) scale(${shapeScaleX * motion.scale}, ${shapeScaleY * motion.scale})`;

        return (
          <div
            key={layer.id}
            data-layer-id={layer.id}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey || e.metaKey) {
                state.toggleSelectShapeLayer(layer.id);
              } else {
                state.selectShapeLayer(layer.id);
              }
            }}
            className={`shape-layer-item absolute cursor-pointer select-none ${layerLocked || !motion.isVisible ? 'pointer-events-none' : ''} ${
              isSelected ? 'ring-2 ring-pastel-pink ring-offset-2 ring-offset-neutral-950/40' : ''
            }`}
            style={{
              zIndex: getLayerZIndex('shape', layer.id, positionFilter),
              transform: transformStr,
              transformStyle: has3D ? 'preserve-3d' : undefined,
              opacity: motion.isVisible ? (isGlass ? motion.opacity : (shapeOpacity / 100) * motion.opacity) : 0,
              filter: isGlass ? 'none' : layer.shadow ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.65))' : 'none',
              width: `${shapeWidth}px`,
              height: `${shapeHeight}px`,
              overflow: isSelected
                ? 'visible'
                : !isPolygonOrMask && !layer.blur
                  ? 'hidden'
                  : undefined,
              borderRadius:
                layer.shapeType === 'coolshape'
                  ? undefined
                  : layer.shapeType === 'circle' && !isSelected
                    ? '9999px'
                    : `${shapeBorderRadius}px`,
            }}
          >
            <div
              className="w-full h-full relative"
              style={{
                ...getGlassOrSolidBackground(),
                ...getShapeStyle(),
                opacity: isGlass ? 1 : (layer.opacity ?? 100) / 100,
                filter: layer.blur ? `blur(${layer.blur}px)` : 'none',
                ...(isGlass
                  ? {
                      backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
                      WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
                      border:
                        !isPolygonOrMask && layer.glassmorphismBorder !== false
                          ? '1px solid rgba(255, 255, 255, 0.4)'
                          : 'none',
                      boxShadow:
                        !isPolygonOrMask && layer.glassmorphismBorder !== false
                          ? layer.shadow
                            ? 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.1), 0 12px 36px 0 rgba(0, 0, 0, 0.45)'
                            : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px 0 rgba(0, 0, 0, 0.25)'
                          : !isPolygonOrMask
                            ? layer.shadow
                              ? '0 12px 36px 0 rgba(0, 0, 0, 0.45)'
                              : '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                            : 'none',
                      borderRadius: isPolygonOrMask
                        ? undefined
                        : layer.shapeType === 'circle'
                          ? '9999px'
                          : `${layer.borderRadius ?? 8}px`,
                      overflow: !isPolygonOrMask ? 'hidden' : undefined,
                    }
                  : {}),
              }}
            >
              {layer.shapeType === 'coolshape' && (
                <Coolshape
                  type={layer.coolshapeType || 'star'}
                  index={layer.coolshapeIndex ?? 0}
                  noise={layer.coolshapeNoise ?? true}
                  className="w-full h-full pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                />
              )}

              {/* Hexagon glassmorphic frosted border outline */}
              {isGlass && layer.shapeType === 'hexagon' && layer.glassmorphismBorder !== false && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polygon
                    points="25,0.75 75,0.75 99.25,50 75,99.25 25,99.25 0.75,50"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.45)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
            </div>
            {isSelected && !isGlass && (
              <>
                <div
                  data-action="delete"
                  title="Delete shape"
                  onClick={(e) => {
                    e.stopPropagation();
                    state.removeShapeLayer(layer.id);
                  }}
                  className="delete-handle absolute -top-3 -left-3 w-6 h-6 rounded-full bg-rose-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.TrashIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-shapeRot}deg)` }}
                  />
                </div>
                <div
                  data-action="rotate"
                  title="Drag to rotate"
                  className="rotate-handle absolute -top-3 -right-3 w-6 h-6 rounded-full bg-pastel-pink text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.ArrowClockwiseIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-shapeRot}deg)` }}
                  />
                </div>
                <div
                  data-action="resize"
                  title="Drag to resize shape"
                  className="resize-handle absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#a2d2ff] text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-se-resize hover:scale-125 transition-transform z-50 pointer-events-auto"
                >
                  <PhosphorIcons.ArrowsOutSimpleIcon
                    className="w-3.5 h-3.5 font-bold pointer-events-none"
                    style={{ transform: `rotate(${-shapeRot}deg)` }}
                  />
                </div>

                {/* Center Point Indicator when moving */}
                <CenterPointIndicator
                  rotation={shapeRot}
                  visible={
                    dragItem?.id === layer.id || groupDrag?.items.some((it) => it.id === layer.id)
                  }
                />
              </>
            )}
          </div>
        );
      });
  };

  const canvasAspectRatio = (() => {
    switch (state.aspectRatio) {
      case '16:9':
      case 'yt-banner':
      case 'yt-thumbnail':
      case 'yt-video':
        return '16 / 9';
      case '1:1':
      case 'ig-post':
        return '1 / 1';
      case '4:3':
        return '4 / 3';
      case '3:2':
        return '3 / 2';
      case '5:4':
        return '5 / 4';
      case '4:5':
      case 'ig-portrait':
        return '4 / 5';
      case '3:4':
        return '3 / 4';
      case '9:16':
      case 'ig-story':
        return '9 / 16';
      default:
        return '16 / 10';
    }
  })();

  const renderSingleFrame = (
    imgSrc: string | null,
    imgName: string,
    onUpload: (file: File) => void,
    slotIndex: 1 | 2 = 1
  ) => {
    const isFrameless = state.frameType === 'frameless';

    const slotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        onUpload(e.target.files[0]);
      }
    };

    const imageStyle: React.CSSProperties = {
      borderRadius: isFrameless ? `${state.borderRadius}px` : undefined,
    };

    const slotWidth = slotIndex === 2 ? state.secondImageWidth : state.imageWidth;
    const slotHeight = slotIndex === 2 ? state.secondImageHeight : state.imageHeight;
    const placeholderSrc =
      slotWidth && slotHeight ? buildPlaceholderSrc(slotWidth, slotHeight) : null;

    const isPhoneDevice =
      state.frameType === 'iphone' ||
      state.frameType === 'iphone14pro' ||
      state.frameType === 'iphone16' ||
      state.frameType === 'iphone16-floating' ||
      state.frameType === 'iphone17-dual-side' ||
      state.frameType === 'samsung-s21';

    // Empty-state drop zone: match the canvas ratio (frameless) so it fills the canvas instead
    // of a small 16:10 strip. Fitted with max-h-full so it never overflows the padded area.
    const defaultPlaceholderAspect = isFrameless
      ? canvasAspectRatio
      : isPhoneDevice
        ? '9 / 29'
        : '16 / 10';

    const placeholderAspect =
      slotIndex === 2
        ? state.secondImageWidth && state.secondImageHeight
          ? `${state.secondImageWidth} / ${state.secondImageHeight}`
          : defaultPlaceholderAspect
        : state.imageWidth && state.imageHeight
          ? `${state.imageWidth} / ${state.imageHeight}`
          : defaultPlaceholderAspect;

    const isSlotVideo =
      slotIndex === 2 ? state.secondMediaType === 'video' : state.mediaType === 'video';

    const shinePreset = state.shinePreset || (state.enableShine ? 'diagonal-glass' : 'none');
    const enableShine = shinePreset !== 'none';
    const shineOpacity = (state.shineOpacity ?? 35) / 100;

    // Dynamic rotation & animation parameters for natural physical light reflection
    const rotX = slotIndex === 2 ? slot2RX : animTransform.rotateX;
    const rotY = slotIndex === 2 ? slot2RY : animTransform.rotateY;

    const timeProgress =
      state.durationSec && state.durationSec > 0
        ? (state.currentTimeSec % state.durationSec) / state.durationSec
        : 0;
    const timeShimmer = Math.sin(timeProgress * Math.PI * 2) * 5;

    // Light shifts across the glass surface inversely to the 3D tilt with ample margin
    const shineShiftX = -rotY * 0.35 + timeShimmer;
    const shineShiftY = rotX * 0.35;
    const dynamicAngle = Math.round(135 + rotY * 1.5 + rotX * 0.5);

    const getShineBackground = () => {
      switch (shinePreset) {
        case 'apple-glare': {
          const cutStop = Math.max(25, Math.min(65, 48 - rotY * 0.4 + timeShimmer * 0.5));
          return `linear-gradient(${125 + rotY * 1.5 + rotX * 0.5}deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.25) ${cutStop}%, rgba(255,255,255,0.02) ${cutStop + 1.5}%, transparent ${cutStop + 1.6}%, transparent 100%)`;
        }
        case 'curved-sheen': {
          const cx = Math.max(10, Math.min(70, 35 - rotY * 0.8 + timeShimmer));
          const cy = Math.max(0, Math.min(50, 15 + rotX * 0.8));
          return `radial-gradient(ellipse 130% 80% at ${cx}% ${cy}%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.22) 38%, transparent 75%)`;
        }
        case 'top-light': {
          const topStop = Math.max(20, Math.min(60, 38 + rotX * 0.5));
          return `linear-gradient(${180 + rotY * 1.2}deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.22) ${topStop}%, transparent ${topStop + 35}%)`;
        }
        case 'dual-beam': {
          const beam1 = Math.max(20, Math.min(55, 38 - rotY * 0.5));
          const beam2 = Math.max(20, Math.min(55, 32 + rotY * 0.5));
          return `linear-gradient(${135 + rotY * 1.2}deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.18) ${beam1}%, transparent ${beam1 + 15}%), linear-gradient(${315 + rotY * 1.2}deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) ${beam2}%, transparent ${beam2 + 15}%)`;
        }
        case 'diagonal-glass':
        default: {
          const stop1 = Math.max(15, Math.min(55, 38 - rotY * 0.4 + timeShimmer * 0.4));
          return `linear-gradient(${dynamicAngle}deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.28) ${stop1}%, rgba(255,255,255,0.06) ${stop1 + 12}%, transparent ${stop1 + 25}%)`;
        }
      }
    };

    const imageFit = state.imageFit || 'cover';
    const objectFitClass =
      imageFit === 'contain'
        ? 'object-contain'
        : imageFit === 'fill'
          ? 'object-fill'
          : 'object-cover';

    const content =
      imgSrc || placeholderSrc ? (
        <div
          className="@container relative group overflow-hidden w-full h-full flex items-center justify-center"
          style={{
            borderRadius: isFrameless ? `${state.borderRadius}px` : undefined,
          }}
        >
          {isSlotVideo && imgSrc ? (
            <VideoCanvasScreen
              src={imgSrc}
              slotIndex={slotIndex}
              isPlaying={state.isPlaying}
              currentTimeSec={state.currentTimeSec}
              className={`w-full h-full ${objectFitClass} transition-all group-hover:brightness-75 ${
                isFrameless ? '' : 'rounded-none'
              }`}
              style={imageStyle}
            />
          ) : (
            <img
              src={imgSrc || placeholderSrc!}
              alt={imgName || 'Screenshot'}
              className={`w-full h-full ${objectFitClass} block transition-all group-hover:brightness-75 ${
                isFrameless ? '' : 'rounded-none'
              }`}
              style={imageStyle}
            />
          )}

          {/* Dynamic Glass Screen Shine / Reflection Overlay with Full-Coverage Bleed */}
          {enableShine && (
            <div
              className="absolute inset-0 pointer-events-none z-[5] overflow-hidden"
              style={{
                borderRadius: isFrameless ? `${state.borderRadius}px` : undefined,
              }}
            >
              <div
                className="w-[240%] h-[240%] -left-[70%] -top-[70%] absolute pointer-events-none transition-transform duration-100 ease-out"
                style={{
                  background: getShineBackground(),
                  opacity: shineOpacity,
                  mixBlendMode: 'screen',
                  transform: `translate3d(${shineShiftX}%, ${shineShiftY}%, 0)`,
                }}
              />
            </div>
          )}
          <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col items-center justify-center text-white cursor-pointer z-10 p-3">
            <div className="w-[12cqmin] h-[12cqmin] min-w-[28px] min-h-[28px] max-w-[80px] max-h-[80px] rounded-[16%] bg-slate-900/90 border border-slate-700/80 shadow-2xl flex items-center justify-center mb-[1.5cqmin] group-hover:scale-110 transition-transform pointer-events-none">
              <ImageUp className="w-[50%] h-[50%] text-brand-400 pointer-events-none" />
            </div>
            <span className="text-[clamp(8px,1.4cqmin,14px)] font-bold tracking-wide text-slate-100 drop-shadow-lg pointer-events-none text-center px-2 truncate max-w-full">
              {imgSrc
                ? isSlotVideo && state.layoutCount === 1
                  ? 'Replace Video'
                  : state.layoutCount === 2
                    ? `Replace Slot ${slotIndex} Image`
                    : 'Replace Image or Video'
                : state.layoutCount === 2
                  ? `Add Slot ${slotIndex} Image`
                  : 'Add Screenshot or Video'}
            </span>
            <input
              type="file"
              accept={
                state.layoutCount === 2
                  ? 'image/*'
                  : 'image/*,video/mp4,video/webm,video/quicktime,video/ogg'
              }
              onChange={slotFileChange}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <label
          className={`@container w-full p-6 bg-slate-800/80 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-center shadow-xl cursor-pointer hover:border-pastel-pink transition-all group ${
            isFrameless ? 'rounded-xl' : 'rounded-none'
          }`}
          style={{
            ...imageStyle,
            aspectRatio: placeholderAspect,
            minWidth:
              isFrameless ||
              state.frameType.startsWith('safari') ||
              state.frameType === 'chrome-dark' ||
              state.frameType.startsWith('polaroid') ||
              state.frameType.startsWith('instagram')
                ? state.layoutCount === 2
                  ? '480px'
                  : '420px'
                : undefined,
            minHeight:
              isFrameless ||
              state.frameType.startsWith('safari') ||
              state.frameType === 'chrome-dark' ||
              state.frameType.startsWith('polaroid') ||
              state.frameType.startsWith('instagram')
                ? state.layoutCount === 2
                  ? '280px'
                  : '240px'
                : undefined,
          }}
        >
          <div
            className={`${state.layoutCount === 2 ? 'w-[22cqmin] h-[22cqmin] min-w-[56px] min-h-[56px] max-w-[200px] max-h-[200px]' : 'w-[14cqmin] h-[14cqmin] min-w-[40px] min-h-[40px] max-w-[120px] max-h-[120px]'} mb-[3cqmin] rounded-[22%] bg-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform`}
          >
            <svg
              className="w-[55%] h-[55%] text-pastel-pink"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p
            className={`${state.layoutCount === 2 ? 'text-[clamp(14px,6cqmin,40px)]' : 'text-[clamp(12px,3cqmin,26px)]'} font-bold text-slate-100 tracking-tight`}
          >
            Upload Slot {slotIndex}
          </p>
          <p
            className={`${state.layoutCount === 2 ? 'text-[clamp(10px,3.5cqmin,24px)]' : 'text-[clamp(10px,2.5cqmin,16px)]'} text-slate-400 mt-[1.5cqmin] font-semibold`}
          >
            {state.layoutCount === 2 ? 'Click or drop image' : 'Click or drop image / video'}
          </p>
          <input
            type="file"
            accept={
              state.layoutCount === 2
                ? 'image/*'
                : 'image/*,video/mp4,video/webm,video/quicktime,video/ogg'
            }
            onChange={slotFileChange}
            className="hidden"
          />
        </label>
      );

    let frameElement: React.ReactNode;
    if (state.frameType.startsWith('safari') || state.frameType === 'chrome-dark') {
      const currentUrl = slotIndex === 2 ? state.secondUrlText : state.urlText;
      frameElement = (
        <BrowserFrame
          type={state.frameType as any}
          urlText={currentUrl}
          isCompact={state.layoutCount === 2}
        >
          {content}
        </BrowserFrame>
      );
    } else if (
      state.frameType === 'macbook' ||
      state.frameType === 'macbookair13' ||
      state.frameType === 'iphone' ||
      state.frameType === 'iphone14pro' ||
      state.frameType === 'iphone16' ||
      state.frameType === 'iphone16-floating' ||
      state.frameType === 'iphone17-dual-side' ||
      state.frameType === 'samsung-s21'
    ) {
      frameElement = <DeviceFrame type={state.frameType}>{content}</DeviceFrame>;
    } else if (state.frameType === 'polaroid' || state.frameType === 'polaroid-dark') {
      const isDark = state.frameType === 'polaroid-dark';
      frameElement = (
        <div
          className={`p-4 pb-16 shadow-2xl transition-all border flex flex-col items-center gap-2 ${
            isDark
              ? 'bg-neutral-950 border-neutral-800 text-slate-200'
              : 'bg-white border-slate-200/90 text-slate-800'
          }`}
          style={{
            borderRadius: '6px',
          }}
        >
          <div className="overflow-hidden rounded-xs border border-black/10 shadow-inner">
            {content}
          </div>
        </div>
      );
    } else if (state.frameType === 'instagram' || state.frameType === 'instagram-dark') {
      const isDark = state.frameType === 'instagram-dark';
      frameElement = (
        <div
          className={`transition-all border flex flex-col overflow-hidden ${
            isDark
              ? 'bg-neutral-950 border-neutral-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
          style={{
            borderRadius: '12px',
          }}
        >
          {/* Header with Avatar & Username Skeleton */}
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full shrink-0 ${
                  isDark ? 'bg-neutral-800' : 'bg-slate-200'
                }`}
              />
              <div className="flex flex-col gap-1">
                <div
                  className={`w-24 h-3 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-slate-200'}`}
                />
                <div
                  className={`w-14 h-2 rounded-full ${
                    isDark ? 'bg-neutral-800/60' : 'bg-slate-200/70'
                  }`}
                />
              </div>
            </div>
            <DotsHorizontal
              className={`w-5 h-5 ${isDark ? 'text-neutral-400' : 'text-slate-400'}`}
            />
          </div>

          {/* Screenshot Content */}
          <div className="relative overflow-hidden">{content}</div>

          {/* Action Footer */}
          <div className="flex items-center justify-between px-3.5 py-3">
            <div className="flex items-center gap-3.5">
              <Heart className={`w-5 h-5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`} />
              <MessageCircle02
                className={`w-5 h-5 scale-x-[-1] ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
              />
              <Repeat01 className={`w-5 h-5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`} />
              <Send01 className={`w-5 h-5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`} />
            </div>
            <Bookmark className={`w-5 h-5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`} />
          </div>
        </div>
      );
    } else {
      // Frameless styles implementation
      const fStyle = state.framelessStyle || 'default';
      const rotXVal = slotIndex === 2 ? slot2RX : animTransform.rotateX;
      const rotYVal = slotIndex === 2 ? slot2RY : animTransform.rotateY;
      const isImg =
        slotIndex === 2 ? state.secondMediaType !== 'video' : state.mediaType !== 'video';
      const userThick = state.slabThickness ?? 12;
      const is3D = isFrameless && isImg && userThick > 0;

      let borderStyleClasses = '';
      if (fStyle === 'glass-light') {
        borderStyleClasses = is3D
          ? 'p-1.5 bg-white/40 backdrop-blur-md border border-white/50'
          : 'p-1.5 bg-white/30 backdrop-blur-md border border-white/50 shadow-xl';
      } else if (fStyle === 'glass-dark') {
        borderStyleClasses = is3D
          ? 'p-1.5 bg-black/50 backdrop-blur-md border border-white/15'
          : 'p-1.5 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl';
      } else if (fStyle === 'inset-light') {
        borderStyleClasses = is3D
          ? 'p-1.5 bg-slate-200/90 border border-slate-300'
          : 'p-1.5 bg-slate-200/90 border border-slate-300 shadow-inner';
      } else if (fStyle === 'inset-dark') {
        borderStyleClasses = is3D
          ? 'p-1.5 bg-slate-900/90 border border-slate-800'
          : 'p-1.5 bg-slate-900/90 border border-slate-800 shadow-inner';
      }

      if (fStyle === 'card') {
        frameElement = (
          <div className="relative group">
            {/* Stacked background card box with slight slope */}
            <div
              className="absolute inset-0 bg-neutral-900/90 border border-neutral-700/80 shadow-2xl transition-transform transform translate-y-3 translate-x-2 rotate-2 group-hover:translate-y-4 group-hover:rotate-3"
              style={{
                borderRadius: `${state.borderRadius}px`,
              }}
            />
            {/* Main foreground image frame */}
            <div
              className="relative z-10 overflow-hidden shadow-xl"
              style={{
                borderRadius: `${state.borderRadius}px`,
              }}
            >
              {content}
            </div>
          </div>
        );
      } else if (fStyle !== 'default') {
        frameElement = (
          <div
            className={`overflow-hidden ${borderStyleClasses}`}
            style={{
              borderRadius: `${state.borderRadius + 8}px`,
            }}
          >
            <div
              className="overflow-hidden w-full h-full"
              style={{
                borderRadius: `${state.borderRadius}px`,
              }}
            >
              {content}
            </div>
          </div>
        );
      } else {
        frameElement = content;
      }
    }

    const shadowClass = getShadowClass();
    const currentStyle = state.framelessStyle || 'default';
    const computedRadius = state.frameType.startsWith('instagram')
      ? '12px'
      : state.frameType.startsWith('polaroid')
        ? '6px'
        : isFrameless && currentStyle !== 'default' && currentStyle !== 'card'
          ? `${state.borderRadius + 8}px`
          : isFrameless || state.frameType.startsWith('safari') || state.frameType === 'chrome-dark'
            ? `${state.borderRadius}px`
            : undefined;

    const isImage =
      slotIndex === 2 ? state.secondMediaType !== 'video' : state.mediaType !== 'video';
    const userThickness = state.slabThickness ?? 12;
    const is3DActive = isFrameless && isImage && userThickness > 0;

    const rawColor = state.slabColor || '#1e293b';
    const parsed = parseColorAndAlpha(rawColor);
    const r0 = parseInt(parsed.hex.slice(1, 3), 16) || 30;
    const g0 = parseInt(parsed.hex.slice(3, 5), 16) || 41;
    const b0 = parseInt(parsed.hex.slice(5, 7), 16) || 59;
    const baseAlpha = (parsed.alpha || 100) / 100;

    if (is3DActive) {
      // Dense 1px-per-slice extrusion for a gap-free solid chassis wall
      const totalSlices = userThickness; // 1 slice per pixel of thickness

      // Compute light direction from the tilt angle for edge shading
      const radX = (rotX * Math.PI) / 180;
      const radY = (rotY * Math.PI) / 180;
      // Light comes from upper-left by default; edge facing toward light is brighter
      const lightDirX = -Math.sin(radY);
      const lightDirY = Math.sin(radX);

      // Build the side-wall slices as box-shadow layers on a single div
      const sideShadows: string[] = [];

      for (let i = 1; i <= totalSlices; i++) {
        const progress = i / totalSlices; // 0→1 from front face to back

        // Directional edge lighting: slices closer to the "near" side are brighter
        const depthShade = 1 - progress * 0.4;
        const specularBoost = progress < 0.2 ? 1 + (1 - progress / 0.2) * 0.15 : 1;
        const aoFade = progress > 0.8 ? 1 - ((progress - 0.8) / 0.2) * 0.2 : 1;

        const shade = Math.min(1, depthShade * specularBoost * aoFade);
        const r = Math.min(255, Math.round(r0 * shade));
        const g = Math.min(255, Math.round(g0 * shade));
        const b = Math.min(255, Math.round(b0 * shade));

        // Each shadow is offset along the light normal by i pixels
        const px = (lightDirX * i).toFixed(1);
        const py = (lightDirY * i).toFixed(1);

        sideShadows.push(`${px}px ${py}px 0 rgba(${r}, ${g}, ${b}, ${baseAlpha.toFixed(2)})`);
      }

      // Specular rim on the front leading edge
      const rimShadows = [
        'inset 0 1px 2px 0 rgba(255,255,255,0.4)',
        'inset 0 -1px 1px 0 rgba(0,0,0,0.2)',
      ];

      // Floor and ambient shadow multiplier
      const shadowMul =
        state.shadow === 'none'
          ? 0
          : state.shadow === 'soft'
            ? 0.45
            : state.shadow === 'medium'
              ? 0.7
              : state.shadow === 'hard'
                ? 0.9
                : 1.0; // 'floating'

      if (shadowMul > 0) {
        // Deep ambient floor shadow cast from beneath the slab (smoothly centered when tilt = 0)
        const floorCastX = (lightDirX * (userThickness + 8)).toFixed(1);
        const floorCastY = (lightDirY * (userThickness + 8) + 12).toFixed(1);
        const floorBlur = userThickness * 2.5 + 24;
        const floorAlpha = (0.55 * shadowMul).toFixed(2);
        sideShadows.push(`${floorCastX}px ${floorCastY}px ${floorBlur}px rgba(0,0,0,${floorAlpha})`);

        // Secondary closer contact shadow for realistic grounding
        const contactX = (lightDirX * userThickness * 0.5).toFixed(1);
        const contactY = (lightDirY * userThickness * 0.5 + 6).toFixed(1);
        const contactBlur = userThickness + 8;
        const contactAlpha = (0.35 * shadowMul).toFixed(2);
        sideShadows.push(`${contactX}px ${contactY}px ${contactBlur}px rgba(0,0,0,${contactAlpha})`);
      }

      const sheenOpacity = Math.min(
        0.25,
        Math.max(0.04, ((Math.abs(rotX) + Math.abs(rotY)) / 100) * 0.35 + 0.04)
      );

      return (
        <div className="relative group">
          {/* The image/mockup with dense 3D slab extrusion via box-shadow */}
          <div
            className="relative z-10"
            style={{
              borderRadius: computedRadius,
              boxShadow: [...rimShadows, ...sideShadows].join(', '),
            }}
          >
            {frameElement}

            {/* Front glass specular rim highlight overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
              style={{
                borderRadius: computedRadius,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />

            {/* Dynamic angle-responsive surface sheen */}
            <div
              className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
              style={{
                borderRadius: computedRadius,
                opacity: sheenOpacity,
                mixBlendMode: 'overlay',
                background: `linear-gradient(${135 + rotY * 1.5}deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.15) 100%)`,
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="relative group">
        {/* Underlying shadow backing box with exact matching border-radius */}
        {shadowClass && (
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-200 ${shadowClass}`}
            style={{
              borderRadius: computedRadius,
            }}
          />
        )}

        {/* Foreground mockup content */}
        <div
          className="relative z-10 transition-all duration-200"
          style={{
            borderRadius: computedRadius,
          }}
        >
          {frameElement}
        </div>
      </div>
    );
  };

  const renderFrameContent = () => {
    const handleFirstUpload = (file: File) => onImageUpload && onImageUpload(file);
    const handleSecondUpload = (file: File) => {
      if (!isValidMediaFile(file)) {
        alert(
          'Please upload a valid image or video file (.png, .jpg, .jpeg, .webp, .svg, .mp4, .webm, .mov)'
        );
        return;
      }

      if (isVideoFile(file)) {
        validateAndLoadVideo(file, ({ src, name, width, height, duration }) => {
          useStudioStore.getState().setSecondImage(src, name, width, height, 'video', duration);
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const src = e.target.result as string;
            const img = new Image();
            img.onload = () => {
              useStudioStore
                .getState()
                .setSecondImage(src, file.name, img.naturalWidth, img.naturalHeight, 'image');
            };
            img.onerror = () =>
              useStudioStore.getState().setSecondImage(src, file.name, null, null, 'image');
            img.src = src;
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const firstFrame = renderSingleFrame(state.imageSrc, state.imageName, handleFirstUpload, 1);
    const secondFrame = renderSingleFrame(
      state.secondImageSrc,
      state.secondImageName,
      handleSecondUpload,
      2
    );

    const firstFrameElement = (
      <div
        className={state.isAnimationMode && state.isPlaying ? '' : 'transition-all duration-200'}
        style={{
          transform: `perspective(${state.perspective}px) rotateX(${animTransform.rotateX}deg) rotateY(${animTransform.rotateY}deg) skewX(${state.skewX}deg) skewY(${state.skewY}deg) scale(${state.isAnimationMode ? animTransform.zoom / 100 : state.zoom / 100}) translate(${state.isAnimationMode ? animTransform.offsetX : state.offsetX}px, ${state.isAnimationMode ? animTransform.offsetY : state.offsetY}px) rotate(${state.isAnimationMode ? (animTransform.slot1Rotate ?? 0) : state.slot1Rotate || 0}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {firstFrame}
      </div>
    );

    const secondFrameElement = (
      <div
        className={state.isAnimationMode && state.isPlaying ? '' : 'transition-all duration-200'}
        style={{
          transform: `perspective(${slot2Perspective}px) rotateX(${slot2RX}deg) rotateY(${slot2RY}deg) skewX(${slot2SkewX}deg) skewY(${slot2SkewY}deg) scale(${state.isAnimationMode ? animTransform.slot2Zoom / 100 : state.slot2Zoom / 100}) translate(${state.isAnimationMode ? animTransform.slot2OffsetX : state.slot2OffsetX}px, ${state.isAnimationMode ? animTransform.slot2OffsetY : state.slot2OffsetY}px) rotate(${state.isAnimationMode ? (animTransform.slot2Rotate ?? 0) : state.slot2Rotate || 0}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {secondFrame}
      </div>
    );

    let layoutElement: React.ReactNode;

    if (state.layoutCount === 2) {
      switch (state.layoutPreset) {
        case 'overlap-right':
          layoutElement = (
            <div className="relative flex items-center justify-center p-8">
              <div className="relative z-10 scale-95 opacity-95 transition-all hover:z-30 hover:scale-100">
                {firstFrameElement}
              </div>
              <div className="relative z-20 -ml-16 mt-12 transition-all hover:z-30 hover:scale-105">
                {secondFrameElement}
              </div>
            </div>
          );
          break;
        case 'overlap-left':
          layoutElement = (
            <div className="relative flex items-center justify-center p-8">
              <div className="relative z-20 mt-12 transition-all hover:z-30 hover:scale-105">
                {firstFrameElement}
              </div>
              <div className="relative z-10 -ml-16 scale-95 opacity-95 transition-all hover:z-30 hover:scale-100">
                {secondFrameElement}
              </div>
            </div>
          );
          break;
        case 'stacked':
          layoutElement = (
            <div className="flex flex-col items-center gap-6 p-4">
              <div className="w-full flex justify-center">{firstFrameElement}</div>
              <div className="w-full flex justify-center">{secondFrameElement}</div>
            </div>
          );
          break;
        case 'side-by-side':
        default:
          layoutElement = (
            <div className="flex items-center gap-8 p-4">
              <div className="flex-1 flex justify-center">{firstFrameElement}</div>
              <div className="flex-1 flex justify-center">{secondFrameElement}</div>
            </div>
          );
          break;
      }
    } else {
      layoutElement = firstFrameElement;
    }

    // Compute inner scale reduction based on padding, aspect ratio, and layout count
    const isPortrait = ['9:16', '3:4', '4:5', 'ig-story', 'ig-portrait'].includes(
      state.aspectRatio
    );
    const baseScale = state.layoutCount === 2 ? (isPortrait ? 0.65 : 1) : 1.0;
    const paddingScale = Math.max(0.2, baseScale - (state.padding * 0.5) / 300);

    return (
      <div
        className="transition-all duration-200 flex items-center justify-center pointer-events-auto max-w-full max-h-full"
        style={{
          visibility: state.hideMockup ? 'hidden' : 'visible',
          transform: `scale(${paddingScale})`,
          transformOrigin:
            state.alignment === 'top'
              ? 'top center'
              : state.alignment === 'bottom'
                ? 'bottom center'
                : 'center center',
        }}
      >
        {layoutElement}
      </div>
    );
  };

  // Touch / Mouse Panning & Layer Dragging State
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // On-canvas direct element dragging state
  const [dragItem, setDragItem] = useState<{
    type: 'text' | 'phosphor' | 'element' | 'shape';
    id: string;
    startX: number;
    startY: number;
    initialLayerX: number;
    initialLayerY: number;
    scale: number;
  } | null>(null);

  // On-canvas direct element rotation state
  const [rotateDragItem, setRotateDragItem] = useState<{
    type: 'text' | 'phosphor' | 'element' | 'shape';
    id: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    initialRotation: number;
  } | null>(null);

  // On-canvas direct element resize state
  const [resizeDragItem, setResizeDragItem] = useState<{
    type: 'text' | 'phosphor' | 'element' | 'shape';
    id: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    initialFontSize: number;
    initialSize: number;
    initialScaleX?: number;
    initialScaleY?: number;
    scale: number;
    rotation: number;
    shapeType?: import('../types/studio').ShapeType;
  } | null>(null);

  // On-canvas drag of multiple selected layers together
  const [groupDrag, setGroupDrag] = useState<{
    startX: number;
    startY: number;
    scale: number;
    items: { type: 'text' | 'phosphor' | 'element' | 'shape'; id: string; x: number; y: number }[];
  } | null>(null);

  // Touch center for 2-finger mobile panning
  const touchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // rAF-throttled store updates for drag/resize/rotate (coalesce pointer-move spam to 1 update/frame)
  const dragFrameRef = useRef<number | null>(null);
  const dragPendingRef = useRef<(() => void) | null>(null);

  const scheduleDragUpdate = (update: () => void) => {
    dragPendingRef.current = update;
    if (dragFrameRef.current == null) {
      dragFrameRef.current = requestAnimationFrame(() => {
        dragFrameRef.current = null;
        const pending = dragPendingRef.current;
        dragPendingRef.current = null;
        pending?.();
      });
    }
  };

  const flushDragUpdate = () => {
    if (dragFrameRef.current != null) {
      cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    const pending = dragPendingRef.current;
    dragPendingRef.current = null;
    if (pending) pending();
  };

  // Cancel any pending drag frame on unmount
  useEffect(() => {
    return () => {
      if (dragFrameRef.current != null) cancelAnimationFrame(dragFrameRef.current);
    };
  }, []);

  // Reset pan offset to center when aspect ratio changes or when state is reset
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [state.aspectRatio, state.imageSrc, state.secondImageSrc, state.resetKey]);

  // 2-Finger Trackpad Pan & Pinch-to-Zoom on Mac/Windows
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevent page-level scroll and Safari back/forward history navigation gesture
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch-to-zoom (or Ctrl + mouse wheel)
        const zoomDelta = -e.deltaY * 0.5;
        const currentZoom = useStudioStore.getState().previewCanvasZoom || 100;
        const nextZoom = Math.max(25, Math.min(250, Math.round(currentZoom + zoomDelta)));
        useStudioStore.getState().updateState({ previewCanvasZoom: nextZoom });
      } else {
        // 2-finger trackpad pan or mouse wheel scroll
        setPan((prev) => ({
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }));
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Synchronize video elements with timeline playback and current time
  useEffect(() => {
    if (!canvasRef.current) return;
    const videoElements = canvasRef.current.querySelectorAll('video');
    videoElements.forEach((vid) => {
      if (state.isPlaying) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
        if (state.currentTimeSec !== undefined && vid.duration) {
          const targetTime = state.currentTimeSec % vid.duration;
          if (Math.abs(vid.currentTime - targetTime) > 0.05) {
            vid.currentTime = targetTime;
          }
        }
      }
    });
  }, [state.isPlaying, state.currentTimeSec]);

  // Auto-fit canvas zoom when aspect ratio changes
  useEffect(() => {
    // Canvas intrinsic width/height derived from getAspectRatioStyle (mirrors that function's logic)
    const ar = state.aspectRatio;
    const isDual = state.layoutCount === 2;
    let intrinsicW = 832;
    let intrinsicH = 832 * (9 / 16);

    if (ar === '1:1' || ar === 'ig-post') {
      intrinsicW = isDual ? 630 : 520;
      intrinsicH = intrinsicW;
    } else if (ar === '9:16' || ar === 'ig-story') {
      intrinsicW = 450;
      intrinsicH = 450 * (16 / 9);
    } else if (ar === '4:3') {
      intrinsicW = isDual ? 870 : 760;
      intrinsicH = intrinsicW * (3 / 4);
    } else if (ar === '3:2') {
      intrinsicW = isDual ? 900 : 585;
      intrinsicH = intrinsicW * (2 / 3);
    } else if (ar === '5:4') {
      intrinsicW = isDual ? 810 : 526;
      intrinsicH = intrinsicW * (4 / 5);
    } else if (ar === '3:4') {
      intrinsicW = isDual ? 428 : 428;
      intrinsicH = intrinsicW * (4 / 3);
    } else if (ar === '4:5' || ar === 'ig-portrait') {
      intrinsicW = isDual ? 468 : 468;
      intrinsicH = intrinsicW * (5 / 4);
    } else if (ar === 'auto') {
      intrinsicW = isDual ? 1560 : 1200;
      intrinsicH = isDual ? 900 : 700;
    } else if (ar === 'custom') {
      intrinsicW = (state.customWidth || 1280) * 0.45;
      intrinsicH = (state.customHeight || 720) * 0.45;
    } else {
      // 16:9 and yt-* variants
      intrinsicW = isDual ? 960 : 832;
      intrinsicH = intrinsicW * (9 / 16);
    }

    const containerEl =
      (canvasRef.current?.closest('.absolute.inset-0') as HTMLElement | null) ||
      (canvasRef.current?.parentElement?.parentElement as HTMLElement | null);

    // Fallback to window dimensions minus sidebar widths (~640px combined)
    const containerW = containerEl ? containerEl.clientWidth : window.innerWidth - 640;
    const containerH = containerEl ? containerEl.clientHeight : window.innerHeight - 120;

    const padding = 96; // 6rem each side
    const availW = containerW - padding;
    const availH = containerH - padding;

    const scaleW = availW / intrinsicW;
    const scaleH = availH / intrinsicH;
    const fitScale = Math.min(scaleW, scaleH, 1.0); // never zoom above 100%
    const clampedZoom = Math.max(25, Math.min(100, Math.round(fitScale * 100)));

    state.updateState({ previewCanvasZoom: clampedZoom });
  }, [state.aspectRatio, state.layoutCount]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.closest('label') ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return;
    }

    const deleteHandleEl = target.closest('[data-action="delete"]') as HTMLElement | null;
    if (deleteHandleEl) {
      return;
    }

    const resizeHandleEl = target.closest('[data-action="resize"]') as HTMLElement | null;
    if (resizeHandleEl) {
      const textLayerEl = target.closest('.text-layer-item') as HTMLElement | null;
      const phosphorIconLayerEl = target.closest('.phosphor-icon-layer-item') as HTMLElement | null;
      const canvasElementEl = target.closest('.canvas-element-item') as HTMLElement | null;
      const shapeLayerEl = target.closest('.shape-layer-item') as HTMLElement | null;

      let currentScale = 1;
      const canvasEl = canvasRef.current || document.getElementById('shotage-canvas');
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        if (rect.width > 0 && canvasEl.offsetWidth > 0) {
          currentScale = rect.width / canvasEl.offsetWidth;
        }
      }

      if (textLayerEl) {
        const id = textLayerEl.dataset.layerId || '';
        const layer = (state.textLayers || []).find((l) => l.id === id);
        if (layer) {
          const currentScaleX = layer.scaleX ?? 1;
          const currentScaleY = layer.scaleY ?? 1;
          const baseW = textLayerEl.offsetWidth || 100;
          const baseH = textLayerEl.offsetHeight || 30;

          setResizeDragItem({
            type: 'text',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: baseW,
            initialHeight: baseH,
            initialFontSize: layer.fontSize || 32,
            initialScaleX: currentScaleX,
            initialScaleY: currentScaleY,
            initialSize: 0,
            scale: currentScale,
            rotation: layer.rotation || 0,
          });
          state.updateState({ isPositionDragging: true });
        }
      } else if (phosphorIconLayerEl) {
        const id = phosphorIconLayerEl.dataset.layerId || '';
        const layer = (state.phosphorIconLayers || []).find((l) => l.id === id);
        if (layer) {
          setResizeDragItem({
            type: 'phosphor',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: 0,
            initialHeight: 0,
            initialFontSize: 0,
            initialSize: layer.size || 36,
            scale: currentScale,
            rotation: layer.rotation || 0,
          });
          state.updateState({ isPositionDragging: true });
        }
      } else if (canvasElementEl) {
        const id = canvasElementEl.dataset.layerId || '';
        const layer = (state.canvasElements || []).find((l) => l.id === id);
        if (layer) {
          setResizeDragItem({
            type: 'element',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: layer.width || 90,
            initialHeight: layer.height || 90,
            initialFontSize: 0,
            initialSize: 0,
            scale: currentScale,
            rotation: layer.rotation || 0,
          });
          state.updateState({ isPositionDragging: true });
        }
      } else if (shapeLayerEl) {
        const id = shapeLayerEl.dataset.layerId || '';
        const layer = (state.shapeLayers || []).find((l) => l.id === id);
        if (layer) {
          setResizeDragItem({
            type: 'shape',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: layer.width || 120,
            initialHeight: layer.height || 120,
            initialFontSize: 0,
            initialSize: 0,
            scale: currentScale,
            rotation: layer.rotation || 0,
            shapeType: layer.shapeType,
          });
          state.updateState({ isPositionDragging: true });
        }
      }
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      return;
    }

    const rotateHandleEl = target.closest('[data-action="rotate"]') as HTMLElement | null;
    if (rotateHandleEl) {
      const textLayerEl = target.closest('.text-layer-item') as HTMLElement | null;
      const phosphorIconLayerEl = target.closest('.phosphor-icon-layer-item') as HTMLElement | null;
      const canvasElementEl = target.closest('.canvas-element-item') as HTMLElement | null;
      const shapeLayerEl = target.closest('.shape-layer-item') as HTMLElement | null;
      const layerEl = textLayerEl || phosphorIconLayerEl || canvasElementEl || shapeLayerEl;

      if (layerEl) {
        const rect = layerEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

        if (textLayerEl) {
          const id = textLayerEl.dataset.layerId || '';
          const layer = (state.textLayers || []).find((l) => l.id === id);
          if (layer) {
            setRotateDragItem({
              type: 'text',
              id: layer.id,
              centerX,
              centerY,
              startAngle,
              initialRotation: layer.rotation || 0,
            });
            state.updateState({ isPositionDragging: true });
          }
        } else if (phosphorIconLayerEl) {
          const id = phosphorIconLayerEl.dataset.layerId || '';
          const layer = (state.phosphorIconLayers || []).find((l) => l.id === id);
          if (layer) {
            setRotateDragItem({
              type: 'phosphor',
              id: layer.id,
              centerX,
              centerY,
              startAngle,
              initialRotation: layer.rotation || 0,
            });
            state.updateState({ isPositionDragging: true });
          }
        } else if (canvasElementEl) {
          const id = canvasElementEl.dataset.layerId || '';
          const layer = (state.canvasElements || []).find((l) => l.id === id);
          if (layer) {
            setRotateDragItem({
              type: 'element',
              id: layer.id,
              centerX,
              centerY,
              startAngle,
              initialRotation: layer.rotation || 0,
            });
            state.updateState({ isPositionDragging: true });
          }
        } else if (shapeLayerEl) {
          const id = shapeLayerEl.dataset.layerId || '';
          const layer = (state.shapeLayers || []).find((l) => l.id === id);
          if (layer) {
            setRotateDragItem({
              type: 'shape',
              id: layer.id,
              centerX,
              centerY,
              startAngle,
              initialRotation: layer.rotation || 0,
            });
            state.updateState({ isPositionDragging: true });
          }
        }
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }
    }

    const textLayerEl = target.closest('.text-layer-item') as HTMLElement | null;
    const phosphorIconLayerEl = target.closest('.phosphor-icon-layer-item') as HTMLElement | null;
    const canvasElementEl = target.closest('.canvas-element-item') as HTMLElement | null;
    const shapeLayerEl = target.closest('.shape-layer-item') as HTMLElement | null;

    // Modifier+click on a layer: let the native click event handle multi-select
    // toggling instead of starting a drag / pan / single-select here.
    const multiKey = e.shiftKey || e.metaKey || e.ctrlKey;
    if ((textLayerEl || phosphorIconLayerEl || canvasElementEl || shapeLayerEl) && multiKey) {
      return;
    }

    const isShiftDrag = e.shiftKey;
    const isTargetingLayer =
      (textLayerEl || phosphorIconLayerEl || canvasElementEl || shapeLayerEl) && !isShiftDrag;

    if (isTargetingLayer) {
      let currentScale = 1;
      const canvasEl = canvasRef.current || document.getElementById('shotage-canvas');
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        if (rect.width > 0 && canvasEl.offsetWidth > 0) {
          currentScale = rect.width / canvasEl.offsetWidth;
        }
      }

      const pressedEl = textLayerEl
        ? textLayerEl
        : phosphorIconLayerEl
          ? phosphorIconLayerEl
          : canvasElementEl
            ? canvasElementEl
            : shapeLayerEl;

      if (pressedEl) {
        const pressedId = pressedEl.dataset.layerId || '';
        const selectedIds = textLayerEl
          ? state.selectedTextLayerIds || []
          : phosphorIconLayerEl
            ? state.selectedPhosphorIconLayerIds || []
            : canvasElementEl
              ? state.selectedElementIds || []
              : state.selectedShapeIds || [];

        // Pressed layer is part of a current multi-selection → drag all selected layers together
        if (selectedIds.length >= 2 && selectedIds.includes(pressedId)) {
          const items: {
            type: 'text' | 'phosphor' | 'element' | 'shape';
            id: string;
            x: number;
            y: number;
          }[] = [];
          (state.textLayers || [])
            .filter((l) => (state.selectedTextLayerIds || []).includes(l.id))
            .forEach((l) => items.push({ type: 'text', id: l.id, x: l.x || 0, y: l.y || 0 }));
          (state.phosphorIconLayers || [])
            .filter((l) => (state.selectedPhosphorIconLayerIds || []).includes(l.id))
            .forEach((l) => items.push({ type: 'phosphor', id: l.id, x: l.x || 0, y: l.y || 0 }));
          (state.canvasElements || [])
            .filter((el) => (state.selectedElementIds || []).includes(el.id))
            .forEach((el) =>
              items.push({ type: 'element', id: el.id, x: el.x || 0, y: el.y || 0 })
            );
          (state.shapeLayers || [])
            .filter((s) => (state.selectedShapeIds || []).includes(s.id))
            .forEach((s) => items.push({ type: 'shape', id: s.id, x: s.x || 0, y: s.y || 0 }));

          if (items.length >= 2) {
            setGroupDrag({
              startX: e.clientX,
              startY: e.clientY,
              scale: currentScale,
              items,
            });
            state.updateState({ isPositionDragging: true });
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            return;
          }
        }
      }

      if (textLayerEl) {
        const id = textLayerEl.dataset.layerId || '';
        const layer = (state.textLayers || []).find((l) => l.id === id);
        if (layer) {
          state.selectTextLayer(layer.id);
          setDragItem({
            type: 'text',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialLayerX: layer.x || 0,
            initialLayerY: layer.y || 0,
            scale: currentScale,
          });
          state.updateState({ isPositionDragging: true });
        }
      } else if (phosphorIconLayerEl) {
        const id = phosphorIconLayerEl.dataset.layerId || '';
        const layer = (state.phosphorIconLayers || []).find((l) => l.id === id);
        if (layer) {
          state.selectPhosphorIconLayer(layer.id);
          setDragItem({
            type: 'phosphor',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialLayerX: layer.x || 0,
            initialLayerY: layer.y || 0,
            scale: currentScale,
          });
          state.updateState({ isPositionDragging: true });
        }
      } else if (canvasElementEl) {
        const id = canvasElementEl.dataset.layerId || '';
        const layer = (state.canvasElements || []).find((l) => l.id === id);
        if (layer) {
          state.selectCanvasElement(layer.id);
          setDragItem({
            type: 'element',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialLayerX: layer.x || 0,
            initialLayerY: layer.y || 0,
            scale: currentScale,
          });
          state.updateState({ isPositionDragging: true });
        }
      } else if (shapeLayerEl) {
        const id = shapeLayerEl.dataset.layerId || '';
        const layer = (state.shapeLayers || []).find((l) => l.id === id);
        if (layer) {
          state.selectShapeLayer(layer.id);
          setDragItem({
            type: 'shape',
            id: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initialLayerX: layer.x || 0,
            initialLayerY: layer.y || 0,
            scale: currentScale,
          });
          state.updateState({ isPositionDragging: true });
        }
      }
    } else {
      if (!(e.shiftKey || e.metaKey || e.ctrlKey)) {
        if ((state.selectedTextLayerIds?.length ?? 0) > 0 && !textLayerEl)
          state.selectTextLayer(null);
        if ((state.selectedPhosphorIconLayerIds?.length ?? 0) > 0 && !phosphorIconLayerEl)
          state.selectPhosphorIconLayer(null);
        if ((state.selectedElementIds?.length ?? 0) > 0 && !canvasElementEl)
          state.selectCanvasElement(null);
        if ((state.selectedShapeIds?.length ?? 0) > 0 && !shapeLayerEl)
          state.selectShapeLayer(null);
      }

      setIsPanning(true);
      startPosRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (rotateDragItem) {
      const currentAngle =
        Math.atan2(e.clientY - rotateDragItem.centerY, e.clientX - rotateDragItem.centerX) *
        (180 / Math.PI);
      const angleDiff = currentAngle - rotateDragItem.startAngle;
      let newRotation = Math.round(rotateDragItem.initialRotation + angleDiff);

      // Normalize to -180 .. 180 range
      newRotation = ((((newRotation + 180) % 360) + 360) % 360) - 180;

      // Snap to every 45 degrees (0, 45, 90, 135, 180, -45, -90, -135, -180) within 4 degrees threshold
      const snapTargets = [-180, -135, -90, -45, 0, 45, 90, 135, 180];
      for (const target of snapTargets) {
        if (Math.abs(newRotation - target) <= 10) {
          newRotation = target;
          break;
        }
      }

      if (rotateDragItem.type === 'text') {
        scheduleDragUpdate(() =>
          state.updateTextLayer(rotateDragItem.id, { rotation: newRotation })
        );
      } else if (rotateDragItem.type === 'phosphor') {
        scheduleDragUpdate(() =>
          state.updatePhosphorIconLayer(rotateDragItem.id, { rotation: newRotation })
        );
      } else if (rotateDragItem.type === 'element') {
        scheduleDragUpdate(() =>
          state.updateCanvasElement(rotateDragItem.id, { rotation: newRotation })
        );
      } else if (rotateDragItem.type === 'shape') {
        scheduleDragUpdate(() =>
          state.updateShapeLayer(rotateDragItem.id, { rotation: newRotation })
        );
      }
    } else if (resizeDragItem) {
      const scale = resizeDragItem.scale || 1;
      const screenDeltaX = (e.clientX - resizeDragItem.startX) / scale;
      const screenDeltaY = (e.clientY - resizeDragItem.startY) / scale;

      // Project screen delta into the element's local coordinate space rotated by -rotation
      const rad = ((resizeDragItem.rotation || 0) * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const deltaX = screenDeltaX * cos - screenDeltaY * sin;
      const deltaY = screenDeltaX * sin + screenDeltaY * cos;
      const delta = (deltaX + deltaY) / 2;

      if (resizeDragItem.type === 'text') {
        const baseW = Math.max(resizeDragItem.initialWidth || 100, 20);
        const baseH = Math.max(resizeDragItem.initialHeight || 30, 10);
        const initScaleX = resizeDragItem.initialScaleX ?? 1;
        const initScaleY = resizeDragItem.initialScaleY ?? 1;

        if (e.shiftKey) {
          // Proportional Uniform Scaling when holding Shift
          const initVisualW = baseW * initScaleX;
          const initVisualH = baseH * initScaleY;
          const avgVisualDelta = (deltaX + deltaY) / 2;
          const scaleRatio = 1 + avgVisualDelta / Math.max(initVisualW, initVisualH, 30);
          const nextScaleX = Math.max(0.1, Math.min(20.0, initScaleX * scaleRatio));
          const nextScaleY = Math.max(0.1, Math.min(20.0, initScaleY * scaleRatio));
          scheduleDragUpdate(() =>
            state.updateTextLayer(resizeDragItem.id, {
              scaleX: Math.round(nextScaleX * 100) / 100,
              scaleY: Math.round(nextScaleY * 100) / 100,
            })
          );
        } else {
          // 1:1 Pixel-Perfect Cursor Tracking (nextVisualW = initVisualW + deltaX => nextScaleX = initScaleX + deltaX / baseW)
          const nextScaleX = Math.max(0.1, Math.min(20.0, initScaleX + deltaX / baseW));
          const nextScaleY = Math.max(0.1, Math.min(20.0, initScaleY + deltaY / baseH));
          scheduleDragUpdate(() =>
            state.updateTextLayer(resizeDragItem.id, {
              scaleX: Math.round(nextScaleX * 100) / 100,
              scaleY: Math.round(nextScaleY * 100) / 100,
            })
          );
        }
      } else if (resizeDragItem.type === 'phosphor') {
        // 1:1 Pixel-Perfect Cursor Tracking for Phosphor Icons (diagonal displacement on square aspect)
        const newSize = Math.max(
          16,
          Math.min(600, Math.round(resizeDragItem.initialSize + (deltaX + deltaY) / 2))
        );
        scheduleDragUpdate(() =>
          state.updatePhosphorIconLayer(resizeDragItem.id, { size: newSize })
        );
      } else if (resizeDragItem.type === 'element') {
        // 1:1 Pixel-Perfect Cursor Tracking for Canvas Elements (emojis, arrows, lines)
        const initW = resizeDragItem.initialWidth || 90;
        const initH = resizeDragItem.initialHeight || 90;
        const isSquare = Math.abs(initW - initH) < 2;

        if (isSquare || e.shiftKey) {
          // Uniform 1:1 aspect scaling (e.g. emojis)
          const avgDelta = (deltaX + deltaY) / 2;
          const aspect = initH > 0 ? initW / initH : 1;
          const newWidth = Math.max(10, Math.min(1200, Math.round(initW + avgDelta)));
          const newHeight = Math.max(10, Math.min(1200, Math.round(newWidth / aspect)));
          scheduleDragUpdate(() =>
            state.updateCanvasElement(resizeDragItem.id, { width: newWidth, height: newHeight })
          );
        } else {
          // Freeform 2D sizing
          const newWidth = Math.max(10, Math.min(1200, Math.round(initW + deltaX)));
          const newHeight = Math.max(10, Math.min(1200, Math.round(initH + deltaY)));
          scheduleDragUpdate(() =>
            state.updateCanvasElement(resizeDragItem.id, { width: newWidth, height: newHeight })
          );
        }
      } else if (resizeDragItem.type === 'shape') {
        // 1:1 Pixel-Perfect Cursor Tracking for Shapes
        const isUniform = resizeDragItem.shapeType && resizeDragItem.shapeType !== 'rectangle';
        const initW = resizeDragItem.initialWidth || 120;
        const initH = resizeDragItem.initialHeight || 120;

        if (isUniform || e.shiftKey) {
          const avgDelta = (deltaX + deltaY) / 2;
          const aspect = initH > 0 ? initW / initH : 1;
          const newWidth = Math.max(10, Math.min(2000, Math.round(initW + avgDelta)));
          const newHeight = Math.max(10, Math.min(2000, Math.round(newWidth / aspect)));
          scheduleDragUpdate(() =>
            state.updateShapeLayer(resizeDragItem.id, { width: newWidth, height: newHeight })
          );
        } else {
          const newWidth = Math.max(10, Math.min(2000, Math.round(initW + deltaX)));
          const newHeight = Math.max(10, Math.min(2000, Math.round(initH + deltaY)));
          scheduleDragUpdate(() =>
            state.updateShapeLayer(resizeDragItem.id, { width: newWidth, height: newHeight })
          );
        }
      }
    } else if (groupDrag) {
      const scale = groupDrag.scale || 1;
      const deltaX = (e.clientX - groupDrag.startX) / scale;
      const deltaY = (e.clientY - groupDrag.startY) / scale;

      scheduleDragUpdate(() => {
        for (const item of groupDrag.items) {
          const newX = Math.round(item.x + deltaX);
          const newY = Math.round(item.y + deltaY);
          if (item.type === 'text') {
            state.updateTextLayer(item.id, { x: newX, y: newY });
          } else if (item.type === 'phosphor') {
            state.updatePhosphorIconLayer(item.id, { x: newX, y: newY });
          } else if (item.type === 'element') {
            state.updateCanvasElement(item.id, { x: newX, y: newY });
          } else if (item.type === 'shape') {
            state.updateShapeLayer(item.id, { x: newX, y: newY });
          }
        }
      });
    } else if (dragItem) {
      const scale = dragItem.scale || 1;
      const deltaX = (e.clientX - dragItem.startX) / scale;
      const deltaY = (e.clientY - dragItem.startY) / scale;

      const newX = Math.round(dragItem.initialLayerX + deltaX);
      const newY = Math.round(dragItem.initialLayerY + deltaY);

      if (dragItem.type === 'text') {
        scheduleDragUpdate(() => state.updateTextLayer(dragItem.id, { x: newX, y: newY }));
      } else if (dragItem.type === 'phosphor') {
        scheduleDragUpdate(() => state.updatePhosphorIconLayer(dragItem.id, { x: newX, y: newY }));
      } else if (dragItem.type === 'element') {
        scheduleDragUpdate(() => state.updateCanvasElement(dragItem.id, { x: newX, y: newY }));
      } else if (dragItem.type === 'shape') {
        scheduleDragUpdate(() => state.updateShapeLayer(dragItem.id, { x: newX, y: newY }));
      }
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPosRef.current.x,
        y: e.clientY - startPosRef.current.y,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    flushDragUpdate();
    if (rotateDragItem) {
      setRotateDragItem(null);
      state.updateState({ isPositionDragging: false });
    }
    if (resizeDragItem) {
      setResizeDragItem(null);
      state.updateState({ isPositionDragging: false });
    }
    if (groupDrag) {
      setGroupDrag(null);
      state.updateState({ isPositionDragging: false });
    }
    if (dragItem) {
      setDragItem(null);
      state.updateState({ isPositionDragging: false });
    }
    if (isPanning) {
      setIsPanning(false);
    }
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      flushDragUpdate();
      if (rotateDragItem) {
        setRotateDragItem(null);
        state.updateState({ isPositionDragging: false });
      }
      if (resizeDragItem) {
        setResizeDragItem(null);
        state.updateState({ isPositionDragging: false });
      }
      if (groupDrag) {
        setGroupDrag(null);
        state.updateState({ isPositionDragging: false });
      }
      if (dragItem) {
        setDragItem(null);
        state.updateState({ isPositionDragging: false });
      }
      setIsPanning(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      touchCenterRef.current = { x: centerX - pan.x, y: centerY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length >= 2 && touchCenterRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentCenterX = (touch1.clientX + touch2.clientX) / 2;
      const currentCenterY = (touch1.clientY + touch2.clientY) / 2;

      setPan({
        x: currentCenterX - touchCenterRef.current.x,
        y: currentCenterY - touchCenterRef.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchCenterRef.current = null;
    }
  };

  return (
    <div
      ref={viewportRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`absolute inset-0 max-w-full flex items-center justify-center p-3 sm:p-6 md:p-12 overflow-hidden transition-all duration-300 ${
        rotateDragItem || resizeDragItem || groupDrag || dragItem
          ? 'cursor-move select-none'
          : isPanning
            ? 'cursor-grabbing select-none'
            : 'cursor-grab'
      }`}
    >
      {/* Canvas Viewport Scaling & Drag Pan Wrapper */}
      <div
        className="transition-transform duration-75 flex items-center justify-center touch-none relative"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${state.previewCanvasZoom / 100})`,
        }}
      >
        {/* Editor-Only Transparency Guide Grid (Not included in export canvasRef) */}
        {state.backgroundType === 'transparent' && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none border border-neutral-700/60 shadow-2xl"
            style={{
              backgroundImage:
                'radial-gradient(#334155 1.5px, transparent 1.5px), radial-gradient(#334155 1.5px, #0f172a 1.5px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          />
        )}

        {/* Exportable Canvas Container */}
        <div
          ref={canvasRef}
          id="shotage-canvas"
          className={`relative flex items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl box-border shrink-0 ${getAspectRatioStyle()}`}
          style={{
            ...getBackgroundStyle(),
            padding: `${state.padding}px`,
            ...(state.aspectRatio === 'custom'
              ? {
                  width: `${Math.max(160, state.customWidth || 1280) * 0.45}px`,
                  height: `${Math.max(160, state.customHeight || 720) * 0.45}px`,
                  aspectRatio: `${state.customWidth || 1280} / ${state.customHeight || 720}`,
                }
              : {}),
          }}
        >
          {/* Global Canvas Background Layer Container with Blur Support */}
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
              (state.bgBlur ?? 0) > 0 ? 'scale-105' : ''
            }`}
            style={{
              ...getBackgroundStyle(),
              filter: (state.bgBlur ?? 0) > 0 ? `blur(${state.bgBlur}px)` : undefined,
            }}
          >
            {/* SVG Wave Background Layer */}
            {state.backgroundType === 'wave' && (
              <WaveBackground presetId={state.wavePreset || 'wave-1'} />
            )}

            {/* Dynamic Mesh Background Layer */}
            {state.backgroundType === 'mesh' && (
              <MeshBackground presetId={state.meshPreset || 'mesh-1'} />
            )}

            {/* Confetti Shapes Background Layer */}
            {state.backgroundType === 'confetti' && (
              <ConfettiBackground
                presetId={state.confettiPreset || 'confetti-1'}
                customPreset={state.customConfettiObj}
              />
            )}

            {/* Shadeshifter Grainient Mesh Layer */}
            {state.backgroundType === 'shadeshifter' && (
              <ShadeshifterBackground
                presetId={state.shadeshifterPreset || 'shadeshifter-1'}
                grainOpacity={0}
                blur={state.shadeshifterBlur ?? 40}
              />
            )}

            {/* Spectral Chromatic Prism Layer */}
            {state.backgroundType === 'spectral' && (
              <SpectralBackground
                presetId={state.spectralPreset || 'spectral-1'}
                blur={state.spectralBlur}
                angle={state.spectralAngle}
              />
            )}

            {/* Radiant Glow Background Layer */}
            {state.backgroundType === 'radiant' && (
              <RadiantBackground presetId={state.radiantPreset || 'radiant-1'} />
            )}

            {/* Pure CSS Animated Gradient Background Layer */}
            {state.backgroundType === 'animatedGradient' && (
              <AnimatedGradientBackground
                presetId={state.animatedGradientPreset || 'anim-grad-1'}
              />
            )}

            {/* Pure CSS Animated Mesh Background Layer */}
            {state.backgroundType === 'animatedMesh' && (
              <AnimatedMeshBackground presetId={state.animatedMeshPreset || 'anim-mesh-1'} />
            )}

            {/* Background Image Layer */}
            {state.backgroundType === 'image' && state.bgImageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${state.bgImageUrl})`,
                }}
              />
            )}
          </div>

          {/* Pattern Add-on Overlay Layer */}
          {state.bgPatternEnabled && (
            <div
              className="absolute inset-0 pointer-events-none z-[1]"
              style={{
                opacity: (state.bgPatternOpacity ?? 40) / 100,
                backgroundImage: getPatternSvgUrl(
                  state.bgPatternPreset || 'pattern-1',
                  state.bgPatternColor || '#9C92AC'
                ),
                backgroundRepeat: 'repeat',
              }}
            />
          )}

          {/* Grain Effect Noise Overlay Layer */}
          {(state.bgGrain ?? 0) > 0 && (
            <div
              className="absolute inset-0 pointer-events-none z-[2] mix-blend-overlay"
              style={{
                opacity: (state.bgGrain ?? 0) / 100,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
          )}

          {/* Shadow Overlay Layer */}
          {state.shadowOverlay && state.shadowOverlay !== 'none' && (
            <img
              src={`/overlay/${state.shadowOverlay}.png`}
              alt="Shadow Overlay"
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-multiply ${
                (state.shadowOverlayPosition || 'above') === 'behind' ? 'z-[1]' : 'z-[30]'
              }`}
              style={{
                opacity: (state.shadowOverlayOpacity ?? 85) / 100,
              }}
            />
          )}

          {/* Underneath Static Text & Icon Layers (Rendered behind the 3D mockup frame) */}
          {renderTextLayers('underneath')}
          {renderPhosphorIconLayers('underneath')}
          {renderCanvasElements('underneath')}
          {renderShapeLayers('underneath')}

          {/* 3D Transform Wrapper */}
          <div
            className={`flex-1 h-full max-w-full flex items-center justify-center relative z-10 ${
              state.hideMockup ? 'pointer-events-none' : ''
            }`}
            style={transformStyle}
          >
            {renderFrameContent()}
          </div>

          {/* Above Static Text & Icon Layers (Rendered on top of the 3D mockup frame) */}
          {renderTextLayers('above')}
          {renderPhosphorIconLayers('above')}
          {renderCanvasElements('above')}
          {renderShapeLayers('above')}

          {/* Center Alignment Guide Lines & Dashed Grid Overlay (Shown while dragging) */}
          {state.isPositionDragging && (
            <div className="absolute inset-0 pointer-events-none z-20 animate-in fade-in duration-100 overflow-hidden">
              {/* Grid of small squares with dashed lines */}
              <div
                className="absolute inset-0 opacity-80"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 32 0 L 0 0 0 32' fill='none' stroke='rgba(148,163,184,0.9)' stroke-width='2' stroke-dasharray='4 4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'repeat',
                }}
              />
              {/* Vertical Center Alignment Line */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-slate-300 shadow-[0_0_4px_1px_rgba(203,213,225,0.7)]" />
              {/* Horizontal Center Alignment Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-300 shadow-[0_0_4px_1px_rgba(203,213,225,0.7)]" />
            </div>
          )}

          {/* Tech Stack Overlay */}
          {(() => {
            const config = state.techStackConfig;
            if (
              !config ||
              !config.enabled ||
              !config.selectedIcons ||
              config.selectedIcons.length === 0
            ) {
              return null;
            }

            const getPositionStyles = (): React.CSSProperties => {
              let baseTX = '0%';
              let baseTY = '0%';
              let top: string | undefined;
              let bottom: string | undefined;
              let left: string | undefined;
              let right: string | undefined;

              switch (config.position) {
                case 'top-left':
                  top = '1.5rem';
                  left = '1.5rem';
                  break;
                case 'top-center':
                  top = '1.5rem';
                  left = '50%';
                  baseTX = '-50%';
                  break;
                case 'top-right':
                  top = '1.5rem';
                  right = '1.5rem';
                  break;
                case 'center-left':
                  top = '50%';
                  left = '1.5rem';
                  baseTY = '-50%';
                  break;
                case 'center':
                  top = '50%';
                  left = '50%';
                  baseTX = '-50%';
                  baseTY = '-50%';
                  break;
                case 'center-right':
                  top = '50%';
                  right = '1.5rem';
                  baseTY = '-50%';
                  break;
                case 'bottom-left':
                  bottom = '1.5rem';
                  left = '1.5rem';
                  break;
                case 'bottom-center':
                  bottom = '1.5rem';
                  left = '50%';
                  baseTX = '-50%';
                  break;
                case 'bottom-right':
                  bottom = '1.5rem';
                  right = '1.5rem';
                  break;
              }

              const xOff = config.xOffset || 0;
              const yOff = config.yOffset || 0;

              return {
                top,
                bottom,
                left,
                right,
                transform: `translate(calc(${baseTX} + ${xOff}px), calc(${baseTY} + ${yOff}px))`,
              };
            };

            const getBadgeClass = () => {
              switch (config.badgeStyle) {
                case 'glass-dark':
                  return 'bg-neutral-950/40 backdrop-blur-md border border-white/15 shadow-xl rounded-xl p-2.5';
                case 'glass-light':
                  return 'bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-xl p-2.5';
                case 'badge-dark':
                  return 'bg-neutral-950/90 border border-neutral-800 shadow-md rounded-xl p-2.5';
                case 'badge-light':
                  return 'bg-white border border-slate-200/90 shadow-md rounded-xl p-2.5';
                case 'plain':
                default:
                  return '';
              }
            };

            return (
              <div
                className={`absolute z-[5] pointer-events-none select-none transition-all duration-150 ${getBadgeClass()}`}
                style={getPositionStyles()}
              >
                <div
                  className={`flex items-center ${
                    config.style === 'column' ? 'flex-col' : 'flex-row'
                  }`}
                  style={{ gap: `${config.gap || 12}px` }}
                >
                  {config.selectedIcons.map((iconId) => (
                    <TechStackIcon key={iconId} id={iconId} size={config.size || 28} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Phosphor Icons Overlay */}
          {(() => {
            const config = state.phosphorIconConfig;
            if (
              !config ||
              !config.enabled ||
              !config.selectedIcons ||
              config.selectedIcons.length === 0
            ) {
              return null;
            }

            const getPositionStyles = (): React.CSSProperties => {
              let baseTX = '0%';
              let baseTY = '0%';
              let top: string | undefined;
              let bottom: string | undefined;
              let left: string | undefined;
              let right: string | undefined;

              switch (config.position) {
                case 'top-left':
                  top = '1.5rem';
                  left = '1.5rem';
                  break;
                case 'top-center':
                  top = '1.5rem';
                  left = '50%';
                  baseTX = '-50%';
                  break;
                case 'top-right':
                  top = '1.5rem';
                  right = '1.5rem';
                  break;
                case 'center-left':
                  top = '50%';
                  left = '1.5rem';
                  baseTY = '-50%';
                  break;
                case 'center':
                  top = '50%';
                  left = '50%';
                  baseTX = '-50%';
                  baseTY = '-50%';
                  break;
                case 'center-right':
                  top = '50%';
                  right = '1.5rem';
                  baseTY = '-50%';
                  break;
                case 'bottom-left':
                  bottom = '1.5rem';
                  left = '1.5rem';
                  break;
                case 'bottom-center':
                  bottom = '1.5rem';
                  left = '50%';
                  baseTX = '-50%';
                  break;
                case 'bottom-right':
                  bottom = '1.5rem';
                  right = '1.5rem';
                  break;
              }

              const xOff = config.xOffset || 0;
              const yOff = config.yOffset || 0;

              return {
                top,
                bottom,
                left,
                right,
                transform: `translate(calc(${baseTX} + ${xOff}px), calc(${baseTY} + ${yOff}px))`,
              };
            };

            const getBadgeClass = () => {
              switch (config.badgeStyle) {
                case 'glass-dark':
                  return 'bg-neutral-950/40 backdrop-blur-md border border-white/15 shadow-xl rounded-xl p-2.5';
                case 'glass-light':
                  return 'bg-white/30 backdrop-blur-md border border-white/50 shadow-xl rounded-xl p-2.5';
                case 'badge-dark':
                  return 'bg-neutral-950/90 border border-neutral-800 shadow-md rounded-xl p-2.5';
                case 'badge-light':
                  return 'bg-white border border-slate-200/90 shadow-md rounded-xl p-2.5';
                case 'plain':
                default:
                  return '';
              }
            };

            return (
              <div
                className={`absolute z-[5] pointer-events-none select-none transition-all duration-150 ${getBadgeClass()}`}
                style={getPositionStyles()}
              >
                <div
                  className={`flex items-center ${
                    config.style === 'column' ? 'flex-col' : 'flex-row'
                  }`}
                  style={{ gap: `${config.gap || 12}px` }}
                >
                  {(config.selectedIcons || []).map((iconId: string) => {
                    const IconComp = (PhosphorIcons as any)[iconId] || PhosphorIcons.Sparkle;
                    return (
                      <IconComp
                        key={iconId}
                        weight={config.weight || 'regular'}
                        size={config.size || 28}
                        color={config.color || '#a2d2ff'}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Top-Level Lens Blur (Depth of Field) Overlay covering the entire stage & mockup */}
          {state.lensBlurEnabled && (state.lensBlurAmount ?? 0) > 0 && (
            <div
              className="absolute inset-0 pointer-events-none z-40 transition-all duration-200 scale-[1.03]"
              style={{
                backdropFilter: `blur(${state.lensBlurAmount}px) saturate(135%) brightness(92%)`,
                WebkitBackdropFilter: `blur(${state.lensBlurAmount}px) saturate(135%) brightness(92%)`,
                WebkitMaskImage: `radial-gradient(circle at ${state.lensBlurFocalX ?? 50}% ${
                  state.lensBlurFocalY ?? 50
                }%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${state.lensBlurRadius ?? 20}%, rgba(0,0,0,1) ${Math.min(
                  100,
                  (state.lensBlurRadius ?? 20) + 35
                )}%)`,
                maskImage: `radial-gradient(circle at ${state.lensBlurFocalX ?? 50}% ${
                  state.lensBlurFocalY ?? 50
                }%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${state.lensBlurRadius ?? 20}%, rgba(0,0,0,1) ${Math.min(
                  100,
                  (state.lensBlurRadius ?? 20) + 35
                )}%)`,
              }}
            />
          )}

          {/* Watermark Overlay (Placed at top-level above Lens Blur) */}
          <WatermarkOverlay />
        </div>

        {/* Multi-Select Align Toolbar (Editor-only, not part of export canvas) */}
        {(state.selectedElementIds?.length ?? 0) +
          (state.selectedTextLayerIds?.length ?? 0) +
          (state.selectedPhosphorIconLayerIds?.length ?? 0) +
          (state.selectedShapeIds?.length ?? 0) >=
          2 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-neutral-900/95 border border-neutral-700 rounded-xl p-1 shadow-2xl pointer-events-auto">
            <button
              type="button"
              onClick={() => state.alignCanvasElements('left', canvasRef.current?.offsetWidth || 0)}
              title="Align left"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <PhosphorIcons.AlignLeftIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                state.alignCanvasElements('center', canvasRef.current?.offsetWidth || 0)
              }
              title="Align horizontal center"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <PhosphorIcons.AlignCenterHorizontalIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                state.alignCanvasElements('right', canvasRef.current?.offsetWidth || 0)
              }
              title="Align right"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <PhosphorIcons.AlignRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
