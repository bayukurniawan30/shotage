import React, { useRef, useState, useLayoutEffect, useMemo, useId } from 'react';
import {
  evaluateMistGeometry,
  getVeilBaseColor,
  getRidgeBaseColor,
  getRidgeStrokeColor,
  getRidgeStrokeOpacity,
  getRidgeGradientEndWeight,
  getAirHazeOpacity,
  getRidgeBlurStdDev,
  lerpOklab,
  getFilledRidgePath,
  getSplineCrestPath,
} from '../utils/mistPresets';

export interface MistBackgroundProps {
  stops?: string[];
  ranges?: number; // 3 to 9
  horizon?: number; // 20 to 58 (% sky share)
  peaks?: number; // 0 to 100 (% peak height)
  sharp?: number; // 0 to 100 (% sharpness)
  haze?: number; // 0 to 100 (% fog density)
  seed?: number;
  isMini?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_STOPS = ['#FBF2E2', '#F3DDC2', '#D9BCAE', '#B08F9B', '#7A6483', '#463A5E'];

export const MistBackground: React.FC<MistBackgroundProps> = ({
  stops = DEFAULT_STOPS,
  ranges = 5,
  horizon = 42,
  peaks = 50,
  sharp = 55,
  haze = 50,
  seed = 7,
  isMini = false,
  className = '',
  style,
}) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: isMini ? 240 : 900, h: isMini ? 160 : 600 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const nw = Math.round(rect.width);
        const nh = Math.round(rect.height);
        setDims((prev) => (prev.w === nw && prev.h === nh ? prev : { w: nw, h: nh }));
      }
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { w, h } = dims;

  // Compute mountain ridge geometry
  const geometry = useMemo(() => {
    return evaluateMistGeometry(w, h, ranges, horizon, peaks, sharp, haze, seed);
  }, [w, h, ranges, horizon, peaks, sharp, haze, seed]);

  const veilColor = useMemo(() => getVeilBaseColor(stops), [stops]);
  const airOpacity = useMemo(() => getAirHazeOpacity(haze), [haze]);

  // Compute evenly spaced stop percentages for sky background
  const skyStops = useMemo(() => {
    if (stops.length <= 1) return [{ color: stops[0] || '#FBF2E2', offset: '50%' }];
    return stops.map((c, idx) => ({
      color: c,
      offset: `${((idx / (stops.length - 1)) * 100).toFixed(1)}%`,
    }));
  }, [stops]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      style={style}
    >
      <svg
        className="w-full h-full block absolute inset-0"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Base Sky Linear Gradient */}
          <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
            {skyStops.map((st, i) => (
              <stop key={i} offset={st.offset} stopColor={st.color} />
            ))}
          </linearGradient>

          {/* Mist Veil Radial Gradient (Soft atmospheric falloff) */}
          <radialGradient id={`${uid}-mv`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={veilColor} stopOpacity={0.9} />
            <stop offset="55%" stopColor={veilColor} stopOpacity={0.42} />
            <stop offset="100%" stopColor={veilColor} stopOpacity={0} />
          </radialGradient>

          {/* Base Ground Air Haze Linear Gradient */}
          <linearGradient id={`${uid}-mair`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={veilColor} stopOpacity={0} />
            <stop offset="100%" stopColor={veilColor} stopOpacity={airOpacity} />
          </linearGradient>

          {/* Individual Mountain Ridge Shading Gradients */}
          {geometry.ridges.map((ridge, idx) => {
            const baseCol = getRidgeBaseColor(stops, ridge.t, haze);
            const midCol = lerpOklab(baseCol, veilColor, 0.16);
            const endWeight = getRidgeGradientEndWeight(ridge.t, haze);
            const endCol = lerpOklab(baseCol, veilColor, endWeight);

            return (
              <linearGradient
                key={`grad-${idx}`}
                id={`${uid}-mr${idx}`}
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={ridge.top.toFixed(1)}
                x2="0"
                y2={ridge.base.toFixed(1)}
              >
                <stop offset="0%" stopColor={baseCol} />
                <stop offset="45%" stopColor={midCol} />
                <stop offset="100%" stopColor={endCol} />
              </linearGradient>
            );
          })}

          {/* Ridge Distance Blur Filters */}
          {geometry.ridges.map((ridge, idx) => {
            const blurDev = getRidgeBlurStdDev(ridge.t, h);
            if (blurDev <= 0.4) return null;
            return (
              <filter
                key={`blur-${idx}`}
                id={`${uid}-mb${idx}`}
                x="-4%"
                y="-30%"
                width="108%"
                height="160%"
              >
                <feGaussianBlur stdDeviation={blurDev.toFixed(2)} />
              </filter>
            );
          })}
        </defs>

        {/* 1. Sky Gradient Background */}
        <rect width={w} height={h} fill={`url(#${uid}-sky)`} />

        {/* 2. Mountain Ridges & Soft Mist Veils (Back to Front) */}
        {geometry.ridges.map((ridge, idx) => {
          const blurDev = getRidgeBlurStdDev(ridge.t, h);
          const filterAttr = blurDev > 0.4 ? `url(#${uid}-mb${idx})` : undefined;
          const strokeCol = getRidgeStrokeColor(stops, ridge.t, haze);
          const strokeWidth = Math.max(1, h * 0.0035).toFixed(1);
          const strokeOpacity = getRidgeStrokeOpacity(ridge.t).toFixed(3);
          const veil = geometry.veils[idx];

          return (
            <g key={`layer-${idx}`} opacity={ridge.fade < 1 ? ridge.fade.toFixed(3) : undefined}>
              {/* Mountain Silhouette Fill */}
              <path
                d={getFilledRidgePath(ridge, w, h)}
                fill={`url(#${uid}-mr${idx})`}
                filter={filterAttr}
              />

              {/* Alpine Crest Highlight Stroke */}
              <path
                d={getSplineCrestPath(ridge.pts)}
                fill="none"
                stroke={strokeCol}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={strokeOpacity}
                filter={filterAttr}
              />

              {/* Soft Mist Veil Ellipse (No drift, gentle stationary mist) */}
              {veil && (
                <ellipse
                  cx={veil.cx.toFixed(1)}
                  cy={veil.cy.toFixed(1)}
                  rx={veil.rx.toFixed(1)}
                  ry={veil.ry.toFixed(1)}
                  fill={`url(#${uid}-mv)`}
                  opacity={veil.a.toFixed(3)}
                />
              )}
            </g>
          );
        })}

        {/* 3. Base Ground Mist Haze */}
        <rect
          x="0"
          y={(h * 0.86).toFixed(1)}
          width={w}
          height={(h * 0.14).toFixed(1)}
          fill={`url(#${uid}-mair)`}
        />
      </svg>
    </div>
  );
};
