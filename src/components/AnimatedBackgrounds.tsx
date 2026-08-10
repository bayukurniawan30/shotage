import React from 'react';

export interface AnimatedGradientPreset {
  id: string;
  name: string;
  c1: string;
  c2: string;
  c3: string;
}

export interface AnimatedMeshPreset {
  id: string;
  name: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
}

export const ANIMATED_GRADIENT_PRESETS: AnimatedGradientPreset[] = [
  { id: 'anim-grad-1', name: 'Cosmic Glow', c1: '#05219f', c2: '#764ba2', c3: '#f093fb' },
  { id: 'anim-grad-2', name: 'Indigo Cyan', c1: '#4f46e5', c2: '#06b6d4', c3: '#38bdf8' },
  { id: 'anim-grad-3', name: 'Pastel Sunset', c1: '#ffafcc', c2: '#cdb4db', c3: '#a2d2ff' },
  { id: 'anim-grad-4', name: 'Neon Violet', c1: '#f43f5e', c2: '#a855f7', c3: '#ec4899' },
  { id: 'anim-grad-5', name: 'Sunset Amber', c1: '#f43f5e', c2: '#f97316', c3: '#fbbf24' },
  { id: 'anim-grad-6', name: 'Emerald Teal', c1: '#059669', c2: '#14b8a6', c3: '#34d399' },
  { id: 'anim-grad-7', name: 'Northern Lights', c1: '#00c6ff', c2: '#0072ff', c3: '#7a00ff' },
  { id: 'anim-grad-8', name: 'Solar Flame', c1: '#c2410c', c2: '#f59e0b', c3: '#f43f5e' },
  { id: 'anim-grad-9', name: 'Deep Nebula', c1: '#020024', c2: '#090979', c3: '#00d4ff' },
  { id: 'anim-grad-10', name: 'Candy Floss', c1: '#fbc2eb', c2: '#a6c1ee', c3: '#cdb4db' },
  { id: 'anim-grad-11', name: 'Cyberpunk Red', c1: '#ff0055', c2: '#7a00ff', c3: '#00e5ff' },
  { id: 'anim-grad-12', name: 'Cherry Blossom', c1: '#ffb3d9', c2: '#ff66b2', c3: '#9d50bb' },
  { id: 'anim-grad-13', name: 'Laguna Breeze', c1: '#43e97b', c2: '#38f9d7', c3: '#059669' },
  { id: 'anim-grad-14', name: 'Velvet Midnight', c1: '#200122', c2: '#6f0000', c3: '#a855f7' },
  { id: 'anim-grad-15', name: 'Warm Flame', c1: '#ff5e62', c2: '#ff9966', c3: '#f12711' },
  { id: 'anim-grad-16', name: 'Frozen Berry', c1: '#e0c3fc', c2: '#8ec5fc', c3: '#4f46e5' },
  { id: 'anim-grad-17', name: 'Lush Forest', c1: '#134e5e', c2: '#71b280', c3: '#a3e635' },
  { id: 'anim-grad-18', name: 'Royal Velvet', c1: '#4e54c8', c2: '#8f94fb', c3: '#ec4899' },
  { id: 'anim-grad-19', name: 'Peachy Beach', c1: '#ffedd5', c2: '#fda085', c3: '#f97316' },
  { id: 'anim-grad-20', name: 'Electric Violet', c1: '#4776e6', c2: '#8e54e9', c3: '#f43f5e' },
  { id: 'anim-grad-21', name: 'Vibrant Magenta', c1: '#ee0979', c2: '#ff6a00', c3: '#ffe000' },
  { id: 'anim-grad-22', name: 'Deep Ocean', c1: '#000046', c2: '#1cb5e0', c3: '#0072ff' },
  { id: 'anim-grad-23', name: 'Apricot Dream', c1: '#f6d365', c2: '#fda085', c3: '#ffafcc' },
  { id: 'anim-grad-24', name: 'Mystic Indigo', c1: '#614385', c2: '#516395', c3: '#00c6ff' },
];

