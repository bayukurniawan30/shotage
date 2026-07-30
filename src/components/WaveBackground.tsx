import React from 'react';
import { WAVE_PRESETS } from '../utils/wavePresets';

interface WaveBackgroundProps {
  presetId?: string;
}

export const WaveBackground: React.FC<WaveBackgroundProps> = ({ presetId = 'wave-1' }) => {
  const preset = WAVE_PRESETS.find((w) => w.id === presetId) || WAVE_PRESETS[0];

  const cBase = preset.colors[0];
  const cWave1 = preset.colors[1];
  const cWave2 = preset.colors[2];

  // Render path curves based on wave type
  const renderPaths = () => {
    switch (preset.pathType) {
      case 'multi-sine':
        return (
          <>
            <path
              d="M0,160 C320,300 480,100 800,240 C1120,380 1280,160 1440,280 L1440,900 L0,900 Z"
              fill={cWave1}
              opacity={preset.opacity * 0.4}
            />
            <path
              d="M0,280 C360,120 600,340 960,180 C1200,80 1360,300 1440,200 L1440,900 L0,900 Z"
              fill={cWave2}
              opacity={preset.opacity * 0.7}
            />
          </>
        );

      case 'layered':
        return (
          <>
            <path
              d="M0,120 C240,240 480,60 720,180 C960,300 1200,120 1440,240 L1440,900 L0,900 Z"
              fill={cWave1}
              opacity={preset.opacity * 0.5}
            />
            <path
              d="M0,240 C320,100 640,320 960,160 C1280,300 1360,180 1440,280 L1440,900 L0,900 Z"
              fill={cWave2}
              opacity={preset.opacity * 0.8}
            />
          </>
        );

      case 'blob':
        return (
          <>
            <path
              d="M0,90 C400,280 600,-40 1000,220 C1250,380 1350,120 1440,300 L1440,900 L0,900 Z"
              fill={cWave1}
              opacity={preset.opacity * 0.5}
            />
            <path
              d="M0,320 C280,140 680,360 1040,160 C1240,40 1380,260 1440,180 L1440,900 L0,900 Z"
              fill={cWave2}
              opacity={preset.opacity * 0.75}
            />
          </>
        );

      case 'peaks':
        return (
          <>
            <path
              d="M0,180 Q360,40 720,260 Q1080,80 1440,220 L1440,900 L0,900 Z"
              fill={cWave1}
              opacity={preset.opacity * 0.45}
            />
            <path
              d="M0,260 Q400,120 800,320 Q1200,100 1440,260 L1440,900 L0,900 Z"
              fill={cWave2}
              opacity={preset.opacity * 0.8}
            />
          </>
        );

      case 'curved-flow':
        return (
          <>
            <path
              d="M0,100 C480,360 960,40 1440,300 L1440,900 L0,900 Z"
              fill={cWave1}
              opacity={preset.opacity * 0.5}
            />
            <path
              d="M0,260 C480,80 960,380 1440,140 L1440,900 L0,900 Z"
              fill={cWave2}
              opacity={preset.opacity * 0.75}
            />
          </>
        );

      case 'sine':
      default:
        return (
          <>
            <path
              d="M0,200 Q360,320 720,200 T1440,200 L1440,900 L0,900 Z"
              fill={cWave1}
              opacity={preset.opacity * 0.5}
            />
            <path
              d="M0,300 Q360,180 720,300 T1440,300 L1440,900 L0,900 Z"
              fill={cWave2}
              opacity={preset.opacity * 0.8}
            />
          </>
        );
    }
  };

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ backgroundColor: cBase }}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="w-full h-full block transform scale-105"
      >
        <defs>
          <linearGradient id={`grad-${preset.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={cWave1} />
            <stop offset="100%" stopColor={cWave2} />
          </linearGradient>

          <filter id={`glow-blur-${preset.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="120" />
          </filter>
        </defs>

        {/* Ambient Top Glow with Soft Blur Filter */}
        <circle
          cx="720"
          cy="0"
          r="500"
          fill={`url(#grad-${preset.id})`}
          opacity="0.45"
          filter={`url(#glow-blur-${preset.id})`}
        />

        {/* SVG Wave Paths */}
        {renderPaths()}
      </svg>
    </div>
  );
};
