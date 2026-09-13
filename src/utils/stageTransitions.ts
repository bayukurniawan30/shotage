import type { CSSProperties } from 'react';
import type { StudioState, StageTransition, StageTransitionType } from '../types/studio';
import { calculateEasing } from '../types/animationTypes';

export const DEFAULT_STAGE_TRANSITION: StageTransition = {
  type: 'none',
  durationSec: 0.6,
  easing: 'ease-in-out',
};

export const STAGE_TRANSITION_OPTIONS: Array<{
  type: StageTransitionType;
  label: string;
  shortLabel: string;
}> = [
  { type: 'none', label: 'Cut', shortLabel: 'Cut' },
  { type: 'crossfade', label: 'Crossfade', shortLabel: 'Fade' },
  { type: 'slide-left', label: 'Slide Left', shortLabel: 'Slide L' },
  { type: 'slide-right', label: 'Slide Right', shortLabel: 'Slide R' },
  { type: 'zoom-fade', label: 'Zoom Fade', shortLabel: 'Zoom' },
];

export interface StageSequenceEntry {
  index: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  overlapOutSec: number;
}

export interface ResolvedStageSequenceFrame {
  outgoingIndex: number;
  outgoingLocalTimeSec: number;
  incomingIndex: number | null;
  incomingLocalTimeSec: number | null;
  transition: StageTransition | null;
  transitionProgress: number;
}

export interface StageTransitionLayerTransform {
  opacity: number;
  translateXPercent: number;
  scale: number;
}

export function getStageDuration(stage: Partial<StudioState> | undefined) {
  return Math.max(0.1, Number(stage?.durationSec) || 10);
}

export function getStageTransition(
  stage: Partial<StudioState> | undefined,
  nextStage: Partial<StudioState> | undefined
): StageTransition {
  const configured = stage?.transitionOut || DEFAULT_STAGE_TRANSITION;
  if (!nextStage || configured.type === 'none') {
    return { ...configured, type: 'none' };
  }

  const maximumOverlap = Math.max(
    0,
    Math.min(getStageDuration(stage) / 2, getStageDuration(nextStage) / 2, 1.5)
  );

  return {
    type: configured.type,
    durationSec: Math.min(maximumOverlap, Math.max(0.1, configured.durationSec || 0.6)),
    easing: configured.easing || 'ease-in-out',
  };
}

export function getStageSequenceTiming(stages: Partial<StudioState>[]) {
  const entries: StageSequenceEntry[] = [];
  let startSec = 0;

  stages.forEach((stage, index) => {
    const durationSec = getStageDuration(stage);
    const transition = getStageTransition(stage, stages[index + 1]);
    const overlapOutSec = transition.type === 'none' ? 0 : transition.durationSec;
    entries.push({
      index,
      startSec,
      endSec: startSec + durationSec,
      durationSec,
      overlapOutSec,
    });
    startSec += durationSec - overlapOutSec;
  });

  return {
    entries,
    totalDurationSec: entries.length > 0 ? entries[entries.length - 1].endSec : 0,
  };
}

export function resolveStageSequenceFrame(
  stages: Partial<StudioState>[],
  requestedTimeSec: number
): ResolvedStageSequenceFrame | null {
  if (stages.length === 0) return null;

  const timing = getStageSequenceTiming(stages);
  const timeSec = Math.max(0, Math.min(requestedTimeSec, timing.totalDurationSec));
  let activeIndex = 0;
  for (let index = 1; index < timing.entries.length; index++) {
    if (timeSec >= timing.entries[index].startSec) activeIndex = index;
    else break;
  }

  if (activeIndex > 0) {
    const incomingEntry = timing.entries[activeIndex];
    const outgoingEntry = timing.entries[activeIndex - 1];
    const transition = getStageTransition(stages[activeIndex - 1], stages[activeIndex]);
    const overlapEndSec = incomingEntry.startSec + transition.durationSec;

    if (transition.type !== 'none' && timeSec < overlapEndSec) {
      const rawProgress = Math.max(
        0,
        Math.min(1, (timeSec - incomingEntry.startSec) / transition.durationSec)
      );
      return {
        outgoingIndex: activeIndex - 1,
        outgoingLocalTimeSec: Math.min(outgoingEntry.durationSec, timeSec - outgoingEntry.startSec),
        incomingIndex: activeIndex,
        incomingLocalTimeSec: Math.max(0, timeSec - incomingEntry.startSec),
        transition,
        transitionProgress: calculateEasing(rawProgress, transition.easing),
      };
    }
  }

  const entry = timing.entries[activeIndex];
  return {
    outgoingIndex: activeIndex,
    outgoingLocalTimeSec: Math.max(0, Math.min(entry.durationSec, timeSec - entry.startSec)),
    incomingIndex: null,
    incomingLocalTimeSec: null,
    transition: null,
    transitionProgress: 0,
  };
}

export function getStageTransitionStyles(
  type: StageTransitionType,
  progress: number
): { outgoing: CSSProperties; incoming: CSSProperties } {
  const transforms = getStageTransitionLayerTransforms(type, progress);
  const base: CSSProperties = {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    willChange: 'transform, opacity',
  };

  const toStyle = (transform: StageTransitionLayerTransform): CSSProperties => ({
    ...base,
    opacity: transform.opacity,
    transform: `translateX(${transform.translateXPercent}%) scale(${transform.scale})`,
  });

  return {
    outgoing: toStyle(transforms.outgoing),
    incoming: toStyle(transforms.incoming),
  };
}

export function getStageTransitionLayerTransforms(
  type: StageTransitionType,
  progress: number
): {
  outgoing: StageTransitionLayerTransform;
  incoming: StageTransitionLayerTransform;
} {
  const p = Math.max(0, Math.min(1, progress));
  const still = { opacity: 1, translateXPercent: 0, scale: 1 };

  switch (type) {
    case 'crossfade':
      return {
        outgoing: { ...still, opacity: 1 - p },
        incoming: { ...still, opacity: p },
      };
    case 'slide-left':
      return {
        outgoing: { ...still, translateXPercent: -100 * p },
        incoming: { ...still, translateXPercent: 100 * (1 - p) },
      };
    case 'slide-right':
      return {
        outgoing: { ...still, translateXPercent: 100 * p },
        incoming: { ...still, translateXPercent: -100 * (1 - p) },
      };
    case 'zoom-fade':
      return {
        outgoing: { ...still, opacity: 1 - p, scale: 1 + p * 0.04 },
        incoming: { ...still, opacity: p, scale: 0.96 + p * 0.04 },
      };
    case 'none':
    default:
      return {
        outgoing: { ...still, opacity: p < 1 ? 1 : 0 },
        incoming: { ...still, opacity: p < 1 ? 0 : 1 },
      };
  }
}
