import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { BrowserFrame } from './frames/BrowserFrame';
import { DeviceFrame } from './frames/DeviceFrame';
import { WaveBackground } from './WaveBackground';
import { MeshBackground } from './MeshBackground';
import { ConfettiBackground } from './ConfettiBackground';
import { RadiantBackground } from './RadiantBackground';
import { LINEAR_SWATCH_PRESETS } from '../utils/linearSwatchPresets';
import { WatermarkOverlay } from './WatermarkOverlay';
import { GOOGLE_FONTS } from './RightSidebar';
import { SocialIcon } from './SocialIcons';
import { TechStackIcon } from './TechStackIcons';
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
        return isDual ? 'aspect-[4/3] w-[870px]' : 'aspect-[4/3] w-[565px]';
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
        return 'w-auto h-auto min-h-[390px]';
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
        backgroundImage:
          'radial-gradient(#334155 1px, transparent 1px), radial-gradient(#334155 1px, #0f172a 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
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
      ['iphone', 'iphone14pro', 'macbook', 'macbookair13', 'samsung-s21', 'tablet'].includes(
        state.frameType
      )
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

    // Smooth cubic ease-in-out easing interpolation
    const ease = (p: number) => (p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p);
    const factor = ease(progress);

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

  // 3D Perspective & Tilt transform matrix for the stage
  const transformStyle: React.CSSProperties = {
    transform: `perspective(${state.perspective}px) rotateX(${animTransform.rotateX}deg) rotateY(${animTransform.rotateY}deg)`,
    transformStyle: 'preserve-3d',
    transition: state.isPlaying ? 'none' : 'transform 0.15s ease-out',
  };

  const renderTextLayers = (positionFilter: 'above' | 'underneath') => {
    return state.textLayers
      .filter((layer) => (layer.position || 'above') === positionFilter)
      .map((layer) => {
        const isSelected = layer.id === state.selectedTextLayerId;
        const fontObj = GOOGLE_FONTS.find((f) => f.name === layer.fontFamily);
        const fontFamilyCss = fontObj ? fontObj.family : layer.fontFamily;

        return (
          <div
            key={layer.id}
            data-layer-id={layer.id}
            onClick={(e) => {
              e.stopPropagation();
              state.selectTextLayer(layer.id);
            }}
            className={`text-layer-item absolute cursor-pointer select-none rounded-sm ${
              positionFilter === 'underneath' ? 'z-0' : 'z-30'
            } ${
              isSelected
                ? 'ring-2 ring-pastel-blue ring-offset-2 ring-offset-neutral-950/40'
                : 'hover:outline-1 hover:outline-dashed hover:outline-slate-400'
            }`}
            style={{
              transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation || 0}deg)`,
              fontFamily: fontFamilyCss,
              fontSize: `${layer.fontSize}px`,
              lineHeight: 1.2,
              fontWeight: layer.fontWeight,
              fontStyle: layer.fontStyle,
              color: layer.color,
              textAlign: layer.textAlign,
              opacity: (layer.opacity ?? 100) / 100,
              textShadow: layer.shadow
                ? '0 4px 12px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)'
                : 'none',
              whiteSpace: layer.text.includes('\n') ? 'pre-wrap' : 'nowrap',
              width: 'max-content',
              maxWidth: 'none',
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
                <span style={{ fontFamily: fontFamilyCss }}>{layer.text}</span>
              </div>
            ) : (
              layer.text
            )}
            {isSelected && (
              <div
                data-action="rotate"
                title="Drag to rotate"
                className="rotate-handle absolute -top-3 -right-3 w-6 h-6 rounded-full bg-pastel-pink text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-50 pointer-events-auto"
              >
                <PhosphorIcons.ArrowClockwise className="w-3.5 h-3.5 font-bold" />
              </div>
            )}
          </div>
        );
      });
  };

  const renderPhosphorIconLayers = (positionFilter: 'above' | 'underneath') => {
    const layers = state.phosphorIconLayers || [];
    return layers
      .filter((layer) => (layer.position || 'above') === positionFilter)
      .map((layer) => {
        const isSelected = layer.id === state.selectedPhosphorIconLayerId;
        const IconComp = (PhosphorIcons as any)[layer.iconId] || PhosphorIcons.Sparkle;

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

        return (
          <div
            key={layer.id}
            data-layer-id={layer.id}
            onClick={(e) => {
              e.stopPropagation();
              state.selectPhosphorIconLayer(layer.id);
            }}
            className={`phosphor-icon-layer-item absolute cursor-pointer select-none transition-all ${roundedClass} ${
              positionFilter === 'underneath' ? 'z-0' : 'z-30'
            } ${
              isSelected ? 'ring-2 ring-pastel-pink ring-offset-2 ring-offset-neutral-950/40' : ''
            }`}
            style={{
              transform: `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation || 0}deg)`,
              opacity: (layer.opacity ?? 100) / 100,
              filter: layer.shadow ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.65))' : 'none',
            }}
          >
            <div className={getBadgeClass(layer.badgeStyle)}>
              <IconComp
                weight={layer.weight || 'duotone'}
                size={layer.size || 36}
                color={layer.color || '#a2d2ff'}
              />
            </div>
            {isSelected && (
              <div
                data-action="rotate"
                title="Drag to rotate"
                className="rotate-handle absolute -top-3 -right-3 w-6 h-6 rounded-full bg-pastel-pink text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-50 pointer-events-auto"
              >
                <PhosphorIcons.ArrowClockwise className="w-3.5 h-3.5 font-bold" />
              </div>
            )}
          </div>
        );
      });
  };

  const renderCanvasElements = (positionFilter: 'above' | 'underneath') => {
    const elements = state.canvasElements || [];
    return elements
      .filter((el) => (el.position || 'above') === positionFilter)
      .map((el) => {
        const isSelected = el.id === state.selectedElementId;

        return (
          <div
            key={el.id}
            data-layer-id={el.id}
            onClick={(e) => {
              e.stopPropagation();
              state.selectCanvasElement(el.id);
            }}
            className={`canvas-element-item absolute cursor-pointer select-none transition-all rounded-lg ${
              positionFilter === 'underneath' ? 'z-0' : 'z-30'
            } ${
              isSelected ? 'ring-2 ring-pastel-pink ring-offset-2 ring-offset-neutral-950/40' : ''
            }`}
            style={{
              transform: `translate(${el.x}px, ${el.y}px) rotate(${el.rotation || 0}deg) scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`,
              opacity: (el.opacity ?? 100) / 100,
              filter: el.shadow ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.65))' : 'none',
              width: `${el.width || 90}px`,
              height: `${el.height || 90}px`,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                backgroundColor: el.color || '#a2d2ff',
                WebkitMaskImage: `url(${el.src})`,
                maskImage: `url(${el.src})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
            {isSelected && (
              <div
                data-action="rotate"
                title="Drag to rotate"
                className="rotate-handle absolute -top-3 -right-3 w-6 h-6 rounded-full bg-pastel-pink text-slate-950 flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-50 pointer-events-auto"
                style={{
                  transform: `scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1})`,
                }}
              >
                <PhosphorIcons.ArrowClockwise className="w-3.5 h-3.5 font-bold" />
              </div>
            )}
          </div>
        );
      });
  };

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

    const content = imgSrc ? (
      <div className="relative group overflow-hidden w-full h-full flex items-center justify-center">
        <img
          src={imgSrc}
          alt={imgName}
          className={`w-full h-full object-cover block transition-all group-hover:brightness-75 ${
            isFrameless ? '' : 'rounded-none'
          }`}
          style={imageStyle}
        />
        <label className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-[2px]">
          <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <ImageUp className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-[11px] font-semibold tracking-wide text-slate-100 drop-shadow-md">
            Replace Slot {slotIndex}
          </span>
          <input type="file" accept="image/*" onChange={slotFileChange} className="hidden" />
        </label>
      </div>
    ) : (
      <label
        className={`${
          state.layoutCount === 2 ? 'w-[320px] p-4' : 'w-[480px] p-6'
        } max-w-full aspect-[16/10] bg-slate-800/80 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-center shadow-xl cursor-pointer hover:border-pastel-pink transition-all group ${
          isFrameless ? 'rounded-xl' : 'rounded-none'
        }`}
        style={imageStyle}
      >
        <div
          className={`${
            state.layoutCount === 2 ? 'w-8 h-8 mb-1.5' : 'w-11 h-11 mb-2.5'
          } rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform`}
        >
          <svg
            className={`${state.layoutCount === 2 ? 'w-4 h-4' : 'w-6 h-6'} text-pastel-pink`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p
          className={`${state.layoutCount === 2 ? 'text-xs' : 'text-sm'} font-bold text-slate-100`}
        >
          Upload Slot {slotIndex}
        </p>
        <p
          className={`${state.layoutCount === 2 ? 'text-[10px]' : 'text-[11px]'} text-slate-400 mt-0.5`}
        >
          Click or drop image
        </p>
        <input
          type="file"
          accept={
            state.mediaType === 'video'
              ? 'video/mp4,video/webm,video/quicktime,video/ogg'
              : 'image/*'
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
      let borderStyleClasses = '';
      if (fStyle === 'glass-light') {
        borderStyleClasses = 'p-1.5 bg-white/30 backdrop-blur-md border border-white/50 shadow-xl';
      } else if (fStyle === 'glass-dark') {
        borderStyleClasses = 'p-1.5 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl';
      } else if (fStyle === 'inset-light') {
        borderStyleClasses = 'p-1.5 bg-slate-200/90 border border-slate-300 shadow-inner';
      } else if (fStyle === 'inset-dark') {
        borderStyleClasses = 'p-1.5 bg-slate-900/90 border border-slate-800 shadow-inner';
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
            className={`transition-all ${borderStyleClasses}`}
            style={{
              borderRadius: `${state.borderRadius + 8}px`,
            }}
          >
            <div
              className="overflow-hidden"
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
        : isFrameless && currentStyle !== 'default'
          ? `${state.borderRadius + 8}px`
          : isFrameless || state.frameType.startsWith('safari') || state.frameType === 'chrome-dark'
            ? `${state.borderRadius}px`
            : undefined;

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
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          useStudioStore.getState().setSecondImage(e.target.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
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
        className="transition-all duration-200"
        style={{
          transform: `scale(${state.isAnimationMode ? animTransform.zoom / 100 : state.zoom / 100}) translate(${state.isAnimationMode ? animTransform.offsetX : state.offsetX}px, ${state.isAnimationMode ? animTransform.offsetY : state.offsetY}px) rotate(${state.isAnimationMode ? (animTransform.slot1Rotate ?? 0) : state.slot1Rotate || 0}deg)`,
        }}
      >
        {firstFrame}
      </div>
    );

    const secondFrameElement = (
      <div
        className="transition-all duration-200"
        style={{
          transform: `scale(${state.isAnimationMode ? animTransform.slot2Zoom / 100 : state.slot2Zoom / 100}) translate(${state.isAnimationMode ? animTransform.slot2OffsetX : state.slot2OffsetX}px, ${state.isAnimationMode ? animTransform.slot2OffsetY : state.slot2OffsetY}px) rotate(${state.isAnimationMode ? (animTransform.slot2Rotate ?? 0) : state.slot2Rotate || 0}deg)`,
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
    const baseScale = state.layoutCount === 2 ? (isPortrait ? 0.65 : 1) : 0.95;
    const paddingScale = Math.max(0.2, baseScale - (state.padding * 0.6) / 300);

    return (
      <div
        className="transition-all duration-200 flex items-center justify-center pointer-events-auto max-w-full max-h-full"
        style={{
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  // On-canvas direct element dragging state
  const [dragItem, setDragItem] = useState<{
    type: 'text' | 'phosphor' | 'element';
    id: string;
    startX: number;
    startY: number;
    initialLayerX: number;
    initialLayerY: number;
  } | null>(null);

  // On-canvas direct element rotation state
  const [rotateDragItem, setRotateDragItem] = useState<{
    type: 'text' | 'phosphor' | 'element';
    id: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    initialRotation: number;
  } | null>(null);

  // Touch center for 2-finger mobile panning
  const touchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Reset pan offset to center when aspect ratio changes or when state is reset
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [state.aspectRatio, state.imageSrc, state.secondImageSrc, state.resetKey]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT'
    ) {
      return;
    }

    const rotateHandleEl = target.closest('[data-action="rotate"]') as HTMLElement | null;
    if (rotateHandleEl) {
      const textLayerEl = target.closest('.text-layer-item') as HTMLElement | null;
      const phosphorIconLayerEl = target.closest('.phosphor-icon-layer-item') as HTMLElement | null;
      const canvasElementEl = target.closest('.canvas-element-item') as HTMLElement | null;
      const layerEl = textLayerEl || phosphorIconLayerEl || canvasElementEl;

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
        }
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }
    }

    const textLayerEl = target.closest('.text-layer-item') as HTMLElement | null;
    const phosphorIconLayerEl = target.closest('.phosphor-icon-layer-item') as HTMLElement | null;
    const canvasElementEl = target.closest('.canvas-element-item') as HTMLElement | null;

    const isShiftDrag = e.shiftKey;
    const isTargetingLayer = (textLayerEl || phosphorIconLayerEl || canvasElementEl) && !isShiftDrag;

    if (isTargetingLayer) {
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
          });
          state.updateState({ isPositionDragging: true });
        }
      }
    } else {
      if (!isShiftDrag) {
        if (state.selectedTextLayerId && !textLayerEl) state.selectTextLayer(null);
        if (state.selectedPhosphorIconLayerId && !phosphorIconLayerEl) state.selectPhosphorIconLayer(null);
        if (state.selectedElementId && !canvasElementEl) state.selectCanvasElement(null);
      }

      setIsPanning(true);
      startPosRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }

    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (rotateDragItem) {
      const currentAngle = Math.atan2(e.clientY - rotateDragItem.centerY, e.clientX - rotateDragItem.centerX) * (180 / Math.PI);
      const angleDiff = currentAngle - rotateDragItem.startAngle;
      let newRotation = Math.round(rotateDragItem.initialRotation + angleDiff);

      // Normalize to -180 .. 180 range
      newRotation = ((newRotation + 180) % 360 + 360) % 360 - 180;

      if (rotateDragItem.type === 'text') {
        state.updateTextLayer(rotateDragItem.id, { rotation: newRotation });
      } else if (rotateDragItem.type === 'phosphor') {
        state.updatePhosphorIconLayer(rotateDragItem.id, { rotation: newRotation });
      } else if (rotateDragItem.type === 'element') {
        state.updateCanvasElement(rotateDragItem.id, { rotation: newRotation });
      }
    } else if (dragItem) {
      const zoomScale = Math.max(0.1, (state.previewCanvasZoom || 100) / 100);
      const deltaX = (e.clientX - dragItem.startX) / zoomScale;
      const deltaY = (e.clientY - dragItem.startY) / zoomScale;

      const newX = Math.round(dragItem.initialLayerX + deltaX);
      const newY = Math.round(dragItem.initialLayerY + deltaY);

      if (dragItem.type === 'text') {
        state.updateTextLayer(dragItem.id, { x: newX, y: newY });
      } else if (dragItem.type === 'phosphor') {
        state.updatePhosphorIconLayer(dragItem.id, { x: newX, y: newY });
      } else if (dragItem.type === 'element') {
        state.updateCanvasElement(dragItem.id, { x: newX, y: newY });
      }
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPosRef.current.x,
        y: e.clientY - startPosRef.current.y,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (rotateDragItem) {
      setRotateDragItem(null);
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
      if (rotateDragItem) {
        setRotateDragItem(null);
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`w-full h-full max-w-full flex items-center justify-center p-3 sm:p-6 md:p-12 overflow-hidden transition-all duration-300 ${
        rotateDragItem || dragItem ? 'cursor-move select-none' : isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'
      }`}
    >
      {/* Canvas Viewport Scaling & Drag Pan Wrapper */}
      <div
        className="transition-transform duration-75 flex items-center justify-center touch-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${state.previewCanvasZoom / 100})`,
        }}
      >
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

            {/* Radiant Glow Background Layer */}
            {state.backgroundType === 'radiant' && (
              <RadiantBackground presetId={state.radiantPreset || 'radiant-1'} />
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

          {/* 3D Transform Wrapper */}
          <div
            className="flex-1 h-full max-w-full flex items-center justify-center relative z-10"
            style={transformStyle}
          >
            {renderFrameContent()}
          </div>

          {/* Above Static Text & Icon Layers (Rendered on top of the 3D mockup frame) */}
          {renderTextLayers('above')}
          {renderPhosphorIconLayers('above')}
          {renderCanvasElements('above')}

          {/* Center Alignment Guide Lines & Dashed Grid Overlay (Shown while dragging) */}
          {state.isPositionDragging && (
            <div className="absolute inset-0 pointer-events-none z-20 animate-in fade-in duration-100 overflow-hidden">
              {/* Grid of small squares with dashed lines */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 32 0 L 0 0 0 32' fill='none' stroke='rgba(244,114,182,0.5)' stroke-width='1' stroke-dasharray='3 3'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'repeat',
                }}
              />
              {/* Vertical Center Alignment Line */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-pastel-pink shadow-[0_0_8px_#f472b6]" />
              {/* Horizontal Center Alignment Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-pastel-pink shadow-[0_0_8px_#f472b6]" />
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
                  {config.selectedIcons.map((iconId) => {
                    const IconComp = (PhosphorIcons as any)[iconId] || PhosphorIcons.Sparkle;
                    return (
                      <IconComp
                        key={iconId}
                        weight={config.weight || 'duotone'}
                        size={config.size || 28}
                        color={config.color || '#a2d2ff'}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Watermark Overlay */}
          <WatermarkOverlay />

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
        </div>
      </div>
    </div>
  );
};