export const ANIMATED_MESH_PRESETS: AnimatedMeshPreset[] = [
  {
    id: 'anim-mesh-1',
    name: 'Electric Mesh',
    c1: '#667eea',
    c2: '#764ba2',
    c3: '#f093fb',
    c4: '#4facfe',
  },
  {
    id: 'anim-mesh-2',
    name: 'Pastel Velvet',
    c1: '#cdb4db',
    c2: '#ffafcc',
    c3: '#a2d2ff',
    c4: '#bde0fe',
  },
  {
    id: 'anim-mesh-3',
    name: 'Cyberpunk Neon',
    c1: '#4f46e5',
    c2: '#7c3aed',
    c3: '#ec4899',
    c4: '#06b6d4',
  },
  {
    id: 'anim-mesh-4',
    name: 'Sunset Glow',
    c1: '#f43f5e',
    c2: '#8b5cf6',
    c3: '#fbbf24',
    c4: '#f97316',
  },
  {
    id: 'anim-mesh-5',
    name: 'Oceanic Haze',
    c1: '#0f172a',
    c2: '#1e3a8a',
    c3: '#06b6d4',
    c4: '#3b82f6',
  },
  {
    id: 'anim-mesh-6',
    name: 'Emerald Oasis',
    c1: '#064e3b',
    c2: '#047857',
    c3: '#34d399',
    c4: '#0284c7',
  },
  {
    id: 'anim-mesh-7',
    name: 'Cosmic Berry',
    c1: '#311042',
    c2: '#6b21a8',
    c3: '#f43f5e',
    c4: '#c084fc',
  },
  {
    id: 'anim-mesh-8',
    name: 'Golden Sunrise',
    c1: '#78350f',
    c2: '#c2410c',
    c3: '#fbbf24',
    c4: '#f43f5e',
  },
  {
    id: 'anim-mesh-9',
    name: 'Candy Aura',
    c1: '#fbc2eb',
    c2: '#a6c1ee',
    c3: '#ffb3d9',
    c4: '#a2d2ff',
  },
  {
    id: 'anim-mesh-10',
    name: 'Northern Aurora',
    c1: '#00c6ff',
    c2: '#0072ff',
    c3: '#7a00ff',
    c4: '#00e5ff',
  },
  {
    id: 'anim-mesh-11',
    name: 'Cherry Velvet',
    c1: '#ff0055',
    c2: '#7a00ff',
    c3: '#ff66b2',
    c4: '#9d50bb',
  },
  {
    id: 'anim-mesh-12',
    name: 'Laguna Breeze',
    c1: '#43e97b',
    c2: '#38f9d7',
    c3: '#059669',
    c4: '#0284c7',
  },
  {
    id: 'anim-mesh-13',
    name: 'Midnight Space',
    c1: '#020024',
    c2: '#090979',
    c3: '#3b0764',
    c4: '#00d4ff',
  },
  {
    id: 'anim-mesh-14',
    name: 'Warm Apricot',
    c1: '#ff5e62',
    c2: '#ff9966',
    c3: '#f6d365',
    c4: '#fda085',
  },
  {
    id: 'anim-mesh-15',
    name: 'Frozen Galaxy',
    c1: '#e0c3fc',
    c2: '#8ec5fc',
    c3: '#4f46e5',
    c4: '#38bdf8',
  },
  {
    id: 'anim-mesh-16',
    name: 'Solar Citrus',
    c1: '#ee0979',
    c2: '#ff6a00',
    c3: '#ffe000',
    c4: '#f43f5e',
  },
];

export const AnimatedGradientBackground: React.FC<{ presetId: string }> = ({ presetId }) => {
  const preset =
    ANIMATED_GRADIENT_PRESETS.find((p) => p.id === presetId) || ANIMATED_GRADIENT_PRESETS[0];

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(45deg, ${preset.c1}, ${preset.c2}, ${preset.c3})`,
        backgroundSize: '200% 200%',
        animation: 'animatedGradientFlow 10s ease infinite',
      }}
    />
  );
};

export const AnimatedMeshBackground: React.FC<{ presetId: string }> = ({ presetId }) => {
  const preset = ANIMATED_MESH_PRESETS.find((p) => p.id === presetId) || ANIMATED_MESH_PRESETS[0];

  return (
    <div
      className="absolute inset-0 overflow-hidden w-full h-full pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${preset.c1} 0%, ${preset.c2} 100%)`,
      }}
    >
      {/* Mesh Blob 1 (Top-Left) */}
      <div
        className="absolute w-[60%] h-[60%] -top-[20%] -left-[20%] opacity-70 blur-[80px]"
        style={{
          background: `linear-gradient(135deg, ${preset.c3} 0%, ${preset.c4} 100%)`,
          animation: 'animatedMeshMorph 8s ease-in-out infinite',
        }}
      />
      {/* Mesh Blob 2 (Bottom-Right) */}
      <div
        className="absolute w-[60%] h-[60%] -bottom-[20%] -right-[20%] opacity-70 blur-[80px]"
        style={{
          background: `linear-gradient(135deg, ${preset.c4} 0%, ${preset.c1} 100%)`,
          animation: 'animatedMeshMorph 8s ease-in-out infinite 4s',
        }}
      />
    </div>
  );
};
