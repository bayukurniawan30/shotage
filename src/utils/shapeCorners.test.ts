import { describe, expect, it } from 'vitest';
import { shapeCornerRadii, shapeCornerCss } from './shapeCorners';
import type { ShapeLayer } from '../types/studio';

describe('individual shape corners', () => {
  const shape = { shapeType: 'rectangle', width: 100, height: 80, borderRadius: 10 } as ShapeLayer;
  it('keeps legacy uniform radius and explicit zero overrides', () => {
    expect(shapeCornerRadii(shape)).toEqual([10, 10, 10, 10]);
    expect(shapeCornerCss({ ...shape, cornerRadii: { topLeft: 0, bottomRight: 25 } })).toBe(
      '0px 10px 25px 10px'
    );
  });
  it('scales overlapping corners proportionally like CSS', () => {
    expect(
      shapeCornerRadii({
        ...shape,
        cornerRadii: { topLeft: 100, topRight: 100, bottomLeft: 0, bottomRight: 0 },
      })
    ).toEqual([50, 50, 0, 0]);
  });
});
