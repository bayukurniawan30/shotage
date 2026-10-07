import type { StudioState } from '../types/studio';

export const DEFAULT_CUSTOM_GRADIENT = {
  angle: 90,
  stops: [
    { color: '#ffafcc', position: 0 },
    { color: '#a2d2ff', position: 100 },
  ],
};

export function customGradientCss(
  value?: StudioState['customGradient'],
  angle = value?.angle ?? 90
) {
  const stops = value?.stops ?? DEFAULT_CUSTOM_GRADIENT.stops;
  return `linear-gradient(${angle}deg, ${stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')})`;
}
