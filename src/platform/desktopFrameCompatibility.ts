import type { FrameType, StudioState } from '../types/studio';

// These frames project their screenshot with CSS 3D transforms. WKWebView's
// export capture does not currently match the Studio canvas for them.
export const DESKTOP_UNSUPPORTED_FRAMES: Partial<Record<FrameType, string>> = {
  iphone16: 'iPhone 16',
  'iphone16-floating': 'iPhone 16 Floating',
};

type Stage = Partial<StudioState>;

type TransformValues = {
  pitch?: number;
  yaw?: number;
  rotateX?: number;
  rotateY?: number;
  skewX?: number;
  skewY?: number;
  perspective?: number;
  slot2RotateX?: number;
  slot2RotateY?: number;
  slot2SkewX?: number;
  slot2SkewY?: number;
  slot2Perspective?: number;
};

function hasTransform(
  values: TransformValues,
  includePerspective = false,
  includeSecondSlot = false
): boolean {
  return Boolean(
    values.pitch || values.yaw || values.rotateX || values.rotateY ||
    values.skewX || values.skewY ||
    (includeSecondSlot && (
      values.slot2RotateX || values.slot2RotateY || values.slot2SkewX || values.slot2SkewY
    )) ||
    (includePerspective && (
      (values.perspective !== undefined && values.perspective !== 1000) ||
      (includeSecondSlot && values.slot2Perspective !== undefined && values.slot2Perspective !== 1000)
    ))
  );
}

function getUnsupportedTransform(stage: Stage): string | null {
  if (hasTransform(stage, true, stage.layoutCount === 2)) {
    return 'mockup Pitch, Yaw, Skew, or Perspective Depth';
  }
  if (stage.keyframes?.some((keyframe) => hasTransform(keyframe))) {
    return 'a mockup animation keyframe with Pitch or Yaw';
  }

  const layerCollections = [
    stage.textLayers,
    stage.shapeLayers,
    stage.canvasElements,
    stage.phosphorIconLayers,
    stage.layerGroups,
  ];
  for (const layers of layerCollections) {
    for (const layer of layers ?? []) {
      if (hasTransform(layer as TransformValues) || layer.keyframes?.some((keyframe) => hasTransform(keyframe))) {
        return `Pitch, Yaw, or Skew on ${layer.name || 'a layer'}`;
      }
      if (layer.motions?.some((motion) => motion.preset === 'flip-in')) {
        return `3D Flip In on ${layer.name || 'a layer'}`;
      }
    }
  }
  return null;
}

export function getDesktopFrameExportIssue(
  state: Pick<StudioState, 'frameType' | 'stages' | 'activeStageIndex'>,
  scope: 'current' | 'all'
): string | null {
  const stageCount = state.stages?.length ?? 0;
  const indices = scope === 'all' && stageCount > 1
    ? Array.from({ length: stageCount }, (_, index) => index)
    : [state.activeStageIndex];

  for (const index of indices) {
    const stage = index === state.activeStageIndex ? state : state.stages?.[index];
    const frameType = stage?.frameType;
    const label = frameType && DESKTOP_UNSUPPORTED_FRAMES[frameType];
    const stageLabel = scope === 'all' && stageCount > 1 ? ` in Stage ${index + 1}` : '';
    if (label) {
      return `${label}${stageLabel} cannot be exported accurately in the desktop app yet. Choose another frame or export this design in the web app.`;
    }
    const transform = stage && getUnsupportedTransform(stage);
    if (transform) {
      return `This design uses ${transform}${stageLabel}, which desktop export cannot match yet. Reset those values or export in the web app.`;
    }
  }

  return null;
}
