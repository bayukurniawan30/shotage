import type { CanvasGuide } from '../types/studio';

export function guidePositionFromScreen(coordinate: number, origin: number, size: number) {
  return size > 0 ? (coordinate - origin) / size : 0;
}

export function guidePositionToScreen(position: number, origin: number, size: number) {
  return origin + position * size;
}

/** Keep major ruler labels at least 70 screen pixels apart, regardless of zoom. */
export function getRulerStep(logicalSize: number, screenSize: number) {
  const desired = (70 * logicalSize) / Math.max(1, screenSize);
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(0.01, desired)));
  return ([1, 2, 5, 10].find((factor) => factor * magnitude >= desired) ?? 10) * magnitude;
}

export function normalizeCanvasGuides(value: unknown): CanvasGuide[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value
    .filter((guide): guide is CanvasGuide => {
      if (
        !guide ||
        typeof guide.id !== 'string' ||
        !guide.id ||
        ids.has(guide.id) ||
        (guide.axis !== 'horizontal' && guide.axis !== 'vertical') ||
        typeof guide.position !== 'number' ||
        !Number.isFinite(guide.position) ||
        guide.position < 0 ||
        guide.position > 1
      )
        return false;
      ids.add(guide.id);
      return true;
    })
    .slice(0, 100)
    .map(({ id, axis, position }) => ({ id, axis, position }));
}
