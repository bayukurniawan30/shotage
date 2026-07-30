export interface WavePreset {
  id: string;
  name: string;
  colors: [string, string, string];
  pathType: 'sine' | 'multi-sine' | 'layered' | 'blob' | 'peaks' | 'curved-flow';
  opacity: number;
}

export const WAVE_PRESETS: WavePreset[] = [
  // 1-8: Soft Pastel & Modern Gradients
  { id: 'wave-1', name: 'Pastel Dream', colors: ['#0f172a', '#ffafcc', '#cdb4db'], pathType: 'sine', opacity: 0.7 },
  { id: 'wave-2', name: 'Ocean Breeze', colors: ['#090d16', '#a2d2ff', '#38bdf8'], pathType: 'multi-sine', opacity: 0.65 },
  { id: 'wave-3', name: 'Sunset Glow', colors: ['#180e29', '#f43f5e', '#fbbf24'], pathType: 'layered', opacity: 0.75 },
  { id: 'wave-4', name: 'Emerald Tide', colors: ['#042f2e', '#059669', '#34d399'], pathType: 'blob', opacity: 0.7 },
  { id: 'wave-5', name: 'Cyber Neon', colors: ['#17042b', '#a855f7', '#06b6d4'], pathType: 'peaks', opacity: 0.8 },
  { id: 'wave-6', name: 'Peach Velvet', colors: ['#1c1017', '#ffb5a7', '#fcd5ce'], pathType: 'curved-flow', opacity: 0.75 },
  { id: 'wave-7', name: 'Midnight Aurora', colors: ['#090514', '#7c3aed', '#38bdf8'], pathType: 'multi-sine', opacity: 0.7 },
  { id: 'wave-8', name: 'Cotton Candy', colors: ['#130f26', '#ffc8dd', '#bde0fe'], pathType: 'sine', opacity: 0.8 },

  // 9-16: Vibrant & Electric Flow
  { id: 'wave-9', name: 'Electric Violet', colors: ['#12032e', '#8e54e9', '#4776e6'], pathType: 'layered', opacity: 0.75 },
  { id: 'wave-10', name: 'Solar Flare', colors: ['#260408', '#ff512f', '#dd2476'], pathType: 'blob', opacity: 0.8 },
  { id: 'wave-11', name: 'Mint Splash', colors: ['#022c22', '#00b09b', '#96c93d'], pathType: 'peaks', opacity: 0.7 },
  { id: 'wave-12', name: 'Rose Gold Wave', colors: ['#290813', '#f43f5e', '#fda4af'], pathType: 'curved-flow', opacity: 0.75 },
  { id: 'wave-13', name: 'Deep Sea Current', colors: ['#02132b', '#1cb5e0', '#000046'], pathType: 'multi-sine', opacity: 0.85 },
  { id: 'wave-14', name: 'Cherry Pop', colors: ['#2b0213', '#ff66b2', '#ffb3d9'], pathType: 'sine', opacity: 0.7 },
  { id: 'wave-15', name: 'Laguna Dune', colors: ['#022619', '#43e97b', '#38f9d7'], pathType: 'layered', opacity: 0.7 },
  { id: 'wave-16', name: 'Cosmic Pulse', colors: ['#160c29', '#654ea3', '#eaafc8'], pathType: 'blob', opacity: 0.75 },

  // 17-24: Dark Mode & Sleek Metallic
  { id: 'wave-17', name: 'Obsidian Ripple', colors: ['#09090b', '#27272a', '#52525b'], pathType: 'sine', opacity: 0.85 },
  { id: 'wave-18', name: 'Titanium Flow', colors: ['#0f172a', '#334155', '#94a3b8'], pathType: 'multi-sine', opacity: 0.7 },
  { id: 'wave-19', name: 'Neon Lime Surge', colors: ['#091c08', '#15803d', '#a3e635'], pathType: 'peaks', opacity: 0.75 },
  { id: 'wave-20', name: 'Hyper Magenta', colors: ['#2b0318', '#ee0979', '#ff6a00'], pathType: 'curved-flow', opacity: 0.8 },
  { id: 'wave-21', name: 'Amethyst Wave', colors: ['#1a0b2e', '#9d50bb', '#6e48aa'], pathType: 'layered', opacity: 0.75 },
  { id: 'wave-22', name: 'Twilight Haze', colors: ['#160826', '#3a1c71', '#d76d77'], pathType: 'blob', opacity: 0.7 },
  { id: 'wave-23', name: 'Ice Blue Crest', colors: ['#051b2c', '#00c6fb', '#005bea'], pathType: 'sine', opacity: 0.8 },
  { id: 'wave-24', name: 'Golden Dune', colors: ['#241b02', '#ffe000', '#799f0c'], pathType: 'curved-flow', opacity: 0.65 },

  // 25-32: Abstract Dual-Tone & Soft Ambient
  { id: 'wave-25', name: 'Apricot Horizon', colors: ['#2b1303', '#f6d365', '#fda085'], pathType: 'multi-sine', opacity: 0.7 },
  { id: 'wave-26', name: 'Lilac Mist', colors: ['#170e2b', '#e2d1f9', '#d0bdf4'], pathType: 'layered', opacity: 0.75 },
  { id: 'wave-27', name: 'Cyberpunk Drift', colors: ['#290011', '#ff0055', '#7a00ff'], pathType: 'blob', opacity: 0.8 },
  { id: 'wave-28', name: 'Warm Ember', colors: ['#2b0d02', '#c2410c', '#f97316'], pathType: 'peaks', opacity: 0.75 },
  { id: 'wave-29', name: 'Sublime Surge', colors: ['#02162e', '#00c6ff', '#0072ff'], pathType: 'sine', opacity: 0.8 },
  { id: 'wave-30', name: 'Frosted Coral', colors: ['#2e0c07', '#ff5e62', '#ff9966'], pathType: 'curved-flow', opacity: 0.7 },
  { id: 'wave-31', name: 'Royal Velvet', colors: ['#0e0f33', '#4e54c8', '#8f94fb'], pathType: 'multi-sine', opacity: 0.75 },
  { id: 'wave-32', name: 'Berry Glaze', colors: ['#26071e', '#f857a6', '#ff5858'], pathType: 'layered', opacity: 0.8 },
];
