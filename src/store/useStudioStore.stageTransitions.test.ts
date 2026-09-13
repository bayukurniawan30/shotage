import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('coolshapes-react', () => ({ Coolshape: () => null }));

import { getStageSnapshot, useStudioStore } from './useStudioStore';

describe('stage transition preview snapshots', () => {
  beforeEach(() => {
    useStudioStore.getState().resetAll();
  });

  it('keeps each stage shape color and the selected transition without mutating the store', () => {
    const firstShapeId = useStudioStore
      .getState()
      .addShapeLayer('custom-path', { color: '#ff006e', pathData: 'M 0 0 L 10 0 L 10 10 Z' });
    useStudioStore.getState().addStage();
    useStudioStore.getState().updateShapeLayer(firstShapeId, { color: '#8338ec' });
    useStudioStore.getState().selectStage(0);
    useStudioStore.getState().updateStageTransition(0, {
      type: 'crossfade',
      durationSec: 0.6,
      easing: 'ease-in-out',
    });

    const store = useStudioStore.getState();
    const previewStages = (store.stages || []).map((stage) => structuredClone(stage));
    previewStages[store.activeStageIndex] = getStageSnapshot(store);

    expect(previewStages[0].shapeLayers?.[0].color).toBe('#ff006e');
    expect(previewStages[1].shapeLayers?.[0].color).toBe('#8338ec');
    expect(previewStages[0].transitionOut?.type).toBe('crossfade');
    expect(useStudioStore.getState().stages?.[0].transitionOut?.type).toBe('crossfade');
  });

  it('copies mask relationships and additional animated appearance data into a stage', () => {
    const textId = useStudioStore.getState().addTextLayer();
    const maskId = useStudioStore.getState().addShapeLayer('circle');
    useStudioStore.getState().updateTextLayer(textId, {
      letterSpacing: 9,
      blur: 4,
      shadow: true,
      shadowOpacity: 55,
      shadowBlur: 16,
      shadowOffsetX: 2,
      shadowOffsetY: 7,
    });
    useStudioStore.getState().captureLayerKeyframe('text', textId, 0);
    useStudioStore.getState().setShapeMaskTarget(maskId, { type: 'text', id: textId });

    const snapshot = getStageSnapshot(useStudioStore.getState());
    expect(snapshot.shapeLayers?.find((shape) => shape.id === maskId)?.maskTarget).toEqual({
      type: 'text',
      id: textId,
    });
    expect(snapshot.textLayers?.find((layer) => layer.id === textId)).toMatchObject({
      letterSpacing: 9,
      blur: 4,
      shadowOpacity: 55,
      shadowBlur: 16,
      shadowOffsetX: 2,
      shadowOffsetY: 7,
    });
    expect(snapshot.textLayers?.find((layer) => layer.id === textId)?.keyframes?.[0]).toMatchObject({
      letterSpacing: 9,
      blur: 4,
      shadowOpacity: 55,
      shadowBlur: 16,
      shadowOffsetX: 2,
      shadowOffsetY: 7,
    });
  });
});
