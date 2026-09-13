import { describe, expect, it } from 'vitest';
import {
  calculateCubicBezier,
  calculateEasing,
  calculateMotionBlurRadius,
  evaluateTextAnimationUnit,
  evaluateLayerKeyframes,
  evaluateMotionPathSegment,
  interpolateColorOklab,
  segmentTextForAnimation,
  type CubicBezierEasing,
} from './animationTypes';

const linearCurve: CubicBezierEasing = {
  type: 'cubic-bezier',
  x1: 0,
  y1: 0,
  x2: 1,
  y2: 1,
};

describe('custom cubic Bezier easing', () => {
  it('preserves exact endpoints and linear midpoint', () => {
    expect(calculateCubicBezier(0, linearCurve)).toBe(0);
    expect(calculateCubicBezier(0.5, linearCurve)).toBeCloseTo(0.5, 5);
    expect(calculateCubicBezier(1, linearCurve)).toBe(1);
  });

  it('supports curves that overshoot the target', () => {
    const pop: CubicBezierEasing = {
      type: 'cubic-bezier',
      x1: 0.34,
      y1: 1.56,
      x2: 0.64,
      y2: 1,
    };

    expect(calculateEasing(0.75, pop)).toBeGreaterThan(1);
  });

  it('uses the outgoing keyframe custom curve during layer interpolation', () => {
    const result = evaluateLayerKeyframes(
      {
        x: 0,
        keyframes: [
          { id: 'start', timeSec: 0, x: 0, easing: linearCurve },
          { id: 'end', timeSec: 2, x: 100 },
        ],
      },
      1
    );

    expect(result.x).toBeCloseTo(50, 4);
  });
});

describe('motion paths', () => {
  it('keeps path endpoints exact while bending the midpoint', () => {
    const config = { type: 'arc-up' as const, curvature: 0.25 };
    const start = evaluateMotionPathSegment({ x: 0, y: 0 }, { x: 100, y: 0 }, 0, config);
    const middle = evaluateMotionPathSegment({ x: 0, y: 0 }, { x: 100, y: 0 }, 0.5, config);
    const end = evaluateMotionPathSegment({ x: 0, y: 0 }, { x: 100, y: 0 }, 1, config);

    expect(start).toMatchObject({ x: 0, y: 0 });
    expect(middle.x).toBeCloseTo(50, 5);
    expect(middle.y).toBeLessThan(0);
    expect(end).toMatchObject({ x: 100, y: 0 });
  });

  it('can orient a layer along the path tangent', () => {
    const result = evaluateLayerKeyframes(
      {
        x: 0,
        y: 0,
        rotation: 10,
        motionPath: { type: 'linear' as const, curvature: 0, autoOrient: true },
        keyframes: [
          { id: 'start', timeSec: 0, x: 0, y: 0, easing: linearCurve },
          { id: 'end', timeSec: 2, x: 0, y: 100 },
        ],
      },
      1
    );

    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(50, 5);
    expect(result.rotation).toBeCloseTo(100, 5);
  });
});

describe('motion blur', () => {
  it('keeps stationary content sharp', () => {
    expect(
      calculateMotionBlurRadius(
        { x: 20, y: 30, rotation: 10, scale: 1 },
        { x: 20, y: 30, rotation: 10, scale: 1 },
        100
      )
    ).toBe(0);
  });

  it('increases blur with movement and user strength', () => {
    const low = calculateMotionBlurRadius({ x: 0, y: 0 }, { x: 8, y: 0 }, 25);
    const high = calculateMotionBlurRadius({ x: 0, y: 0 }, { x: 8, y: 0 }, 100);

    expect(low).toBeGreaterThan(0);
    expect(high).toBeGreaterThan(low);
  });

  it('caps extreme motion to keep rendering usable', () => {
    expect(calculateMotionBlurRadius({ x: 0, y: 0 }, { x: 1000, y: 1000 }, 100)).toBe(14);
  });
});

describe('additional animatable properties', () => {
  it('interpolates numeric appearance properties with the keyframe easing', () => {
    const result = evaluateLayerKeyframes(
      {
        x: 0,
        color: '#ff0000',
        keyframes: [
          { id: 'start', timeSec: 0, x: 0, blur: 0, skewX: -10, letterSpacing: 0, shadowOpacity: 20, easing: linearCurve },
          { id: 'end', timeSec: 2, x: 0, blur: 20, skewX: 10, letterSpacing: 8, shadowOpacity: 80 },
        ],
      },
      1
    );

    expect(result.blur).toBe(10);
    expect(result.skewX).toBe(0);
    expect(result.letterSpacing).toBe(4);
    expect(result.shadowOpacity).toBe(50);
  });

  it('interpolates solid colors in OKLab and preserves exact endpoints', () => {
    expect(interpolateColorOklab('#ff0000', '#0000ff', 0)).toBe('#ff0000');
    expect(interpolateColorOklab('#ff0000', '#0000ff', 1)).toBe('#0000ff');
    expect(interpolateColorOklab('#ff0000', '#0000ff', 0.5)).toMatch(/^rgba\(\d+, \d+, \d+, 1\)$/);
  });
});

describe('per-unit text animation', () => {
  it('segments graphemes without splitting emoji and skips whitespace stagger slots', () => {
    const segments = segmentTextForAnimation('Hi 👋🏽!');

    expect(segments.map((segment) => segment.text)).toEqual(['H', 'i', ' ', '👋🏽', '!']);
    expect(segments.map((segment) => segment.animationIndex)).toEqual([0, 1, null, 2, 3]);
  });

  it('can animate words while preserving their exact spaces', () => {
    const segments = segmentTextForAnimation('Hello   Shotage', 'word');

    expect(segments).toEqual([
      { text: 'Hello', animationIndex: 0 },
      { text: '   ', animationIndex: null },
      { text: 'Shotage', animationIndex: 1 },
    ]);
  });

  it('stagger reveals earlier characters before later characters', () => {
    const block = {
      id: 'rise',
      preset: 'text-rise' as const,
      startTimeSec: 0,
      durationSec: 1.2,
      staggerSec: 0.05,
      textOrder: 'forward' as const,
    };
    const first = evaluateTextAnimationUnit(block, 0, 8, 0.2);
    const last = evaluateTextAnimationUnit(block, 7, 8, 0.2);

    expect(first.opacity).toBeGreaterThan(last.opacity);
    expect(first.translateY).toBeLessThan(last.translateY);
  });

  it('caps long-text stagger at 700ms', () => {
    const block = {
      id: 'long-rise',
      preset: 'text-rise' as const,
      startTimeSec: 0,
      durationSec: 1.4,
      staggerSec: 0.2,
      textOrder: 'forward' as const,
    };
    const lastAtCap = evaluateTextAnimationUnit(block, 99, 100, 0.7);

    expect(lastAtCap.opacity).toBe(0);
    expect(lastAtCap.translateY).toBe(22);
  });
});
