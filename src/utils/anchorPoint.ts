export interface AnchorPoint {
  x: number;
  y: number;
}

export const CENTER_ANCHOR: AnchorPoint = { x: 0.5, y: 0.5 };

export const clampAnchor = (value: number): number =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0.5));

/**
 * Returns the translation needed to change transform-origin without moving the
 * rendered object. Translation is expressed in the canvas coordinate system.
 */
export const getAnchorCompensation = (
  element: HTMLElement | null,
  previous: AnchorPoint,
  next: AnchorPoint
): { x: number; y: number } => {
  if (!element || typeof DOMMatrixReadOnly === 'undefined') return { x: 0, y: 0 };

  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (!width || !height) return { x: 0, y: 0 };

  const transform = window.getComputedStyle(element).transform;
  const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
  const dx = (previous.x - next.x) * width;
  const dy = (previous.y - next.y) * height;
  const transformedX = matrix.m11 * dx + matrix.m21 * dy;
  const transformedY = matrix.m12 * dx + matrix.m22 * dy;

  return { x: dx - transformedX, y: dy - transformedY };
};

export const anchorOrigin = (anchorX?: number, anchorY?: number): string =>
  `${clampAnchor(anchorX ?? 0.5) * 100}% ${clampAnchor(anchorY ?? 0.5) * 100}%`;
