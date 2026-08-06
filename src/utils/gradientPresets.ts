export interface GradientPreset {
  name: string;
  c1: string;
  c2: string;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Pastel Sunset', c1: '#ffafcc', c2: '#ffc8dd' },
  { name: 'Pastel Sky', c1: '#a2d2ff', c2: '#bde0fe' },
  { name: 'Lavender Dream', c1: '#cdb4db', c2: '#ffc8dd' },
  { name: 'Cotton Candy', c1: '#cdb4db', c2: '#a2d2ff' },
  { name: 'Pastel Glow', c1: '#ffafcc', c2: '#bde0fe' },
  { name: 'Indigo Cyan', c1: '#4f46e5', c2: '#06b6d4' },
  { name: 'Sunset Amber', c1: '#f43f5e', c2: '#fbbf24' },
  { name: 'Emerald Teal', c1: '#059669', c2: '#34d399' },
  { name: 'Purple Pink', c1: '#a855f7', c2: '#ec4899' },
  { name: 'Dark Slate', c1: '#1e293b', c2: '#0f172a' },
  { name: 'Ocean Blue', c1: '#2563eb', c2: '#38bdf8' },
  { name: 'Rose Gold', c1: '#f43f5e', c2: '#fda4af' },
  { name: 'Midnight Violet', c1: '#3b0764', c2: '#7c3aed' },
  { name: 'Neon Lime', c1: '#15803d', c2: '#a3e635' },
  { name: 'Warm Flame', c1: '#c2410c', c2: '#f97316' },
  { name: 'Deep Space', c1: '#000000', c2: '#434343' },
  { name: 'Cosmic Purple', c1: '#654ea3', c2: '#eaafc8' },
  { name: 'Cherry Blossom', c1: '#ffb3d9', c2: '#ff66b2' },
  { name: 'Northern Lights', c1: '#00c6ff', c2: '#0072ff' },
  { name: 'Solar Burst', c1: '#ff512f', c2: '#dd2476' },
  { name: 'Lush Forest', c1: '#134e5e', c2: '#71b280' },
  { name: 'Peachy Beach', c1: '#ffedd5', c2: '#f97316' },
  { name: 'Electric Violet', c1: '#4776e6', c2: '#8e54e9' },
  { name: 'Cyberpunk Red', c1: '#ff0055', c2: '#7a00ff' },
  { name: 'Cool Silver', c1: '#eef2f3', c2: '#8e9eab' },
  { name: 'Golden Glow', c1: '#ffe000', c2: '#799f0c' },
  { name: 'Deep Ocean', c1: '#1cb5e0', c2: '#000046' },
  { name: 'Amethyst', c1: '#9d50bb', c2: '#6e48aa' },
  { name: 'Vibrant Magenta', c1: '#ee0979', c2: '#ff6a00' },
  { name: 'Aqua Splash', c1: '#136a8a', c2: '#267871' },
  { name: 'Royal Velvet', c1: '#4e54c8', c2: '#8f94fb' },
  { name: 'Mint Fresh', c1: '#00b09b', c2: '#96c93d' },
  { name: 'Twilight Haze', c1: '#3a1c71', c2: '#d76d77' },
  { name: 'Coral Flare', c1: '#ff5e62', c2: '#ff9966' },
  { name: 'Soft Peach', c1: '#fcd5ce', c2: '#ffb5a7' },
  { name: 'Frozen Berry', c1: '#e0c3fc', c2: '#8ec5fc' },
  { name: 'Sublime Blue', c1: '#00c6fb', c2: '#005bea' },
  { name: 'Velvet Midnight', c1: '#200122', c2: '#6f0000' },
  { name: 'Neon Coral', c1: '#f857a6', c2: '#ff5858' },
  { name: 'Laguna Breeze', c1: '#43e97b', c2: '#38f9d7' },
  { name: 'Apricot Dream', c1: '#f6d365', c2: '#fda085' },
  { name: 'Mystic Indigo', c1: '#614385', c2: '#516395' },
  { name: 'Sunkissed Citrus', c1: '#f12711', c2: '#f5af19' },
  { name: 'Pastel Lilac', c1: '#e2d1f9', c2: '#d0bdf4' },
  { name: 'Deep Nebula', c1: '#020024', c2: '#090979' },
  { name: 'Emerald Isle', c1: '#0ba360', c2: '#3cba92' },
  { name: 'Candy Floss', c1: '#fbc2eb', c2: '#a6c1ee' },
  { name: 'Zenith Blue', c1: '#1a2a6c', c2: '#b21f1f' },
];

export const getRandomGradientPreset = (): GradientPreset => {
  const randomIndex = Math.floor(Math.random() * GRADIENT_PRESETS.length);
  return GRADIENT_PRESETS[randomIndex];
};
