import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('coolshapes-react', () => ({ Coolshape: () => null }));

import { getStageSnapshot, useStudioStore } from '../useStudioStore';

describe('stage transition preview snapshots', () => {
  it('preserves image framing per stage and clears it on restore or replacement', () => {
    const crop = { ratio: 1, zoom: 2, x: .2, y: -.4 };
    useStudioStore.getState().updateState({ imageCrop: crop, slot2ImageCrop: crop });
    expect(getStageSnapshot(useStudioStore.getState()).imageCrop).toEqual(crop);
    useStudioStore.getState().addStage();
    useStudioStore.getState().updateState({ imageCrop: { ...crop, zoom: 3 } });
    useStudioStore.getState().selectStage(0);
    expect(useStudioStore.getState().imageCrop).toEqual(crop);
    useStudioStore.getState().setImage('new.png', 'New', 800, 600);
    expect(useStudioStore.getState().imageCrop).toBeNull();
    useStudioStore.getState().resetAll();
    expect(useStudioStore.getState().slot2ImageCrop).toBeNull();
  });
  it('preserves independent image effects per stage and clears them on reset', () => {
    const effect = { preset: 'sepia' as const, intensity: 70 };
    useStudioStore.getState().updateState({ imageEffect: effect, slot2ImageEffect: { preset: 'vivid', intensity: 40 } });
    const id = useStudioStore.getState().addShapeLayer('rectangle', { bgImage: 'https://example.com/photo.png', imageEffect: effect });
    useStudioStore.getState().addStage();
    useStudioStore.getState().updateState({ imageEffect: { preset: 'noir', intensity: 100 } });
    useStudioStore.getState().updateShapeLayer(id, { imageEffect: { preset: 'cool', intensity: 30 } });
    useStudioStore.getState().selectStage(0);
    expect(useStudioStore.getState().imageEffect).toEqual(effect);
    expect(getStageSnapshot(useStudioStore.getState()).shapeLayers?.[0].imageEffect).toEqual(effect);
    expect(useStudioStore.getState().slot2ImageEffect).toEqual({ preset: 'vivid', intensity: 40 });
    useStudioStore.getState().resetAll();
    expect(useStudioStore.getState().imageEffect?.preset).toBe('original');
    expect(useStudioStore.getState().slot2ImageEffect?.preset).toBe('original');
  });
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

  it('preserves an open pen path and its stroke through stage snapshots', () => {
    const lineId = useStudioStore.getState().addShapeLayer('custom-path', {
      pathData: 'M -40 0 C -10 -20, 10 20, 40 0',
      pathClosed: false,
      strokeWidth: 12,
      color: '#ffafcc',
      name: 'Vector Line',
    });
    useStudioStore.getState().addStage();
    useStudioStore.getState().selectStage(0);

    const line = getStageSnapshot(useStudioStore.getState()).shapeLayers?.find(
      (shape) => shape.id === lineId
    );
    expect(line).toMatchObject({
      pathClosed: false,
      strokeWidth: 12,
      color: '#ffafcc',
    });
  });

  it('keeps guides stage-specific, including switching to an older stage without guides', () => {
    const guide = { id: 'guide-a', axis: 'vertical' as const, position: 0.25 };
    useStudioStore.getState().updateState({ canvasGuides: [guide] });
    const snapshot = getStageSnapshot(useStudioStore.getState());
    expect(snapshot.canvasGuides).toEqual([guide]);
    expect(snapshot.canvasGuides).not.toBe(useStudioStore.getState().canvasGuides);

    useStudioStore.getState().addStage();
    useStudioStore.getState().updateState({ canvasGuides: [] });
    useStudioStore.getState().selectStage(0);
    expect(useStudioStore.getState().canvasGuides).toEqual([guide]);
    useStudioStore.getState().selectStage(1);
    expect(useStudioStore.getState().canvasGuides).toEqual([]);

    useStudioStore.setState({ stages: [snapshot, {}], activeStageIndex: 0, canvasGuides: [guide] });
    useStudioStore.getState().selectStage(1);
    expect(useStudioStore.getState().canvasGuides).toEqual([]);
  });
});
