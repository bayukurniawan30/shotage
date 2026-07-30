export interface MeshPreset {
  id: string;
  name: string;
  colors: [string, string, string, string];
  blur: number;
}

export const MESH_PRESETS: MeshPreset[] = [
  { id: 'mesh-1', name: 'Pastel Sunset', colors: ['#ffafcc', '#ffc8dd', '#cdb4db', '#a2d2ff'], blur: 50 },
  { id: 'mesh-2', name: 'Cotton Candy', colors: ['#ffc8dd', '#bde0fe', '#cdb4db', '#ffafcc'], blur: 50 },
  { id: 'mesh-3', name: 'Neon Cyberpunk', colors: ['#4f46e5', '#a855f7', '#ec4899', '#06b6d4'], blur: 50 },
  { id: 'mesh-4', name: 'Emerald Mirage', colors: ['#059669', '#34d399', '#0284c7', '#38bdf8'], blur: 50 },
  { id: 'mesh-5', name: 'Sunset Burst', colors: ['#f43f5e', '#fbbf24', '#c2410c', '#f97316'], blur: 50 },
  { id: 'mesh-6', name: 'Midnight Aurora', colors: ['#3b0764', '#7c3aed', '#2563eb', '#06b6d4'], blur: 50 },
  { id: 'mesh-7', name: 'Rose Gold', colors: ['#f43f5e', '#fda4af', '#e0c3fc', '#8ec5fc'], blur: 50 },
  { id: 'mesh-8', name: 'Oceanic Deep', colors: ['#1e293b', '#2563eb', '#00c6fb', '#0072ff'], blur: 50 },
  { id: 'mesh-9', name: 'Lavender Haze', colors: ['#cdb4db', '#e2d1f9', '#ffafcc', '#bde0fe'], blur: 50 },
  { id: 'mesh-10', name: 'Tropical Citrus', colors: ['#ff512f', '#dd2476', '#f5af19', '#ffe000'], blur: 50 },
  { id: 'mesh-11', name: 'Mint Meadow', colors: ['#00b09b', '#96c93d', '#43e97b', '#38f9d7'], blur: 50 },
  { id: 'mesh-12', name: 'Berry Glaze', colors: ['#ee0979', '#ff6a00', '#f857a6', '#ff5858'], blur: 50 },
  { id: 'mesh-13', name: 'Cosmic Violet', colors: ['#654ea3', '#eaafc8', '#9d50bb', '#6e48aa'], blur: 50 },
  { id: 'mesh-14', name: 'Warm Ember', colors: ['#c2410c', '#f97316', '#f12711', '#fbbf24'], blur: 50 },
  { id: 'mesh-15', name: 'Frosted Sky', colors: ['#bde0fe', '#a2d2ff', '#e0c3fc', '#8ec5fc'], blur: 50 },
  { id: 'mesh-16', name: 'Obsidian Glow', colors: ['#09090b', '#18181b', '#312e81', '#4338ca'], blur: 50 },
];
