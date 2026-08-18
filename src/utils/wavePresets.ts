export interface WavePreset {
  id: string;
  name: string;
  colors: [string, string, string];
  pathType: 'sine' | 'multi-sine' | 'layered' | 'blob' | 'peaks' | 'curved-flow';
  opacity: number;
}

export const WAVE_PRESETS: WavePreset[] = [
  // 1-8: Soft Pastel & Modern Gradients
  { id: 'wave-1',  name: 'Pastel Dream',     colors: ['#100a1f', '#f472b6', '#c4b5fd'], pathType: 'sine',         opacity: 0.80 },
  { id: 'wave-2',  name: 'Ocean Breeze',     colors: ['#060d1c', '#38bdf8', '#818cf8'], pathType: 'multi-sine',   opacity: 0.80 },
  { id: 'wave-3',  name: 'Sunset Glow',      colors: ['#140a04', '#f97316', '#f43f5e'], pathType: 'layered',      opacity: 0.85 },
  { id: 'wave-4',  name: 'Emerald Tide',     colors: ['#021a12', '#10b981', '#34d399'], pathType: 'blob',         opacity: 0.80 },
  { id: 'wave-5',  name: 'Cyber Neon',       colors: ['#10032a', '#a855f7', '#06b6d4'], pathType: 'peaks',        opacity: 0.85 },
  { id: 'wave-6',  name: 'Peach Velvet',     colors: ['#1a0a10', '#fb923c', '#fda4af'], pathType: 'curved-flow',  opacity: 0.80 },
  { id: 'wave-7',  name: 'Midnight Aurora',  colors: ['#06030f', '#6d28d9', '#22d3ee'], pathType: 'multi-sine',   opacity: 0.85 },
  { id: 'wave-8',  name: 'Cotton Candy',     colors: ['#0d0820', '#e879f9', '#93c5fd'], pathType: 'sine',         opacity: 0.80 },

  // 9-16: Vibrant & Electric Flow
  { id: 'wave-9',  name: 'Electric Violet',  colors: ['#0e0224', '#7c3aed', '#4f46e5'], pathType: 'layered',      opacity: 0.85 },
  { id: 'wave-10', name: 'Solar Flare',      colors: ['#1c0302', '#ef4444', '#f97316'], pathType: 'blob',         opacity: 0.85 },
  { id: 'wave-11', name: 'Mint Splash',      colors: ['#011a10', '#059669', '#86efac'], pathType: 'peaks',        opacity: 0.80 },
  { id: 'wave-12', name: 'Rose Gold Wave',   colors: ['#1c0408', '#e11d48', '#fb923c'], pathType: 'curved-flow',  opacity: 0.80 },
  { id: 'wave-13', name: 'Deep Sea Current', colors: ['#020e20', '#0284c7', '#06b6d4'], pathType: 'multi-sine',   opacity: 0.85 },
  { id: 'wave-14', name: 'Bubble Gum',       colors: ['#1a0214', '#ec4899', '#f9a8d4'], pathType: 'sine',         opacity: 0.80 },
  { id: 'wave-15', name: 'Tropical Lagoon',  colors: ['#011810', '#10b981', '#14b8a6'], pathType: 'layered',      opacity: 0.80 },
  { id: 'wave-16', name: 'Cosmic Pulse',     colors: ['#0e0718', '#7c3aed', '#db2777'], pathType: 'blob',         opacity: 0.85 },

  // 17-24: Dark Mode & Sleek Metallic
  { id: 'wave-17', name: 'Obsidian Ripple',  colors: ['#050506', '#3f3f46', '#71717a'], pathType: 'sine',         opacity: 0.90 },
  { id: 'wave-18', name: 'Titanium Flow',    colors: ['#080f1e', '#475569', '#94a3b8'], pathType: 'multi-sine',   opacity: 0.80 },
  { id: 'wave-19', name: 'Neon Lime Surge',  colors: ['#05100a', '#16a34a', '#bef264'], pathType: 'peaks',        opacity: 0.80 },
  { id: 'wave-20', name: 'Hyper Magenta',    colors: ['#1c0112', '#d946ef', '#f97316'], pathType: 'curved-flow',  opacity: 0.85 },
  { id: 'wave-21', name: 'Amethyst Wave',    colors: ['#120a22', '#7c3aed', '#a78bfa'], pathType: 'layered',      opacity: 0.80 },
  { id: 'wave-22', name: 'Twilight Haze',    colors: ['#0c0418', '#4f46e5', '#c026d3'], pathType: 'blob',         opacity: 0.80 },
  { id: 'wave-23', name: 'Ice Blue Crest',   colors: ['#030f1e', '#0284c7', '#38bdf8'], pathType: 'sine',         opacity: 0.85 },
  { id: 'wave-24', name: 'Golden Dune',      colors: ['#160e01', '#d97706', '#fbbf24'], pathType: 'curved-flow',  opacity: 0.80 },

  // 25-32: Abstract Dual-Tone & Soft Ambient
  { id: 'wave-25', name: 'Apricot Horizon',  colors: ['#1a0d04', '#f59e0b', '#fb923c'], pathType: 'multi-sine',   opacity: 0.80 },
  { id: 'wave-26', name: 'Lilac Mist',       colors: ['#110a20', '#8b5cf6', '#c4b5fd'], pathType: 'layered',      opacity: 0.80 },
  { id: 'wave-27', name: 'Cyberpunk Drift',  colors: ['#1a0008', '#e11d48', '#7c3aed'], pathType: 'blob',         opacity: 0.85 },
  { id: 'wave-28', name: 'Warm Ember',       colors: ['#1a0901', '#c2410c', '#ef4444'], pathType: 'peaks',        opacity: 0.80 },
  { id: 'wave-29', name: 'Sublime Surge',    colors: ['#020e22', '#2563eb', '#06b6d4'], pathType: 'sine',         opacity: 0.85 },
  { id: 'wave-30', name: 'Frosted Coral',    colors: ['#1c0a08', '#f43f5e', '#fb923c'], pathType: 'curved-flow',  opacity: 0.80 },
  { id: 'wave-31', name: 'Royal Velvet',     colors: ['#080930', '#3730a3', '#818cf8'], pathType: 'multi-sine',   opacity: 0.80 },
  { id: 'wave-32', name: 'Berry Glaze',      colors: ['#1a041a', '#db2777', '#f472b6'], pathType: 'layered',      opacity: 0.85 },
];
