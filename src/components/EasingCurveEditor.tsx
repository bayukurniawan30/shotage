import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import {
  AnimationEasing,
  CubicBezierEasing,
  calculateCubicBezier,
  isCubicBezierEasing,
} from '../types/animationTypes';

interface EasingCurveEditorProps {
  easing: AnimationEasing;
  layerName: string;
  startTimeSec: number;
  endTimeSec: number;
  onApply: (easing: CubicBezierEasing) => void;
  onClose: () => void;
}

const CURVE_PRESETS: Array<{ name: string; curve: CubicBezierEasing }> = [
  { name: 'Linear', curve: { type: 'cubic-bezier', x1: 0, y1: 0, x2: 1, y2: 1 } },
  { name: 'Smooth', curve: { type: 'cubic-bezier', x1: 0.65, y1: 0, x2: 0.35, y2: 1 } },
  { name: 'Snappy', curve: { type: 'cubic-bezier', x1: 0.16, y1: 1, x2: 0.3, y2: 1 } },
  { name: 'Accelerate', curve: { type: 'cubic-bezier', x1: 0.7, y1: 0, x2: 0.84, y2: 0 } },
  { name: 'Soft', curve: { type: 'cubic-bezier', x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 } },
  { name: 'Pop', curve: { type: 'cubic-bezier', x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 } },
];

