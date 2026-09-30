import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import type { CanvasGuide } from '../types/studio';
import {
  getRulerStep,
  guidePositionFromScreen,
  guidePositionToScreen,
} from '../utils/canvasGuides';

interface CanvasRulersProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  geometryKey: string;
  logicalWidth?: number;
  logicalHeight?: number;
  leftSidebarExpanded: boolean;
}

interface Geometry {
  left: number;
  top: number;
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  logicalWidth: number;
  logicalHeight: number;
  rulerLeft: number;
  rulerTop: number;
}

interface GuideDrag {
  guide: CanvasGuide;
  pointerId: number;
  grabOffset: number;
  isNew: boolean;
}

const EMPTY_GUIDES: CanvasGuide[] = [];
const RULER_SIZE = 24;

function RulerTicks({
  origin,
  screenSize,
  logicalSize,
  viewportSize,
  vertical = false,
}: {
  origin: number;
  screenSize: number;
  logicalSize: number;
  viewportSize: number;
  vertical?: boolean;
}) {
  const pixelsPerUnit = screenSize / logicalSize;
  const majorStep = getRulerStep(logicalSize, screenSize);
  const minorStep = majorStep / 5;
  const first = Math.floor(-origin / pixelsPerUnit / minorStep);
  const last = Math.ceil((viewportSize - origin) / pixelsPerUnit / minorStep);
  const ticks: React.ReactNode[] = [];
  for (let index = first; index <= last; index++) {
    const value = index * minorStep;
    const coordinate = origin + value * pixelsPerUnit;
    const major = index % 5 === 0;
    const label = String(Math.round(value * 100) / 100);
    ticks.push(
      <g key={index}>
        <line
          x1={vertical ? RULER_SIZE - (major ? 9 : 4) : coordinate}
          x2={vertical ? RULER_SIZE : coordinate}
          y1={vertical ? coordinate : RULER_SIZE - (major ? 9 : 4)}
          y2={vertical ? coordinate : RULER_SIZE}
          stroke={major ? '#737373' : '#404040'}
        />
        {major && (
          <text
            x={vertical ? 9 : coordinate + 3}
            y={vertical ? coordinate - 3 : 10}
            transform={vertical ? `rotate(-90 9 ${coordinate - 3})` : undefined}
            fill={value === 0 ? '#a2d2ff' : '#a3a3a3'}
            fontSize="9"
            fontFamily="ui-monospace, monospace"
          >
            {label}
          </text>
        )}
      </g>
    );
  }
  return <>{ticks}</>;
}

