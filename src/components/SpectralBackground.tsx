import React from 'react';
import { SPECTRAL_PRESETS, SpectralPreset } from '../utils/spectralPresets';

interface SpectralBackgroundProps {
  presetId?: string;
  blur?: number;
  angle?: number;
}

export const SpectralBackground: React.FC<SpectralBackgroundProps> = ({
  presetId = 'spectral-1',
  blur,
  angle,
}) => {
  const preset: SpectralPreset =
    SPECTRAL_PRESETS.find((p) => p.id === presetId) || SPECTRAL_PRESETS[0];

  const effectiveBlur = blur ?? preset.blur ?? 45;
  const effectiveAngle = angle ?? preset.angle ?? 135;
  const { c1, c2, c3, c4, c5, c6 } = preset.stops;
  const c6Val = c6 || c1;
  const isLight = preset.theme === 'light';

  // Build the chromatic spectral gradient based on geometry type
  const renderGradientLayer = () => {
    if (preset.type === 'conic') {
      return (
        <div
          className="absolute -inset-16 w-[calc(100%+128px)] h-[calc(100%+128px)]"
          style={{
            filter: `blur(${effectiveBlur}px)`,
            transform: 'scale(1.2)',
            opacity: isLight ? 0.75 : 0.85,
            backgroundImage: `conic-gradient(from ${effectiveAngle}deg at 50% 50%, ${c1}, ${c2}, ${c3}, ${c4}, ${c5}, ${c6Val}, ${c1})`,
          }}
        />
      );
    }

    if (preset.type === 'radial') {
      return (
        <div
          className="absolute -inset-12 w-[calc(100%+96px)] h-[calc(100%+96px)]"
          style={{
            filter: `blur(${effectiveBlur}px)`,
            transform: 'scale(1.15)',
            opacity: isLight ? 0.8 : 0.85,
            backgroundImage: `
              radial-gradient(circle at 15% 20%, ${c1}${isLight ? 'cc' : 'ee'} 0%, transparent 55%),
              radial-gradient(circle at 85% 15%, ${c2}${isLight ? 'cc' : 'ee'} 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, ${c3}${isLight ? 'bb' : 'dd'} 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${c4}${isLight ? 'cc' : 'ee'} 0%, transparent 55%),
              radial-gradient(circle at 20% 85%, ${c5}${isLight ? 'cc' : 'ee'} 0%, transparent 50%)
            `,
          }}
        />
      );
    }

    // Default: Multi-stop linear sweep
    return (
      <div
        className="absolute -inset-16 w-[calc(100%+128px)] h-[calc(100%+128px)]"
        style={{
          filter: `blur(${effectiveBlur}px)`,
          transform: 'scale(1.2)',
          opacity: isLight ? 0.75 : 0.85,
          backgroundImage: `linear-gradient(${effectiveAngle}deg, ${c1} 0%, ${c2} 20%, ${c3} 40%, ${c4} 60%, ${c5} 80%, ${c6Val} 100%)`,
        }}
      />
    );
  };

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ backgroundColor: preset.bgColor }}
    >
      {/* Primary Chromatic Spectral Dispersion */}
      {renderGradientLayer()}

      {/* Secondary Ambient Vignette / Prismatic Core Accent */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage: isLight
            ? `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, rgba(248,250,252,0.1) 100%)`
            : `radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,5,12,0.6) 100%)`,
        }}
      />
    </div>
  );
};
