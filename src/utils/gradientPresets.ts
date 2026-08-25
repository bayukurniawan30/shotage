export interface GradientPreset {
  name: string;
  c1: string;
  c2: string;
  includeInInitialState?: boolean;
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Pastel Sunset', c1: '#ffafcc', c2: '#ffc8dd', includeInInitialState: true },
  { name: 'Pastel Sky', c1: '#a2d2ff', c2: '#bde0fe', includeInInitialState: true },
  { name: 'Lavender Dream', c1: '#cdb4db', c2: '#ffc8dd', includeInInitialState: true },
  { name: 'Cotton Candy', c1: '#cdb4db', c2: '#a2d2ff', includeInInitialState: true },
  { name: 'Pastel Glow', c1: '#ffafcc', c2: '#bde0fe', includeInInitialState: true },
  { name: 'Indigo Cyan', c1: '#4f46e5', c2: '#06b6d4', includeInInitialState: true },
  { name: 'Sunset Amber', c1: '#f43f5e', c2: '#fbbf24' },
  { name: 'Emerald Teal', c1: '#059669', c2: '#34d399' },
  { name: 'Purple Pink', c1: '#a855f7', c2: '#ec4899', includeInInitialState: true },
  { name: 'Dark Slate', c1: '#1e293b', c2: '#0f172a' },
  { name: 'Ocean Blue', c1: '#2563eb', c2: '#38bdf8', includeInInitialState: true },
  { name: 'Rose Gold', c1: '#f43f5e', c2: '#fda4af', includeInInitialState: true },
  { name: 'Midnight Violet', c1: '#3b0764', c2: '#7c3aed' },
  { name: 'Neon Lime', c1: '#15803d', c2: '#a3e635' },
  { name: 'Warm Flame', c1: '#c2410c', c2: '#f97316' },
  { name: 'Deep Space', c1: '#000000', c2: '#434343' },
  { name: 'Cosmic Purple', c1: '#654ea3', c2: '#eaafc8', includeInInitialState: true },
  { name: 'Cherry Blossom', c1: '#ffb3d9', c2: '#ff66b2', includeInInitialState: true },
  { name: 'Northern Lights', c1: '#00c6ff', c2: '#0072ff', includeInInitialState: true },
  { name: 'Solar Burst', c1: '#ff512f', c2: '#dd2476', includeInInitialState: true },
  { name: 'Lush Forest', c1: '#134e5e', c2: '#71b280', includeInInitialState: true },
  { name: 'Peachy Beach', c1: '#ffedd5', c2: '#f97316', includeInInitialState: true },
  { name: 'Electric Violet', c1: '#4776e6', c2: '#8e54e9' },
  { name: 'Cyberpunk Red', c1: '#ff0055', c2: '#7a00ff' },
  { name: 'Cool Silver', c1: '#eef2f3', c2: '#8e9eab', includeInInitialState: true },
  { name: 'Golden Glow', c1: '#ffe000', c2: '#799f0c' },
  { name: 'Deep Ocean', c1: '#1cb5e0', c2: '#000046' },
  { name: 'Amethyst', c1: '#9d50bb', c2: '#6e48aa', includeInInitialState: true },
  { name: 'Vibrant Magenta', c1: '#ee0979', c2: '#ff6a00', includeInInitialState: true },
  { name: 'Aqua Splash', c1: '#136a8a', c2: '#267871' },
  { name: 'Royal Velvet', c1: '#4e54c8', c2: '#8f94fb' },
  { name: 'Mint Fresh', c1: '#00b09b', c2: '#96c93d' },
  { name: 'Twilight Haze', c1: '#3a1c71', c2: '#d76d77' },
  { name: 'Coral Flare', c1: '#ff5e62', c2: '#ff9966', includeInInitialState: true },
  { name: 'Soft Peach', c1: '#fcd5ce', c2: '#ffb5a7' },
  { name: 'Frozen Berry', c1: '#e0c3fc', c2: '#8ec5fc', includeInInitialState: true },
  { name: 'Sublime Blue', c1: '#00c6fb', c2: '#005bea', includeInInitialState: true },
  { name: 'Velvet Midnight', c1: '#200122', c2: '#6f0000' },
  { name: 'Neon Coral', c1: '#f857a6', c2: '#ff5858' },
  { name: 'Laguna Breeze', c1: '#43e97b', c2: '#38f9d7', includeInInitialState: true },
  { name: 'Apricot Dream', c1: '#f6d365', c2: '#fda085' },
  { name: 'Mystic Indigo', c1: '#614385', c2: '#516395' },
  { name: 'Sunkissed Citrus', c1: '#f12711', c2: '#f5af19' },
  { name: 'Pastel Lilac', c1: '#e2d1f9', c2: '#d0bdf4' },
  { name: 'Deep Nebula', c1: '#020024', c2: '#090979' },
  { name: 'Emerald Isle', c1: '#0ba360', c2: '#3cba92' },
  { name: 'Candy Floss', c1: '#fbc2eb', c2: '#a6c1ee' },
  { name: 'Zenith Blue', c1: '#1a2a6c', c2: '#b21f1f' },
  { name: 'White Fade', c1: '#ffffff', c2: 'transparent' },
  { name: 'Black Fade', c1: '#000000', c2: 'transparent' },
  { name: 'Pink Fade', c1: '#ffafcc', c2: 'transparent' },
  { name: 'Sky Fade', c1: '#a2d2ff', c2: 'transparent' },
  { name: 'Glass Fade', c1: 'rgba(255,255,255,0.7)', c2: 'rgba(255,255,255,0.05)' },
  { name: 'Dark Vignette', c1: 'rgba(0,0,0,0.85)', c2: 'transparent' },
];

