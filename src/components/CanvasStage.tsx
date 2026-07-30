import React, { useState, useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { BrowserFrame } from './frames/BrowserFrame';
import { DeviceFrame } from './frames/DeviceFrame';
import { ImageUp } from '@untitledui/icons';

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

  // Calculate aspect ratio styling
  const getAspectRatioStyle = () => {
    const isDual = state.layoutCount === 2;
    switch (state.aspectRatio) {
      case '16:9':
      case 'yt-banner':
      case 'yt-thumbnail':
      case 'yt-video':
        return isDual ? 'aspect-[16/9] w-[640px]' : 'aspect-[16/9] w-[520px]';
      case '1:1':
      case 'ig-post':
        return isDual ? 'aspect-square h-[420px] w-[420px]' : 'aspect-square h-[340px] w-[340px]';
      case '9:16':
      case 'ig-story':
        return 'aspect-[9/16] h-[380px] w-[214px]';
      case '4:3':
        return isDual ? 'aspect-[4/3] w-[580px]' : 'aspect-[4/3] w-[460px]';
      case '1.91:1':
        return isDual ? 'aspect-[1.91/1] w-[640px]' : 'aspect-[1.91/1] w-[520px]';
      case 'ig-portrait':
        return 'aspect-[4/5] h-[380px] w-[304px]';
      default:
        return 'w-auto h-auto min-h-[260px]';
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

  // 3D Transform style matrix
  const transformStyle: React.CSSProperties = {
    transform: `perspective(${state.perspective}px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg)`,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.15s ease-out',
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
        <input type="file" accept="image/*" onChange={slotFileChange} className="hidden" />
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
      state.frameType === 'samsung-s21' ||
      state.frameType === 'tablet'
    ) {
      frameElement = <DeviceFrame type={state.frameType}>{content}</DeviceFrame>;
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
    const computedRadius =
      isFrameless && currentStyle !== 'default'
        ? `${state.borderRadius + 8}px`
        : isFrameless || state.frameType.startsWith('safari') || state.frameType === 'chrome-dark'
          ? `${state.borderRadius}px`
          : undefined;

    return (
      <div className="relative group">
        {/* Underlying shadow backing box with exact matching border-radius */}
        {shadowClass && (
          <div
            className={`absolute inset-0 bg-neutral-900 pointer-events-none transition-all duration-200 ${shadowClass}`}
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
          transform: `scale(${state.zoom / 100}) translate(${state.offsetX}px, ${state.offsetY}px)`,
        }}
      >
        {firstFrame}
      </div>
    );

    const secondFrameElement = (
      <div
        className="transition-all duration-200"
        style={{
          transform: `scale(${state.slot2Zoom / 100}) translate(${state.slot2OffsetX}px, ${state.slot2OffsetY}px)`,
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

    return (
      <div
        className="transition-all duration-200"
        style={{
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

  // Touch / Mouse Panning State for Mobile & Desktop
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pan if clicking on empty stage area or dragging
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsPanning(true);
    startPosRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPosRef.current.x,
      y: e.clientY - startPosRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`w-full h-full max-w-full flex items-center justify-center p-3 sm:p-6 md:p-12 overflow-hidden transition-all duration-300 ${
        isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'
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
          className={`relative flex items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl box-content shrink-0 ${getAspectRatioStyle()}`}
          style={{
            ...getBackgroundStyle(),
            padding: `${state.padding}px`,
          }}
        >
          {/* Background Image Layer (Scope blur strictly to background image) */}
          {state.backgroundType === 'image' && state.bgImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none scale-105"
              style={{
                backgroundImage: `url(${state.bgImageUrl})`,
                filter: `blur(${state.bgBlur}px)`,
              }}
            />
          )}

          {/* 3D Transform Wrapper */}
          <div
            className="flex-1 h-full max-w-full flex items-center justify-center relative z-10"
            style={transformStyle}
          >
            {renderFrameContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
