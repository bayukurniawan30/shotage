import { create } from 'zustand';
import { temporal } from 'zundo';
import { StudioState, DEFAULT_STUDIO_STATE } from '../types/studio';
import {
  calculateEasing,
  LayerMotionBlock,
  LayerKeyframe,
  MotionPresetId,
  MOTION_PRESETS,
} from '../types/animationTypes';
import { GOOGLE_FONTS } from '../components/right-sidebar/shared';
import {
  mergeShapeLayers,
  booleanOperationOnShapes,
  BooleanOperation,
} from '../utils/shapeBoolean';

interface StudioStore extends StudioState {
  isPreviewMode: boolean;
  updateState: (updates: Partial<StudioState>) => void;
  setImage: (
    src: string,
    name: string,
    width?: number | null,
    height?: number | null,
    mediaType?: 'image' | 'video',
    duration?: number
  ) => void;
  setSecondImage: (
    src: string,
    name: string,
    width?: number | null,
    height?: number | null,
    mediaType?: 'image' | 'video',
    duration?: number
  ) => void;
  reset3DPerspective: () => void;
  resetAll: () => void;
  togglePreviewMode: () => void;
  addTextLayer: (initialTextOrProps?: string | Partial<import('../types/studio').TextLayer>) => string;
  addSocialLayer: (platform?: import('../types/studio').SocialPlatform, handle?: string) => void;
  updateTextLayer: (id: string, updates: Partial<import('../types/studio').TextLayer>) => void;
  removeTextLayer: (id: string) => void;
  duplicateTextLayer: (id: string) => void;
  explodeTextLayer: (id: string) => void;
  selectTextLayer: (id: string | null) => void;
  toggleTextLayer: (id: string) => void;
  clearSelectedTextLayers: () => void;
  addPhosphorIconLayer: (
    iconId?: string,
    customProps?: Partial<import('../types/studio').PhosphorIconLayer>
  ) => void;
  updatePhosphorIconLayer: (
    id: string,
    updates: Partial<import('../types/studio').PhosphorIconLayer>
  ) => void;
  removePhosphorIconLayer: (id: string) => void;
  duplicatePhosphorIconLayer: (id: string) => void;
  selectPhosphorIconLayer: (id: string | null) => void;
  togglePhosphorIconLayer: (id: string) => void;
  toggleSelectPhosphorIconLayer: (id: string) => void;
  addCanvasElement: (
    elementId?: string,
    src?: string,
    category?: import('../types/studio').ElementCategory,
    customProps?: Partial<import('../types/studio').CanvasElement>
  ) => void;
  updateCanvasElement: (
    id: string,
    updates: Partial<import('../types/studio').CanvasElement>
  ) => void;
  removeCanvasElement: (id: string) => void;
  duplicateCanvasElement: (id: string) => void;
  selectCanvasElement: (id: string | null) => void;
  toggleSelectCanvasElement: (id: string) => void;
  addShapeLayer: (
    shapeType?: import('../types/studio').ShapeType,
    customProps?: Partial<import('../types/studio').ShapeLayer>
  ) => string;
  updateShapeLayer: (id: string, updates: Partial<import('../types/studio').ShapeLayer>) => void;
  removeShapeLayer: (id: string) => void;
  duplicateShapeLayer: (id: string) => void;
  selectShapeLayer: (id: string | null) => void;
  toggleSelectShapeLayer: (id: string) => void;
  mergeSelectedShapes: (operation?: BooleanOperation) => boolean;
  booleanOperationOnShapes: (operation?: BooleanOperation) => boolean;
  setPenDrawingMode: (active: boolean) => void;
  reorderLayers: (
    newOrder: { type: 'text' | 'phosphor' | 'element' | 'shape'; id: string }[]
  ) => void;
  alignCanvasElements: (align: 'left' | 'center' | 'right', canvasWidth: number) => void;
  selectStage: (index: number) => void;
  addStage: () => void;
  removeStage: (index: number) => void;
  addLayerMotionBlock: (
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    presetId: MotionPresetId,
    startTimeSec?: number,
    durationSec?: number
  ) => void;
  updateLayerMotionBlock: (
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    blockId: string,
    updates: Partial<LayerMotionBlock>
  ) => void;
  removeLayerMotionBlock: (
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    blockId: string
  ) => void;
  addLayerKeyframe: (
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    timeSec?: number,
    props?: Partial<LayerKeyframe>
  ) => void;
  updateLayerKeyframe: (
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    keyframeId: string,
    updates: Partial<LayerKeyframe>
  ) => void;
  removeLayerKeyframe: (
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    keyframeId: string
  ) => void;
  captureLayerKeyframe: (
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    timeSec?: number
  ) => void;
}

