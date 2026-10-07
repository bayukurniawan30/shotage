import { nonzeroRingsToMultiPolygon, parseSvgPathToRings } from './shapeBoolean';

// A separate stroke silhouette keeps the original Bézier fill untouched.
// Cache by geometry (not color/width/time) so animation does not recompute unions.
const cache = new Map<string, string>();
export function textOutlineBorderPath(path: string): string {
  const cached = cache.get(path);
  if (cached !== undefined) return cached;
  const geometry = nonzeroRingsToMultiPolygon(parseSvgPathToRings(path, 64));
  const result = geometry
    .flatMap((polygon) =>
      polygon.map((ring) => ring.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ') + ' Z')
    )
    .join(' ');
  if (cache.size >= 64) cache.delete(cache.keys().next().value!);
  cache.set(path, result);
  return result;
}
