export interface SpectralPreset {
  id: string;
  name: string;
  theme: 'dark' | 'light';
  bgColor: string;
  angle?: number;
  blur?: number;
  type: 'conic' | 'linear' | 'radial';
  stops: {
    c1: string;
    c2: string;
    c3: string;
    c4: string;
    c5: string;
    c6?: string;
  };
}

export const SPECTRAL_PRESETS: SpectralPreset[] = [
  // 4 Dark Based Presets
  {
    id: 'spectral-1',
    name: 'Obsidian Prism',
    theme: 'dark',
    bgColor: '#05050c',
    type: 'conic',
    angle: 215,
    blur: 48,
    stops: {
      c1: '#7c3aed', // Violet
      c2: '#2563eb', // Royal Blue
      c3: '#06b6d4', // Cyan
      c4: '#10b981', // Emerald
      c5: '#f59e0b', // Amber
      c6: '#ec4899', // Magenta
    },
  },
  {
    id: 'spectral-2',
    name: 'Cosmic Refraction',
    theme: 'dark',
    bgColor: '#090b10',
    type: 'linear',
    angle: 135,
    blur: 44,
    stops: {
      c1: '#4f46e5', // Laser Indigo
      c2: '#0284c7', // Electric Azure
      c3: '#34d399', // Mint Aura
      c4: '#fbbf24', // Sunburst
      c5: '#f43f5e', // Coral Crimson
      c6: '#8b5cf6', // Deep Purple
    },
  },
  {
    id: 'spectral-3',
    name: 'Solar Flare Spectrum',
    theme: 'dark',
    bgColor: '#0d0408',
    type: 'linear',
    angle: 160,
    blur: 50,
    stops: {
      c1: '#ff0055',
      c2: '#ff5500',
      c3: '#ffcc00',
      c4: '#00ffcc',
      c5: '#7700ff',
    },
  },
  {
    id: 'spectral-4',
    name: 'Neon Aurora Beam',
    theme: 'dark',
    bgColor: '#040b12',
    type: 'conic',
    angle: 310,
    blur: 45,
    stops: {
      c1: '#00f2fe',
      c2: '#4facfe',
      c3: '#00e676',
      c4: '#ffea00',
      c5: '#f50057',
      c6: '#d500f9',
    },
  },

  // 4 Light Based Presets
  {
    id: 'spectral-5',
    name: 'Iridescent Pearl',
    theme: 'light',
    bgColor: '#f8fafc',
    type: 'radial',
    angle: 45,
    blur: 40,
    stops: {
      c1: '#fbcfe8', // Rose Quartz
      c2: '#bae6fd', // Soft Sky
      c3: '#fef08a', // Warm Champagne
      c4: '#ddd6fe', // Pastel Lavender
      c5: '#a7f3d0', // Mint Frost
    },
  },
  {
    id: 'spectral-6',
    name: 'Prism Opal',
    theme: 'light',
    bgColor: '#ffffff',
    type: 'conic',
    angle: 140,
    blur: 46,
    stops: {
      c1: '#3b82f6', // Radiant Cobalt
      c2: '#14b8a6', // Turquoise
      c3: '#84cc16', // Vivid Lime
      c4: '#f97316', // Tangerine
      c5: '#d946ef', // Fuchsia
      c6: '#6366f1', // Electric Indigo
    },
  },
  {
    id: 'spectral-7',
    name: 'Crystal Quartz',
    theme: 'light',
    bgColor: '#fbfbfe',
    type: 'radial',
    angle: 90,
    blur: 42,
    stops: {
      c1: '#818cf8', // Soft Indigo
      c2: '#fb923c', // Warm Peach
      c3: '#f472b6', // Rose Quartz
      c4: '#22d3ee', // Aqua Cyan
      c5: '#c084fc', // Violet Lilac
    },
  },
  {
    id: 'spectral-8',
    name: 'Ethereal Cloud',
    theme: 'light',
    bgColor: '#f8fafc',
    type: 'linear',
    angle: 120,
    blur: 38,
    stops: {
      c1: '#38bdf8', // Sky Blue
      c2: '#fb7185', // Sunset Coral
      c3: '#fbbf24', // Sunlit Amber
      c4: '#34d399', // Mint Jade
      c5: '#a78bfa', // Lavender Dream
    },
  },
];
