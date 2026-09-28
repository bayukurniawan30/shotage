import React, { useId } from 'react';
import { getExtrudedShapeGeometry } from '../utils/extrudedShape';
import type { ShapeLayer } from '../types/studio';

interface ExtrudedShapeProps {
  width: number;
  height: number;
  depth: number;
  cornerSoftness?: number;
  color: string;
  gradient?: ShapeLayer['gradient'];
  borderColor?: string;
  borderWidth?: number;
  className?: string;
}

export function ExtrudedShape({
  width,
  height,
  depth,
  cornerSoftness = 0,
  color,
  gradient,
  borderColor,
  borderWidth = 0,
  className,
}: ExtrudedShapeProps) {
  const id = `extruded-${useId().replace(/:/g, '')}`;
  const gradientId = `${id}-base`;
  const frontLightId = `${id}-front-light`;
  const frontSheenId = `${id}-front-sheen`;
  const sideShadeId = `${id}-side-shade`;
  const geometry = getExtrudedShapeGeometry(width, height, depth, cornerSoftness);
  const fill = gradient ? `url(#${gradientId})` : color;
  const stroke = borderWidth > 0 ? borderColor || '#ffffff' : 'none';
  const strokeWidth = Math.min(borderWidth, Math.min(width, height) / 8);
  const angle = ((gradient?.angle ?? 135) * Math.PI) / 180;
  const blueMaterial = !gradient && color.toLowerCase() === '#347ff5';

  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {gradient && (
          <linearGradient
            id={gradientId}
            x1={`${50 - 50 * Math.cos(angle)}%`}
            y1={`${50 - 50 * Math.sin(angle)}%`}
            x2={`${50 + 50 * Math.cos(angle)}%`}
            y2={`${50 + 50 * Math.sin(angle)}%`}
          >
            <stop offset="0%" stopColor={gradient.color1} />
            <stop offset="100%" stopColor={gradient.color2} />
          </linearGradient>
        )}
        <radialGradient id={frontLightId} cx="55%" cy="38%" r="78%">
          <stop offset="0%" stopColor={blueMaterial ? '#c5faff' : '#ffffff'} stopOpacity="0.9" />
          <stop offset="52%" stopColor={blueMaterial ? '#baf0ff' : '#ffffff'} stopOpacity="0.56" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
        </radialGradient>
        <linearGradient id={frontSheenId} x1="0%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={sideShadeId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="45%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {Array.from({ length: geometry.sliceCount }, (_, index) => {
        // Draw back-to-front; each rounded face overlaps the next just as the
        // mockup's dense box-shadow extrusion does. No polygon corner joins.
        const progress = (geometry.sliceCount - index) / geometry.sliceCount;
        const slice = {
          ...geometry.front,
          x: geometry.projectedDepth * progress,
          y: geometry.verticalDepth * progress,
        };
        return (
          <g key={index}>
            <rect {...slice} rx={geometry.radius} ry={geometry.radius} fill={fill} />
            <rect {...slice} rx={geometry.radius} ry={geometry.radius} fill={`url(#${sideShadeId})`} />
          </g>
        );
      })}
      <rect {...geometry.front} rx={geometry.radius} ry={geometry.radius} fill={fill} />
      <rect
        {...geometry.front}
        rx={geometry.radius}
        ry={geometry.radius}
        fill={`url(#${frontLightId})`}
      />
      <rect
        {...geometry.front}
        rx={geometry.radius}
        ry={geometry.radius}
        fill={`url(#${frontSheenId})`}
      />
      <rect
        {...geometry.front}
        rx={geometry.radius}
        ry={geometry.radius}
        fill="none"
        stroke={blueMaterial ? '#1554df' : '#000000'}
        strokeOpacity={blueMaterial ? 0.62 : 0.16}
        strokeWidth="2"
      />
      {geometry.front.width > 6 && geometry.front.height > 6 && (
        <rect
          x="2.5"
          y="2.5"
          width={geometry.front.width - 5}
          height={geometry.front.height - 5}
          rx={Math.max(0, geometry.radius - 2.5)}
          ry={Math.max(0, geometry.radius - 2.5)}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.42"
          strokeWidth="2"
        />
      )}
      {strokeWidth > 0 && (
        <g fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round">
          <rect {...geometry.front} rx={geometry.radius} ry={geometry.radius} />
        </g>
      )}
    </svg>
  );
}
