import React from 'react';
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
    switch (state.aspectRatio) {
      case '16:9':
      case 'yt-banner':
      case 'yt-thumbnail':
      case 'yt-video':
        return 'aspect-[16/9] w-full max-w-[800px]';
      case '1:1':
      case 'ig-post':
        return 'aspect-square h-full max-h-[520px] max-w-[520px]';
      case '9:16':
      case 'ig-story':
        return 'aspect-[9/16] h-full max-h-[580px] max-w-[340px]';
      case '4:3':
        return 'aspect-[4/3] w-full max-w-[700px]';
      case '1.91:1':
        return 'aspect-[1.91/1] w-full max-w-[800px]';
      case 'ig-portrait':
        return 'aspect-[4/5] h-full max-h-[560px] max-w-[448px]';
      default:
        return 'w-auto h-auto min-h-[360px]';
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
      [
        'iphone',
        'iphone14pro',
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

  // 3D Transform style matrix
  const transformStyle: React.CSSProperties = {
    transform: `perspective(${state.perspective}px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg)`,
    transformStyle: 'preserve-3d',
    transition: 'transform 0.15s ease-out',
  };

  const isFrameless = state.frameType === 'frameless';
  const imageStyle: React.CSSProperties = {
    borderRadius: isFrameless ? `${state.borderRadius}px` : undefined,
  };

  const imageContent = state.imageSrc ? (
    <div
      className={`relative group cursor-pointer overflow-hidden w-full h-full transition-all duration-200 ${
        isFrameless ? '' : 'rounded-none'
      }`}
      style={imageStyle}
    >
      <img
        src={state.imageSrc}
        alt={state.imageName}
        className={`w-full h-full object-cover block transition-all group-hover:brightness-75 ${
          isFrameless ? '' : 'rounded-none'
        }`}
        style={imageStyle}
      />
      <label className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-[2px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <ImageUp className="w-6 h-6 text-brand-400" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-slate-100 drop-shadow-md">
          Replace Image
        </span>
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </label>
    </div>
  ) : (
    <div
      className={`w-full max-w-[480px] aspect-[16/10] bg-slate-800/80 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center p-6 text-center shadow-lg ${
        isFrameless ? 'rounded-xl' : 'rounded-none'
      }`}
      style={imageStyle}
    >
      <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center mb-3">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-200">Upload or Drag & Drop a Screenshot</p>
      <p className="text-xs text-slate-400 mt-1">
        Supports PNG, JPG, WebP, SVG or Paste (`Cmd+V` / `Ctrl+V`)
      </p>
    </div>
  );

  const renderFrameContent = () => {
    let frameElement: React.ReactNode;
    if (state.frameType.startsWith('safari') || state.frameType === 'chrome-dark') {
      frameElement = (
        <BrowserFrame type={state.frameType as any} urlText={state.urlText}>
          {imageContent}
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
      frameElement = <DeviceFrame type={state.frameType}>{imageContent}</DeviceFrame>;
    } else {
      frameElement = imageContent;
    }

    return (
      <div
        className={`transition-all duration-200 overflow-hidden ${getShadowClass()}`}
        style={{
          transform: `scale(${state.zoom / 100}) translate(${state.offsetX}px, ${state.offsetY}px)`,
          transformOrigin:
            state.alignment === 'top'
              ? 'top center'
              : state.alignment === 'bottom'
                ? 'bottom center'
                : 'center center',
          borderRadius: state.frameType === 'frameless' ? `${state.borderRadius}px` : undefined,
        }}
      >
        {frameElement}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6 md:p-12 overflow-auto transition-all duration-300">
      {/* Exportable Canvas Container */}
      <div
        ref={canvasRef}
        id="shotage-canvas"
        className={`relative flex items-center justify-center transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl ${getAspectRatioStyle()} ${
          state.isPreviewMode ? 'scale-[0.7] shadow-2xl' : 'scale-100'
        }`}
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
        <div className="w-full max-w-full flex items-center justify-center relative z-10" style={transformStyle}>
          {renderFrameContent()}
        </div>
      </div>
    </div>
  );
};
