import { describe, expect, it } from 'vitest';
import type { ShapeLayer } from '../types/studio';
import {
  booleanOperationOnShapes,
  canBooleanOperateOnShape,
  parseSvgPathToRings,
} from './shapeBoolean';

function shape(overrides: Partial<ShapeLayer>): ShapeLayer {
  return {
    id: 'shape',
    shapeType: 'rectangle',
    color: '#ffffff',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 100,
    position: 'above',
    ...overrides,
  };
}

describe('shape boolean operations', () => {
  it('supports valid pen paths but rejects vectors without usable path geometry', () => {
    expect(
      canBooleanOperateOnShape(
        shape({ shapeType: 'custom-path', pathData: 'M 0 -50 L 50 0 L 0 50 L -50 0 Z' })
      )
    ).toBe(true);
    expect(canBooleanOperateOnShape(shape({ shapeType: 'custom-path' }))).toBe(false);
    expect(canBooleanOperateOnShape(shape({ shapeType: 'coolshape' }))).toBe(false);
  });

  it('keeps a pen-drawn silhouette when unioning it with a rectangle', () => {
    const penShape = shape({
      id: 'pen',
      shapeType: 'custom-path',
      pathData: 'M 0 -50 L 50 0 L 0 50 L -50 0 Z',
      viewBox: '-50 -50 100 100',
      name: 'Custom Vector Shape',
    });
    const rectangle = shape({ id: 'rectangle', width: 40, height: 40, x: 40 });

    const result = booleanOperationOnShapes([penShape, rectangle], 'union');

    expect(result?.shapeType).toBe('custom-path');
    expect(result?.pathData).toBeTruthy();
    expect(parseSvgPathToRings(result?.pathData || '')[0].length).toBeGreaterThan(5);
  });

  it('does not silently convert an unsupported shape to a rectangle', () => {
    const result = booleanOperationOnShapes(
      [shape({ id: 'cool', shapeType: 'coolshape' }), shape({ id: 'rectangle' })],
      'union'
    );

    expect(result).toBeNull();
  });
});
