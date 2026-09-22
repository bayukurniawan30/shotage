import { describe, expect, it } from 'vitest';
import type { StudioState } from '../types/studio';
import { createSavedSessionData, normalizeRestoredSession } from './sessionStore';

describe('session stage transition restore', () => {
  it('restores the transition saved on every stage', () => {
    const saved: Partial<StudioState> = {
      activeStageIndex: 0,
      transitionOut: { type: 'none', durationSec: 0.6, easing: 'ease-in-out' },
      stages: [
        {
          transitionOut: { type: 'crossfade', durationSec: 0.8, easing: 'ease-out' },
        },
        {
          transitionOut: { type: 'slide-left', durationSec: 1.1, easing: 'linear' },
        },
        {},
      ],
    };

    const restored = normalizeRestoredSession(saved);

    expect(restored.stages?.map((stage) => stage.transitionOut?.type)).toEqual([
      'crossfade',
      'slide-left',
      'none',
    ]);
    expect(restored.transitionOut).toEqual(restored.stages?.[0].transitionOut);
  });
});

describe('session feature restore', () => {
  it('keeps masks, appearance keyframes, motion settings, and their stage copies', () => {
    const shapeLayers = [
      {
        id: 'mask-shape',
        shapeType: 'circle' as const,
        color: '#ffffff',
        width: 120,
        height: 120,
        x: 20,
        y: -10,
        rotation: 0,
        opacity: 100,
        position: 'above' as const,
        maskTarget: { type: 'text' as const, id: 'title' },
        keyframes: [
          {
            id: 'appearance',
            timeSec: 1,
            blur: 8,
            skewX: 12,
            color: '#ff00aa',
            borderWidth: 6,
            borderColor: '#00ffff',
            shadowOpacity: 60,
            shadowBlur: 18,
            shadowOffsetX: 3,
            shadowOffsetY: 9,
          },
        ],
      },
    ];
    const textLayers = [
      {
        id: 'title',
        text: 'Restore me',
        fontFamily: 'Inter',
        fontSize: 40,
        fontWeight: '700' as const,
        fontStyle: 'normal' as const,
        color: '#ffffff',
        textAlign: 'center' as const,
        x: 0,
        y: 0,
        shadow: true,
        opacity: 100,
        rotation: 0,
        position: 'above' as const,
        letterSpacing: 7,
        shadowBlur: 14,
        motions: [
          {
            id: 'chars',
            preset: 'text-rise' as const,
            startTimeSec: 0,
            durationSec: 1,
            textUnit: 'character' as const,
            textOrder: 'center' as const,
            staggerSec: 0.04,
          },
        ],
      },
    ];
    const saved = {
      textLayers,
      shapeLayers,
      phosphorIconLayers: [],
      canvasElements: [],
      layerGroups: [],
      motionBlurEnabled: true,
      motionBlurStrength: 72,
      mockupAnchorX: 0.25,
      mockupAnchorY: 0.75,
      mockupMotionPath: { type: 'arc-up' as const, curvature: 0.4, autoOrient: true },
      transitionOut: { type: 'crossfade' as const, durationSec: 0.8, easing: 'ease-out' as const },
      activeStageIndex: 0,
      stages: [
        {
          textLayers,
          shapeLayers,
          transitionOut: {
            type: 'slide-left' as const,
            durationSec: 0.7,
            easing: 'ease-in-out' as const,
          },
        },
      ],
    } as Partial<StudioState>;

    const restored = normalizeRestoredSession(saved);
    expect(restored.shapeLayers?.[0].maskTarget).toEqual({ type: 'text', id: 'title' });
    expect(restored.shapeLayers?.[0].keyframes?.[0]).toMatchObject({
      blur: 8,
      color: '#ff00aa',
      borderWidth: 6,
      shadowBlur: 18,
    });
    expect(restored.textLayers?.[0]).toMatchObject({ letterSpacing: 7, shadowBlur: 14 });
    expect(restored.textLayers?.[0].motions?.[0]).toMatchObject({
      preset: 'text-rise',
      textOrder: 'center',
      staggerSec: 0.04,
    });
    expect(restored.stages?.[0].shapeLayers?.[0].maskTarget).toEqual({ type: 'text', id: 'title' });
    expect(restored).toMatchObject({
      motionBlurEnabled: true,
      motionBlurStrength: 72,
      mockupAnchorX: 0.25,
    });
  });

  it('creates an IndexedDB-safe payload without dropping new design fields', () => {
    const state = {
      frameType: 'code-window',
      codeSource: 'const saved = true;',
      codeLanguage: 'typescript',
      codeWindowStyle: 'macos',
      shapeLayers: [{ id: 'mask', maskTarget: { type: 'group', id: 'hero' } }],
      isPlaying: false,
      isExporting: true,
      updateState: () => undefined,
    } as unknown as StudioState;
    const payload = createSavedSessionData(state, 123);

    expect(payload._version).toBe('1.2');
    expect(payload.savedAt).toBe(123);
    expect(payload.data.shapeLayers?.[0].maskTarget).toEqual({ type: 'group', id: 'hero' });
    expect(payload.data).toMatchObject({
      frameType: 'code-window',
      codeSource: 'const saved = true;',
      codeLanguage: 'typescript',
      codeWindowStyle: 'macos',
    });
    expect(payload.data.isExporting).toBeUndefined();
    expect('updateState' in payload.data).toBe(false);
    expect(() => structuredClone(payload)).not.toThrow();
  });
});
