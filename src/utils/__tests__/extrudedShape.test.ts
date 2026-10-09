import { describe, expect, it } from 'vitest';
import { getExtrudedShapeGeometry } from '../extrudedShape';

describe('3D shape extrusion', () => {
  it('keeps the front and rear faces inside the layer bounds', () => {
    const geometry = getExtrudedShapeGeometry(120, 120, 24);
    expect(geometry.front.x).toBe(0);
    expect(geometry.front.y).toBe(0);
    expect(geometry.front.width).toBe(96);
    expect(geometry.front.height).toBe(96);
    expect(geometry.verticalDepth).toBe(24);
    expect(geometry.radius).toBe(0);
    expect(geometry.sliceCount).toBe(24);
    expect(geometry.front.width + geometry.projectedDepth).toBe(geometry.width);
    expect(geometry.front.height + geometry.verticalDepth).toBe(geometry.height);
  });

  it('allows a flat depth and clamps excessive depth', () => {
    expect(getExtrudedShapeGeometry(160, 100, 0).front).toEqual({
      x: 0, y: 0, width: 160, height: 100,
    });
    expect(getExtrudedShapeGeometry(160, 100, 0).sliceCount).toBe(0);
    expect(getExtrudedShapeGeometry(160, 100, 500).projectedDepth).toBe(45);
  });

  it('uses the same radius for every extruded slice', () => {
    const geometry = getExtrudedShapeGeometry(120, 120, 24, 16);
    expect(geometry.radius).toBe(16);
    expect(geometry.sliceCount).toBe(24);
    expect(getExtrudedShapeGeometry(120, 120, 24, 200).radius).toBe(48);
  });

  it('preserves a rectangular front face when depth is applied', () => {
    const geometry = getExtrudedShapeGeometry(160, 100, 20);
    expect(geometry.front.width / geometry.front.height).toBeCloseTo(160 / 100);
  });
});
