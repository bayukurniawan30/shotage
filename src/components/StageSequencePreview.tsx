import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PauseSquare, Play, XClose } from '@untitledui/icons';
import { useStudioStore } from '../store/useStudioStore';
import type { StudioState } from '../types/studio';
import { CanvasStage } from './CanvasStage';
import {
  getStageSequenceTiming,
  getStageTransitionStyles,
  resolveStageSequenceFrame,
} from '../utils/stageTransitions';

interface StageSequencePreviewProps {
  stages: Partial<StudioState>[];
  boundaryIndex?: number;
  onClose: () => void;
}

export const StageSequencePreview: React.FC<StageSequencePreviewProps> = ({
  stages,
  boundaryIndex,
  onClose,
}) => {
  const liveState = useStudioStore();
  const outgoingCanvasRef = useRef<HTMLDivElement>(null);
  const incomingCanvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const timing = useMemo(() => getStageSequenceTiming(stages), [stages]);
  const range = useMemo(() => {
    if (boundaryIndex === undefined) {
      return { startSec: 0, endSec: timing.totalDurationSec };
    }
    const incoming = timing.entries[boundaryIndex + 1];
    if (!incoming) return { startSec: 0, endSec: timing.totalDurationSec };
    return {
      startSec: Math.max(0, incoming.startSec - 0.75),
      endSec: Math.min(timing.totalDurationSec, incoming.startSec + 1.35),
    };
  }, [boundaryIndex, timing]);
  const [timeSec, setTimeSec] = useState(range.startSec);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    setTimeSec(range.startSec);
    setIsPlaying(true);
  }, [range.startSec, range.endSec]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = null;
      return;
    }

    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const previous = lastTimeRef.current ?? now;
      lastTimeRef.current = now;
      setTimeSec((current) => {
        const next = current + (now - previous) / 1000;
        if (next >= range.endSec) {
          if (boundaryIndex !== undefined) return range.startSec;
          setIsPlaying(false);
          return range.endSec;
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [boundaryIndex, isPlaying, range.endSec, range.startSec]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.code === 'Space') {
        event.preventDefault();
        setIsPlaying((playing) => !playing);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const frame = resolveStageSequenceFrame(stages, timeSec);
  if (!frame) return null;

  const transitionStyles = getStageTransitionStyles(
    frame.transition?.type || 'none',
    frame.transitionProgress
  );
  const createOverride = (index: number, localTimeSec: number): Partial<StudioState> => ({
    ...stages[index],
    currentTimeSec: localTimeSec,
    exportTimeSec: timeSec,
    isAnimationMode: true,
    isExporting: false,
    previewCanvasZoom: liveState.previewCanvasZoom,
  });
  return (
    <div className="fixed inset-0 z-[90] bg-neutral-950/95 backdrop-blur-xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ ...transitionStyles.outgoing, zIndex: 10 }}>
          <CanvasStage
            canvasRef={outgoingCanvasRef}
            stateOverride={createOverride(frame.outgoingIndex, frame.outgoingLocalTimeSec)}
            readOnly
            canvasId="shotage-sequence-preview-outgoing"
          />
        </div>
        {frame.incomingIndex !== null && frame.incomingLocalTimeSec !== null && (
          <div style={{ ...transitionStyles.incoming, zIndex: 20 }}>
            <CanvasStage
              canvasRef={incomingCanvasRef}
              stateOverride={createOverride(frame.incomingIndex, frame.incomingLocalTimeSec)}
              readOnly
              canvasId="shotage-sequence-preview-incoming"
            />
          </div>
        )}
      </div>

      <div className="absolute left-1/2 bottom-5 z-40 w-[min(92vw,580px)] -translate-x-1/2 rounded-2xl border border-neutral-700 bg-neutral-900/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-white">
              {boundaryIndex === undefined
                ? 'Preview All Stages'
                : `Stage ${boundaryIndex + 1} → ${boundaryIndex + 2}`}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {timeSec.toFixed(2)}s / {timing.totalDurationSec.toFixed(2)}s combined
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!isPlaying && timeSec >= range.endSec) setTimeSec(range.startSec);
                setIsPlaying((playing) => !playing);
              }}
              className="rounded-lg border border-pastel-pink/40 bg-pastel-pink/15 p-2 text-pastel-pink hover:bg-pastel-pink/25"
              title={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isPlaying ? <PauseSquare className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-slate-300 hover:text-white"
              title="Close preview"
            >
              <XClose className="h-4 w-4" />
            </button>
          </div>
        </div>
        <input
          type="range"
          min={range.startSec}
          max={range.endSec}
          step={0.01}
          value={timeSec}
          onChange={(event) => {
            setIsPlaying(false);
            setTimeSec(Number(event.target.value));
          }}
          className="w-full accent-pastel-pink"
          aria-label="Sequence preview time"
        />
      </div>
    </div>
  );
};
