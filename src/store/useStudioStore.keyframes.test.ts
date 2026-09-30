import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('coolshapes-react', () => ({ Coolshape: () => null }));

import { useStudioStore } from './useStudioStore';
import { evaluateLayerKeyframes } from '../types/animationTypes';

describe('capturing evaluated layer keyframes', () => {
  beforeEach(() => useStudioStore.getState().resetAll());

  function setup() {
    const id = useStudioStore.getState().addShapeLayer('rectangle', { x: 30, y: 30 });
    useStudioStore.getState().updateState({ durationSec: 10, animationEasing: 'linear' });
    useStudioStore.getState().captureLayerKeyframe('shape', id, 0);
    useStudioStore.getState().captureLayerKeyframe('shape', id, 3);
    useStudioStore.getState().updateState({ currentTimeSec: 0 });
    useStudioStore.getState().updateShapeLayer(id, { x: 0, y: 0 });
    return id;
  }

  function layer(id: string) {
    return useStudioStore.getState().shapeLayers.find((shape) => shape.id === id)!;
  }

  it.each(['captureLayerKeyframe', 'addLayerKeyframe'] as const)(
    '%s holds the last position when adding a later keyframe',
    (action) => {
      const id = setup();
      useStudioStore.getState()[action]('shape', id, 5);
      expect(layer(id).keyframes?.map(({ timeSec, x, y }) => ({ timeSec, x, y }))).toEqual([
        { timeSec: 0, x: 0, y: 0 },
        { timeSec: 3, x: 30, y: 30 },
        { timeSec: 5, x: 30, y: 30 },
      ]);
      expect(layer(id)).toMatchObject({ x: 0, y: 0 });
    }
  );

  it('samples interpolation at the requested time, not the playhead or base position', () => {
    const id = setup();
    useStudioStore.getState().captureLayerKeyframe('shape', id, 1.5);
    expect(layer(id).keyframes?.find((keyframe) => keyframe.timeSec === 1.5)).toMatchObject({
      x: 15, y: 15,
    });
  });

  it.each(['captureLayerKeyframe', 'addLayerKeyframe'] as const)(
    '%s keeps the third position when adding fourth and subsequent keyframes',
    (action) => {
      const id = setup();
      useStudioStore.getState()[action]('shape', id, 5);
      useStudioStore.getState()[action]('shape', id, 7);
      useStudioStore.getState()[action]('shape', id, 9);
      expect(layer(id).keyframes?.slice(2).map(({ x, y }) => ({ x, y }))).toEqual([
        { x: 30, y: 30 }, { x: 30, y: 30 }, { x: 30, y: 30 },
      ]);
    }
  );

  it('uses an edited third keyframe when capturing a fourth', () => {
    const id = setup();
    useStudioStore.getState().captureLayerKeyframe('shape', id, 5);
    useStudioStore.getState().updateState({ currentTimeSec: 5 });
    useStudioStore.getState().updateShapeLayer(id, { x: 60, y: 70 });
    useStudioStore.getState().captureLayerKeyframe('shape', id, 7);
    expect(layer(id).keyframes?.at(-1)).toMatchObject({ timeSec: 7, x: 60, y: 70 });
  });

  it('lets explicit properties override sampled values without resetting other properties', () => {
    const id = setup();
    useStudioStore.getState().addLayerKeyframe('shape', id, 5, { x: 80, opacity: 40 });
    expect(layer(id).keyframes?.at(-1)).toMatchObject({ x: 80, y: 30, opacity: 40 });
  });

  it('retains the evaluated position when editing another property creates a keyframe', () => {
    const id = setup();
    useStudioStore.getState().updateState({ currentTimeSec: 5 });
    useStudioStore.getState().updateShapeLayer(id, { opacity: 40 });
    expect(layer(id).keyframes?.at(-1)).toMatchObject({ timeSec: 5, x: 30, y: 30, opacity: 40 });
  });

  it('preserves an existing keyframe ID and easing when recapturing it', () => {
    const id = setup();
    const last = layer(id).keyframes!.at(-1)!;
    useStudioStore.getState().updateLayerKeyframe('shape', id, last.id, { easing: 'ease-in' });
    useStudioStore.getState().captureLayerKeyframe('shape', id, 3);
    expect(layer(id).keyframes).toHaveLength(2);
    expect(layer(id).keyframes?.at(-1)).toMatchObject({ id: last.id, easing: 'ease-in', x: 30 });
  });

  it('does not bake automatic path orientation into the captured rotation', () => {
    const id = setup();
    useStudioStore.setState({
      shapeLayers: [{
        ...layer(id),
        rotation: 10,
        keyframes: layer(id).keyframes?.map((keyframe) => ({ ...keyframe, rotation: 10 })),
        motionPath: { type: 'linear', curvature: 0.25, autoOrient: true },
      }],
    });
    const before = evaluateLayerKeyframes(layer(id), 1.5, 'linear');
    useStudioStore.getState().captureLayerKeyframe('shape', id, 1.5);
    expect(layer(id).keyframes?.find((keyframe) => keyframe.timeSec === 1.5)?.rotation).toBe(10);
    expect(evaluateLayerKeyframes(layer(id), 1.5, 'linear').rotation).toBeCloseTo(before.rotation!);
  });

  it('uses base values when capturing the first keyframe', () => {
    const id = useStudioStore.getState().addTextLayer({ x: 30, y: 30, opacity: 75 });
    useStudioStore.getState().captureLayerKeyframe('text', id, 0);
    expect(useStudioStore.getState().textLayers.find((text) => text.id === id)?.keyframes?.[0])
      .toMatchObject({ x: 30, y: 30, opacity: 75 });
  });
});
