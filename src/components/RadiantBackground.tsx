import React from 'react';
import { RADIANT_PRESETS } from '../utils/radiantPresets';

interface RadiantBackgroundProps {
  presetId?: string;
}

export const RadiantBackground: React.FC<RadiantBackgroundProps> = ({
  presetId = 'radiant-1',
}) => {
  const preset = RADIANT_PRESETS.find((r) => r.id === presetId) || RADIANT_PRESETS[0];

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
      style={{
        backgroundColor: preset.bgColor,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, ${preset.centerColor}cc 0%, ${preset.c1}b3 30%, ${preset.c2}80 60%, ${preset.c3}00 100%),
          radial-gradient(circle at 20% 20%, ${preset.c2}99 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, ${preset.c3}99 0%, transparent 50%)
        `,
      }}
    />
  );
};
