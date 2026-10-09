import { describe, it, expect } from 'vitest';
import { cropGeometry, fixedCropFrame } from '../imageCrop';

describe('non-destructive image framing', () => {
  it('covers the viewport while preserving the original aspect ratio', () => {
    const g = cropGeometry(1200, 600, 300, 300, { ratio: 1, zoom: 1, x: 0, y: 0 });
    expect(g).toEqual({ width: 600, height: 300, left: -150, top: -0 });
  });
  it.each([-1, 0, 1])('never exposes empty edges at offset %s', (offset) => {
    const g = cropGeometry(600, 1200, 400, 225, { ratio: 16 / 9, zoom: 2, x: offset, y: offset });
    expect(g.left).toBeLessThanOrEqual(0);
    expect(g.top).toBeLessThanOrEqual(0);
    expect(g.left + g.width).toBeGreaterThanOrEqual(400);
    expect(g.top + g.height).toBeGreaterThanOrEqual(225);
  });
  it('scales framing consistently for export density', () => {
    const crop = { ratio: 1, zoom: 1.5, x: 0.3, y: -0.6 };
    const a = cropGeometry(1000, 800, 300, 300, crop);
    const b = cropGeometry(1000, 800, 600, 600, crop);
    for (const key of ['width', 'height', 'left', 'top'] as const)
      expect(b[key]).toBeCloseTo(a[key] * 2);
  });
  it('keeps device and ticket screen proportions fixed', () => {
    expect(fixedCropFrame('iphone')).toBe(true);
    expect(fixedCropFrame('ticket-pass')).toBe(true);
    expect(fixedCropFrame('none')).toBe(false);
  });
});
