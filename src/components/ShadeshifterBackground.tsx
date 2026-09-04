import React from 'react';
import { SHADESHIFTER_PRESETS } from '../utils/shadeshifterPresets';
import { getGrainSvgUrl, getGrainTileSize } from '../utils/grain';

interface ShadeshifterBackgroundProps {
  presetId?: string;
  grainOpacity?: number; // 0 to 100
  blur?: number; // blur in px
}

export const ShadeshifterBackground: React.FC<ShadeshifterBackgroundProps> = ({
  presetId = 'shadeshifter-1',
  grainOpacity = 35,
  blur = 40,
}) => {
  const preset =
    SHADESHIFTER_PRESETS.find((p) => p.id === presetId) || SHADESHIFTER_PRESETS[0];
  const [c1, c2, c3, c4, c5] = preset.colors;
  const effectiveBlur = blur ?? preset.blur ?? 40;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{ backgroundColor: preset.bgColor }}
    >
      {/* Layer 1: Multi-Point Fluid Mesh Blobs */}
      <div
        className="absolute -inset-10 w-[calc(100%+80px)] h-[calc(100%+80px)]"
        style={{
          filter: `blur(${effectiveBlur}px)`,
          transform: 'scale(1.15)',
          backgroundImage: `
            radial-gradient(at 15% 20%, ${c1}ee 0px, transparent 55%),
            radial-gradient(at 85% 15%, ${c2}ee 0px, transparent 50%),
            radial-gradient(at 50% 50%, ${c3}dd 0px, transparent 60%),
            radial-gradient(at 80% 85%, ${c4}ee 0px, transparent 55%),
            radial-gradient(at 20% 80%, ${c5}dd 0px, transparent 55%),
            radial-gradient(at 50% 10%, ${c2}aa 0px, transparent 40%),
            radial-gradient(at 90% 50%, ${c1}88 0px, transparent 45%)
          `,
        }}
      />

      {/* Layer 2: Analog Film Grain Noise Overlay */}
      {grainOpacity > 0 && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay z-[2]"
          style={{
            opacity: grainOpacity / 100,
            backgroundImage: `url("${getGrainSvgUrl('fine', 'monochrome')}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: getGrainTileSize('fine'),
          }}
        />
      )}
    </div>
  );
};
