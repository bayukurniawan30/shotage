import type { ShapeLayer } from '../types/studio';

export function shapeCornerRadii(
  shape: Pick<ShapeLayer, 'width' | 'height' | 'borderRadius' | 'cornerRadii'>,
  radius = shape.borderRadius ?? 0
) {
  const c = shape.cornerRadii;
  const values = [c?.topLeft, c?.topRight, c?.bottomRight, c?.bottomLeft].map((v) =>
    Math.max(0, v ?? radius)
  );
  const [tl, tr, br, bl] = values;
  // CSS scales all radii together when adjacent corners exceed an edge.
  const factor = Math.min(
    1,
    shape.width / Math.max(1, tl + tr),
    shape.width / Math.max(1, bl + br),
    shape.height / Math.max(1, tl + bl),
    shape.height / Math.max(1, tr + br)
  );
  return values.map((v) => v * factor);
}

export function shapeCornerCss(shape: ShapeLayer, radius = shape.borderRadius ?? 0) {
  if (shape.shapeType !== 'rectangle' && shape.shapeType !== 'square') return `${radius}px`;
  return shapeCornerRadii(shape, radius)
    .map((v) => `${v}px`)
    .join(' ');
}
