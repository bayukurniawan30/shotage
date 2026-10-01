import React, { useId } from 'react';
import { WAVE_PRESETS, WAVE_PROFILES, type WavePreset } from '../utils/wavePresets';

interface WaveBackgroundProps {
  presetId?: string;
}

const WIDTH = 1440;
const HEIGHT = 900;
const LAYERS = [0, 1, 2, 3];

function waveContour(type: WavePreset['pathType'], layer: number) {
  const { amplitude, cycles, phase, harmonic, tilt } = WAVE_PROFILES[type];
  const frequency = (Math.PI * 2 * cycles) / WIDTH;
  const y = (x: number) => {
    const angle = x * frequency + phase;
    return (
      440 +
      layer * 92 +
      tilt * (x / WIDTH - 0.5) +
      amplitude * (Math.sin(angle) + harmonic * Math.sin(2 * angle + 0.6))
    );
  };
  const slope = (x: number) => {
    const angle = x * frequency + phase;
    return (
      tilt / WIDTH +
      amplitude * frequency * (Math.cos(angle) + 2 * harmonic * Math.cos(2 * angle + 0.6))
    );
  };
  // Matching tangents keep every join smooth; overscan avoids edge seams.
  const start = -120;
  const end = WIDTH + 120;
  const step = (end - start) / 8;
  const number = (value: number) => value.toFixed(2);
  let edge = `M ${start} ${number(y(start))}`;
  for (let segment = 0; segment < 8; segment++) {
    const x0 = start + segment * step;
    const x1 = x0 + step;
    edge +=
      ` C ${number(x0 + step / 3)} ${number(y(x0) + (slope(x0) * step) / 3)}` +
      ` ${number(x1 - step / 3)} ${number(y(x1) - (slope(x1) * step) / 3)}` +
      ` ${number(x1)} ${number(y(x1))}`;
  }
  return { edge, surface: `${edge} L ${end} ${HEIGHT + 120} L ${start} ${HEIGHT + 120} Z` };
}

// Geometry is shared by every palette and remains fixed during video capture.
const CONTOURS = Object.fromEntries(
  Object.keys(WAVE_PROFILES).map((type) => [
    type,
    LAYERS.map((layer) => waveContour(type as WavePreset['pathType'], layer)),
  ])
) as Record<WavePreset['pathType'], ReturnType<typeof waveContour>[]>;

export const WaveBackground: React.FC<WaveBackgroundProps> = React.memo(function WaveBackground({
  presetId = 'wave-1',
}) {
  const preset = WAVE_PRESETS.find((wave) => wave.id === presetId) || WAVE_PRESETS[0];
  const [base, primary, secondary] = preset.colors;
  // Previews and canvas instances need their own SVG paint servers.
  const id = `wave-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ backgroundColor: base }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        <defs>
          <radialGradient id={`${id}-ambient`} cx="22%" cy="18%" r="85%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.2" />
            <stop offset="65%" stopColor={secondary} stopOpacity="0.05" />
            <stop offset="100%" stopColor={base} stopOpacity="0" />
          </radialGradient>
          {LAYERS.map((layer) => (
            <linearGradient
              key={layer}
              id={`${id}-surface-${layer}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={320 + layer * 92}
              x2={WIDTH}
              y2={HEIGHT + 60}
            >
              <stop offset="0%" stopColor={layer % 2 === 0 ? primary : secondary} />
              <stop
                offset="48%"
                stopColor={layer % 2 === 0 ? secondary : primary}
                stopOpacity="0.72"
              />
              <stop offset="100%" stopColor={base} />
            </linearGradient>
          ))}
          <linearGradient id={`${id}-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={secondary} stopOpacity="0" />
            <stop offset="35%" stopColor={secondary} stopOpacity="0.3" />
            <stop offset="70%" stopColor={primary} stopOpacity="0.18" />
            <stop offset="100%" stopColor={primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill={`url(#${id}-ambient)`} />
        {CONTOURS[preset.pathType].map(({ edge, surface }, layer) => (
          <g key={layer}>
            <path
              d={surface}
              fill={`url(#${id}-surface-${layer})`}
              opacity={preset.opacity * (0.36 + layer * 0.16)}
            />
            <path d={edge} fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1.5" />
          </g>
        ))}
      </svg>
    </div>
  );
});