const LEGACY_CURVES: Record<string, CubicBezierEasing> = {
  linear: CURVE_PRESETS[0].curve,
  'ease-in-out': { type: 'cubic-bezier', x1: 0.65, y1: 0, x2: 0.35, y2: 1 },
  'ease-out': { type: 'cubic-bezier', x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
  'ease-in': { type: 'cubic-bezier', x1: 0.7, y1: 0, x2: 0.84, y2: 0 },
  spring: { type: 'cubic-bezier', x1: 0.34, y1: 1.4, x2: 0.64, y2: 1 },
};

const copyCurve = (curve: CubicBezierEasing): CubicBezierEasing => ({ ...curve });

const toEditableCurve = (easing: AnimationEasing): CubicBezierEasing =>
  isCubicBezierEasing(easing)
    ? copyCurve(easing)
    : copyCurve(LEGACY_CURVES[easing] || LEGACY_CURVES['ease-in-out']);

const roundCurveValue = (value: number) => Math.round(value * 100) / 100;

export const EasingCurveEditor: React.FC<EasingCurveEditorProps> = ({
  easing,
  layerName,
  startTimeSec,
  endTimeSec,
  onApply,
  onClose,
}) => {
  const [curve, setCurve] = useState<CubicBezierEasing>(() => toEditableCurve(easing));
  const [previewTime, setPreviewTime] = useState(0);
  const graphRef = useRef<SVGSVGElement>(null);

  useEffect(() => setCurve(toEditableCurve(easing)), [easing]);

  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const cycle = ((now - startedAt) % 1800) / 1800;
      setPreviewTime(cycle);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const graph = useMemo(
    () => ({ left: 28, right: 292, top: 18, bottom: 210, yMin: -0.6, yMax: 1.6 }),
    []
  );
  const graphWidth = graph.right - graph.left;
  const graphHeight = graph.bottom - graph.top;
  const pointX = (value: number) => graph.left + value * graphWidth;
  const pointY = (value: number) =>
    graph.top + ((graph.yMax - value) / (graph.yMax - graph.yMin)) * graphHeight;

  const updateHandle = (
    handle: 'first' | 'second',
    event: React.PointerEvent<SVGCircleElement>
  ) => {
    const bounds = graphRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const svgX = ((event.clientX - bounds.left) / bounds.width) * 320;
    const svgY = ((event.clientY - bounds.top) / bounds.height) * 228;
    const x = Math.max(0, Math.min(1, (svgX - graph.left) / graphWidth));
    const y = Math.max(
      graph.yMin,
      Math.min(
        graph.yMax,
        graph.yMax - ((svgY - graph.top) / graphHeight) * (graph.yMax - graph.yMin)
      )
    );
    setCurve((current) =>
      handle === 'first'
        ? { ...current, x1: roundCurveValue(x), y1: roundCurveValue(y) }
        : { ...current, x2: roundCurveValue(x), y2: roundCurveValue(y) }
    );
  };

  const setNumericValue = (key: 'x1' | 'y1' | 'x2' | 'y2', value: number) => {
    if (!Number.isFinite(value)) return;
    const isX = key === 'x1' || key === 'x2';
    const bounded = isX ? Math.max(0, Math.min(1, value)) : Math.max(-0.6, Math.min(1.6, value));
    setCurve((current) => ({ ...current, [key]: roundCurveValue(bounded) }));
  };

  const path = `M ${pointX(0)} ${pointY(0)} C ${pointX(curve.x1)} ${pointY(curve.y1)}, ${pointX(curve.x2)} ${pointY(curve.y2)}, ${pointX(1)} ${pointY(1)}`;
  const easedPreview = calculateCubicBezier(previewTime, curve);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 text-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold">Custom easing</h3>
            <p className="mt-1 text-xs text-slate-400">
              {layerName} · {startTimeSec.toFixed(1)}s to {endTimeSec.toFixed(1)}s
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-neutral-800 hover:text-white"
            title="Close curve editor"
          >
            <XClose className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-1.5">
            {CURVE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setCurve(copyCurve(preset.curve))}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:border-pastel-pink/60 hover:text-pastel-pink"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3">
            <svg
              ref={graphRef}
              viewBox="0 0 320 228"
              className="block aspect-[320/228] w-full touch-none select-none"
              aria-label="Cubic Bezier easing graph"
            >
              <line
                x1={graph.left}
                y1={pointY(1)}
                x2={graph.right}
                y2={pointY(1)}
                stroke="#404040"
                strokeDasharray="4 4"
              />
              <line
                x1={graph.left}
                y1={pointY(0)}
                x2={graph.right}
                y2={pointY(0)}
                stroke="#525252"
              />
              <line
                x1={graph.left}
                y1={graph.top}
                x2={graph.left}
                y2={graph.bottom}
                stroke="#525252"
              />
              <line
                x1={pointX(0)}
                y1={pointY(0)}
                x2={pointX(curve.x1)}
                y2={pointY(curve.y1)}
                stroke="#a3a3a3"
                strokeWidth="1.5"
              />
              <line
                x1={pointX(1)}
                y1={pointY(1)}
                x2={pointX(curve.x2)}
                y2={pointY(curve.y2)}
                stroke="#a3a3a3"
                strokeWidth="1.5"
              />
              <path d={path} fill="none" stroke="#f9a8d4" strokeWidth="3" strokeLinecap="round" />
              <circle cx={pointX(0)} cy={pointY(0)} r="4" fill="#e5e5e5" />
              <circle cx={pointX(1)} cy={pointY(1)} r="4" fill="#e5e5e5" />
              <circle
                cx={pointX(curve.x1)}
                cy={pointY(curve.y1)}
                r="8"
                fill="#171717"
                stroke="#f9a8d4"
                strokeWidth="3"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId))
                    updateHandle('first', event);
                }}
              />
              <circle
                cx={pointX(curve.x2)}
                cy={pointY(curve.y2)}
                r="8"
                fill="#171717"
                stroke="#c4b5fd"
                strokeWidth="3"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId))
                    updateHandle('second', event);
                }}
              />
              <text x={graph.left} y={graph.bottom + 14} fill="#737373" fontSize="10">
                0
              </text>
              <text x={graph.right - 5} y={graph.bottom + 14} fill="#737373" fontSize="10">
                1
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(['x1', 'y1', 'x2', 'y2'] as const).map((key) => (
              <label
                key={key}
                className="space-y-1 text-[10px] font-semibold uppercase text-slate-500"
              >
                {key}
                <input
                  type="number"
                  min={key.startsWith('x') ? 0 : -0.6}
                  max={key.startsWith('x') ? 1 : 1.6}
                  step="0.01"
                  value={curve[key]}
                  onChange={(event) => setNumericValue(key, Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-pastel-pink"
                />
              </label>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
            <div className="relative h-2 overflow-visible rounded-full bg-neutral-800">
              <span
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pastel-pink shadow-lg shadow-pastel-pink/40"
                style={{ left: `${Math.max(0, Math.min(1, easedPreview)) * 100}%` }}
              />
            </div>
            <p className="font-mono text-[10px] text-slate-500">
              cubic-bezier({curve.x1}, {curve.y1}, {curve.x2}, {curve.y2})
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(curve);
              onClose();
            }}
            className="rounded-lg bg-pastel-pink px-3 py-2 text-xs font-bold text-neutral-950 transition-colors hover:bg-pink-300"
          >
            Apply curve
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
