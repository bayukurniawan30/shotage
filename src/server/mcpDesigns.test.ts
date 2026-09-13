import { describe, expect, it } from 'vitest';
import { buildStudioState, createShapeLayer, createTextLayer } from './mcpDesigns';
import { validateMcpStudioState } from './mcpDesignSchema';

describe('MCP design construction', () => {
  it('merges nested state and clears volatile editor fields', () => {
    const state = buildStudioState({
      aspectRatio: '1:1',
      gradient: { color1: '#111111', color2: '#eeeeee', angle: 45 },
      isPlaying: true,
      currentTimeSec: 8,
    });
    expect(state.aspectRatio).toBe('1:1');
    expect(state.gradient).toEqual({ color1: '#111111', color2: '#eeeeee', angle: 45 });
    expect(state.isPlaying).toBe(false);
    expect(state.currentTimeSec).toBe(0);
  });

  it('builds editor-compatible text and shape defaults', () => {
    expect(createTextLayer({ text: 'Hello' }, 0)).toMatchObject({
      text: 'Hello',
      fontFamily: 'Inter',
      scaleX: 1,
      scaleY: 1,
    });
    expect(createShapeLayer({ shapeType: 'circle' }, 0)).toMatchObject({
      shapeType: 'circle',
      width: 180,
      height: 180,
      borderWidth: 0,
    });
  });

  it('rejects invalid duration and background values', () => {
    expect(() => buildStudioState({ durationSec: 61 })).toThrow();
    expect(() => buildStudioState({ backgroundType: 'unknown' })).toThrow();
  });

  it('accepts paths, custom easing, text staggering, masks, groups, blur, and transitions', () => {
    const state = buildStudioState({
      durationSec: 8,
      isAnimationMode: true,
      motionBlurEnabled: true,
      motionBlurStrength: 65,
      mockupAnchorX: 0.5,
      mockupAnchorY: 0.75,
      mockupMotionPath: { type: 's-curve', curvature: 0.2, autoOrient: false },
      keyframes: [
        {
          id: 'mockup-start',
          timeSec: 0,
          rotateX: 4,
          rotateY: -8,
          zoom: 85,
          offsetX: -120,
          offsetY: 40,
          easing: { type: 'cubic-bezier', x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
        },
        {
          id: 'mockup-end',
          timeSec: 3,
          rotateX: 0,
          rotateY: 0,
          zoom: 100,
          offsetX: 0,
          offsetY: 0,
        },
      ],
      textLayers: [
        createTextLayer(
          {
            id: 'headline',
            text: 'Hello motion',
            anchorX: 0.5,
            anchorY: 0.5,
            motions: [
              {
                id: 'headline-rise',
                preset: 'text-rise',
                startTimeSec: 0.2,
                durationSec: 1.2,
                textUnit: 'character',
                textOrder: 'center',
                staggerSec: 0.04,
              },
            ],
            keyframes: [
              {
                id: 'headline-start',
                timeSec: 0,
                x: -200,
                opacity: 0,
                easing: { type: 'cubic-bezier', x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
              },
              { id: 'headline-end', timeSec: 1.2, x: 0, opacity: 100 },
            ],
            motionPath: { type: 'arc-up', curvature: 0.25, autoOrient: false },
          },
          0
        ),
      ],
      shapeLayers: [
        createShapeLayer(
          {
            id: 'headline-mask',
            shapeType: 'rectangle',
            maskTarget: { type: 'text', id: 'headline' },
          },
          0
        ),
      ],
      layerGroups: [
        {
          id: 'hero-group',
          name: 'Hero',
          members: [{ type: 'text', id: 'headline' }],
          position: 'above',
          originX: 0,
          originY: 0,
          x: 0,
          y: 0,
          width: 400,
          height: 100,
          scale: 1,
          rotation: 0,
          opacity: 100,
          anchorX: 0.5,
          anchorY: 0.5,
        },
      ],
      layerOrder: [
        { type: 'text', id: 'headline' },
        { type: 'shape', id: 'headline-mask' },
      ],
      transitionOut: { type: 'crossfade', durationSec: 0.6, easing: 'ease-in-out' },
    });

    expect(validateMcpStudioState(state as unknown as Record<string, unknown>)).toEqual({
      warnings: [],
    });
  });

  it('reports precise paths for invalid advanced motion', () => {
    expect(() =>
      buildStudioState({
        durationSec: 4,
        textLayers: [
          createTextLayer(
            {
              id: 'headline',
              text: 'Bad timing',
              keyframes: [
                {
                  id: 'late',
                  timeSec: 5,
                  easing: { type: 'cubic-bezier', x1: 2, y1: 0, x2: 0.3, y2: 1 },
                },
              ],
              motionPath: { type: 's-curve', curvature: 0.4 },
            },
            0
          ),
        ],
      })
    ).toThrow(/studioState\.textLayers\[0\]\.keyframes\[0\]\.easing\.x1/);
  });

  it('requires enough mockup keyframes for each configured motion path', () => {
    expect(() =>
      buildStudioState({
        slot2MockupMotionPath: { type: 'arc-down', curvature: 0.4 },
        keyframes: [],
      })
    ).toThrow(/studioState\.slot2MockupMotionPath requires at least two mockup keyframes/);
  });

  it('rejects missing mask targets and duplicate group membership', () => {
    expect(() =>
      buildStudioState({
        textLayers: [createTextLayer({ id: 'title', text: 'Title' }, 0)],
        shapeLayers: [
          createShapeLayer(
            {
              id: 'mask',
              shapeType: 'rectangle',
              maskTarget: { type: 'text', id: 'missing-title' },
            },
            0
          ),
        ],
        layerGroups: [
          {
            id: 'group-a',
            name: 'A',
            members: [{ type: 'text', id: 'title' }],
            position: 'above',
            originX: 0,
            originY: 0,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            scale: 1,
            rotation: 0,
            opacity: 100,
          },
          {
            id: 'group-b',
            name: 'B',
            members: [{ type: 'text', id: 'title' }],
            position: 'above',
            originX: 0,
            originY: 0,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            scale: 1,
            rotation: 0,
            opacity: 100,
          },
        ],
      })
    ).toThrow(/missing text:missing-title[\s\S]*repeats grouped layer text:title/);
  });
});