function syncKeyframesOnLayerUpdate<T extends { keyframes?: LayerKeyframe[]; [k: string]: any }>(
  layer: T,
  updates: Partial<T>,
  currentTimeSec: number
): T {
  const updated = { ...layer, ...updates };
  if (updated.keyframes && updated.keyframes.length > 0) {
    const t = currentTimeSec !== undefined ? Math.round(currentTimeSec * 100) / 100 : 0;
    const kfs: LayerKeyframe[] = [...updated.keyframes];
    const kfIdx = kfs.findIndex((k) => Math.abs(k.timeSec - t) < 0.15);

    if (kfIdx !== -1) {
      const targetKf = kfs[kfIdx];
      const newKf = { ...targetKf };
      if (updates.width !== undefined) newKf.width = updates.width as number;
      if (updates.height !== undefined) newKf.height = updates.height as number;
      if (updates.x !== undefined) newKf.x = updates.x as number;
      if (updates.y !== undefined) newKf.y = updates.y as number;
      if (updates.rotation !== undefined) newKf.rotation = updates.rotation as number;
      if (updates.pitch !== undefined) newKf.pitch = updates.pitch as number;
      if (updates.yaw !== undefined) newKf.yaw = updates.yaw as number;
      if (updates.opacity !== undefined) newKf.opacity = updates.opacity as number;
      if (updates.borderRadius !== undefined) newKf.borderRadius = updates.borderRadius as number;
      if (updates.fontSize !== undefined) newKf.fontSize = updates.fontSize as number;
      if (updates.scale !== undefined) newKf.scale = updates.scale as number;
      if (updates.scaleX !== undefined) newKf.scaleX = updates.scaleX as number;
      if (updates.scaleY !== undefined) newKf.scaleY = updates.scaleY as number;
      kfs[kfIdx] = newKf;
      updated.keyframes = kfs as any;
    } else {
      // Auto-create a keyframe at playhead position t
      const newKf: LayerKeyframe = {
        id: `kf-layer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timeSec: t,
        x: updates.x !== undefined ? (updates.x as number) : updated.x,
        y: updates.y !== undefined ? (updates.y as number) : updated.y,
        width: updates.width !== undefined ? (updates.width as number) : updated.width,
        height: updates.height !== undefined ? (updates.height as number) : updated.height,
        scale: updates.scale !== undefined ? (updates.scale as number) : updated.scale,
        scaleX: updates.scaleX !== undefined ? (updates.scaleX as number) : updated.scaleX,
        scaleY: updates.scaleY !== undefined ? (updates.scaleY as number) : updated.scaleY,
        rotation: updates.rotation !== undefined ? (updates.rotation as number) : updated.rotation,
        pitch: updates.pitch !== undefined ? (updates.pitch as number) : updated.pitch,
        yaw: updates.yaw !== undefined ? (updates.yaw as number) : updated.yaw,
        opacity: updates.opacity !== undefined ? (updates.opacity as number) : updated.opacity,
        borderRadius: updates.borderRadius !== undefined ? (updates.borderRadius as number) : updated.borderRadius,
        fontSize: updates.fontSize !== undefined ? (updates.fontSize as number) : updated.fontSize,
      };
      kfs.push(newKf);
      kfs.sort((a, b) => a.timeSec - b.timeSec);
      updated.keyframes = kfs as any;
    }
  }
  return updated;
}

const getStageSnapshot = (state: StudioState): Partial<StudioState> => {
  const {
    imageSrc,
    imageName,
    imageWidth,
    imageHeight,
    secondImageSrc,
    secondImageName,
    secondImageWidth,
    secondImageHeight,
    layoutCount,
    mediaType,
    secondMediaType,
    videoDuration,
    secondVideoDuration,
    layoutPreset,
    zoom,
    slot2Zoom,
    alignment,
    padding,
    borderRadius,
    imageFit,
    slabThickness,
    slabColor,
    enableShine,
    shinePreset,
    shineOpacity,
    framelessStyle,
    shadow,
    shadowOverlay,
    shadowOverlayOpacity,
    shadowOverlayPosition,
    frameType,
    samsungStatusBar,
    iphoneStatusBar,
    urlText,
    secondUrlText,
    backgroundType,
    wavePreset,
    meshPreset,
    shadeshifterPreset,
    shadeshifterGrain,
    shadeshifterBlur,
    spectralPreset,
    spectralBlur,
    spectralAngle,
    animatedGradientPreset,
    animatedMeshPreset,
    flowPreset,
    flowColors,
    flowSpeed,
    flowDistortion,
    flowSwirl,
    flowScale,
    mistPreset,
    mistStops,
    mistRanges,
    mistHorizon,
    mistPeaks,
    mistSharp,
    mistHaze,
    mistSeed,
    confettiPreset,
    customConfettiObj,
    radiantPreset,
    linearSwatchesPreset,
    backgroundColor,
    bgGrain,
    bgGrainBlendMode,
    bgGrainSize,
    bgGrainColor,
    bgPatternEnabled,
    bgPatternPreset,
    bgPatternColor,
    bgPatternOpacity,
    gradient,
    bgImageUrl,
    bgBlur,
    lensBlurEnabled,
    lensBlurAmount,
    lensBlurFocalX,
    lensBlurFocalY,
    lensBlurRadius,
    watermarkType,
    watermarkPosition,
    watermarkSize,
    customWidth,
    customHeight,
    aspectRatio,
    rotateX,
    rotateY,
    skewX,
    skewY,
    slot1Rotate,
    slot2Rotate,
    slot2RotateX,
    slot2RotateY,
    slot2SkewX,
    slot2SkewY,
    slot2Perspective,
    perspective,
    offsetX,
    offsetY,
    slot2OffsetX,
    slot2OffsetY,
    textLayers,
    phosphorIconLayers,
    canvasElements,
    shapeLayers,
    layerOrder,
    techStackConfig,
    phosphorIconConfig,
    isAnimationMode,
    durationSec,
    keyframes,
    activePresetId,
  } = state;

  return {
    imageSrc,
    imageName,
    imageWidth,
    imageHeight,
    secondImageSrc,
    secondImageName,
    secondImageWidth,
    secondImageHeight,
    layoutCount,
    mediaType,
    secondMediaType,
    videoDuration,
    secondVideoDuration,
    layoutPreset,
    zoom,
    slot2Zoom,
    alignment,
    padding,
    borderRadius,
    slabThickness,
    slabColor,
    enableShine,
    shinePreset,
    shineOpacity,
    framelessStyle,
    shadow,
    shadowOverlay,
    shadowOverlayOpacity,
    shadowOverlayPosition,
    frameType,
    samsungStatusBar,
    iphoneStatusBar,
    urlText,
    secondUrlText,
    backgroundType,
    wavePreset,
    meshPreset,
    shadeshifterPreset,
    shadeshifterGrain,
    shadeshifterBlur,
    spectralPreset,
    spectralBlur,
    spectralAngle,
    animatedGradientPreset,
    animatedMeshPreset,
    flowPreset,
    flowColors: flowColors ? [...flowColors] : undefined,
    flowSpeed,
    flowDistortion,
    flowSwirl,
    flowScale,
    mistPreset,
    mistStops: mistStops ? [...mistStops] : undefined,
    mistRanges,
    mistHorizon,
    mistPeaks,
    mistSharp,
    mistHaze,
    mistSeed,
    confettiPreset,
    customConfettiObj: customConfettiObj ? JSON.parse(JSON.stringify(customConfettiObj)) : null,
    radiantPreset,
    linearSwatchesPreset,
    backgroundColor,
    bgGrain,
    bgGrainBlendMode,
    bgGrainSize,
    bgGrainColor,
    bgPatternEnabled,
    bgPatternPreset,
    bgPatternColor,
    bgPatternOpacity,
    gradient: { ...gradient },
    bgImageUrl,
    bgBlur,
    lensBlurEnabled,
    lensBlurAmount,
    lensBlurFocalX,
    lensBlurFocalY,
    lensBlurRadius,
    watermarkType,
    watermarkPosition,
    watermarkSize,
    customWidth,
    customHeight,
    aspectRatio,
    rotateX,
    rotateY,
    skewX,
    skewY,
    slot1Rotate,
    slot2Rotate,
    slot2RotateX,
    slot2RotateY,
    slot2SkewX,
    slot2SkewY,
    slot2Perspective,
    perspective,
    offsetX,
    offsetY,
    slot2OffsetX,
    slot2OffsetY,
    textLayers: JSON.parse(JSON.stringify(textLayers || [])),
    phosphorIconLayers: JSON.parse(JSON.stringify(phosphorIconLayers || [])),
    canvasElements: JSON.parse(JSON.stringify(canvasElements || [])),
    shapeLayers: JSON.parse(JSON.stringify(shapeLayers || [])),
    layerOrder: JSON.parse(JSON.stringify(layerOrder || [])),
    techStackConfig: { ...techStackConfig },
    phosphorIconConfig: { ...phosphorIconConfig },
    isAnimationMode: isAnimationMode || false,
    durationSec: durationSec || 10,
    keyframes: JSON.parse(JSON.stringify(keyframes || [])),
    activePresetId: activePresetId || '',
  };
};

export const useStudioStore = create<StudioStore>()(
  temporal(
    (set, get) => ({
      ...DEFAULT_STUDIO_STATE,
      isPreviewMode: false,
      updateState: (updates) =>
        set((state) => {
          const nextState = { ...state, ...updates };

          // 1. If modifying transform properties while in Animation Mode (and not playing):
          if (
            state.isAnimationMode &&
            !state.isPlaying &&
            ('rotateX' in updates ||
              'rotateY' in updates ||
              'zoom' in updates ||
              'slot2Zoom' in updates ||
              'offsetX' in updates ||
              'offsetY' in updates ||
              'slot2OffsetX' in updates ||
              'slot2OffsetY' in updates ||
              'slot1Rotate' in updates ||
              'slot2Rotate' in updates)
          ) {
            const currentT = Math.round(state.currentTimeSec * 10) / 10;
            const existingIndex = state.keyframes.findIndex(
              (kf) => Math.abs(kf.timeSec - currentT) <= 0.25
            );

            let updatedKeyframes = [...state.keyframes];

            if (existingIndex >= 0) {
              // Update existing keyframe at current timestamp
              const targetKf = { ...updatedKeyframes[existingIndex] };
              if ('rotateX' in updates) targetKf.rotateX = updates.rotateX!;
              if ('rotateY' in updates) targetKf.rotateY = updates.rotateY!;
              if ('zoom' in updates) targetKf.zoom = updates.zoom!;
              if ('slot2Zoom' in updates) targetKf.slot2Zoom = updates.slot2Zoom!;
              if ('offsetX' in updates) targetKf.offsetX = updates.offsetX!;
              if ('offsetY' in updates) targetKf.offsetY = updates.offsetY!;
              if ('slot2OffsetX' in updates) targetKf.slot2OffsetX = updates.slot2OffsetX!;
              if ('slot2OffsetY' in updates) targetKf.slot2OffsetY = updates.slot2OffsetY!;
              if ('slot1Rotate' in updates) targetKf.slot1Rotate = updates.slot1Rotate!;
              if ('slot2Rotate' in updates) targetKf.slot2Rotate = updates.slot2Rotate!;
              updatedKeyframes[existingIndex] = targetKf;
            } else {
              // Automatically insert new keyframe at current timestamp without overwriting 0s keyframe
              const newKf = {
                id: `kf-auto-${Date.now()}`,
                timeSec: currentT,
                rotateX: updates.rotateX ?? state.rotateX,
                rotateY: updates.rotateY ?? state.rotateY,
                zoom: updates.zoom ?? state.zoom,
                slot2Zoom: updates.slot2Zoom ?? state.slot2Zoom ?? state.zoom,
                offsetX: updates.offsetX ?? state.offsetX,
                offsetY: updates.offsetY ?? state.offsetY,
                slot2OffsetX: updates.slot2OffsetX ?? state.slot2OffsetX ?? 0,
                slot2OffsetY: updates.slot2OffsetY ?? state.slot2OffsetY ?? 0,
                slot1Rotate: updates.slot1Rotate ?? state.slot1Rotate ?? 0,
                slot2Rotate: updates.slot2Rotate ?? state.slot2Rotate ?? 0,
              };
              updatedKeyframes.push(newKf);
              updatedKeyframes.sort((a, b) => a.timeSec - b.timeSec);
            }

            nextState.keyframes = updatedKeyframes;
          }

          // 2. If scrubbing timeline in Animation Mode, sync slider values to interpolated animation state
          if (
            state.isAnimationMode &&
            !state.isPlaying &&
            'currentTimeSec' in updates &&
            !('rotateX' in updates) &&
            !('slot1Rotate' in updates) &&
            !('zoom' in updates) &&
            !('slot2Zoom' in updates) &&
            !('offsetX' in updates) &&
            !('slot2OffsetX' in updates) &&
            state.keyframes.length > 0
          ) {
            const t = updates.currentTimeSec!;
            const keyframes = state.keyframes;

            if (t <= keyframes[0].timeSec) {
              const firstKf = keyframes[0];
              nextState.rotateX = firstKf.rotateX;
              nextState.rotateY = firstKf.rotateY;
              nextState.zoom = firstKf.zoom;
              nextState.slot2Zoom = firstKf.slot2Zoom ?? firstKf.zoom;
              nextState.offsetX = firstKf.offsetX;
              nextState.offsetY = firstKf.offsetY;
              nextState.slot2OffsetX = firstKf.slot2OffsetX ?? 0;
              nextState.slot2OffsetY = firstKf.slot2OffsetY ?? 0;
              nextState.slot1Rotate = firstKf.slot1Rotate ?? 0;
              nextState.slot2Rotate = firstKf.slot2Rotate ?? 0;
            } else if (t >= keyframes[keyframes.length - 1].timeSec) {
              const lastKf = keyframes[keyframes.length - 1];
              nextState.rotateX = lastKf.rotateX;
              nextState.rotateY = lastKf.rotateY;
              nextState.zoom = lastKf.zoom;
              nextState.slot2Zoom = lastKf.slot2Zoom ?? lastKf.zoom;
              nextState.offsetX = lastKf.offsetX;
              nextState.offsetY = lastKf.offsetY;
              nextState.slot2OffsetX = lastKf.slot2OffsetX ?? 0;
              nextState.slot2OffsetY = lastKf.slot2OffsetY ?? 0;
              nextState.slot1Rotate = lastKf.slot1Rotate ?? 0;
              nextState.slot2Rotate = lastKf.slot2Rotate ?? 0;
            } else {
              let prevIndex = 0;
              for (let i = 0; i < keyframes.length - 1; i++) {
                if (t >= keyframes[i].timeSec && t <= keyframes[i + 1].timeSec) {
                  prevIndex = i;
                  break;
                }
              }
              const kf1 = keyframes[prevIndex];
              const kf2 = keyframes[prevIndex + 1];
              const duration = kf2.timeSec - kf1.timeSec;
              const progress = duration > 0 ? (t - kf1.timeSec) / duration : 0;
              const factor = calculateEasing(progress, state.animationEasing || 'ease-in-out');

              const z2_1 = kf1.slot2Zoom ?? kf1.zoom;
              const z2_2 = kf2.slot2Zoom ?? kf2.zoom;
              const x2_1 = kf1.slot2OffsetX ?? 0;
              const x2_2 = kf2.slot2OffsetX ?? 0;
              const y2_1 = kf1.slot2OffsetY ?? 0;
              const y2_2 = kf2.slot2OffsetY ?? 0;
              const r1_1 = kf1.slot1Rotate ?? 0;
              const r1_2 = kf2.slot1Rotate ?? 0;
              const r2_1 = kf1.slot2Rotate ?? 0;
              const r2_2 = kf2.slot2Rotate ?? 0;

              nextState.rotateX = Math.round(kf1.rotateX + (kf2.rotateX - kf1.rotateX) * factor);
              nextState.rotateY = Math.round(kf1.rotateY + (kf2.rotateY - kf1.rotateY) * factor);
              nextState.zoom = Math.round(kf1.zoom + (kf2.zoom - kf1.zoom) * factor);
              nextState.slot2Zoom = Math.round(z2_1 + (z2_2 - z2_1) * factor);
              nextState.offsetX = Math.round(kf1.offsetX + (kf2.offsetX - kf1.offsetX) * factor);
              nextState.offsetY = Math.round(kf1.offsetY + (kf2.offsetY - kf1.offsetY) * factor);
              nextState.slot2OffsetX = Math.round(x2_1 + (x2_2 - x2_1) * factor);
              nextState.slot2OffsetY = Math.round(y2_1 + (y2_2 - y2_1) * factor);
              nextState.slot1Rotate = Math.round(r1_1 + (r1_2 - r1_1) * factor);
              nextState.slot2Rotate = Math.round(r2_1 + (r2_2 - r2_1) * factor);
            }
          }

          return nextState;
        }),
      setImage: (src, name, width, height, mediaType = 'image', duration) =>
        set((s) => ({
          imageSrc: src,
          imageName: name,
          imageWidth: width,
          imageHeight: height,
          mediaType: mediaType || 'image',
          videoDuration: duration,
          ...(mediaType === 'video' && duration && !s.isAnimationMode
            ? { durationSec: Math.min(60, Math.max(3, Math.ceil(duration))) }
            : {}),
        })),
      setSecondImage: (src, name, width, height, mediaType = 'image', duration) =>
        set({
          secondImageSrc: src,
          secondImageName: name,
          secondImageWidth: width,
          secondImageHeight: height,
          secondMediaType: mediaType || 'image',
          secondVideoDuration: duration,
        }),
      reset3DPerspective: () =>
        set({
          zoom: 100,
          slot2Zoom: 100,
          rotateX: 0,
          rotateY: 0,
          skewX: 0,
          skewY: 0,
          slot1Rotate: 0,
          slot2Rotate: 0,
          slot2RotateX: 0,
          slot2RotateY: 0,
          slot2SkewX: 0,
          slot2SkewY: 0,
          slot2Perspective: 1000,
          perspective: 1000,
          offsetX: 0,
          offsetY: 0,
          slot2OffsetX: 0,
          slot2OffsetY: 0,
          slabThickness: 12,
          slabColor: '#1e293b',
        }),
      resetAll: () => set((s) => ({ ...DEFAULT_STUDIO_STATE, resetKey: s.resetKey + 1 })),
      togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
      addTextLayer: (initialTextOrProps) => {
        const isObj = typeof initialTextOrProps === 'object' && initialTextOrProps !== null;
        const initialText = typeof initialTextOrProps === 'string' ? initialTextOrProps : undefined;
        const customProps = isObj ? initialTextOrProps : {};
        const newId = `text-${Date.now()}`;
        set((state) => {
          const newLayer: import('../types/studio').TextLayer = {
            id: newId,
            text: initialText || customProps.text || `Text ${state.textLayers.length + 1}`,
            fontFamily: 'Inter',
            fontSize: 32,
            fontWeight: '700',
            fontStyle: 'normal',
            color: '#ffffff',
            textAlign: 'center',
            x: 0,
            y: 0,
            shadow: false,
            opacity: 100,
            rotation: 0,
            pitch: 0,
            yaw: 0,
            skewX: 0,
            skewY: 0,
            scaleX: 1,
            scaleY: 1,
            position: 'above',
            name: initialText || customProps.name || '',
            visible: true,
            locked: false,
            ...customProps,
          };
          return {
            textLayers: [...state.textLayers, newLayer],
            selectedTextLayerId: newLayer.id,
            selectedTextLayerIds: [newLayer.id],
            layerOrder: [{ type: 'text', id: newLayer.id }, ...(state.layerOrder || [])],
          };
        });
        return newId;
      },
      addSocialLayer: (platform, handle) =>
        set((state) => {
          const plat = platform || 'instagram';
          const newLayer: import('../types/studio').TextLayer = {
            id: `social-${Date.now()}`,
            text: handle || '@username',
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: '600',
            fontStyle: 'normal',
            color: '#ffffff',
            textAlign: 'left',
            x: 0,
            y: 120,
            shadow: false,
            opacity: 100,
            rotation: 0,
            pitch: 0,
            yaw: 0,
            skewX: 0,
            skewY: 0,
            scaleX: 1,
            scaleY: 1,
            position: 'above',
            socialPlatform: plat,
            socialStyle: 'default',
            iconColor: '#ffffff',
            iconSize: 20,
            name: handle || '',
            visible: true,
            locked: false,
          };
          return {
            textLayers: [...state.textLayers, newLayer],
            selectedTextLayerId: newLayer.id,
            selectedTextLayerIds: [newLayer.id],
            layerOrder: [{ type: 'text', id: newLayer.id }, ...(state.layerOrder || [])],
          };
        }),
      updateTextLayer: (id, updates) =>
        set((state) => ({
          textLayers: state.textLayers.map((l) =>
            l.id === id ? syncKeyframesOnLayerUpdate(l, updates, state.currentTimeSec) : l
          ),
        })),
      removeTextLayer: (id) =>
        set((state) => ({
          textLayers: state.textLayers.filter((l) => l.id !== id),
          selectedTextLayerId: state.selectedTextLayerId === id ? null : state.selectedTextLayerId,
          selectedTextLayerIds: (state.selectedTextLayerIds || []).filter((i) => i !== id),
          layerOrder: (state.layerOrder || []).filter((e) => !(e.type === 'text' && e.id === id)),
        })),
      duplicateTextLayer: (id) =>
        set((state) => {
          const layerToDup = state.textLayers.find((l) => l.id === id);
          if (!layerToDup) return state;
          const dup: import('../types/studio').TextLayer = {
            ...layerToDup,
            id: `text-${Date.now()}`,
            text: `${layerToDup.text} (Copy)`,
            y: layerToDup.y + 20,
          };
          const srcIdx = (state.layerOrder || []).findIndex(
            (e) => e.type === 'text' && e.id === id
          );
          const newOrder = [...(state.layerOrder || [])];
          newOrder.splice(srcIdx === -1 ? 0 : srcIdx, 0, { type: 'text', id: dup.id });
          return {
            textLayers: [...state.textLayers, dup],
            selectedTextLayerId: dup.id,
            selectedTextLayerIds: [dup.id],
            layerOrder: newOrder,
          };
        }),
      explodeTextLayer: (id) =>
        set((state) => {
          const layer = state.textLayers.find((l) => l.id === id);
          if (!layer || !layer.text || layer.text.length <= 1) return state;

          const chars = Array.from(layer.text);
          const nonSpaceChars = chars.filter((c) => c.trim().length > 0);
          if (nonSpaceChars.length <= 1) return state;

          const now = Date.now();
          const newLayers: import('../types/studio').TextLayer[] = [];

          // If DOM element exists on screen, use Range API for 100.0% exact on-screen position
          let hasMeasuredDom = false;
          if (typeof document !== 'undefined') {
            const domEl = document.querySelector(`[data-layer-id="${id}"]`);
            if (domEl) {
              const walker = document.createTreeWalker(domEl, NodeFilter.SHOW_TEXT, null);
              const textNode = walker.nextNode();
              if (textNode && textNode.textContent) {
                const zoom = (state.previewCanvasZoom || 100) / 100;
                const range0 = document.createRange();
                range0.setStart(textNode, 0);
                range0.setEnd(textNode, 0);
                const rect0 = range0.getBoundingClientRect();

                chars.forEach((char, idx) => {
                  if (char.trim().length > 0) {
                    const rangeI = document.createRange();
                    rangeI.setStart(textNode, idx);
                    rangeI.setEnd(textNode, idx);
                    const rectI = rangeI.getBoundingClientRect();
                    const deltaX = (rectI.left - rect0.left) / zoom;
                    const deltaY = (rectI.top - rect0.top) / zoom;

                    newLayers.push({
                      ...layer,
                      id: `text-exploded-${now}-${idx}`,
                      text: char,
                      x: Math.round((layer.x + deltaX) * 10) / 10,
                      y: Math.round((layer.y + deltaY) * 10) / 10,
                      name: `Char: ${char}`,
                    });
                  }
                });
                hasMeasuredDom = newLayers.length > 0;
              }
            }
          }

          // Fallback if not measured via DOM
          if (!hasMeasuredDom) {
            let ctx: CanvasRenderingContext2D | null = null;
            try {
              const canvas = document.createElement('canvas');
              ctx = canvas.getContext('2d');
              if (ctx) {
                const fontObj = GOOGLE_FONTS.find((f) => f.name === layer.fontFamily);
                const family = fontObj ? fontObj.family : layer.fontFamily || 'Inter, sans-serif';
                ctx.font = `${layer.fontStyle === 'italic' ? 'italic ' : ''}${layer.fontWeight || 'normal'} ${layer.fontSize}px ${family}`;
              }
            } catch {
              ctx = null;
            }

            const rotRad = ((layer.rotation || 0) * Math.PI) / 180;
            const cosRot = Math.cos(rotRad);
            const sinRot = Math.sin(rotRad);
            const scaleX = layer.scaleX ?? 1;

            chars.forEach((char, idx) => {
              if (char.trim().length > 0) {
                const prefix = layer.text.slice(0, idx);
                const prefixWidth = ctx
                  ? ctx.measureText(prefix).width
                  : idx * (layer.fontSize * 0.55);
                const dist = prefixWidth * scaleX;
                newLayers.push({
                  ...layer,
                  id: `text-exploded-${now}-${idx}`,
                  text: char,
                  x: Math.round((layer.x + dist * cosRot) * 10) / 10,
                  y: Math.round((layer.y + dist * sinRot) * 10) / 10,
                  name: `Char: ${char}`,
                });
              }
            });
          }

          if (newLayers.length === 0) return state;

          // Replace old layer in textLayers
          const oldIndex = state.textLayers.findIndex((l) => l.id === id);
          const updatedTextLayers = [...state.textLayers];
          updatedTextLayers.splice(oldIndex, 1, ...newLayers);

          // Replace old layer in layerOrder
          const oldOrderIdx = (state.layerOrder || []).findIndex(
            (e) => e.type === 'text' && e.id === id
          );
          const newOrder = [...(state.layerOrder || [])];
          if (oldOrderIdx !== -1) {
            newOrder.splice(
              oldOrderIdx,
              1,
              ...newLayers.map((nl) => ({ type: 'text' as const, id: nl.id }))
            );
          }

          return {
            textLayers: updatedTextLayers,
            selectedTextLayerId: newLayers[0].id,
            selectedTextLayerIds: newLayers.map((nl) => nl.id),
            layerOrder: newOrder,
          };
        }),
      selectTextLayer: (id) =>
        set(() => ({
          selectedTextLayerId: id,
          selectedTextLayerIds: id ? [id] : [],
        })),
      toggleTextLayer: (id) =>
        set((state) => {
          const ids = state.selectedTextLayerIds || [];
          const has = ids.includes(id);
          const nextIds = has ? ids.filter((i) => i !== id) : [...ids, id];
          return {
            selectedTextLayerIds: nextIds,
            selectedTextLayerId: nextIds.length ? id : null,
          };
        }),
      clearSelectedTextLayers: () =>
        set(() => ({
          selectedTextLayerId: null,
          selectedTextLayerIds: [],
        })),
      addPhosphorIconLayer: (iconId, customProps) =>
        set((state) => {
          const newLayer: import('../types/studio').PhosphorIconLayer = {
            id: `phosphor-${Date.now()}`,
            iconId: iconId || 'Sparkle',
            weight: 'regular',
            size: 40,
            color: '#ffffff',
            badgeStyle: 'plain',
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 100,
            position: 'above',
            shadow: false,
            name: iconId || 'Sparkle',
            visible: true,
            locked: false,
            ...customProps,
          };
          return {
            phosphorIconLayers: [...(state.phosphorIconLayers || []), newLayer],
            selectedPhosphorIconLayerId: newLayer.id,
            selectedPhosphorIconLayerIds: [newLayer.id],
            layerOrder: [{ type: 'phosphor', id: newLayer.id }, ...(state.layerOrder || [])],
          };
        }),
      updatePhosphorIconLayer: (id, updates) =>
        set((state) => ({
          phosphorIconLayers: (state.phosphorIconLayers || []).map((l) =>
            l.id === id ? syncKeyframesOnLayerUpdate(l, updates, state.currentTimeSec) : l
          ),
        })),
      removePhosphorIconLayer: (id) =>
        set((state) => ({
          phosphorIconLayers: (state.phosphorIconLayers || []).filter((l) => l.id !== id),
          selectedPhosphorIconLayerId:
            state.selectedPhosphorIconLayerId === id ? null : state.selectedPhosphorIconLayerId,
          selectedPhosphorIconLayerIds: (state.selectedPhosphorIconLayerIds || []).filter(
            (i) => i !== id
          ),
          layerOrder: (state.layerOrder || []).filter(
            (e) => !(e.type === 'phosphor' && e.id === id)
          ),
        })),
      duplicatePhosphorIconLayer: (id) =>
        set((state) => {
          const layerToDup = (state.phosphorIconLayers || []).find((l) => l.id === id);
          if (!layerToDup) return state;
          const dup: import('../types/studio').PhosphorIconLayer = {
            ...layerToDup,
            id: `phosphor-${Date.now()}`,
            x: layerToDup.x + 20,
            y: layerToDup.y + 20,
          };
          const srcIdx = (state.layerOrder || []).findIndex(
            (e) => e.type === 'phosphor' && e.id === id
          );
          const newOrder = [...(state.layerOrder || [])];
          newOrder.splice(srcIdx === -1 ? 0 : srcIdx, 0, { type: 'phosphor', id: dup.id });
          return {
            phosphorIconLayers: [...(state.phosphorIconLayers || []), dup],
            selectedPhosphorIconLayerId: dup.id,
            selectedPhosphorIconLayerIds: [dup.id],
            layerOrder: newOrder,
          };
        }),
      selectPhosphorIconLayer: (id) =>
        set(() => ({
          selectedPhosphorIconLayerId: id,
          selectedPhosphorIconLayerIds: id ? [id] : [],
        })),
      togglePhosphorIconLayer: (id: string) =>
        set((state) => {
          const ids = state.selectedPhosphorIconLayerIds || [];
          const has = ids.includes(id);
          const nextIds = has ? ids.filter((i) => i !== id) : [...ids, id];
          return {
            selectedPhosphorIconLayerIds: nextIds,
            selectedPhosphorIconLayerId: nextIds.length ? id : null,
          };
        }),
      toggleSelectPhosphorIconLayer: (id: string) =>
        set((state) => {
          const ids = state.selectedPhosphorIconLayerIds || [];
          const has = ids.includes(id);
          const nextIds = has ? ids.filter((i) => i !== id) : [...ids, id];
          return {
            selectedPhosphorIconLayerIds: nextIds,
            selectedPhosphorIconLayerId: nextIds.length ? id : null,
          };
        }),
      addCanvasElement: (elementId, src, category = 'arrow', customProps) =>
        set((state) => {
          const newEl: import('../types/studio').CanvasElement = {
            id: `el-${Date.now()}`,
            category,
            elementId: elementId || 'arrow-1',
            src: src || '/element/arrow/1.svg',
            color: '#a2d2ff',
            width: 90,
            height: 90,
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 100,
            position: 'above',
            shadow: false,
            name: elementId || 'arrow-1',
            visible: true,
            locked: false,
            ...customProps,
          };
          return {
            canvasElements: [...(state.canvasElements || []), newEl],
            selectedElementId: newEl.id,
            selectedElementIds: [newEl.id],
            layerOrder: [{ type: 'element', id: newEl.id }, ...(state.layerOrder || [])],
          };
        }),
      updateCanvasElement: (id, updates) =>
        set((state) => ({
          canvasElements: (state.canvasElements || []).map((el) =>
            el.id === id ? syncKeyframesOnLayerUpdate(el, updates, state.currentTimeSec) : el
          ),
        })),
      removeCanvasElement: (id) =>
        set((state) => ({
          canvasElements: (state.canvasElements || []).filter((el) => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
          selectedElementIds: (state.selectedElementIds || []).filter((i) => i !== id),
          layerOrder: (state.layerOrder || []).filter(
            (e) => !(e.type === 'element' && e.id === id)
          ),
        })),
      duplicateCanvasElement: (id) =>
        set((state) => {
          const elToDup = (state.canvasElements || []).find((el) => el.id === id);
          if (!elToDup) return state;
          const dup: import('../types/studio').CanvasElement = {
            ...elToDup,
            id: `el-${Date.now()}`,
            x: elToDup.x + 20,
            y: elToDup.y + 20,
          };
          const srcIdx = (state.layerOrder || []).findIndex(
            (e) => e.type === 'element' && e.id === id
          );
          const newOrder = [...(state.layerOrder || [])];
          newOrder.splice(srcIdx === -1 ? 0 : srcIdx, 0, { type: 'element', id: dup.id });
          return {
            canvasElements: [...(state.canvasElements || []), dup],
            selectedElementId: dup.id,
            selectedElementIds: [dup.id],
            layerOrder: newOrder,
          };
        }),
      selectCanvasElement: (id) =>
        set(() => ({
          selectedElementId: id,
          selectedElementIds: id ? [id] : [],
        })),
      toggleSelectCanvasElement: (id) =>
        set((state) => {
          const ids = state.selectedElementIds || [];
          const has = ids.includes(id);
          const nextIds = has ? ids.filter((i) => i !== id) : [...ids, id];
          return {
            selectedElementIds: nextIds,
            selectedElementId: nextIds.length ? id : null,
          };
        }),
      addShapeLayer: (shapeType = 'square', customProps) => {
        const newId = `shape-${Date.now()}`;
        set((state) => {
          const dims: Record<
            import('../types/studio').ShapeType,
            { width: number; height: number }
          > = {
            square: { width: 120, height: 120 },
            rectangle: { width: 160, height: 100 },
            circle: { width: 120, height: 120 },
            triangle: { width: 130, height: 120 },
            hexagon: { width: 140, height: 122 },
            quote: { width: 120, height: 120 },
            coolshape: { width: 140, height: 140 },
            'custom-path': { width: 120, height: 120 },
          };
          const newShape: import('../types/studio').ShapeLayer = {
            id: newId,
            shapeType,
            color: '#a2d2ff',
            ...dims[shapeType],
            borderRadius: shapeType === 'square' || shapeType === 'rectangle' ? 8 : 0,
            x: 0,
            y: 0,
            rotation: 0,
            pitch: 0,
            yaw: 0,
            skewX: 0,
            skewY: 0,
            opacity: 100,
            position: 'above',
            shadow: false,
            name: customProps?.name || (shapeType === 'coolshape' ? `Coolshape ${customProps?.coolshapeType || 'star'}` : shapeType),
            visible: true,
            locked: false,
            coolshapeType: customProps?.coolshapeType || (shapeType === 'coolshape' ? 'star' : undefined),
            coolshapeIndex: customProps?.coolshapeIndex ?? 0,
            coolshapeNoise: customProps?.coolshapeNoise ?? true,
            ...customProps,
          };
          return {
            shapeLayers: [...(state.shapeLayers || []), newShape],
            selectedShapeId: newShape.id,
            selectedShapeIds: [newShape.id],
            layerOrder: [{ type: 'shape', id: newShape.id }, ...(state.layerOrder || [])],
          };
        });
        return newId;
      },
      setPenDrawingMode: (active) => set({ isPenDrawingMode: active }),
      updateShapeLayer: (id, updates) =>
        set((state) => ({
          shapeLayers: (state.shapeLayers || []).map((s) =>
            s.id === id ? syncKeyframesOnLayerUpdate(s, updates, state.currentTimeSec) : s
          ),
        })),
      removeShapeLayer: (id) =>
        set((state) => ({
          shapeLayers: (state.shapeLayers || []).filter((s) => s.id !== id),
          selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
          selectedShapeIds: (state.selectedShapeIds || []).filter((i) => i !== id),
          layerOrder: (state.layerOrder || []).filter((e) => !(e.type === 'shape' && e.id === id)),
        })),
      duplicateShapeLayer: (id) =>
        set((state) => {
          const shapeToDup = (state.shapeLayers || []).find((s) => s.id === id);
          if (!shapeToDup) return state;
          const dup: import('../types/studio').ShapeLayer = {
            ...shapeToDup,
            id: `shape-${Date.now()}`,
            x: shapeToDup.x + 20,
            y: shapeToDup.y + 20,
          };
          const srcIdx = (state.layerOrder || []).findIndex(
            (e) => e.type === 'shape' && e.id === id
          );
          const newOrder = [...(state.layerOrder || [])];
          newOrder.splice(srcIdx === -1 ? 0 : srcIdx, 0, { type: 'shape', id: dup.id });
          return {
            shapeLayers: [...(state.shapeLayers || []), dup],
            selectedShapeId: dup.id,
            selectedShapeIds: [dup.id],
            layerOrder: newOrder,
          };
        }),
      selectShapeLayer: (id) =>
        set(() => ({
          selectedShapeId: id,
          selectedShapeIds: id ? [id] : [],
        })),
      toggleSelectShapeLayer: (id) =>
        set((state) => {
          const ids = state.selectedShapeIds || [];
          const has = ids.includes(id);
          const nextIds = has ? ids.filter((i) => i !== id) : [...ids, id];
          return {
            selectedShapeIds: nextIds,
            selectedShapeId: nextIds.length ? id : null,
          };
        }),
      booleanOperationOnShapes: (operation: BooleanOperation = 'union') => {
        let mergedSuccessfully = false;
        set((state) => {
          const selectedIds = state.selectedShapeIds || [];
          if (selectedIds.length < 2) return state;

          const layerOrder = state.layerOrder || [];
          // Sort selected shapes by layerOrder (index 0 = topmost, higher index = bottom-most)
          const sortedShapes = [...(state.shapeLayers || [])]
            .filter((s) => selectedIds.includes(s.id))
            .sort((a, b) => {
              const ai = layerOrder.findIndex((e) => e.type === 'shape' && e.id === a.id);
              const bi = layerOrder.findIndex((e) => e.type === 'shape' && e.id === b.id);
              return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
            });

          if (sortedShapes.length < 2) return state;

          // For Subtract (Difference): the bottom-most layer (highest index in layerOrder)
          // is the base subject, and the layers on top of it are the cutters.
          const shapesToProcess =
            operation === 'subtract'
              ? [sortedShapes[sortedShapes.length - 1], ...sortedShapes.slice(0, sortedShapes.length - 1)]
              : sortedShapes;

          const merged = booleanOperationOnShapes(shapesToProcess, operation);
          if (!merged) return state;

          const remainingShapes = (state.shapeLayers || []).filter((s) => !selectedIds.includes(s.id));
          const firstIdx = layerOrder.findIndex(
            (e) => e.type === 'shape' && selectedIds.includes(e.id)
          );
          const newLayerOrder = layerOrder.filter(
            (e) => !(e.type === 'shape' && selectedIds.includes(e.id))
          );
          newLayerOrder.splice(firstIdx === -1 ? 0 : firstIdx, 0, { type: 'shape', id: merged.id });

          mergedSuccessfully = true;
          return {
            shapeLayers: [...remainingShapes, merged],
            selectedShapeId: merged.id,
            selectedShapeIds: [merged.id],
            layerOrder: newLayerOrder,
          };
        });

        return mergedSuccessfully;
      },
      mergeSelectedShapes: (operation: BooleanOperation = 'union'): boolean => {
        return get().booleanOperationOnShapes(operation);
      },
      reorderLayers: (newOrder) => set(() => ({ layerOrder: newOrder })),
      alignCanvasElements: (align, canvasWidth) =>
        set((state) => {
          const measureTextWidth = (
            text: string,
            fontFamily: string,
            fontSize: number,
            fontWeight: string
          ): number => {
            const longestLine = text
              .split('\n')
              .reduce((a, b) => (b.length > a.length ? b : a), '');
            const ctx = document.createElement('canvas').getContext('2d');
            if (!ctx) return longestLine.length * fontSize * 0.6;
            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
            return ctx.measureText(longestLine).width;
          };

          const getBox = (
            type: 'text' | 'phosphor' | 'element' | 'shape',
            layer: import('../types/studio').TextLayer &
              import('../types/studio').PhosphorIconLayer &
              import('../types/studio').CanvasElement &
              import('../types/studio').ShapeLayer
          ): { id: string; x: number; width: number } => {
            const x = layer.x || 0;
            if (type === 'element') {
              return { id: layer.id, x, width: layer.width || 90 };
            }
            if (type === 'shape') {
              return { id: layer.id, x, width: layer.width || 120 };
            }
            if (type === 'phosphor') {
              const size = layer.size || 36;
              const badgePad = layer.badgeStyle === 'plain' ? 8 : 24;
              return { id: layer.id, x, width: size + badgePad };
            }
            const base = measureTextWidth(
              layer.text,
              layer.fontFamily || 'Inter, sans-serif',
              layer.fontSize || 32,
              layer.fontWeight || '700'
            );
            const width = layer.socialPlatform
              ? base + (layer.iconSize || layer.fontSize * 1.1) + 38
              : base;
            return { id: layer.id, x, width };
          };

          const boxes: { id: string; x: number; width: number }[] = [];
          const textIds = state.selectedTextLayerIds || [];
          (state.textLayers || [])
            .filter((l) => textIds.includes(l.id))
            .forEach((l) => boxes.push(getBox('text', l as never)));
          const iconIds = state.selectedPhosphorIconLayerIds || [];
          (state.phosphorIconLayers || [])
            .filter((l) => iconIds.includes(l.id))
            .forEach((l) => boxes.push(getBox('phosphor', l as never)));
          const elIds = state.selectedElementIds || [];
          (state.canvasElements || [])
            .filter((el) => elIds.includes(el.id))
            .forEach((el) => boxes.push(getBox('element', el as never)));
          const shapeIds = state.selectedShapeIds || [];
          (state.shapeLayers || [])
            .filter((s) => shapeIds.includes(s.id))
            .forEach((s) => boxes.push(getBox('shape', s as never)));

          if (boxes.length === 0) return state;

          // Layers are absolutely positioned in a flex-centered parent, so x/y are
          // offsets from the canvas center: element center offset = x, and
          // left edge = x - width/2, right edge = x + width/2.
          const targets: Record<string, number> = {};
          if (align === 'left') {
            const minLeft = Math.min(...boxes.map((b) => b.x - b.width / 2));
            boxes.forEach((b) => (targets[b.id] = Math.round(minLeft + b.width / 2)));
          } else if (align === 'right') {
            const maxRight = Math.max(...boxes.map((b) => b.x + b.width / 2));
            boxes.forEach((b) => (targets[b.id] = Math.round(maxRight - b.width / 2)));
          } else if (align === 'center') {
            boxes.forEach((b) => (targets[b.id] = 0));
          }

          return {
            textLayers: (state.textLayers || []).map((l) =>
              targets[l.id] != null ? { ...l, x: Math.round(targets[l.id]) } : l
            ),
            phosphorIconLayers: (state.phosphorIconLayers || []).map((l) =>
              targets[l.id] != null ? { ...l, x: Math.round(targets[l.id]) } : l
            ),
            canvasElements: (state.canvasElements || []).map((el) =>
              targets[el.id] != null ? { ...el, x: Math.round(targets[el.id]) } : el
            ),
            shapeLayers: (state.shapeLayers || []).map((s) =>
              targets[s.id] != null ? { ...s, x: Math.round(targets[s.id]) } : s
            ),
          };
        }),

      selectStage: (index) =>
        set((state) => {
          const snapshot = getStageSnapshot(state);
          let currentStages = [...(state.stages || [])];
          if (currentStages.length === 0) {
            currentStages = [snapshot];
          } else {
            currentStages[state.activeStageIndex] = snapshot;
          }

          if (index < 0 || index >= currentStages.length) return state;

          const targetSnapshot = currentStages[index];
          return {
            ...state,
            ...targetSnapshot,
            stages: currentStages,
            activeStageIndex: index,
            isPlaying: false,
            currentTimeSec: 0,
            selectedTextLayerId: null,
            selectedTextLayerIds: [],
            selectedPhosphorIconLayerId: null,
            selectedPhosphorIconLayerIds: [],
            selectedElementId: null,
            selectedElementIds: [],
            selectedShapeId: null,
            selectedShapeIds: [],
          };
        }),

      addStage: () =>
        set((state) => {
          const snapshot = getStageSnapshot(state);
          let currentStages = [...(state.stages || [])];
          if (currentStages.length === 0) {
            currentStages = [snapshot];
          } else {
            currentStages[state.activeStageIndex] = snapshot;
          }

          if (currentStages.length >= 5) return state;

          const newSnapshot = JSON.parse(JSON.stringify(snapshot));
          const newIndex = currentStages.length;
          currentStages.push(newSnapshot);

          return {
            ...state,
            ...newSnapshot,
            stages: currentStages,
            activeStageIndex: newIndex,
            selectedTextLayerId: null,
            selectedTextLayerIds: [],
            selectedPhosphorIconLayerId: null,
            selectedPhosphorIconLayerIds: [],
            selectedElementId: null,
            selectedElementIds: [],
            selectedShapeId: null,
            selectedShapeIds: [],
          };
        }),

      removeStage: (index) =>
        set((state) => {
          const snapshot = getStageSnapshot(state);
          let currentStages = [...(state.stages || [])];
          if (currentStages.length === 0) {
            currentStages = [snapshot];
          } else {
            currentStages[state.activeStageIndex] = snapshot;
          }

          if (currentStages.length <= 1) return state;
          if (index < 0 || index >= currentStages.length) return state;

          currentStages.splice(index, 1);
          let nextActiveIndex = state.activeStageIndex;
          if (nextActiveIndex >= currentStages.length) {
            nextActiveIndex = currentStages.length - 1;
          } else if (index === state.activeStageIndex && nextActiveIndex > 0) {
            nextActiveIndex = Math.max(0, nextActiveIndex - 1);
          }

          const activeSnapshot = currentStages[nextActiveIndex];
          return {
            ...state,
            ...activeSnapshot,
            stages: currentStages,
            activeStageIndex: nextActiveIndex,
          };
        }),

      addLayerMotionBlock: (layerType, layerId, presetId, startTimeSec, customDuration) =>
        set((state) => {
          const meta = MOTION_PRESETS.find((p) => p.id === presetId);
          const dur = customDuration || meta?.defaultDurationSec || 1.5;

          const layerProp =
            layerType === 'text'
              ? 'textLayers'
              : layerType === 'phosphor'
                ? 'phosphorIconLayers'
                : layerType === 'element'
                  ? 'canvasElements'
                  : 'shapeLayers';

          const layers = [...(state[layerProp] || [])] as any[];
          const targetIdx = layers.findIndex((l) => l.id === layerId);
          if (targetIdx === -1) return state;

          const targetLayer = { ...layers[targetIdx] };
          const currentMotions: LayerMotionBlock[] = targetLayer.motions
            ? [...targetLayer.motions]
            : [];

          // If layer had legacy loopAnimation and no motions yet, migrate it
          if (
            currentMotions.length === 0 &&
            targetLayer.loopAnimation &&
            targetLayer.loopAnimation !== 'none'
          ) {
            currentMotions.push({
              id: `motion-legacy-${Date.now()}`,
              preset: targetLayer.loopAnimation as MotionPresetId,
              startTimeSec: targetLayer.animStartTime || 0,
              durationSec: targetLayer.loopAnimation === 'counter' ? 1.2 : 2.5,
            });
          }

          // Calculate start time: if not provided or collides with existing blocks, find non-overlapping slot
          let startT = startTimeSec ?? state.currentTimeSec;
          let finalDur = dur;

          // If startT falls inside an existing block, push it to the end of that block
          currentMotions.forEach((b) => {
            if (startT >= b.startTimeSec && startT < b.startTimeSec + b.durationSec) {
              startT = b.startTimeSec + b.durationSec;
            }
          });

          // Check if [startT, startT + finalDur] overlaps with a subsequent block
          const nextBlock = currentMotions.find((b) => b.startTimeSec >= startT);
          if (nextBlock && startT + finalDur > nextBlock.startTimeSec) {
            const availableGap = nextBlock.startTimeSec - startT;
            if (availableGap >= 0.4) {
              finalDur = availableGap;
            } else {
              // Place after the last block
              const lastBlock = currentMotions[currentMotions.length - 1];
              startT = lastBlock ? lastBlock.startTimeSec + lastBlock.durationSec : 0;
            }
          }

          const newBlock: LayerMotionBlock = {
            id: `motion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            preset: presetId,
            startTimeSec: Math.max(0, Math.round(startT * 10) / 10),
            durationSec: Math.max(0.2, Math.round(finalDur * 10) / 10),
          };

          currentMotions.push(newBlock);
          currentMotions.sort((a, b) => a.startTimeSec - b.startTimeSec);

          targetLayer.motions = currentMotions;
          // Clear single legacy loopAnimation to prevent duplicate evaluation
          targetLayer.loopAnimation = 'none';
          layers[targetIdx] = targetLayer;

          return {
            [layerProp]: layers,
          };
        }),

      updateLayerMotionBlock: (layerType, layerId, blockId, updates) =>
        set((state) => {
          const layerProp =
            layerType === 'text'
              ? 'textLayers'
              : layerType === 'phosphor'
                ? 'phosphorIconLayers'
                : layerType === 'element'
                  ? 'canvasElements'
                  : 'shapeLayers';

          const layers = [...(state[layerProp] || [])] as any[];
          const targetIdx = layers.findIndex((l) => l.id === layerId);
          if (targetIdx === -1) return state;

          const targetLayer = { ...layers[targetIdx] };
          if (!targetLayer.motions) return state;

          const currentBlock = targetLayer.motions.find((m: LayerMotionBlock) => m.id === blockId);
          if (!currentBlock) return state;

          const otherBlocks = targetLayer.motions
            .filter((m: LayerMotionBlock) => m.id !== blockId)
            .sort((a: LayerMotionBlock, b: LayerMotionBlock) => a.startTimeSec - b.startTimeSec);

          // Find left and right neighbors
          const leftNeighbors = otherBlocks.filter(
            (b: LayerMotionBlock) =>
              b.startTimeSec + b.durationSec <= currentBlock.startTimeSec + 0.05
          );
          const leftNeighbor =
            leftNeighbors.length > 0 ? leftNeighbors[leftNeighbors.length - 1] : null;
          const minStart = leftNeighbor ? leftNeighbor.startTimeSec + leftNeighbor.durationSec : 0;

          const initEnd = currentBlock.startTimeSec + currentBlock.durationSec;
          const rightNeighbors = otherBlocks.filter(
            (b: LayerMotionBlock) => b.startTimeSec >= initEnd - 0.05
          );
          const rightNeighbor = rightNeighbors.length > 0 ? rightNeighbors[0] : null;
          const maxBound = rightNeighbor ? rightNeighbor.startTimeSec : state.durationSec;

          let newStart = updates.startTimeSec ?? currentBlock.startTimeSec;
          let newDur = updates.durationSec ?? currentBlock.durationSec;

          newStart = Math.max(minStart, Math.min(Math.max(minStart, maxBound - newDur), newStart));
          newDur = Math.max(0.2, Math.min(maxBound - newStart, newDur));

          targetLayer.motions = targetLayer.motions
            .map((m: LayerMotionBlock) =>
              m.id === blockId
                ? { ...m, ...updates, startTimeSec: newStart, durationSec: newDur }
                : m
            )
            .sort((a: LayerMotionBlock, b: LayerMotionBlock) => a.startTimeSec - b.startTimeSec);

          layers[targetIdx] = targetLayer;
          return { [layerProp]: layers };
        }),

      removeLayerMotionBlock: (layerType, layerId, blockId) =>
        set((state) => {
          const layerProp =
            layerType === 'text'
              ? 'textLayers'
              : layerType === 'phosphor'
                ? 'phosphorIconLayers'
                : layerType === 'element'
                  ? 'canvasElements'
                  : 'shapeLayers';

          const layers = [...(state[layerProp] || [])] as any[];
          const targetIdx = layers.findIndex((l) => l.id === layerId);
          if (targetIdx === -1) return state;

          const targetLayer = { ...layers[targetIdx] };
          if (!targetLayer.motions) return state;

          targetLayer.motions = targetLayer.motions.filter(
            (m: LayerMotionBlock) => m.id !== blockId
          );
          layers[targetIdx] = targetLayer;
          return { [layerProp]: layers };
        }),

      addLayerKeyframe: (layerType, layerId, timeSec, props) =>
        set((state) => {
          const layerProp =
            layerType === 'text'
              ? 'textLayers'
              : layerType === 'phosphor'
                ? 'phosphorIconLayers'
                : layerType === 'element'
                  ? 'canvasElements'
                  : 'shapeLayers';

          const layers = [...(state[layerProp] || [])] as any[];
          const targetIdx = layers.findIndex((l) => l.id === layerId);
          if (targetIdx === -1) return state;

          const targetLayer = { ...layers[targetIdx] };
          const currentKfs: LayerKeyframe[] = targetLayer.keyframes ? [...targetLayer.keyframes] : [];
          const t =
            timeSec !== undefined
              ? Math.max(0, Math.min(state.durationSec || 10, timeSec))
              : state.currentTimeSec || 0;

          // If a keyframe already exists near this timestamp, update it
          const existingIdx = currentKfs.findIndex((k) => Math.abs(k.timeSec - t) < 0.08);
          const newKf: LayerKeyframe = {
            id:
              existingIdx !== -1
                ? currentKfs[existingIdx].id
                : `kf-layer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timeSec: Math.round(t * 100) / 100,
            x: targetLayer.x,
            y: targetLayer.y,
            width: targetLayer.width,
            height: targetLayer.height,
            scale: targetLayer.scale,
            scaleX: targetLayer.scaleX,
            scaleY: targetLayer.scaleY,
            rotation: targetLayer.rotation,
            pitch: targetLayer.pitch,
            yaw: targetLayer.yaw,
            opacity: targetLayer.opacity,
            borderRadius: targetLayer.borderRadius,
            fontSize: targetLayer.fontSize,
            ...props,
          };

          if (existingIdx !== -1) {
            currentKfs[existingIdx] = { ...currentKfs[existingIdx], ...newKf };
          } else {
            currentKfs.push(newKf);
          }

          currentKfs.sort((a, b) => a.timeSec - b.timeSec);
          targetLayer.keyframes = currentKfs;
          layers[targetIdx] = targetLayer;
          return { [layerProp]: layers };
        }),

      updateLayerKeyframe: (layerType, layerId, keyframeId, updates) =>
        set((state) => {
          const layerProp =
            layerType === 'text'
              ? 'textLayers'
              : layerType === 'phosphor'
                ? 'phosphorIconLayers'
                : layerType === 'element'
                  ? 'canvasElements'
                  : 'shapeLayers';

          const layers = [...(state[layerProp] || [])] as any[];
          const targetIdx = layers.findIndex((l) => l.id === layerId);
          if (targetIdx === -1) return state;

          const targetLayer = { ...layers[targetIdx] };
          if (!targetLayer.keyframes) return state;

          const updatedKfs = targetLayer.keyframes.map((k: LayerKeyframe) => {
            if (k.id !== keyframeId) return k;
            const updated = { ...k, ...updates };
            if (updates.timeSec !== undefined) {
              updated.timeSec = Math.max(0, Math.min(state.durationSec || 10, updates.timeSec));
            }
            return updated;
          });

          updatedKfs.sort((a: LayerKeyframe, b: LayerKeyframe) => a.timeSec - b.timeSec);
          targetLayer.keyframes = updatedKfs;
          layers[targetIdx] = targetLayer;
          return { [layerProp]: layers };
        }),

      removeLayerKeyframe: (layerType, layerId, keyframeId) =>
        set((state) => {
          const layerProp =
            layerType === 'text'
              ? 'textLayers'
              : layerType === 'phosphor'
                ? 'phosphorIconLayers'
                : layerType === 'element'
                  ? 'canvasElements'
                  : 'shapeLayers';

          const layers = [...(state[layerProp] || [])] as any[];
          const targetIdx = layers.findIndex((l) => l.id === layerId);
          if (targetIdx === -1) return state;

          const targetLayer = { ...layers[targetIdx] };
          if (!targetLayer.keyframes) return state;

          targetLayer.keyframes = targetLayer.keyframes.filter(
            (k: LayerKeyframe) => k.id !== keyframeId
          );
          layers[targetIdx] = targetLayer;
          return { [layerProp]: layers };
        }),

      captureLayerKeyframe: (layerType, layerId, timeSec) =>
        set((state) => {
          const layerProp =
            layerType === 'text'
              ? 'textLayers'
              : layerType === 'phosphor'
                ? 'phosphorIconLayers'
                : layerType === 'element'
                  ? 'canvasElements'
                  : 'shapeLayers';

          const layers = [...(state[layerProp] || [])] as any[];
          const targetIdx = layers.findIndex((l) => l.id === layerId);
          if (targetIdx === -1) return state;

          const targetLayer = { ...layers[targetIdx] };
          const currentKfs: LayerKeyframe[] = targetLayer.keyframes ? [...targetLayer.keyframes] : [];
          const t =
            timeSec !== undefined
              ? Math.max(0, Math.min(state.durationSec || 10, timeSec))
              : state.currentTimeSec || 0;

          const existingIdx = currentKfs.findIndex((k) => Math.abs(k.timeSec - t) < 0.08);
          const newKf: LayerKeyframe = {
            id:
              existingIdx !== -1
                ? currentKfs[existingIdx].id
                : `kf-layer-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timeSec: Math.round(t * 100) / 100,
            x: targetLayer.x,
            y: targetLayer.y,
            width: targetLayer.width,
            height: targetLayer.height,
            scale: targetLayer.scale,
            scaleX: targetLayer.scaleX,
            scaleY: targetLayer.scaleY,
            rotation: targetLayer.rotation,
            pitch: targetLayer.pitch,
            yaw: targetLayer.yaw,
            opacity: targetLayer.opacity,
            borderRadius: targetLayer.borderRadius,
            fontSize: targetLayer.fontSize,
          };

          if (existingIdx !== -1) {
            currentKfs[existingIdx] = newKf;
          } else {
            currentKfs.push(newKf);
          }

          currentKfs.sort((a, b) => a.timeSec - b.timeSec);
          targetLayer.keyframes = currentKfs;
          layers[targetIdx] = targetLayer;
          return { [layerProp]: layers };
        }),
    }),
    {
      limit: 50, // Keep last 50 history steps
      partialize: (state) => {
        // Exclude transient state like isPreviewMode from history tracking
        const { isPreviewMode, ...rest } = state;
        return rest;
      },
    }
  )
);
