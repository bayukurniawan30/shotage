import React from 'react';
import { useStudioStore } from '../store/useStudioStore';

export const WatermarkOverlay: React.FC = () => {
  const watermarkType = useStudioStore((state) => state.watermarkType);
  const watermarkPosition = useStudioStore((state) => state.watermarkPosition);
  const watermarkSize = useStudioStore((state) => state.watermarkSize);

  if (watermarkType === 'none') {
    return null;
  }

  const getPositionClass = () => {
    switch (watermarkPosition) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2';
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getSizeStyles = () => {
    switch (watermarkSize) {
      case 'sm':
        return {
          container: 'px-2 py-0.5 gap-1 text-[11px]',
          logo: 'h-3.5 w-auto',
        };
      case 'lg':
        return {
          container: 'px-3.5 py-1.5 gap-2 text-sm',
          logo: 'h-5 w-auto',
        };
      case 'md':
      default:
        return {
          container: 'px-2.5 py-1 gap-1.5 text-xs',
          logo: 'h-4 w-auto',
        };
    }
  };

  const getVariantStyle = () => {
    switch (watermarkType) {
      case 'dark':
        return 'text-slate-950 font-extrabold';
      case 'glass':
        return 'bg-slate-900/40 backdrop-blur-md border border-white/20 text-white shadow-lg rounded-full font-bold';
      case 'badge':
        return 'bg-white text-slate-950 shadow-md border border-slate-200/80 rounded-full font-extrabold';
      case 'dark-badge':
        return 'bg-slate-950/90 text-white border border-slate-800 shadow-md rounded-full font-extrabold';
      case 'default':
      default:
        return 'text-white/90 drop-shadow-md font-extrabold';
    }
  };

  const size = getSizeStyles();

  return (
    <div
      className={`absolute z-50 flex items-center pointer-events-none select-none transition-all duration-200 ${getPositionClass()} ${size.container} ${getVariantStyle()}`}
    >
      <img
        src="/shotage-logo-small.png"
        alt="Shotage Logo"
        className={`${size.logo} object-contain shrink-0`}
      />
      <span className="tracking-tight">Shotage</span>
    </div>
  );
};
