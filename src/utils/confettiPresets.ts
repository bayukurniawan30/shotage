export interface ConfettiPreset {
  id: string;
  name: string;
  bgColor: string;
  shapes: {
    type: 'circle' | 'rect' | 'triangle' | 'star';
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    size: number; // smaller particle size
    color: string;
    rotation: number;
    opacity: number;
  }[];
}

const generateDenseConfetti = (
  palette: string[],
  seedOffset: number = 0
): ConfettiPreset['shapes'] => {
  const shapes: ConfettiPreset['shapes'] = [];
  const types: ('circle' | 'rect' | 'triangle' | 'star')[] = ['circle', 'rect', 'triangle', 'star'];

  // Generate 45 small scattered confetti particles
  for (let i = 0; i < 45; i++) {
    const x = Math.round(((i * 23 + seedOffset * 17) % 94) + 3);
    const y = Math.round(((i * 37 + seedOffset * 29) % 94) + 3);
    const size = Math.round(((i * 7) % 6) + 4); // 4px to 9px (small elements)
    const color = palette[i % palette.length];
    const type = types[i % types.length];
    const rotation = (i * 47) % 360;
    const opacity = 0.6 + (i % 5) * 0.08; // 0.6 to 0.92 opacity

    shapes.push({ type, x, y, size, color, rotation, opacity });
  }

  return shapes;
};

export const CONFETTI_PRESETS: ConfettiPreset[] = [
  // 4 Dark Background Confetti Presets
  {
    id: 'confetti-1',
    name: 'Pastel Party (Dark)',
    bgColor: '#0f172a',
    shapes: generateDenseConfetti(['#ffafcc', '#cdb4db', '#a2d2ff', '#ffc8dd', '#bde0fe'], 1),
  },
  {
    id: 'confetti-2',
    name: 'Neon Festival (Dark)',
    bgColor: '#090514',
    shapes: generateDenseConfetti(['#f43f5e', '#38bdf8', '#a855f7', '#a3e635', '#fbbf24'], 2),
  },
  {
    id: 'confetti-3',
    name: 'Golden Celebration (Dark)',
    bgColor: '#180e04',
    shapes: generateDenseConfetti(['#ffe000', '#fbbf24', '#f59e0b', '#d97706', '#fef08a'], 3),
  },
  {
    id: 'confetti-4',
    name: 'Midnight Sparkle (Dark)',
    bgColor: '#030712',
    shapes: generateDenseConfetti(['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#60a5fa'], 4),
  },

  // 4 Light Background Confetti Presets
  {
    id: 'confetti-5',
    name: 'Pastel Soft (Light)',
    bgColor: '#f8fafc',
    shapes: generateDenseConfetti(['#f43f5e', '#8b5cf6', '#0284c7', '#10b981', '#f59e0b'], 5),
  },
  {
    id: 'confetti-6',
    name: 'Vivid Candy (Light)',
    bgColor: '#fff1f2',
    shapes: generateDenseConfetti(['#e11d48', '#7c3aed', '#2563eb', '#059669', '#d97706'], 6),
  },
  {
    id: 'confetti-7',
    name: 'Vanilla Bloom (Light)',
    bgColor: '#fefce8',
    shapes: generateDenseConfetti(['#d97706', '#ca8a04', '#16a34a', '#2563eb', '#dc2626'], 7),
  },
  {
    id: 'confetti-8',
    name: 'Mint Breeze (Light)',
    bgColor: '#f0fdf4',
    shapes: generateDenseConfetti(['#059669', '#0284c7', '#7c3aed', '#db2777', '#ea580c'], 8),
  },
];
