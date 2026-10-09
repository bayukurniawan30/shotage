import { describe, expect, it } from 'vitest';
import { resizeRectangleEdge, type RectangleEdge } from '../rectangleEdgeResize';

describe('rectangle edge resizing', () => {
  const base = { width: 200, height: 100, x: 30, y: 40, rotation: 0, anchorX: 0.5, anchorY: 0.5 };
  it('moves only the top edge, leaving width and bottom unchanged', () => {
    const result = resizeRectangleEdge(base, 't', 50, -20);
    expect(result).toEqual({ width: 200, height: 120, x: 30, y: 30 });
    expect(result.y + result.height / 2).toBe(base.y + base.height / 2);
  });
  it.each(['t', 'b', 'l', 'r'] as RectangleEdge[])(
    'pins the opposite edge for %s through rotation and noncentral anchors',
    (edge) => {
      for (const rotation of [0, 30, 90, -120])
        for (const anchor of [0, 0.5, 1]) {
          const initial = { ...base, rotation, anchorX: anchor, anchorY: 1 - anchor };
          const resized = resizeRectangleEdge(initial, edge, 30, 25);
          // Position of the opposite local edge midpoint in canvas coordinates.
          const point = (r: typeof initial) => {
            const u = edge === 'l' ? 1 : edge === 'r' ? 0 : 0.5;
            const v = edge === 't' ? 1 : edge === 'b' ? 0 : 0.5;
            const angle = (rotation * Math.PI) / 180;
            const lx = (u - r.anchorX) * r.width,
              ly = (v - r.anchorY) * r.height;
            return {
              x: r.x + (r.anchorX - 0.5) * r.width + lx * Math.cos(angle) - ly * Math.sin(angle),
              y: r.y + (r.anchorY - 0.5) * r.height + lx * Math.sin(angle) + ly * Math.cos(angle),
            };
          };
          const before = point(initial),
            after = point({ ...initial, ...resized });
          expect(after.x).toBeCloseTo(before.x);
          expect(after.y).toBeCloseTo(before.y);
        }
    }
  );
  it('clamps dimensions without moving the opposite edge', () => {
    const r = resizeRectangleEdge(base, 'r', -1000, 0);
    expect(r.width).toBe(10);
    expect(r.x - r.width / 2).toBe(base.x - base.width / 2);
  });
});
