import React from 'react';
import type { IconPreviewShape } from '../store/useIconPreviewStore';

// An iOS-style continuous-corner approximation, not an official Apple mask.
export const ICON_SQUIRCLE_PATH =
  'M .3 0 H .7 C .91 0 1 .09 1 .3 V .7 C 1 .91 .91 1 .7 1 H .3 C .09 1 0 .91 0 .7 V .3 C 0 .09 .09 0 .3 0 Z';

export function IconClipDefinition({ id }: { id: string }) {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
      <defs>
        <clipPath id={id} clipPathUnits="objectBoundingBox">
          <path d={ICON_SQUIRCLE_PATH} />
        </clipPath>
      </defs>
    </svg>
  );
}

export function iconPreviewClip(shape: IconPreviewShape, id: string): string {
  return shape === 'circle'
    ? 'circle(50% at 50% 50%)'
    : shape === 'rounded'
      ? `url(#${id})`
      : 'none';
}

export function IconConstructionGuides({
  construction,
  dragging,
}: {
  construction: boolean;
  dragging: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      className="selection-gizmo-container absolute inset-0 h-full w-full pointer-events-none z-50"
      viewBox="0 0 1000 1000"
      fill="none"
      stroke="white"
      strokeOpacity="0.25"
      strokeWidth="1"
      preserveAspectRatio="none"
    >
      <g>
        <path d="M 0 0 L 1000 1000 M 1000 0 L 0 1000" vectorEffect="non-scaling-stroke" />
        {!dragging && <path d="M 500 0 V 1000 M 0 500 H 1000" vectorEffect="non-scaling-stroke" />}
        {construction && (
          <>
            <rect
              x="140"
              y="140"
              width="720"
              height="720"
              rx="140"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="500" cy="500" r="400" vectorEffect="non-scaling-stroke" />
            <circle cx="500" cy="500" r="280" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </g>
    </svg>
  );
}
