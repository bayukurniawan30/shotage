import React from 'react';
import { MESH_PRESETS } from '../utils/meshPresets';

interface MeshBackgroundProps {
  presetId?: string;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({ presetId = 'mesh-1' }) => {
  const preset = MESH_PRESETS.find((m) => m.id === presetId) || MESH_PRESETS[0];
  const [c1, c2, c3, c4] = preset.colors;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundColor: '#09090b',
        backgroundImage: `
          radial-gradient(at 0% 0%, ${c1}b3 0px, transparent 50%),
          radial-gradient(at 100% 0%, ${c2}b3 0px, transparent 50%),
          radial-gradient(at 0% 100%, ${c3}b3 0px, transparent 50%),
          radial-gradient(at 100% 100%, ${c4}b3 0px, transparent 50%)
        `,
      }}
    />
  );
};