/** Editor overlay: measured against the transformed artboard, outside the export canvas. */
export const CanvasRulers = React.memo(function CanvasRulers({
  canvasRef,
  geometryKey,
  logicalWidth,
  logicalHeight,
  leftSidebarExpanded,
}: CanvasRulersProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const guides = useStudioStore((state) => state.canvasGuides) ?? EMPTY_GUIDES;
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [draft, setDraft] = useState<CanvasGuide | null>(null);
  const dragRef = useRef<GuideDrag | null>(null);
  const captureRef = useRef<HTMLElement | null>(null);
  const refreshRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    let frame = 0;
    let settleUntil = 0;
    const measure = () => {
      const viewport = root.getBoundingClientRect();
      const artboard = canvas.getBoundingClientRect();
      if (artboard.width <= 0 || artboard.height <= 0) return;
      const next: Geometry = {
        left: artboard.left - viewport.left,
        top: artboard.top - viewport.top,
        width: artboard.width,
        height: artboard.height,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        logicalWidth: logicalWidth ?? canvas.clientWidth,
        logicalHeight: logicalHeight ?? canvas.clientHeight,
        rulerLeft:
          leftSidebarExpanded && window.matchMedia('(min-width: 768px)').matches ? 40 : RULER_SIZE,
        rulerTop:
          leftSidebarExpanded && window.matchMedia('(min-width: 768px)').matches ? 64 : RULER_SIZE,
      };
      setGeometry((previous) =>
        previous &&
        (Object.keys(next) as (keyof Geometry)[]).every(
          (key) => Math.abs(previous[key] - next[key]) < 0.05
        )
          ? previous
          : next
      );
    };
    const tick = () => {
      measure();
      frame = performance.now() < settleUntil ? requestAnimationFrame(tick) : 0;
    };
    // Follow the existing smooth zoom and sidebar/size transitions until they settle.
    const refresh = () => {
      settleUntil = performance.now() + 400;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    refreshRef.current = refresh;
    const observer = new ResizeObserver(refresh);
    observer.observe(root);
    observer.observe(canvas);
    window.addEventListener('resize', refresh);
    measure();
    refresh();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', refresh);
      refreshRef.current = () => {};
    };
  }, [canvasRef, logicalWidth, logicalHeight, leftSidebarExpanded]);

  useEffect(() => {
    refreshRef.current();
  }, [geometryKey]);

  const pointerPosition = (event: React.PointerEvent, axis: CanvasGuide['axis']) => {
    const canvas = canvasRef.current?.getBoundingClientRect();
    if (!canvas) return 0;
    return axis === 'vertical'
      ? guidePositionFromScreen(event.clientX, canvas.left, canvas.width)
      : guidePositionFromScreen(event.clientY, canvas.top, canvas.height);
  };

  const beginDrag = (
    event: React.PointerEvent,
    axis: CanvasGuide['axis'],
    existing?: CanvasGuide
  ) => {
    if (event.button !== 0 || (!existing && guides.length >= 100)) return;
    event.preventDefault();
    event.stopPropagation();
    const position = pointerPosition(event, axis);
    const guide = existing ?? { id: crypto.randomUUID(), axis, position };
    dragRef.current = {
      guide,
      pointerId: event.pointerId,
      grabOffset: existing ? existing.position - position : 0,
      isNew: !existing,
    };
    setDraft(guide);
    // A new guide crosses the ruler while its preview is being mounted. Capture
    // on the stable overlay, not the ruler/preview underneath the pointer.
    // Existing guides retain their own capture target for double-click removal.
    captureRef.current = existing ? (event.currentTarget as HTMLElement) : rootRef.current;
    if (!captureRef.current) return;
    captureRef.current.setPointerCapture(event.pointerId);
    if (existing) captureRef.current.focus({ preventScroll: true });
  };

  const moveGuide = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.stopPropagation();
    setDraft({
      ...drag.guide,
      position: pointerPosition(event, drag.guide.axis) + drag.grabOffset,
    });
  };

  const finishDrag = (event: React.PointerEvent, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.stopPropagation();
    if (!cancelled) {
      const viewport = rootRef.current!.getBoundingClientRect();
      const x = event.clientX - viewport.left;
      const y = event.clientY - viewport.top;
      const position = pointerPosition(event, drag.guide.axis) + drag.grabOffset;
      const returnedToRuler = x < RULER_SIZE || y < RULER_SIZE;
      const outside = x > viewport.width || y > viewport.height || position < 0 || position > 1;
      const latest = useStudioStore.getState().canvasGuides ?? EMPTY_GUIDES;
      const remaining = latest.filter((guide) => guide.id !== drag.guide.id);
      if (!returnedToRuler && !outside) {
        if (drag.isNew || Math.abs(position - drag.guide.position) > 1e-9) {
          useStudioStore.getState().updateState({
            canvasGuides: drag.isNew
              ? [...remaining, { ...drag.guide, position }]
              : latest.map((guide) =>
                  guide.id === drag.guide.id ? { ...guide, position } : guide
                ),
          });
        }
      } else if (!drag.isNew) {
        useStudioStore.getState().updateState({ canvasGuides: remaining });
      }
    }
    dragRef.current = null;
    setDraft(null);
    if (captureRef.current?.hasPointerCapture(event.pointerId)) {
      captureRef.current.releasePointerCapture(event.pointerId);
    }
    captureRef.current = null;
  };

  const removeGuide = (id: string) => {
    const latest = useStudioStore.getState().canvasGuides ?? EMPTY_GUIDES;
    useStudioStore
      .getState()
      .updateState({ canvasGuides: latest.filter((guide) => guide.id !== id) });
  };

  const visibleGuides = draft
    ? guides.some((guide) => guide.id === draft.id)
      ? guides.map((guide) => (guide.id === draft.id ? draft : guide))
      : [...guides, draft]
    : guides;

  return (
    <div
      ref={rootRef}
      data-canvas-rulers="true"
      className="absolute inset-0 z-10 pointer-events-none select-none"
      onPointerMove={moveGuide}
      onPointerUp={(event) => finishDrag(event)}
      onPointerCancel={(event) => finishDrag(event, true)}
      onLostPointerCapture={(event) => {
        if (event.pointerId !== dragRef.current?.pointerId || event.target !== captureRef.current) return;
        dragRef.current = null;
        captureRef.current = null;
        setDraft(null);
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {geometry && (
        <>
          {visibleGuides.map((guide) => {
            const vertical = guide.axis === 'vertical';
            const coordinate = guidePositionToScreen(
              guide.position,
              vertical ? geometry.left : geometry.top,
              vertical ? geometry.width : geometry.height
            );
            const logicalSize = vertical ? geometry.logicalWidth : geometry.logicalHeight;
            const value = Math.round(guide.position * logicalSize);
            return (
              <button
                key={guide.id}
                type="button"
                data-canvas-guide={guide.axis}
                aria-label={`${vertical ? 'Vertical' : 'Horizontal'} guide at ${value}px`}
                title={`${vertical ? 'Vertical' : 'Horizontal'} guide: ${value}px. Drag to move, double-click to remove.`}
                className={`absolute pointer-events-auto touch-none border-0 p-0 bg-transparent group/guide ${vertical ? 'cursor-col-resize' : 'cursor-row-resize'}`}
                style={
                  vertical
                    ? { left: coordinate - 4, top: RULER_SIZE, bottom: 0, width: 9 }
                    : { top: coordinate - 4, left: RULER_SIZE, right: 0, height: 9 }
                }
                onPointerDown={(event) => beginDrag(event, guide.axis, guide)}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  removeGuide(guide.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Delete' || event.key === 'Backspace') {
                    event.preventDefault();
                    event.stopPropagation();
                    removeGuide(guide.id);
                  }
                }}
              >
                <span
                  className={`absolute bg-cyan-400/70 group-hover/guide:bg-cyan-200 group-focus-visible/guide:bg-cyan-200 ${vertical ? 'inset-y-0 left-1 w-px' : 'inset-x-0 top-1 h-px'}`}
                />
              </button>
            );
          })}

          {/* Keep the expanded sidebar's collapse tab clear of the ruler hit areas. */}
          <div
            key="horizontal-ruler-gap"
            aria-hidden="true"
            className="absolute top-0 h-6 bg-neutral-900 border-b border-neutral-700 pointer-events-none"
            style={{ left: RULER_SIZE, width: geometry.rulerLeft - RULER_SIZE }}
          />
          <div
            key="vertical-ruler-gap"
            aria-hidden="true"
            className="absolute left-0 w-6 bg-neutral-900 border-r border-neutral-700 pointer-events-none"
            style={{ top: RULER_SIZE, height: geometry.rulerTop - RULER_SIZE }}
          />
          <div
            key="horizontal-ruler"
            data-ruler-axis="horizontal"
            className="absolute right-0 top-0 h-6 overflow-hidden bg-neutral-900 border-b border-neutral-700 pointer-events-auto touch-none cursor-row-resize"
            style={{ left: geometry.rulerLeft }}
            title="Drag down to create a horizontal guide"
            onPointerDown={(event) => beginDrag(event, 'horizontal')}
          >
            <svg className="absolute inset-0 h-6 w-full overflow-visible" aria-hidden="true">
              <g transform={`translate(${-geometry.rulerLeft} 0)`}>
                <RulerTicks
                  origin={geometry.left}
                  screenSize={geometry.width}
                  logicalSize={geometry.logicalWidth}
                  viewportSize={geometry.viewportWidth}
                />
              </g>
            </svg>
          </div>
          <div
            key="vertical-ruler"
            data-ruler-axis="vertical"
            className="absolute left-0 bottom-0 w-6 overflow-hidden bg-neutral-900 border-r border-neutral-700 pointer-events-auto touch-none cursor-col-resize"
            style={{ top: geometry.rulerTop }}
            title="Drag right to create a vertical guide"
            onPointerDown={(event) => beginDrag(event, 'vertical')}
          >
            <svg className="absolute inset-0 w-6 h-full overflow-visible" aria-hidden="true">
              <g transform={`translate(0 ${-geometry.rulerTop})`}>
                <RulerTicks
                  origin={geometry.top}
                  screenSize={geometry.height}
                  logicalSize={geometry.logicalHeight}
                  viewportSize={geometry.viewportHeight}
                  vertical
                />
              </g>
            </svg>
          </div>
          <div
            key="ruler-corner"
            aria-hidden="true"
            className="absolute left-0 top-0 h-6 w-6 bg-neutral-900 border-b border-r border-neutral-700"
          />
        </>
      )}
      {draft && geometry && (
        <span
          className="absolute rounded-md bg-neutral-900 border border-cyan-400/40 px-2 py-1 text-[10px] font-mono text-cyan-200 shadow-lg"
          style={{
            left:
              draft.axis === 'vertical'
                ? Math.max(
                    28,
                    Math.min(
                      geometry.viewportWidth - 85,
                      guidePositionToScreen(draft.position, geometry.left, geometry.width) + 10
                    )
                  )
                : 32,
            top:
              draft.axis === 'horizontal'
                ? Math.max(
                    28,
                    Math.min(
                      geometry.viewportHeight - 30,
                      guidePositionToScreen(draft.position, geometry.top, geometry.height) + 10
                    )
                  )
                : 32,
          }}
        >
          {Math.round(
            draft.position *
              (draft.axis === 'vertical' ? geometry.logicalWidth : geometry.logicalHeight)
          )}{' '}
          px
        </span>
      )}
    </div>
  );
});
