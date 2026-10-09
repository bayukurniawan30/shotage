import { describe, expect, it } from 'vitest';
import { customGradientCss } from '../customGradient';

describe('customGradientCss', () => {
  it('provides an independent two-stop default', () => {
    expect(customGradientCss()).toBe('linear-gradient(90deg, #ffafcc 0%, #a2d2ff 100%)');
  });
  it('preserves three colors, positions, and angle', () => {
    expect(
      customGradientCss({
        angle: 140,
        stops: [
          { color: '#000000', position: 20 },
          { color: '#ff0000', position: 35 },
          { color: '#ffffff', position: 80 },
        ],
      })
    ).toBe('linear-gradient(140deg, #000000 20%, #ff0000 35%, #ffffff 80%)');
  });
});
