import { describe, expect, it } from 'vitest';
import { anchorOrigin, clampAnchor } from './anchorPoint';

describe('anchor point helpers', () => {
  it('uses the center for legacy layers without anchor values', () => {
    expect(anchorOrigin()).toBe('50% 50%');
  });

  it('converts normalized anchors to CSS transform origins', () => {
    expect(anchorOrigin(0, 1)).toBe('0% 100%');
    expect(anchorOrigin(0.25, 0.75)).toBe('25% 75%');
  });

  it('clamps imported or manually entered values to the layer bounds', () => {
    expect(clampAnchor(-0.25)).toBe(0);
    expect(clampAnchor(1.25)).toBe(1);
    expect(clampAnchor(Number.NaN)).toBe(0.5);
  });
});
