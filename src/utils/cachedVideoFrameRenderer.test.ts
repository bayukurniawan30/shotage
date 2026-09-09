import { describe, expect, it } from 'vitest';
import { DEFAULT_STUDIO_STATE, type StudioState } from '../types/studio';
import { canUseCachedVideoFrameRenderer } from './cachedVideoFrameRenderer';

const makeState = (overrides: Partial<StudioState> = {}): StudioState => ({
  ...DEFAULT_STUDIO_STATE,
  ...overrides,
});

describe('cached video frame renderer eligibility', () => {
  it('accepts image mockups with static backgrounds and 2D animation', () => {
    const state = makeState({
      isAnimationMode: true,
      keyframes: [
        {
          id: 'start',
          timeSec: 0,
          rotateX: 0,
          rotateY: 0,
          zoom: 80,
          offsetX: -20,
          offsetY: 0,
        },
        {
          id: 'end',
          timeSec: 5,
          rotateX: 0,
          rotateY: 0,
          zoom: 110,
          offsetX: 20,
          offsetY: 0,
        },
      ],
    });

    expect(canUseCachedVideoFrameRenderer(state)).toBe(true);
  });

  it('accepts a plain Flow background for direct WebGL canvas compositing', () => {
    expect(canUseCachedVideoFrameRenderer(makeState({ backgroundType: 'flow' }))).toBe(true);
  });

  it('accepts static above-mockup text with Flow', () => {
    expect(
      canUseCachedVideoFrameRenderer(
        makeState({
          backgroundType: 'flow',
          textLayers: [
            {
              id: 'text',
              text: 'Static overlay',
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: '500',
              fontStyle: 'normal',
              color: '#ffffff',
              textAlign: 'center',
              x: 50,
              y: 50,
              shadow: false,
              opacity: 100,
              rotation: 0,
              position: 'above',
            },
          ],
        })
      )
    ).toBe(true);
  });

  it.each([
    makeState({ backgroundType: 'flow', bgBlur: 4 }),
    makeState({ backgroundType: 'flow', bgGrain: 20 }),
    makeState({ backgroundType: 'flow', bgPatternEnabled: true }),
    makeState({ backgroundType: 'flow', shadowOverlay: 'shadow-overlay-1' }),
    makeState({
      backgroundType: 'flow',
      lensBlurEnabled: true,
      lensBlurAmount: 10,
    }),
  ])('falls back for Flow effects that need full DOM compositing', (state) => {
    expect(canUseCachedVideoFrameRenderer(state)).toBe(false);
  });

  it.each([
    makeState({ mediaType: 'video' }),
    makeState({ backgroundType: 'animatedGradient' }),
    makeState({ rotateX: 10 }),
    makeState({
      keyframes: [
        {
          id: 'tilted',
          timeSec: 0,
          rotateX: 5,
          rotateY: 0,
          zoom: 100,
          offsetX: 0,
          offsetY: 0,
        },
      ],
    }),
    makeState({
      textLayers: [
        {
          id: 'text',
          text: 'Overlay',
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: '500',
          fontStyle: 'normal',
          color: '#ffffff',
          textAlign: 'center',
          x: 50,
          y: 50,
          shadow: false,
          opacity: 100,
          rotation: 0,
          position: 'underneath',
        },
      ],
    }),
  ])('falls back when the scene needs dynamic DOM rendering', (state) => {
    expect(canUseCachedVideoFrameRenderer(state)).toBe(false);
  });
});
