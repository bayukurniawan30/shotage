import { describe, expect, it } from 'vitest';
import type { ShapeLayer } from '../../types/studio';
import {
  booleanOperationOnShapes,
  canBooleanOperateOnShape,
  parseSvgPathToRings,
  nonzeroRingsToMultiPolygon,
} from '../shapeBoolean';

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
  it('keeps overlapping font strokes solid instead of cutting out their junction', () => {
    const rings = parseSvgPathToRings('M0 0 L100 0 L100 20 L0 20 Z M40 0 L60 0 L60 100 L40 100 Z');
    const result = nonzeroRingsToMultiPolygon(rings);
    const area = result.reduce(
      (sum, poly) =>
        sum +
        poly.reduce((total, ring, index) => {
          const a =
            Math.abs(
              ring.reduce((n, p, i) => {
                const q = ring[(i + 1) % ring.length];
                return n + p[0] * q[1] - q[0] * p[1];
              }, 0)
            ) / 2;
          return total + (index === 0 ? a : -a);
        }, 0),
      0
    );
    expect(result).toHaveLength(1);
    expect(area).toBe(3600);
  });
  it('preserves oppositely wound letter counters and fills nested same-winding contours', () => {
    const outer = 'M0 0 L100 0 L100 100 L0 100 Z';
    const hole = 'M20 20 L20 80 L80 80 L80 20 Z';
    const same = 'M20 20 L80 20 L80 80 L20 80 Z';
    expect(nonzeroRingsToMultiPolygon(parseSvgPathToRings(`${outer} ${hole}`))[0]).toHaveLength(2);
    expect(nonzeroRingsToMultiPolygon(parseSvgPathToRings(`${outer} ${same}`))[0]).toHaveLength(1);
  });
  it('supports valid pen paths but rejects vectors without usable path geometry', () => {
    expect(
      canBooleanOperateOnShape(
        shape({ shapeType: 'custom-path', pathData: 'M 0 -50 L 50 0 L 0 50 L -50 0 Z' })
      )
    ).toBe(true);
    expect(canBooleanOperateOnShape(shape({ shapeType: 'custom-path' }))).toBe(false);
    expect(
      canBooleanOperateOnShape(
        shape({ shapeType: 'custom-path', pathData: 'M -50 0 L 50 0', pathClosed: false })
      )
    ).toBe(false);
    expect(canBooleanOperateOnShape(shape({ shapeType: 'coolshape' }))).toBe(false);
    expect(canBooleanOperateOnShape(shape({ shapeType: 'square-3d' }))).toBe(false);
    expect(canBooleanOperateOnShape(shape({ shapeType: 'rectangle-3d' }))).toBe(false);
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