export const getRandomGradientPreset = (): GradientPreset => {
  const initialPresets = GRADIENT_PRESETS.filter((p) => p.includeInInitialState);
  const pool = initialPresets.length > 0 ? initialPresets : GRADIENT_PRESETS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

export const parseColorAndAlpha = (
  colorStr: string = '#ffffff'
): { hex: string; alpha: number } => {
  if (!colorStr || colorStr === 'transparent') {
    return { hex: '#000000', alpha: 0 };
  }

  // Check rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = colorStr.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/i);
  if (rgbaMatch) {
    const r = Math.min(255, parseInt(rgbaMatch[1], 10)).toString(16).padStart(2, '0');
    const g = Math.min(255, parseInt(rgbaMatch[2], 10)).toString(16).padStart(2, '0');
    const b = Math.min(255, parseInt(rgbaMatch[3], 10)).toString(16).padStart(2, '0');
    const a = rgbaMatch[4] !== undefined ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100;
    return { hex: `#${r}${g}${b}`, alpha: Math.max(0, Math.min(100, a)) };
  }

  // Check 8-digit hex #rrggbbaa
  if (colorStr.startsWith('#') && colorStr.length === 9) {
    const hex = colorStr.slice(0, 7);
    const alphaHex = parseInt(colorStr.slice(7, 9), 16);
    const alpha = Math.round((alphaHex / 255) * 100);
    return { hex, alpha };
  }

  // Standard 6-digit or 3-digit hex
  if (colorStr.startsWith('#')) {
    if (colorStr.length === 4) {
      const r = colorStr[1] + colorStr[1];
      const g = colorStr[2] + colorStr[2];
      const b = colorStr[3] + colorStr[3];
      return { hex: `#${r}${g}${b}`, alpha: 100 };
    }
    return { hex: colorStr.slice(0, 7), alpha: 100 };
  }

  return { hex: '#ffffff', alpha: 100 };
};

export const formatColorWithAlpha = (hex: string, alpha: number): string => {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  if (alpha === 0) return 'transparent';
  if (alpha >= 100) return `#${cleanHex}`;

  const r = parseInt(cleanHex.slice(0, 2) || '00', 16);
  const g = parseInt(cleanHex.slice(2, 4) || '00', 16);
  const b = parseInt(cleanHex.slice(4, 6) || '00', 16);
  const a = Math.round((alpha / 100) * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
