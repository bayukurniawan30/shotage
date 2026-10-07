import { describe, expect, it } from 'vitest';
import { textOutlineBorderPath } from './textOutlineBorder';
import { parseSvgPathToRings, ringsToMultiPolygon } from './shapeBoolean';

describe('text outline border', () => {
  it('strokes only the perimeter of overlapping T strokes', () => {
    const path = 'M0 0 L100 0 L100 20 L0 20 Z M40 0 L60 0 L60 100 L40 100 Z';
    const result = textOutlineBorderPath(path);
    const rings = parseSvgPathToRings(result);
    expect(rings).toHaveLength(1);
    // The internal top edge of the vertical stroke must disappear.
    expect(rings[0]).not.toContainEqual([40, 0]);
    expect(rings[0]).not.toContainEqual([60, 0]);
    expect(textOutlineBorderPath(path)).toBe(result);
  });
  it('retains borders around actual letter holes', () => {
    const path = 'M0 0 L100 0 L100 100 L0 100 Z M20 20 L20 80 L80 80 L80 20 Z';
    expect(ringsToMultiPolygon(parseSvgPathToRings(textOutlineBorderPath(path)))[0]).toHaveLength(
      2
    );
  });
});
