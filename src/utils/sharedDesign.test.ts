import { describe, expect, it } from 'vitest';
import type { TextLayer } from '../types/studio';
import { hydrateSharedStudioState } from './sharedDesign';

const textLayer = (
  scaleX: number,
  scaleY: number,
  overrides: Partial<TextLayer> = {}
): TextLayer => ({
  id: 'text-1',
  text: 'Stretched',
  fontFamily: 'Inter',
  fontSize: 32,
  fontWeight: '500',
  fontStyle: 'normal',
  color: '#ffffff',
  textAlign: 'center',
  x: 0,
  y: 0,
  shadow: false,
  opacity: 100,
  rotation: 0,
  position: 'above',
  scaleX,
  scaleY,
  ...overrides,
});

describe('shared design hydration', () => {
  it('keeps current root text stretch over a stale Stage 1 snapshot', () => {
    const hydrated = hydrateSharedStudioState({
      textLayers: [textLayer(2.4, 0.65)],
      stages: [{ textLayers: [textLayer(1, 1)] }],
      activeStageIndex: 0,
    });

    expect(hydrated.textLayers?.[0]).toMatchObject({ scaleX: 2.4, scaleY: 0.65 });
  });

  it('uses Stage 1 values when an older payload has no root value', () => {
    const hydrated = hydrateSharedStudioState({
      stages: [{ textLayers: [textLayer(1.8, 1.2)] }],
    });

    expect(hydrated.textLayers?.[0]).toMatchObject({ scaleX: 1.8, scaleY: 1.2 });
    expect(hydrated.activeStageIndex).toBe(0);
  });

  it('does not mix a later active stage position into stretched Stage 1 text', () => {
    const hydrated = hydrateSharedStudioState({
      textLayers: [textLayer(2.4, 7.2, { text: 'PLAYFAIR', x: -115, y: -133 })],
      stages: [
        {
          textLayers: [textLayer(2.4, 7.2, { text: 'FONT FAMILY', x: -123, y: -151 })],
        },
        {},
        {},
        {},
        {},
      ],
      activeStageIndex: 4,
      currentTimeSec: 3,
      isPlaying: true,
    });

    expect(hydrated.textLayers?.[0]).toMatchObject({
      text: 'FONT FAMILY',
      x: -123,
      y: -151,
      scaleX: 2.4,
      scaleY: 7.2,
    });
    expect(hydrated.activeStageIndex).toBe(0);
    expect(hydrated.currentTimeSec).toBe(0);
    expect(hydrated.isPlaying).toBe(false);
  });
});
