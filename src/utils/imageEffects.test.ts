import { describe, expect, it } from 'vitest';
import { IMAGE_EFFECT_PRESETS, imageEffectFilter } from './imageEffects';
describe('image effects', () => {
  it('leaves original images untouched and supports zero intensity', () => {
    expect(imageEffectFilter()).toBe('none');
    for (const preset of IMAGE_EFFECT_PRESETS)
      expect(imageEffectFilter({ preset, intensity: 0 })).toBe('none');
  });
  it('interpolates strength and clamps intensity', () => {
    expect(imageEffectFilter({ preset: 'grayscale', intensity: 50 })).toBe('grayscale(0.5)');
    expect(imageEffectFilter({ preset: 'vivid', intensity: 50 })).toBe(
      'saturate(1.3) contrast(1.075)'
    );
    expect(imageEffectFilter({ preset: 'sepia', intensity: 200 })).toBe('sepia(1)');
    expect(imageEffectFilter({ preset: 'noir', intensity: -10 })).toBe('none');
  });
  it('produces a filter for every non-original preset', () => {
    for (const preset of IMAGE_EFFECT_PRESETS.slice(1)) {
      expect(imageEffectFilter({ preset, intensity: 100 })).not.toBe('none');
      expect(imageEffectFilter({ preset, intensity: 100 })).not.toContain('NaN');
    }
  });
});
