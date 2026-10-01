import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getStageSnapshot, useStudioStore } from '../store/useStudioStore';
import type { StudioState } from '../types/studio';
import { evaluateLayerKeyframes } from '../types/animationTypes';
import { CanvasStage } from './CanvasStage';

export interface StageOverviewHandle {
  fit: () => void;
  center: () => void;
}

interface StageOverviewProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const GAP = 48;
const LABEL_HEIGHT = 36;

function freezeStage(stage: Partial<StudioState>): Partial<StudioState> {
  const time = stage.durationSec ?? 5;
  const freeze = <T extends Parameters<typeof evaluateLayerKeyframes>[0]>(layer: T) => ({
    ...layer,
    ...evaluateLayerKeyframes(layer, time, stage.animationEasing),
    keyframes: [],
    motions: [],
    loopAnimation: 'none' as const,
  });
  return {
    ...stage,
    textLayers: stage.textLayers?.map(freeze),
    shapeLayers: stage.shapeLayers?.map(freeze),
    canvasElements: stage.canvasElements?.map(freeze),
    phosphorIconLayers: stage.phosphorIconLayers?.map(freeze),
    layerGroups: stage.layerGroups?.map(freeze),
    currentTimeSec: time,
    exportTimeSec: null,
    isAnimationMode: true,
    isExporting: false,
    motionBlurEnabled: false,
    previewCanvasZoom: 100,
  };
}

const StageCard = React.memo(function StageCard({
  stage,
  index,
  size,
  onSize,
}: {
  stage: Partial<StudioState>;
  index: number;
  size: { width: number; height: number };
  onSize: (index: number, width: number, height: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => onSize(index, canvas.offsetWidth, canvas.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [index, onSize]);
  return (
    <div
      inert
      className="relative pointer-events-none"
      style={{ width: size.width, height: size.height }}
    >
      <CanvasStage
        canvasRef={canvasRef}
        canvasId={`stage-overview-${index}`}
        stateOverride={stage}
        readOnly
        overview
      />
    </div>
  );
});

export const StageOverview = forwardRef<StageOverviewHandle, StageOverviewProps>(
  function StageOverview({ zoom, onZoomChange }, ref) {
    // Capture once on entry, including unsaved edits to the active stage.
    const [stages] = useState(() => {
      const state = useStudioStore.getState();
      const current = getStageSnapshot(state);
      const snapshots = state.stages?.length ? [...state.stages] : [current];
      snapshots[state.activeStageIndex || 0] = current;
      return snapshots.map((snapshot) =>
        freezeStage({ ...current, ...snapshot, hideMockup: state.hideMockup })
      );
    });
    const viewportRef = useRef<HTMLDivElement>(null);
    const [sizes, setSizes] = useState(() => stages.map(() => ({ width: 832, height: 468 })));
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const drag = useRef<{ id: number; x: number; y: number; panX: number; panY: number } | null>(
      null
    );
    const geometry = useMemo(
      () => ({
        width: sizes.reduce((sum, size) => sum + size.width, 0) + GAP * (sizes.length - 1),
        height: Math.max(...sizes.map((size) => size.height)) + LABEL_HEIGHT,
      }),
      [sizes]
    );
    const onSize = React.useCallback((index: number, width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      setSizes((current) =>
        current[index].width === width && current[index].height === height
          ? current
          : current.map((size, n) => (n === index ? { width, height } : size))
      );
    }, []);
    const fit = React.useCallback(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      onZoomChange(
        Math.max(
          2,
          Math.min(
            200,
            Math.floor(
              Math.min(
                (viewport.clientWidth - 64) / geometry.width,
                (viewport.clientHeight - 150) / geometry.height
              ) * 100
            )
          )
        )
      );
      setPan({ x: 0, y: 0 });
    }, [geometry, onZoomChange]);
    useImperativeHandle(ref, () => ({ fit, center: () => setPan({ x: 0, y: 0 }) }), [fit]);
    useLayoutEffect(() => {
      fit();
      const viewport = viewportRef.current;
      if (!viewport) return;
      const observer = new ResizeObserver(fit);
      observer.observe(viewport);
      return () => observer.disconnect();
    }, [fit]);
    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const wheel = (event: WheelEvent) => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey)
          onZoomChange(Math.max(2, Math.min(200, zoom - event.deltaY * 0.15)));
        else setPan((value) => ({ x: value.x - event.deltaX, y: value.y - event.deltaY }));
      };
      viewport.addEventListener('wheel', wheel, { passive: false });
      return () => viewport.removeEventListener('wheel', wheel);
    }, [zoom, onZoomChange]);
    function focus(index: number) {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const size = sizes[index];
      const scale = Math.max(
        0.02,
        Math.min(
          2,
          (viewport.clientWidth - 64) / size.width,
          (viewport.clientHeight - 150) / (size.height + LABEL_HEIGHT)
        )
      );
      const centerX =
        sizes.slice(0, index).reduce((sum, size) => sum + size.width + GAP, 0) + size.width / 2;
      onZoomChange(scale * 100);
      setPan({ x: (geometry.width / 2 - centerX) * scale, y: 0 });
    }
    return (
      <div
        ref={viewportRef}
        className={`absolute inset-0 overflow-hidden touch-none select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        aria-label="Read-only stage overview"
        onPointerDown={(event) => {
          if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            panX: pan.x,
            panY: pan.y,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (!drag.current || drag.current.id !== event.pointerId) return;
          setPan({
            x: drag.current.panX + event.clientX - drag.current.x,
            y: drag.current.panY + event.clientY - drag.current.y,
          });
        }}
        onPointerUp={() => {
          drag.current = null;
          setDragging(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
      >
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-neutral-400 pointer-events-none whitespace-nowrap">
          {stages.length} {stages.length === 1 ? 'stage' : 'stages'} · Drag to pan · Click a stage
          label to focus
        </div>
        <div
          className="absolute flex items-center"
          style={{
            width: geometry.width,
            height: geometry.height,
            gap: GAP,
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom / 100})`,
            transformOrigin: 'center',
            willChange: 'transform',
          }}
        >
          {stages.map((stage, index) => (
            <div key={index} className="shrink-0">
              <button
                type="button"
                onClick={() => focus(index)}
                className="block text-left text-sm font-medium text-neutral-400 hover:text-white cursor-pointer"
                style={{ height: LABEL_HEIGHT, fontSize: 14 / (zoom / 100), lineHeight: 1 }}
                aria-label={`Focus Stage ${index + 1}`}
              >
                Stage {index + 1}
              </button>
              <StageCard stage={stage} index={index} size={sizes[index]} onSize={onSize} />
            </div>
          ))}
        </div>
      </div>
    );
  }
);
