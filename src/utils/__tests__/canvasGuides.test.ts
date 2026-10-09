import { describe, expect, it } from 'vitest';
import {
  getRulerStep,
  guidePositionFromScreen,
  guidePositionToScreen,
  normalizeCanvasGuides,
  snapGuideToCenter,
} from '../canvasGuides';

describe('canvas guide coordinates', () => {
  it('snaps within eight screen pixels of either center, regardless of zoom', () => {
    for (const size of [270, 540, 1080]) {
      expect(snapGuideToCenter(.5 + 7 / size, size)).toBe(.5);
      expect(snapGuideToCenter(.5 - 7 / size, size)).toBe(.5);
      expect(snapGuideToCenter(.5 + 10 / size, size)).toBe(.5 + 10 / size);
    }
    expect(snapGuideToCenter(.4, 0)).toBe(.4);
  });
  it('keeps a guide attached to the same design position through zoom and pan', () => {
    const position = guidePositionFromScreen(350, 100, 1000);
    expect(position).toBe(0.25);
    expect(guidePositionToScreen(position, -200, 2000)).toBe(300);
    expect(guidePositionToScreen(position, 80, 500)).toBe(205);
    expect(guidePositionFromScreen(205, 80, 500)).toBe(position);
  });

  it('spreads ruler labels at readable intervals at different zoom levels', () => {
    for (const screenWidth of [270, 540, 1080]) {
      const step = getRulerStep(1200, screenWidth);
      expect((step * screenWidth) / 1200).toBeGreaterThanOrEqual(70);
    }
  });

  it('discards invalid and duplicate guides when restoring old or imported designs', () => {
    expect(
      normalizeCanvasGuides([
        { id: 'valid', axis: 'vertical', position: 0.25 },
        { id: 'valid', axis: 'horizontal', position: 0.5 },
        { id: 'outside', axis: 'horizontal', position: -1 },
        { id: 'invalid-axis', axis: 'diagonal', position: 0.5 },
        { id: 'invalid-position', axis: 'vertical', position: NaN },
        null,
      ])
    ).toEqual([{ id: 'valid', axis: 'vertical', position: 0.25 }]);
  });
});
