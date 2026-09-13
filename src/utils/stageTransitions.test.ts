import { describe, expect, it } from 'vitest';
import type { StudioState } from '../types/studio';
import {
  getStageSequenceTiming,
  getStageTransition,
  resolveStageSequenceFrame,
} from './stageTransitions';

const stage = (
  durationSec: number,
  transitionOut?: Partial<NonNullable<StudioState['transitionOut']>>
): Partial<StudioState> => ({
  durationSec,
  transitionOut: transitionOut
    ? {
        type: transitionOut.type || 'crossfade',
        durationSec: transitionOut.durationSec ?? 0.6,
        easing: transitionOut.easing || 'linear',
      }
    : undefined,
});

describe('stage transition timing', () => {
  it('subtracts transition overlaps from the combined duration', () => {
    const stages = [stage(4, { durationSec: 0.5 }), stage(5, { durationSec: 1 }), stage(3)];
    const timing = getStageSequenceTiming(stages);

    expect(timing.entries.map((entry) => entry.startSec)).toEqual([0, 3.5, 7.5]);
    expect(timing.totalDurationSec).toBe(10.5);
  });

  it('resolves both stages and their local times inside an overlap', () => {
    const stages = [stage(4, { durationSec: 1 }), stage(5)];
    const resolved = resolveStageSequenceFrame(stages, 3.5);

    expect(resolved).toMatchObject({
      outgoingIndex: 0,
      outgoingLocalTimeSec: 3.5,
      incomingIndex: 1,
      incomingLocalTimeSec: 0.5,
      transitionProgress: 0.5,
    });
  });

  it('keeps cuts at their full summed duration', () => {
    const stages = [stage(4, { type: 'none' }), stage(5)];
    expect(getStageSequenceTiming(stages).totalDurationSec).toBe(9);
  });

  it('clamps transitions so they cannot consume more than half a short stage', () => {
    const transition = getStageTransition(stage(1, { durationSec: 1.5 }), stage(0.6));
    expect(transition.durationSec).toBe(0.3);
  });
});
