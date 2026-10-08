export const IMAGE_EFFECT_PRESETS = [
  'original',
  'grayscale',
  'sepia',
  'vintage',
  'vivid',
  'noir',
  'cool',
  'warm',
] as const;
export type ImageEffect = { preset: (typeof IMAGE_EFFECT_PRESETS)[number]; intensity: number };
export function imageEffectFilter(effect?: ImageEffect): string {
  const a = Math.max(0, Math.min(100, effect?.intensity ?? 100)) / 100;
  if (!a || !effect || effect.preset === 'original') return 'none';
  const mix = (target: number) => Number((1 + (target - 1) * a).toFixed(4));
  switch (effect.preset) {
    case 'grayscale':
      return `grayscale(${a})`;
    case 'sepia':
      return `sepia(${a})`;
    case 'vintage':
      return `sepia(${a * 0.35}) saturate(${mix(0.75)}) contrast(${mix(0.85)}) brightness(${mix(1.08)})`;
    case 'vivid':
      return `saturate(${mix(1.6)}) contrast(${mix(1.15)})`;
    case 'noir':
      return `grayscale(${a}) contrast(${mix(1.5)}) brightness(${mix(0.9)})`;
    case 'cool':
      return `sepia(${a * 0.2}) hue-rotate(${a * 165}deg) saturate(${mix(1.15)})`;
    case 'warm':
      return `sepia(${a * 0.3}) saturate(${mix(1.25)}) brightness(${mix(1.03)})`;
    default:
      return 'none';
  }
}
