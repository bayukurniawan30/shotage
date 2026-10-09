export type RectangleEdge = 't' | 'b' | 'l' | 'r';

/** Resize one local edge, keeping the opposite edge fixed even with rotation/anchors. */
export function resizeRectangleEdge(
  initial: {
    width: number;
    height: number;
    x: number;
    y: number;
    rotation: number;
    anchorX: number;
    anchorY: number;
  },
  edge: RectangleEdge,
  dx: number,
  dy: number
) {
  const sx = edge === 'l' ? -1 : edge === 'r' ? 1 : 0;
  const sy = edge === 't' ? -1 : edge === 'b' ? 1 : 0;
  const width = sx
    ? Math.max(10, Math.min(2000, Math.round(initial.width + sx * dx)))
    : initial.width;
  const height = sy
    ? Math.max(10, Math.min(2000, Math.round(initial.height + sy * dy)))
    : initial.height;
  const dw = width - initial.width,
    dh = height - initial.height;
  const ax = Math.max(0, Math.min(1, initial.anchorX));
  const ay = Math.max(0, Math.min(1, initial.anchorY));
  const localX = (sx / 2 - (0.5 - ax)) * dw;
  const localY = (sy / 2 - (0.5 - ay)) * dh;
  const rad = (initial.rotation * Math.PI) / 180;
  return {
    width,
    height,
    x: initial.x + localX * Math.cos(rad) - localY * Math.sin(rad) + (0.5 - ax) * dw,
    y: initial.y + localX * Math.sin(rad) + localY * Math.cos(rad) + (0.5 - ay) * dh,
  };
}
