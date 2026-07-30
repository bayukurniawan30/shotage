export interface RadiantPreset {
  id: string;
  name: string;
  bgColor: string;
  c1: string;
  c2: string;
  c3: string;
  centerColor: string;
}

export const RADIANT_PRESETS: RadiantPreset[] = [
  // 1-8: Dark Base Radiant Styles
  { id: 'radiant-1', name: 'Pastel Burst (Dark)', bgColor: '#0f172a', c1: '#ffafcc', c2: '#cdb4db', c3: '#a2d2ff', centerColor: '#ffffff' },
  { id: 'radiant-2', name: 'Neon Cyber (Dark)', bgColor: '#090514', c1: '#4f46e5', c2: '#a855f7', c3: '#06b6d4', centerColor: '#ec4899' },
  { id: 'radiant-3', name: 'Solar Flare (Dark)', bgColor: '#180e04', c1: '#f43f5e', c2: '#fbbf24', c3: '#f97316', centerColor: '#ffe000' },
  { id: 'radiant-4', name: 'Emerald Spark (Dark)', bgColor: '#022c22', c1: '#059669', c2: '#34d399', c3: '#0284c7', centerColor: '#6ee7b7' },
  { id: 'radiant-5', name: 'Midnight Aurora (Dark)', bgColor: '#030712', c1: '#3b0764', c2: '#7c3aed', c3: '#38bdf8', centerColor: '#e0e7ff' },
  { id: 'radiant-6', name: 'Rose Quartz (Dark)', bgColor: '#1c0a10', c1: '#f43f5e', c2: '#fda4af', c3: '#e0c3fc', centerColor: '#fff1f2' },
  { id: 'radiant-7', name: 'Deep Space Glow (Dark)', bgColor: '#020617', c1: '#1e1b4b', c2: '#4338ca', c3: '#06b6d4', centerColor: '#a5f3fc' },
  { id: 'radiant-8', name: 'Hyper Magenta (Dark)', bgColor: '#190314', c1: '#701a75', c2: '#ee0979', c3: '#ff6a00', centerColor: '#fbcfe8' },

  // 9-16: Light Base Radiant Styles
  { id: 'radiant-9', name: 'Lavender Mist (Light)', bgColor: '#f8fafc', c1: '#e2d1f9', c2: '#cdb4db', c3: '#ffafcc', centerColor: '#ffffff' },
  { id: 'radiant-10', name: 'Cotton Candy (Light)', bgColor: '#fff1f2', c1: '#ffc8dd', c2: '#bde0fe', c3: '#a2d2ff', centerColor: '#ffffff' },
  { id: 'radiant-11', name: 'Tropical Peach (Light)', bgColor: '#fffbe8', c1: '#f6d365', c2: '#fda085', c3: '#ff5e62', centerColor: '#fef08a' },
  { id: 'radiant-12', name: 'Mint Refresh (Light)', bgColor: '#f0fdf4', c1: '#00b09b', c2: '#96c93d', c3: '#43e97b', centerColor: '#dcfce7' },
  { id: 'radiant-13', name: 'Ice Cyan (Light)', bgColor: '#f0f9ff', c1: '#00c6ff', c2: '#0072ff', c3: '#38bdf8', centerColor: '#e0f2fe' },
  { id: 'radiant-14', name: 'Golden Hour (Light)', bgColor: '#fffbf0', c1: '#f59e0b', c2: '#fbbf24', c3: '#c2410c', centerColor: '#fef3c7' },
  { id: 'radiant-15', name: 'Berry Glaze (Light)', bgColor: '#fdf4ff', c1: '#f857a6', c2: '#ff5858', c3: '#a855f7', centerColor: '#fce7f3' },
  { id: 'radiant-16', name: 'Nordic Frost (Light)', bgColor: '#f1f5f9', c1: '#475569', c2: '#94a3b8', c3: '#cbd5e1', centerColor: '#ffffff' },
];
