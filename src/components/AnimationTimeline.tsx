import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  Play,
  PauseSquare,
  Plus,
  Trash01,
  Film01,
  RefreshCw01,
  ChevronDown,
  ChevronUp,
} from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import { getPhosphorIcon } from './phosphorIconRegistry';
import {
  ANIMATION_PRESETS,
  AnimationKeyframe,
  ELEMENT_LOOP_PRESETS,
  ElementLoopAnimation,
  EASING_PRESET_OPTIONS,
  AnimationEasing,
  AnimationEasingType,
  MOTION_PRESETS,
  LayerMotionBlock,
  LayerKeyframe,
  MotionPresetId,
  MotionCategory,
} from '../types/animationTypes';
import { EasingCurveEditor } from './EasingCurveEditor';
import { Toggle } from './Toggle';

type TimelineLayerType = 'text' | 'phosphor' | 'element' | 'shape' | 'group';

type TimelineSelectionItem =
  | { kind: 'mockup-keyframe'; keyframeId: string }
  | {
      kind: 'layer-keyframe';
      layerType: TimelineLayerType;
      layerId: string;
      keyframeId: string;
    }
  | {
      kind: 'motion';
      layerType: TimelineLayerType;
      layerId: string;
      blockId: string;
    };

type TimelineClipboardItem =
  | {
      selection: Extract<TimelineSelectionItem, { kind: 'mockup-keyframe' }>;
      timeSec: number;
      keyframe: AnimationKeyframe;
    }
  | {
      selection: Extract<TimelineSelectionItem, { kind: 'layer-keyframe' }>;
      timeSec: number;
      keyframe: LayerKeyframe;
    }
  | {
      selection: Extract<TimelineSelectionItem, { kind: 'motion' }>;
      timeSec: number;
      motion: LayerMotionBlock;
    };

interface TimelineDragItem {
  selection: TimelineSelectionItem;
  initialTimeSec: number;
  durationSec?: number;
}

const timelineSelectionKey = (item: TimelineSelectionItem) => {
  if (item.kind === 'mockup-keyframe') return `mockup:${item.keyframeId}`;
  if (item.kind === 'layer-keyframe') {
    return `keyframe:${item.layerType}:${item.layerId}:${item.keyframeId}`;
  }
  return `motion:${item.layerType}:${item.layerId}:${item.blockId}`;
};

const MIN_TIMELINE_PX_PER_SECOND = 72;
const MAX_TIMELINE_PX_PER_SECOND = 240;
const TIMELINE_SCALE_STEP = 12;

export const AnimationTimeline: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const leftTracksRef = useRef<HTMLDivElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const mockupTrackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineRootRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef(false);
  const timelineClipboardRef = useRef<TimelineClipboardItem[]>([]);
  const timelineDragItemsRef = useRef<TimelineDragItem[]>([]);
  const mockupDragStartXRef = useRef(0);
  const [timelinePxPerSecond, setTimelinePxPerSecond] = useState(MIN_TIMELINE_PX_PER_SECOND);

  const handleLeftTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;
    if (trackContainerRef.current) {
      trackContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const handleRightTracksScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;
    if (leftTracksRef.current) {
      leftTracksRef.current.scrollTop = e.currentTarget.scrollTop;
    }
    requestAnimationFrame(() => {
      isSyncingScrollRef.current = false;
    });
  };

  const PAD_PX = 20;
  const totalTrackWidth = Math.max(
    state.durationSec * timelinePxPerSecond + PAD_PX * 2,
    400
  );

  const updateTimelineScale = (requestedScale: number) => {
    const nextScale = Math.max(
      MIN_TIMELINE_PX_PER_SECOND,
      Math.min(MAX_TIMELINE_PX_PER_SECOND, requestedScale)
    );
    if (nextScale === timelinePxPerSecond) return;

    const container = scrollContainerRef.current;
    const centerTime = container
      ? Math.max(
          0,
          (container.scrollLeft + container.clientWidth / 2 - PAD_PX) / timelinePxPerSecond
        )
      : state.currentTimeSec;

    setTimelinePxPerSecond(nextScale);
    requestAnimationFrame(() => {
      if (!container) return;
      container.scrollLeft = Math.max(
        0,
        PAD_PX + centerTime * nextScale - container.clientWidth / 2
      );
    });
  };

  const videoDur =
    state.videoDuration && state.videoDuration > 0 ? Math.round(state.videoDuration) : null;
  const secondVideoDur =
    state.secondVideoDuration && state.secondVideoDuration > 0
      ? Math.round(state.secondVideoDuration)
      : null;

  const durationOptions = useMemo(() => {
    const defaultPresets = [3, 5, 8, 9, 10, 12, 15, 20];
    const set = new Set<number>(defaultPresets);
    if (videoDur) set.add(videoDur);
    if (secondVideoDur) set.add(secondVideoDur);
    if (state.durationSec) set.add(state.durationSec);
    return Array.from(set).sort((a, b) => a - b);
  }, [videoDur, secondVideoDur, state.durationSec]);

  const [draggingKfId, setDraggingKfId] = useState<string | null>(null);
  const [selectedKfId, setSelectedKfId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedTimelineItems, setSelectedTimelineItems] = useState<TimelineSelectionItem[]>([]);
  const [snapGuideTime, setSnapGuideTime] = useState<number | null>(null);
  const [motionCategoryFilter, setMotionCategoryFilter] = useState<
    'all' | 'entrance' | 'emphasis' | 'exit'
  >('all');
  const [draggingMotionBlock, setDraggingMotionBlock] = useState<{
    layerType: TimelineLayerType;
    layerId: string;
    blockId: string;
    startX: number;
    initialStartT: number;
    isResize?: boolean;
    initialDur?: number;
  } | null>(null);
  const [draggingLayerKf, setDraggingLayerKf] = useState<{
    layerType: TimelineLayerType;
    layerId: string;
    keyframeId: string;
    startX: number;
    initialT: number;
  } | null>(null);
  const [hoveredKfId, setHoveredKfId] = useState<string | null>(null);
  const [easingEditorTarget, setEasingEditorTarget] = useState<{
    layerType: TimelineLayerType;
    layerId: string;
    keyframeId: string;
    layerName: string;
  } | null>(null);
  const [mockupEasingEditorKeyframeId, setMockupEasingEditorKeyframeId] = useState<string | null>(
    null
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const clearTimelineSelectionOutside = (event: PointerEvent) => {
      if (timelineRootRef.current?.contains(event.target as Node)) return;
      setSelectedTimelineItems([]);
      setSelectedKfId(null);
      setSelectedBlockId(null);
    };
    document.addEventListener('pointerdown', clearTimelineSelectionOutside, true);
    return () => document.removeEventListener('pointerdown', clearTimelineSelectionOutside, true);
  }, []);

  // Selected track state: 'mockup' or a specific layer
  const [selectedTrack, setSelectedTrack] = useState<{
    type: 'mockup' | TimelineLayerType;
    id: string;
    name: string;
  }>({ type: 'mockup', id: 'mockup', name: 'Mockup' });

  // Automatically select the corresponding timeline track when an element is selected on canvas in Animate Mode
  useEffect(() => {
    if (!state.isAnimationMode) return;

    if (state.selectedLayerGroupId) {
      if (selectedTrack.type === 'group' && selectedTrack.id === state.selectedLayerGroupId) return;
      const group = (state.layerGroups || []).find((item) => item.id === state.selectedLayerGroupId);
      if (group) {
        setSelectedTrack({ type: 'group', id: group.id, name: group.name });
        const trackEl = leftTracksRef.current?.querySelector(`[data-track-id="${group.id}"]`);
        trackEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }

    if (state.selectedTextLayerId) {
      if (selectedTrack.type === 'text' && selectedTrack.id === state.selectedTextLayerId) return;
      const textLayer = (state.textLayers || []).find((l) => l.id === state.selectedTextLayerId);
      if (textLayer) {
        setSelectedTrack({
          type: 'text',
          id: textLayer.id,
          name: textLayer.name || textLayer.text || 'Text',
        });
        const trackEl = leftTracksRef.current?.querySelector(`[data-track-id="${textLayer.id}"]`);
        trackEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }

    if (state.selectedPhosphorIconLayerId) {
      if (selectedTrack.type === 'phosphor' && selectedTrack.id === state.selectedPhosphorIconLayerId) return;
      const iconLayer = (state.phosphorIconLayers || []).find((l) => l.id === state.selectedPhosphorIconLayerId);
      if (iconLayer) {
        setSelectedTrack({
          type: 'phosphor',
          id: iconLayer.id,
          name: iconLayer.name || iconLayer.iconId || 'Icon',
        });
        const trackEl = leftTracksRef.current?.querySelector(`[data-track-id="${iconLayer.id}"]`);
        trackEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }

    if (state.selectedElementId) {
      if (selectedTrack.type === 'element' && selectedTrack.id === state.selectedElementId) return;
      const el = (state.canvasElements || []).find((l) => l.id === state.selectedElementId);
      if (el) {
        setSelectedTrack({
          type: 'element',
          id: el.id,
          name: el.name || (el.category === 'emoji' ? 'Emoji' : 'Element'),
        });
        const trackEl = leftTracksRef.current?.querySelector(`[data-track-id="${el.id}"]`);
        trackEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }

    if (state.selectedShapeId) {
      if (selectedTrack.type === 'shape' && selectedTrack.id === state.selectedShapeId) return;
      const shape = (state.shapeLayers || []).find((l) => l.id === state.selectedShapeId);
      if (shape) {
        setSelectedTrack({
          type: 'shape',
          id: shape.id,
          name: shape.maskTarget
            ? `Mask: ${shape.name || shape.shapeType || 'Shape'}`
            : shape.name || shape.shapeType || 'Shape',
        });
        const trackEl = leftTracksRef.current?.querySelector(`[data-track-id="${shape.id}"]`);
        trackEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }
  }, [
    state.isAnimationMode,
    state.selectedLayerGroupId,
    state.selectedTextLayerId,
    state.selectedPhosphorIconLayerId,
    state.selectedElementId,
    state.selectedShapeId,
    state.textLayers,
    state.phosphorIconLayers,
    state.canvasElements,
    state.shapeLayers,
    state.layerGroups,
    selectedTrack.type,
    selectedTrack.id,
  ]);

  // Auto-scroll when playing if playhead reaches edge of scroll container
  useEffect(() => {
    if (state.isPlaying && scrollContainerRef.current) {
      const playheadX = PAD_PX + state.currentTimeSec * timelinePxPerSecond;
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const visibleWidth = container.clientWidth;

      if (playheadX > scrollLeft + visibleWidth - 80) {
        container.scrollLeft = playheadX - 80;
      } else if (playheadX < scrollLeft) {
        container.scrollLeft = Math.max(0, playheadX - 40);
      }
    }
  }, [state.currentTimeSec, state.isPlaying, timelinePxPerSecond]);

  // Initialize default keyframes with Start (0s) and End (10s) keyframes capturing current canvas pose
  useEffect(() => {
    if (state.keyframes.length === 0) {
      const startKf: AnimationKeyframe = {
        id: `kf-start-${Date.now()}`,
        timeSec: 0,
        rotateX: state.rotateX,
        rotateY: state.rotateY,
        zoom: state.zoom,
        slot2Zoom: state.slot2Zoom ?? state.zoom,
        offsetX: state.offsetX,
        offsetY: state.offsetY,
        slot2OffsetX: state.slot2OffsetX ?? 0,
        slot2OffsetY: state.slot2OffsetY ?? 0,
        slot1Rotate: state.slot1Rotate || 0,
        slot2Rotate: state.slot2Rotate || 0,
      };

      const endKf: AnimationKeyframe = {
        id: `kf-end-${Date.now() + 1}`,
        timeSec: state.durationSec || 10,
        rotateX: state.rotateX,
        rotateY: state.rotateY,
        zoom: state.zoom,
        slot2Zoom: state.slot2Zoom ?? state.zoom,
        offsetX: state.offsetX,
        offsetY: state.offsetY,
        slot2OffsetX: state.slot2OffsetX ?? 0,
        slot2OffsetY: state.slot2OffsetY ?? 0,
        slot1Rotate: state.slot1Rotate || 0,
        slot2Rotate: state.slot2Rotate || 0,
      };

      onChange({ keyframes: [startKf, endKf], activePresetId: '' });
    }
  }, [state.keyframes.length, onChange]);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Stable 60fps Playback Loop
  useEffect(() => {
    if (!state.isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000;
        const cur = stateRef.current.currentTimeSec;
        const dur = stateRef.current.durationSec;
        let nextTime = cur + delta;
        if (nextTime >= dur) {
          nextTime = 0; // Loop playback
        }
        onChange({ currentTimeSec: nextTime });
      }
      lastTimeRef.current = now;
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [state.isPlaying, onChange]);

  const isTimelineItemSelected = (item: TimelineSelectionItem) => {
    const key = timelineSelectionKey(item);
    return selectedTimelineItems.some((selected) => timelineSelectionKey(selected) === key);
  };

  const selectTimelineItem = (
    item: TimelineSelectionItem,
    event: Pick<React.PointerEvent, 'shiftKey' | 'metaKey' | 'ctrlKey'>
  ) => {
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    const key = timelineSelectionKey(item);
    const alreadySelected = selectedTimelineItems.some(
      (selected) => timelineSelectionKey(selected) === key
    );
    const nextSelection = !additive
      ? alreadySelected && selectedTimelineItems.length > 1
        ? selectedTimelineItems
        : [item]
      : alreadySelected
        ? selectedTimelineItems.filter((selected) => timelineSelectionKey(selected) !== key)
        : [...selectedTimelineItems, item];
    setSelectedTimelineItems(nextSelection);
    return nextSelection;
  };

  const getSnapCandidates = () => {
    const candidates = new Set<number>([0, state.durationSec, state.currentTimeSec]);
    state.keyframes.forEach((keyframe) => candidates.add(keyframe.timeSec));
    const layers = [
      ...(state.textLayers || []),
      ...(state.phosphorIconLayers || []),
      ...(state.canvasElements || []),
      ...(state.shapeLayers || []),
      ...(state.layerGroups || []),
    ];
    layers.forEach((layer) => {
      layer.keyframes?.forEach((keyframe) => candidates.add(keyframe.timeSec));
      layer.motions?.forEach((motion) => {
        candidates.add(motion.startTimeSec);
        candidates.add(motion.startTimeSec + motion.durationSec);
      });
    });
    return Array.from(candidates);
  };

  const snapTimelineTime = (rawTime: number, bypassSnap = false) => {
    const clamped = Math.max(0, Math.min(state.durationSec, rawTime));
    if (bypassSnap) {
      setSnapGuideTime(null);
      return Math.round(clamped * 100) / 100;
    }

    const gridTime = Math.round(clamped * 10) / 10;
    const thresholdSec = 8 / timelinePxPerSecond;
    let snappedTime = gridTime;
    let closestDistance = thresholdSec;
    getSnapCandidates().forEach((candidate) => {
      const distance = Math.abs(candidate - clamped);
      if (distance <= closestDistance) {
        snappedTime = candidate;
        closestDistance = distance;
      }
    });
    const rounded = Math.round(snappedTime * 100) / 100;
    setSnapGuideTime(closestDistance < thresholdSec ? rounded : null);
    return rounded;
  };

  // Global Keyboard Shortcut: Spacebar toggles Play/Pause in Animation Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        onChange({ isPlaying: !state.isPlaying });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, onChange]);

  // Load animation preset template for Mockup
  const applyPreset = (presetId: string) => {
    const preset = ANIMATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newKeyframes: AnimationKeyframe[] = preset.keyframes.map((kf, i) => ({
      ...kf,
      id: `kf-preset-${i}-${Date.now()}`,
    }));
    const maxTime = Math.max(...preset.keyframes.map((k) => k.timeSec), 3);
    onChange({
      activePresetId: presetId,
      keyframes: newKeyframes,
      durationSec: maxTime,
      currentTimeSec: 0,
    });
  };

  // Add current canvas state as a new keyframe for Mockup
  const addCurrentStateKeyframe = () => {
    const currentT = Math.round(state.currentTimeSec * 10) / 10;
    const existingIndex = state.keyframes.findIndex((kf) => Math.abs(kf.timeSec - currentT) < 0.2);

    const newKf: AnimationKeyframe = {
      id: `kf-user-${Date.now()}`,
      timeSec: currentT,
      rotateX: state.rotateX,
      rotateY: state.rotateY,
      zoom: state.zoom,
      slot2Zoom: state.slot2Zoom ?? state.zoom,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      slot2OffsetX: state.slot2OffsetX ?? 0,
      slot2OffsetY: state.slot2OffsetY ?? 0,
      slot1Rotate: state.slot1Rotate || 0,
      slot2Rotate: state.slot2Rotate || 0,
    };

    let updatedKf = [...state.keyframes];
    if (existingIndex >= 0) {
      updatedKf[existingIndex] = {
        ...newKf,
        easing: updatedKf[existingIndex].easing,
      };
    } else {
      updatedKf.push(newKf);
      updatedKf.sort((a, b) => a.timeSec - b.timeSec);
    }
    onChange({ keyframes: updatedKf });
    setSelectedKfId(newKf.id);
  };

  // Remove keyframe at index
  const deleteKeyframe = (id: string) => {
    if (state.keyframes.length <= 1) return;
    onChange({ keyframes: state.keyframes.filter((kf) => kf.id !== id) });
    if (selectedKfId === id) setSelectedKfId(null);
  };

  const getTimeFromX = (clientX: number, targetEl: HTMLElement) => {
    const rect = targetEl.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const time = (relativeX - PAD_PX) / timelinePxPerSecond;
    return Math.max(0, Math.min(state.durationSec, time));
  };

  // Keyframe Dragging Pointer Handlers
  const handleMarkerPointerDown = (e: React.PointerEvent, kf: AnimationKeyframe) => {
    e.stopPropagation();
    const nextSelection = selectTimelineItem(
      { kind: 'mockup-keyframe', keyframeId: kf.id },
      e
    );
    if (!nextSelection.some((item) => timelineSelectionKey(item) === `mockup:${kf.id}`)) {
      setSelectedKfId(null);
      return;
    }
    captureTimelineDragItems(nextSelection, 'keyframe');
    mockupDragStartXRef.current = e.clientX;
    setDraggingKfId(kf.id);
    setSelectedKfId(kf.id);
    setSelectedBlockId(null);
    onChange({ currentTimeSec: kf.timeSec, isPlaying: false });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMarkerPointerMove = (e: React.PointerEvent, kfId: string) => {
    if (draggingKfId !== kfId || !mockupTrackRef.current) return;
    const activeDragItem = timelineDragItemsRef.current.find(
      (item) =>
        item.selection.kind === 'mockup-keyframe' && item.selection.keyframeId === kfId
    );
    if (!activeDragItem) return;
    moveSelectedTimelineItems(
      (e.clientX - mockupDragStartXRef.current) / timelinePxPerSecond,
      activeDragItem.initialTimeSec,
      'keyframe',
      e.altKey
    );
  };

  const handleMarkerPointerUp = (e: React.PointerEvent) => {
    if (draggingKfId) {
      setDraggingKfId(null);
      setSnapGuideTime(null);
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  const handleDurationChange = (newDur: number) => {
    const maxAllowedDur = Math.max(
      20,
      videoDur || 0,
      secondVideoDur || 0,
      state.durationSec || 0,
      newDur
    );
    const targetDur = Math.min(maxAllowedDur, Math.max(2, newDur));
    const oldDur = state.durationSec;
    let updatedKf = state.keyframes
      .map((kf) => {
        if (Math.abs(kf.timeSec - oldDur) < 0.1) {
          return { ...kf, timeSec: targetDur };
        }
        return kf;
      })
      .filter((kf) => kf.timeSec <= targetDur);

    const hasEndKf = updatedKf.some((kf) => Math.abs(kf.timeSec - targetDur) < 0.1);
    if (!hasEndKf && updatedKf.length > 0) {
      const lastPose = updatedKf[updatedKf.length - 1];
      updatedKf.push({
        ...lastPose,
        id: `kf-end-${Date.now()}`,
        timeSec: targetDur,
      });
    }

    updatedKf.sort((a, b) => a.timeSec - b.timeSec);

    onChange({
      durationSec: targetDur,
      keyframes: updatedKf,
      currentTimeSec: Math.min(state.currentTimeSec, targetDur),
    });
  };

  const getLayerMotions = (
    type: TimelineLayerType,
    id: string
  ): LayerMotionBlock[] => {
    let layer: any = null;
    if (type === 'text') layer = (state.textLayers || []).find((l) => l.id === id);
    else if (type === 'phosphor') layer = (state.phosphorIconLayers || []).find((l) => l.id === id);
    else if (type === 'element') layer = (state.canvasElements || []).find((l) => l.id === id);
    else if (type === 'shape') layer = (state.shapeLayers || []).find((l) => l.id === id);
    else if (type === 'group') layer = (state.layerGroups || []).find((l) => l.id === id);

    if (!layer) return [];
    if (layer.motions && layer.motions.length > 0) return layer.motions;
    if (layer.loopAnimation && layer.loopAnimation !== 'none') {
      return [
        {
          id: `motion-legacy-${id}`,
          preset: layer.loopAnimation as MotionPresetId,
          startTimeSec: layer.animStartTime || 0,
          durationSec: layer.loopAnimation === 'counter' ? 1.2 : 2.5,
        },
      ];
    }
    return [];
  };

  const handleMotionBlockPointerDown = (
    e: React.PointerEvent,
    layerType: TimelineLayerType,
    layerId: string,
    block: LayerMotionBlock,
    isResize = false
  ) => {
    e.stopPropagation();
    if (!isResize) {
      const nextSelection = selectTimelineItem(
        { kind: 'motion', layerType, layerId, blockId: block.id },
        e
      );
      const selectionKey = `motion:${layerType}:${layerId}:${block.id}`;
      if (!nextSelection.some((item) => timelineSelectionKey(item) === selectionKey)) {
        setSelectedBlockId(null);
        return;
      }
      captureTimelineDragItems(nextSelection, 'motion');
      setSelectedBlockId(block.id);
      setSelectedKfId(null);
    }
    setSelectedTrack({
      type: layerType,
      id: layerId,
      name: selectedTrack.name,
    });
    if (layerType === 'text') state.selectTextLayer(layerId);
    else if (layerType === 'phosphor') state.selectPhosphorIconLayer(layerId);
    else if (layerType === 'element') state.selectCanvasElement(layerId);
    else if (layerType === 'shape') state.selectShapeLayer(layerId);
    else if (layerType === 'group') state.selectLayerGroup(layerId);
    setDraggingMotionBlock({
      layerType,
      layerId,
      blockId: block.id,
      startX: e.clientX,
      initialStartT: block.startTimeSec,
      isResize,
      initialDur: block.durationSec,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMotionBlockPointerMove = (e: React.PointerEvent) => {
    if (!draggingMotionBlock) return;
    const deltaX = e.clientX - draggingMotionBlock.startX;
    const deltaTime = deltaX / timelinePxPerSecond;

    const motions = getLayerMotions(draggingMotionBlock.layerType, draggingMotionBlock.layerId);
    const otherBlocks = motions
      .filter((b) => b.id !== draggingMotionBlock.blockId)
      .sort((a, b) => a.startTimeSec - b.startTimeSec);

    // Left neighbor: block that finishes before or at our initial start
    const leftNeighbors = otherBlocks.filter(
      (b) => b.startTimeSec + b.durationSec <= draggingMotionBlock.initialStartT + 0.05
    );
    const leftNeighbor = leftNeighbors.length > 0 ? leftNeighbors[leftNeighbors.length - 1] : null;
    const minAllowedStart = leftNeighbor ? leftNeighbor.startTimeSec + leftNeighbor.durationSec : 0;

    // Right neighbor: block that starts after or at our initial end
    const initEnd = draggingMotionBlock.initialStartT + (draggingMotionBlock.initialDur || 0);
    const rightNeighbors = otherBlocks.filter((b) => b.startTimeSec >= initEnd - 0.05);
    const rightNeighbor = rightNeighbors.length > 0 ? rightNeighbors[0] : null;
    const maxBoundary = rightNeighbor ? rightNeighbor.startTimeSec : state.durationSec;

    if (draggingMotionBlock.isResize) {
      const minDur = 0.3;
      const maxDur = Math.max(minDur, maxBoundary - draggingMotionBlock.initialStartT);
      const rawDur = Math.max(
        minDur,
        Math.min(maxDur, (draggingMotionBlock.initialDur || 1.5) + deltaTime)
      );
      const snappedEnd = snapTimelineTime(
        draggingMotionBlock.initialStartT + rawDur,
        e.altKey
      );
      const snappedDur = Math.max(minDur, snappedEnd - draggingMotionBlock.initialStartT);
      state.updateLayerMotionBlock(
        draggingMotionBlock.layerType,
        draggingMotionBlock.layerId,
        draggingMotionBlock.blockId,
        {
          durationSec: snappedDur,
        }
      );
    } else {
      moveSelectedTimelineItems(
        deltaTime,
        draggingMotionBlock.initialStartT,
        'motion',
        e.altKey
      );
    }
  };

  const handleMotionBlockPointerUp = (e: React.PointerEvent) => {
    if (draggingMotionBlock) {
      setDraggingMotionBlock(null);
      setSnapGuideTime(null);
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  const getLayerKeyframes = (
    type: TimelineLayerType,
    id: string
  ): LayerKeyframe[] => {
    if (type === 'text') {
      return (state.textLayers || []).find((l) => l.id === id)?.keyframes || [];
    }
    if (type === 'phosphor') {
      return (state.phosphorIconLayers || []).find((l) => l.id === id)?.keyframes || [];
    }
    if (type === 'element') {
      return (state.canvasElements || []).find((l) => l.id === id)?.keyframes || [];
    }
    if (type === 'shape') {
      return (state.shapeLayers || []).find((l) => l.id === id)?.keyframes || [];
    }
    if (type === 'group') {
      return (state.layerGroups || []).find((l) => l.id === id)?.keyframes || [];
    }
    return [];
  };

  const captureTimelineDragItems = (
    selection: TimelineSelectionItem[],
    family: 'keyframe' | 'motion'
  ) => {
    const items: TimelineDragItem[] = [];
    selection.forEach((item) => {
      if (family === 'keyframe' && item.kind === 'mockup-keyframe') {
        const keyframe = state.keyframes.find((candidate) => candidate.id === item.keyframeId);
        if (keyframe) items.push({ selection: item, initialTimeSec: keyframe.timeSec });
      } else if (family === 'keyframe' && item.kind === 'layer-keyframe') {
        const keyframe = getLayerKeyframes(item.layerType, item.layerId).find(
          (candidate) => candidate.id === item.keyframeId
        );
        if (keyframe) items.push({ selection: item, initialTimeSec: keyframe.timeSec });
      } else if (family === 'motion' && item.kind === 'motion') {
        const motion = getLayerMotions(item.layerType, item.layerId).find(
          (candidate) => candidate.id === item.blockId
        );
        if (motion) {
          items.push({
            selection: item,
            initialTimeSec: motion.startTimeSec,
            durationSec: motion.durationSec,
          });
        }
      }
    });
    timelineDragItemsRef.current = items;
  };

  const moveSelectedTimelineItems = (
    rawDelta: number,
    activeInitialTime: number,
    family: 'keyframe' | 'motion',
    bypassSnap: boolean
  ) => {
    const items = timelineDragItemsRef.current.filter((item) =>
      family === 'keyframe' ? item.selection.kind !== 'motion' : item.selection.kind === 'motion'
    );
    if (items.length === 0) return activeInitialTime;

    let minimumDelta = -Math.min(...items.map((item) => item.initialTimeSec));
    let maximumDelta = Math.min(
      ...items.map(
        (item) => state.durationSec - item.initialTimeSec - (item.durationSec || 0)
      )
    );

    if (family === 'motion') {
      const selectedKeys = new Set(items.map((item) => timelineSelectionKey(item.selection)));
      items.forEach((item) => {
        if (item.selection.kind !== 'motion') return;
        const selection = item.selection;
        const unselected = getLayerMotions(selection.layerType, selection.layerId).filter(
          (motion) =>
            !selectedKeys.has(
              timelineSelectionKey({
                kind: 'motion',
                layerType: selection.layerType,
                layerId: selection.layerId,
                blockId: motion.id,
              })
            )
        );
        const initialEnd = item.initialTimeSec + (item.durationSec || 0);
        unselected.forEach((motion) => {
          const motionEnd = motion.startTimeSec + motion.durationSec;
          if (motionEnd <= item.initialTimeSec + 0.05) {
            minimumDelta = Math.max(minimumDelta, motionEnd - item.initialTimeSec);
          } else if (motion.startTimeSec >= initialEnd - 0.05) {
            maximumDelta = Math.min(maximumDelta, motion.startTimeSec - initialEnd);
          }
        });
      });
    }

    const rawActiveTime = activeInitialTime + rawDelta;
    const snappedActiveTime = snapTimelineTime(rawActiveTime, bypassSnap);
    const delta = Math.max(
      minimumDelta,
      Math.min(maximumDelta, snappedActiveTime - activeInitialTime)
    );
    const targetTimes = new Map(
      items.map((item) => [
        timelineSelectionKey(item.selection),
        Math.round((item.initialTimeSec + delta) * 100) / 100,
      ])
    );

    useStudioStore.setState((current) => {
      const partial: Record<string, unknown> = {};
      if (family === 'keyframe') {
        partial.keyframes = current.keyframes
          .map((keyframe) => {
            const timeSec = targetTimes.get(`mockup:${keyframe.id}`);
            return timeSec === undefined ? keyframe : { ...keyframe, timeSec };
          })
          .sort((a, b) => a.timeSec - b.timeSec);
      }

      const layerCollections = [
        ['textLayers', current.textLayers],
        ['phosphorIconLayers', current.phosphorIconLayers],
        ['canvasElements', current.canvasElements],
        ['shapeLayers', current.shapeLayers],
        ['layerGroups', current.layerGroups],
      ] as const;
      layerCollections.forEach(([property, layers]) => {
        let collectionChanged = false;
        const updatedLayers = layers.map((layer) => {
          let layerChanged = false;
          const layerType =
            property === 'textLayers'
              ? 'text'
              : property === 'phosphorIconLayers'
                ? 'phosphor'
                : property === 'canvasElements'
                  ? 'element'
                  : property === 'layerGroups'
                    ? 'group'
                    : 'shape';
          if (family === 'keyframe' && layer.keyframes) {
            const keyframes = layer.keyframes.map((keyframe) => {
              const timeSec = targetTimes.get(
                `keyframe:${layerType}:${layer.id}:${keyframe.id}`
              );
              if (timeSec === undefined) return keyframe;
              layerChanged = true;
              collectionChanged = true;
              return { ...keyframe, timeSec };
            });
            return layerChanged
              ? { ...layer, keyframes: keyframes.sort((a, b) => a.timeSec - b.timeSec) }
              : layer;
          }
          if (family === 'motion' && layer.motions) {
            const motions = layer.motions.map((motion) => {
              const startTimeSec = targetTimes.get(
                `motion:${layerType}:${layer.id}:${motion.id}`
              );
              if (startTimeSec === undefined) return motion;
              layerChanged = true;
              collectionChanged = true;
              return { ...motion, startTimeSec };
            });
            return layerChanged
              ? { ...layer, motions: motions.sort((a, b) => a.startTimeSec - b.startTimeSec) }
              : layer;
          }
          return layer;
        });
        if (collectionChanged) partial[property] = updatedLayers;
      });
      return partial as any;
    });

    const activeTime = Math.round((activeInitialTime + delta) * 100) / 100;
    onChange({ currentTimeSec: activeTime });
    return activeTime;
  };

  const copySelectedTimelineItems = () => {
    const copied: TimelineClipboardItem[] = [];
    selectedTimelineItems.forEach((selection) => {
      if (selection.kind === 'mockup-keyframe') {
        const keyframe = state.keyframes.find((item) => item.id === selection.keyframeId);
        if (keyframe) copied.push({ selection, timeSec: keyframe.timeSec, keyframe: { ...keyframe } });
        return;
      }
      if (selection.kind === 'layer-keyframe') {
        const keyframe = getLayerKeyframes(selection.layerType, selection.layerId).find(
          (item) => item.id === selection.keyframeId
        );
        if (keyframe) copied.push({ selection, timeSec: keyframe.timeSec, keyframe: { ...keyframe } });
        return;
      }
      const motion = getLayerMotions(selection.layerType, selection.layerId).find(
        (item) => item.id === selection.blockId
      );
      if (motion) copied.push({ selection, timeSec: motion.startTimeSec, motion: { ...motion } });
    });
    if (copied.length > 0) timelineClipboardRef.current = copied;
  };

  const pasteTimelineItems = () => {
    const clipboard = timelineClipboardRef.current;
    if (clipboard.length === 0) return;

    const earliestTime = Math.min(...clipboard.map((item) => item.timeSec));
    const latestEnd = Math.max(
      ...clipboard.map((item) =>
        'motion' in item ? item.timeSec + item.motion.durationSec : item.timeSec
      )
    );
    const copiedSpan = latestEnd - earliestTime;
    const pasteOrigin = Math.min(state.currentTimeSec, Math.max(0, state.durationSec - copiedSpan));
    const timestamp = Date.now();
    const nextSelection: TimelineSelectionItem[] = [];
    const mockupKeyframes = [...state.keyframes];

    const avoidOccupiedTime = (requested: number, occupied: number[]) => {
      let candidate = Math.max(0, Math.min(state.durationSec, requested));
      while (
        occupied.some((time) => Math.abs(time - candidate) < 0.08) &&
        candidate < state.durationSec
      ) {
        candidate = Math.min(state.durationSec, Math.round((candidate + 0.1) * 100) / 100);
      }
      return candidate;
    };

    clipboard.forEach((item, index) => {
      const requestedTime = pasteOrigin + (item.timeSec - earliestTime);
      if (item.selection.kind === 'mockup-keyframe' && 'keyframe' in item) {
        const sourceKeyframe = item.keyframe as AnimationKeyframe;
        const timeSec = avoidOccupiedTime(
          requestedTime,
          mockupKeyframes.map((keyframe) => keyframe.timeSec)
        );
        const id = `kf-paste-${timestamp}-${index}`;
        mockupKeyframes.push({ ...sourceKeyframe, id, timeSec });
        nextSelection.push({ kind: 'mockup-keyframe', keyframeId: id });
        return;
      }

      if (item.selection.kind === 'layer-keyframe' && 'keyframe' in item) {
        const sourceKeyframe = item.keyframe as LayerKeyframe;
        const existingKeyframes = getLayerKeyframes(
          item.selection.layerType,
          item.selection.layerId
        );
        const timeSec = avoidOccupiedTime(
          requestedTime,
          existingKeyframes.map((keyframe) => keyframe.timeSec)
        );
        const id = `kf-layer-paste-${timestamp}-${index}`;
        const { id: _sourceId, timeSec: _sourceTime, ...properties } = sourceKeyframe;
        state.addLayerKeyframe(item.selection.layerType, item.selection.layerId, timeSec, {
          ...properties,
          id,
        });
        nextSelection.push({
          kind: 'layer-keyframe',
          layerType: item.selection.layerType,
          layerId: item.selection.layerId,
          keyframeId: id,
        });
        return;
      }

      if (item.selection.kind === 'motion' && 'motion' in item) {
        const selection = item.selection;
        const beforeIds = new Set(
          getLayerMotions(selection.layerType, selection.layerId).map(
            (motion) => motion.id
          )
        );
        state.addLayerMotionBlock(
          selection.layerType,
          selection.layerId,
          item.motion.preset,
          requestedTime,
          item.motion.durationSec
        );
        const freshState = useStudioStore.getState() as any;
        const layerProp =
          selection.layerType === 'text'
            ? 'textLayers'
            : selection.layerType === 'phosphor'
              ? 'phosphorIconLayers'
              : selection.layerType === 'element'
                ? 'canvasElements'
                : selection.layerType === 'group'
                  ? 'layerGroups'
                  : 'shapeLayers';
        const freshLayer = freshState[layerProp]?.find(
          (layer: { id: string }) => layer.id === selection.layerId
        );
        const created = freshLayer?.motions?.find(
          (motion: LayerMotionBlock) => !beforeIds.has(motion.id)
        );
        if (created) {
          nextSelection.push({
            kind: 'motion',
            layerType: selection.layerType,
            layerId: selection.layerId,
            blockId: created.id,
          });
        }
      }
    });

    if (mockupKeyframes.length !== state.keyframes.length) {
      mockupKeyframes.sort((a, b) => a.timeSec - b.timeSec);
      onChange({ keyframes: mockupKeyframes });
    }
    setSelectedTimelineItems(nextSelection);
    setSelectedKfId(null);
    setSelectedBlockId(null);
  };

  const deleteSelectedTimelineItems = () => {
    const mockupIds = new Set(
      selectedTimelineItems
        .filter((item): item is Extract<TimelineSelectionItem, { kind: 'mockup-keyframe' }> =>
          item.kind === 'mockup-keyframe'
        )
        .map((item) => item.keyframeId)
    );
    if (mockupIds.size > 0) {
      const remaining = state.keyframes.filter((keyframe) => !mockupIds.has(keyframe.id));
      if (remaining.length > 0) onChange({ keyframes: remaining });
    }
    selectedTimelineItems.forEach((item) => {
      if (item.kind === 'layer-keyframe') {
        state.removeLayerKeyframe(item.layerType, item.layerId, item.keyframeId);
      } else if (item.kind === 'motion') {
        state.removeLayerMotionBlock(item.layerType, item.layerId, item.blockId);
      }
    });
    setSelectedTimelineItems([]);
    setSelectedKfId(null);
    setSelectedBlockId(null);
  };

  useEffect(() => {
    const handleTimelineClipboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const commandKey = event.metaKey || event.ctrlKey;
      if (commandKey && event.key.toLowerCase() === 'c' && selectedTimelineItems.length > 0) {
        event.preventDefault();
        copySelectedTimelineItems();
      } else if (commandKey && event.key.toLowerCase() === 'v' && timelineClipboardRef.current.length > 0) {
        event.preventDefault();
        pasteTimelineItems();
      } else if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedTimelineItems.length > 0
      ) {
        event.preventDefault();
        deleteSelectedTimelineItems();
      }
    };
    window.addEventListener('keydown', handleTimelineClipboard);
    return () => window.removeEventListener('keydown', handleTimelineClipboard);
  });

  const handleLayerKfPointerDown = (
    e: React.PointerEvent,
    layerType: TimelineLayerType,
    layerId: string,
    kf: LayerKeyframe
  ) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const nextSelection = selectTimelineItem(
      { kind: 'layer-keyframe', layerType, layerId, keyframeId: kf.id },
      e
    );
    const selectionKey = `keyframe:${layerType}:${layerId}:${kf.id}`;
    if (!nextSelection.some((item) => timelineSelectionKey(item) === selectionKey)) {
      setSelectedKfId(null);
      return;
    }
    captureTimelineDragItems(nextSelection, 'keyframe');
    setDraggingLayerKf({
      layerType,
      layerId,
      keyframeId: kf.id,
      startX: e.clientX,
      initialT: kf.timeSec,
    });
    setSelectedKfId(kf.id);
    setSelectedBlockId(null);
  };

  const handleLayerKfPointerMove = (e: React.PointerEvent) => {
    if (!draggingLayerKf) return;
    e.stopPropagation();
    const dx = e.clientX - draggingLayerKf.startX;
    const dt = dx / timelinePxPerSecond;
    moveSelectedTimelineItems(
      dt,
      draggingLayerKf.initialT,
      'keyframe',
      e.altKey
    );
  };

  const handleLayerKfPointerUp = (e: React.PointerEvent) => {
    if (!draggingLayerKf) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setDraggingLayerKf(null);
    setSnapGuideTime(null);
  };

  // Build Layer Track Rows matching the exact order in RightSidebar Layers panel
  const buildLayerRows = () => {
    const buildRow = (
      type: TimelineLayerType,
      id: string,
      name: string,
      indicator: React.ReactNode
    ) => ({ key: `${type}-${id}`, type, id, name, indicator, depth: 0, parentGroupId: null as string | null });

    const allRows: ReturnType<typeof buildRow>[] = [];

    (state.textLayers || []).forEach((l) =>
      allRows.push(
        buildRow(
          'text',
          l.id,
          l.name || l.text || 'Text',
          <PhosphorIcons.TextTIcon className="w-3.5 h-3.5 text-pastel-blue shrink-0" />
        )
      )
    );

    (state.phosphorIconLayers || []).forEach((l) => {
      const IconComp = getPhosphorIcon(l.iconId);
      allRows.push(
        buildRow(
          'phosphor',
          l.id,
          l.name || l.iconId || 'Icon',
          <IconComp className="w-3.5 h-3.5 text-pastel-pink shrink-0" />
        )
      );
    });

    (state.canvasElements || []).forEach((el) => {
      const CatIcon =
        el.category === 'emoji'
          ? PhosphorIcons.SmileyIcon
          : el.category === 'line'
            ? PhosphorIcons.LineSegmentIcon
            : PhosphorIcons.ArrowRightIcon;
      allRows.push(
        buildRow(
          'element',
          el.id,
          el.name || (el.category === 'emoji' ? 'Emoji' : 'Element'),
          <CatIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        )
      );
    });

    (state.shapeLayers || []).forEach((s) => {
      const ShapeCatIcon =
        s.shapeType === 'circle'
          ? PhosphorIcons.CircleIcon
          : s.shapeType === 'triangle'
            ? PhosphorIcons.TriangleIcon
            : s.shapeType === 'hexagon'
              ? PhosphorIcons.HexagonIcon
              : s.shapeType === 'quote'
                ? PhosphorIcons.QuotesIcon
                : s.shapeType === 'coolshape'
                  ? PhosphorIcons.SparkleIcon || PhosphorIcons.SquareIcon
                  : s.shapeType === 'custom-path'
                    ? PhosphorIcons.IntersectIcon || PhosphorIcons.SquareIcon
                    : s.shapeType === 'rectangle'
                      ? PhosphorIcons.RectangleIcon
                      : PhosphorIcons.SquareIcon;
      allRows.push(
        buildRow(
          'shape',
          s.id,
          s.maskTarget ? `Mask: ${s.name || s.shapeType || 'Shape'}` : s.name || s.shapeType || 'Shape',
          s.maskTarget
            ? <PhosphorIcons.MagicWandIcon className="w-3.5 h-3.5 text-pastel-pink shrink-0" />
            : <ShapeCatIcon className="w-3.5 h-3.5 text-pastel-green shrink-0" />
        )
      );
    });

    (state.layerGroups || []).forEach((group) =>
      allRows.push(
        buildRow(
          'group',
          group.id,
          group.name || 'Group',
          <PhosphorIcons.FolderIcon className="w-3.5 h-3.5 text-pastel-pink shrink-0" />
        )
      )
    );

    // Sort by layerOrder (topmost layer on top)
    const layerOrder = state.layerOrder || [];
    const getRowOrder = (row: (typeof allRows)[number]) => {
      if (row.type === 'group') {
        const group = (state.layerGroups || []).find((item) => item.id === row.id);
        if (!group) return 9999;
        return Math.min(
          ...group.members.map((member) => {
            const index = layerOrder.findIndex(
              (item) => item.type === member.type && item.id === member.id
            );
            return index === -1 ? 9999 : index;
          })
        );
      }
      const index = layerOrder.findIndex((item) => item.type === row.type && item.id === row.id);
      return index === -1 ? 9999 : index;
    };
    const sortedRootRows = allRows
      .filter((row) => {
        if (row.type === 'group') return true;
        return !(state.layerGroups || []).some((group) =>
          group.members.some((member) => member.type === row.type && member.id === row.id)
        );
      })
      .sort((a, b) => {
      const idxA = getRowOrder(a);
      const idxB = getRowOrder(b);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sortedRootRows.flatMap((row) => {
      if (row.type !== 'group') return [row];
      const group = (state.layerGroups || []).find((item) => item.id === row.id);
      if (!group) return [row];
      const childRows = group.members
        .map((member) =>
          allRows.find((candidate) => candidate.type === member.type && candidate.id === member.id)
        )
        .filter((candidate): candidate is (typeof allRows)[number] => Boolean(candidate))
        .sort((a, b) => getRowOrder(a) - getRowOrder(b))
        .map((child) => ({ ...child, depth: 1, parentGroupId: group.id }));
      return [row, ...childRows];
    });
  };

  const layerTracks = buildLayerRows();
  const totalTracksHeight = Math.max(8 + layerTracks.length * 32 + 36, 96);
  const easingEditorKeyframes = easingEditorTarget
    ? [...getLayerKeyframes(easingEditorTarget.layerType, easingEditorTarget.layerId)].sort(
        (a, b) => a.timeSec - b.timeSec
      )
    : [];
  const easingEditorIndex = easingEditorTarget
    ? easingEditorKeyframes.findIndex((keyframe) => keyframe.id === easingEditorTarget.keyframeId)
    : -1;
  const easingEditorKeyframe =
    easingEditorIndex >= 0 ? easingEditorKeyframes[easingEditorIndex] : null;
  const easingEditorNextKeyframe =
    easingEditorIndex >= 0 ? easingEditorKeyframes[easingEditorIndex + 1] : null;
  const sortedMockupKeyframes = [...state.keyframes].sort((a, b) => a.timeSec - b.timeSec);
  const mockupEasingEditorIndex = mockupEasingEditorKeyframeId
    ? sortedMockupKeyframes.findIndex(
        (keyframe) => keyframe.id === mockupEasingEditorKeyframeId
      )
    : -1;
  const mockupEasingEditorKeyframe =
    mockupEasingEditorIndex >= 0 ? sortedMockupKeyframes[mockupEasingEditorIndex] : null;
  const mockupEasingEditorNextKeyframe =
    mockupEasingEditorIndex >= 0
      ? sortedMockupKeyframes[mockupEasingEditorIndex + 1]
      : null;

  // Find currently active loop animation for selected layer
  const getSelectedLayerActiveLoop = (): ElementLoopAnimation => {
    if (selectedTrack.type === 'text') {
      return (
        (state.textLayers || []).find((l) => l.id === selectedTrack.id)?.loopAnimation || 'none'
      );
    }
    if (selectedTrack.type === 'phosphor') {
      return (
        (state.phosphorIconLayers || []).find((l) => l.id === selectedTrack.id)?.loopAnimation ||
        'none'
      );
    }
    if (selectedTrack.type === 'element') {
      return (
        (state.canvasElements || []).find((l) => l.id === selectedTrack.id)?.loopAnimation || 'none'
      );
    }
    if (selectedTrack.type === 'shape') {
      return (
        (state.shapeLayers || []).find((l) => l.id === selectedTrack.id)?.loopAnimation || 'none'
      );
    }
    return 'none';
  };

  const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const newTime = Math.round(getTimeFromX(e.clientX, e.currentTarget) * 10) / 10;
    onChange({ currentTimeSec: newTime });
    setSelectedBlockId(null);
    setSelectedKfId(null);
    setSelectedTimelineItems([]);
  };

  if (isCollapsed) {
    return (
      <div className="w-full bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl px-3 py-2 flex items-center justify-between z-50 text-white shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-7 h-7 rounded-lg bg-pastel-pink/20 text-pastel-pink flex items-center justify-center hover:bg-pastel-pink/30 transition-all cursor-pointer shrink-0"
            title="Expand Animation Timeline"
          >
            <Film01 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onChange({ isPlaying: !state.isPlaying })}
            className="p-1 hover:bg-neutral-800 text-pastel-pink rounded-lg transition-all cursor-pointer shrink-0"
            title={state.isPlaying ? 'Pause' : 'Play'}
          >
            {state.isPlaying ? (
              <PauseSquare className="w-5 h-5 fill-pastel-pink text-pastel-pink" />
            ) : (
              <Play className="w-5 h-5 fill-pastel-pink text-pastel-pink ml-0.5" />
            )}
          </button>

          <span className="font-mono text-xs text-slate-300">
            {state.currentTimeSec.toFixed(1)}s / {state.durationSec}s
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(false)}
          className="text-xs text-slate-400 hover:text-pastel-pink flex items-center gap-1 font-semibold cursor-pointer transition-colors"
        >
          <span>Open Timeline</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const playheadPercent = (state.currentTimeSec / state.durationSec) * 100;

  return (
    <>
    <div
      ref={timelineRootRef}
      data-timeline-selection-count={selectedTimelineItems.length}
      className="w-full bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 z-50 text-white shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-2.5"
    >
      {/* Top Header Row: Play Controls, Duration, Minimize */}
      <div className="flex items-center border-b border-neutral-800/80 pb-2 gap-1.5">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 overflow-x-auto overscroll-x-contain no-scrollbar sm:overflow-x-visible">
        {/* Left: Play/Pause, Time, Reset */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onChange({ isPlaying: !state.isPlaying })}
            className="p-1.5 hover:bg-neutral-800 bg-neutral-900 border border-neutral-800 text-pastel-pink rounded-lg transition-all cursor-pointer shrink-0"
            title={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {state.isPlaying ? (
              <PauseSquare className="w-4 h-4 fill-pastel-pink text-pastel-pink" />
            ) : (
              <Play className="w-4 h-4 fill-pastel-pink text-pastel-pink ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-200 bg-neutral-900/80 border border-neutral-800 px-2 py-1 rounded-lg">
            <span className="text-pastel-pink">{state.currentTimeSec.toFixed(1)}s</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{state.durationSec}s</span>
          </div>

          <button
            onClick={() => onChange({ currentTimeSec: 0, isPlaying: false })}
            className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-white rounded-lg border border-neutral-800 transition-all cursor-pointer"
            title="Reset Timeline to 0s"
          >
            <RefreshCw01 className="w-3.5 h-3.5" />
          </button>
          {selectedTimelineItems.length > 0 && (
            <span
              className="shrink-0 rounded-md border border-pastel-blue/40 bg-pastel-blue/15 px-2 py-1 text-[10px] font-bold text-pastel-blue"
              title="Shift/Cmd/Ctrl-click placed keyframes or motion blocks to select multiple"
            >
              {selectedTimelineItems.length} selected
            </span>
          )}
        </div>

        {/* Right: Length Selector, Add Keyframe (for Mockup), Collapse */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className="flex items-center gap-0.5 bg-neutral-900 border border-neutral-800 rounded-lg px-0.5 py-1 text-xs text-slate-300 shrink-0"
            title={`Timeline zoom: ${Math.round((timelinePxPerSecond / MIN_TIMELINE_PX_PER_SECOND) * 100)}%`}
          >
            <button
              type="button"
              onClick={() => updateTimelineScale(timelinePxPerSecond - TIMELINE_SCALE_STEP)}
              disabled={timelinePxPerSecond <= MIN_TIMELINE_PX_PER_SECOND}
              className="w-4 h-5 rounded text-sm font-bold text-slate-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Zoom timeline out"
            >
              −
            </button>
            <input
              type="range"
              min={MIN_TIMELINE_PX_PER_SECOND}
              max={MAX_TIMELINE_PX_PER_SECOND}
              step={TIMELINE_SCALE_STEP}
              value={timelinePxPerSecond}
              onChange={(event) => updateTimelineScale(Number(event.target.value))}
              className="hidden md:block w-12 lg:w-16 accent-pastel-pink cursor-ew-resize"
              aria-label="Timeline zoom"
            />
            <button
              type="button"
              onClick={() => updateTimelineScale(timelinePxPerSecond + TIMELINE_SCALE_STEP)}
              disabled={timelinePxPerSecond >= MAX_TIMELINE_PX_PER_SECOND}
              className="w-4 h-5 rounded text-sm font-bold text-slate-400 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Zoom timeline in"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg px-1.5 sm:px-2 py-1 text-xs text-slate-300 shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase hidden sm:inline">
              Duration:
            </span>
            <select
              value={state.durationSec}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              className="bg-transparent text-pastel-pink font-mono font-bold text-xs outline-none cursor-pointer w-auto min-w-[32px] max-w-[54px] text-center sm:text-left"
            >
              {durationOptions.map((dur) => {
                const isVideoDur =
                  (videoDur && dur === videoDur) || (secondVideoDur && dur === secondVideoDur);
                return (
                  <option key={dur} value={dur} className="bg-neutral-900 text-white">
                    {dur}s
                  </option>
                );
              })}
            </select>
            {videoDur && state.durationSec !== videoDur && (
              <button
                type="button"
                onClick={() => handleDurationChange(videoDur)}
                title={`Match video duration (${videoDur}s)`}
                className="px-1.5 py-0.5 rounded bg-pastel-pink/15 text-pastel-pink hover:bg-pastel-pink/25 border border-pastel-pink/30 text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap"
              >
                Match Video ({videoDur}s)
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-1.5 sm:px-2 py-1 text-xs text-slate-300 shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase hidden sm:inline">
              Easing:
            </span>
            <select
              value={state.animationEasing || 'ease-in-out'}
              onChange={(e) => onChange({ animationEasing: e.target.value as AnimationEasingType })}
              className="bg-transparent text-pastel-pink font-semibold text-xs outline-none cursor-pointer"
            >
              {EASING_PRESET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-neutral-900 text-white">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTrack.type === 'mockup' && (
            <button
              onClick={addCurrentStateKeyframe}
              className="px-2.5 py-1 bg-pastel-pink/15 hover:bg-pastel-pink/25 text-pastel-pink border border-pastel-pink/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Add a 3D keyframe pose at current time"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Keyframe</span>
            </button>
          )}

        </div>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex h-7 w-7 shrink-0 self-center items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-slate-400 transition-all hover:border-neutral-700 hover:bg-neutral-800 hover:text-pastel-pink cursor-pointer"
          title="Minimize Timeline"
          aria-label="Minimize Timeline"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: Context-Aware Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar bg-neutral-900/50 p-1.5 rounded-xl border border-neutral-800/80">
        <div
          className={`flex h-7 shrink-0 items-center gap-2 rounded-lg border px-2 transition-colors ${
            state.motionBlurEnabled
              ? 'border-pastel-blue/50 bg-pastel-blue/10'
              : 'border-neutral-800 bg-neutral-950/80'
          }`}
          title="Add velocity-based blur to moving layers and mockups"
        >
          <PhosphorIcons.WindIcon
            className={`h-3.5 w-3.5 ${state.motionBlurEnabled ? 'text-pastel-blue' : 'text-slate-500'}`}
          />
          <span className="whitespace-nowrap text-[10px] font-bold text-slate-300">
            Motion blur
          </span>
          <Toggle
            aria-label="Enable motion blur"
            slim
            isSelected={!!state.motionBlurEnabled}
            onChange={(motionBlurEnabled) => onChange({ motionBlurEnabled })}
          />
          {state.motionBlurEnabled && (
            <>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={state.motionBlurStrength ?? 50}
                onChange={(event) => onChange({ motionBlurStrength: Number(event.target.value) })}
                className="w-14 accent-pastel-blue cursor-ew-resize"
                aria-label="Motion blur strength"
              />
              <span className="w-7 text-right font-mono text-[9px] text-pastel-blue">
                {state.motionBlurStrength ?? 50}%
              </span>
            </>
          )}
        </div>

        <div className="mx-0.5 h-4 w-px shrink-0 bg-neutral-800" />

        {selectedTrack.type === 'mockup' ? (
          <>
            <span className="text-[10px] uppercase font-bold text-pastel-pink mr-1 shrink-0 flex items-center gap-1">
              <PhosphorIcons.CubeIcon className="w-3.5 h-3.5" />
              <span>Mockup Motions:</span>
            </span>
            {ANIMATION_PRESETS.map((preset) => {
              const isSelected = state.activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              );
            })}
          </>
        ) : (
          <>
            {/* Add Custom Layer Keyframe Button */}
            <button
              onClick={() => {
                state.captureLayerKeyframe(
                  selectedTrack.type as any,
                  selectedTrack.id,
                  state.currentTimeSec
                );
              }}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-pastel-pink/70 bg-pastel-pink/20 text-pastel-pink hover:bg-pastel-pink/30 hover:border-pastel-pink transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 shadow-xs"
              title="Capture current layer size, width/height, position, and rotation into a keyframe at the playhead"
            >
              <Plus className="w-3.5 h-3.5 text-pastel-pink" />
              <span>+ Keyframe ({state.currentTimeSec.toFixed(1)}s)</span>
            </button>

            <div className="h-4 w-px bg-neutral-800 shrink-0 mx-0.5" />

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800 shrink-0 mr-1">
              {(['all', 'entrance', 'emphasis', 'exit'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setMotionCategoryFilter(cat)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                    motionCategoryFilter === cat
                      ? cat === 'entrance'
                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-xs'
                        : cat === 'exit'
                          ? 'bg-rose-500/25 text-rose-300 border border-rose-400/50 shadow-xs'
                          : cat === 'emphasis'
                            ? 'bg-pastel-pink/25 text-pastel-pink border border-pastel-pink/50 shadow-xs'
                            : 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'all'
                    ? 'All'
                    : cat === 'entrance'
                      ? 'In (Entrance)'
                      : cat === 'emphasis'
                        ? 'Loop / Motion'
                        : 'Out (Exit)'}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-neutral-800 shrink-0 mx-0.5" />

            {/* Motion Preset Chips */}
            {MOTION_PRESETS.filter((p) => {
              if (p.textOnly && selectedTrack.type !== 'text') return false;
              if (motionCategoryFilter === 'all') return true;
              return p.category === motionCategoryFilter;
            }).map((preset) => {
              const isEntrance = preset.category === 'entrance';
              const isExit = preset.category === 'exit';

              return (
                <button
                  key={preset.id}
                  onClick={() =>
                    state.addLayerMotionBlock(
                      selectedTrack.type as any,
                      selectedTrack.id,
                      preset.id
                    )
                  }
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isEntrance
                      ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400'
                      : isExit
                        ? 'bg-rose-950/40 border-rose-800/80 text-rose-300 hover:bg-rose-900/60 hover:border-rose-400'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800 hover:text-white'
                  }`}
                  title={`${preset.name}: ${preset.description} (Click to add at timeline playhead)`}
                >
                  <span className="text-[10px] opacity-70">
                    {isEntrance ? '📥' : isExit ? '📤' : '💫'}
                  </span>
                  <span>{preset.name}</span>
                  <span className="text-[9px] font-mono opacity-60 bg-neutral-900 px-1 py-0.2 rounded">
                    {preset.defaultDurationSec}s
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Multi-Track Video Editor Timeline Grid */}
      <div className="border border-neutral-800/90 rounded-xl bg-neutral-950/80 overflow-hidden flex flex-row">
        {/* LEFT COLUMN: Track Headers */}
        <div className="w-36 sm:w-44 border-r border-neutral-800/80 bg-neutral-900/40 shrink-0 flex flex-col select-none">
          {/* Top Header */}
          <div className="h-6 px-2.5 flex items-center justify-between border-b border-neutral-800/80 font-sans font-bold text-[10px] text-slate-400 uppercase tracking-wider bg-neutral-900/60">
            <span>Tracks ({layerTracks.length + 1})</span>
          </div>

          {/* Track Header Items (Vertically Scrollable & Synced) */}
          <div
            ref={leftTracksRef}
            onScroll={handleLeftTracksScroll}
            className="flex flex-col min-h-[96px] max-h-48 overflow-y-auto divide-y divide-neutral-800/40 no-scrollbar"
          >
            {/* Top Empty Track Spacer */}
            <div className="h-2 shrink-0 pointer-events-none" />

            {layerTracks.length === 0 && <div className="flex-1 min-h-[52px]" />}
            {layerTracks.map((row) => {
              const isSelected = selectedTrack.id === row.id;
              const motions = getLayerMotions(row.type, row.id);
              const layerKfs = getLayerKeyframes(row.type, row.id);
              return (
                <div
                  key={row.key}
                  data-track-id={row.id}
                  onClick={() => {
                    setSelectedTrack({
                      type: row.type,
                      id: row.id,
                      name: row.name,
                    });
                    if (row.type === 'text') {
                      state.selectPhosphorIconLayer(null);
                      state.selectCanvasElement(null);
                      state.selectShapeLayer(null);
                      state.selectTextLayer(row.id);
                    } else if (row.type === 'phosphor') {
                      state.selectTextLayer(null);
                      state.selectCanvasElement(null);
                      state.selectShapeLayer(null);
                      state.selectPhosphorIconLayer(row.id);
                    } else if (row.type === 'element') {
                      state.selectTextLayer(null);
                      state.selectPhosphorIconLayer(null);
                      state.selectShapeLayer(null);
                      state.selectCanvasElement(row.id);
                    } else if (row.type === 'shape') {
                      state.selectTextLayer(null);
                      state.selectPhosphorIconLayer(null);
                      state.selectCanvasElement(null);
                      state.selectShapeLayer(row.id);
                    } else if (row.type === 'group') {
                      state.selectLayerGroup(row.id);
                    }
                  }}
                  className={`h-8 shrink-0 px-2.5 flex items-center justify-between overflow-hidden transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-pastel-blue/15 border-l-2 border-pastel-blue'
                      : row.type === 'group'
                        ? 'bg-pastel-pink/[0.04] hover:bg-pastel-pink/[0.08]'
                        : 'hover:bg-neutral-900/50'
                  }`}
                >
                  <div
                    className={`flex items-center overflow-hidden ${row.depth > 0 ? 'gap-1.5 pl-3' : 'gap-2'}`}
                  >
                    {row.depth > 0 && (
                      <span className="w-2 shrink-0 text-center text-[11px] text-slate-600" aria-hidden="true">
                        –
                      </span>
                    )}
                    {row.indicator}
                    <span
                      className={`truncate text-[11px] font-medium leading-tight ${
                        isSelected
                          ? 'text-pastel-blue font-bold'
                          : row.type === 'group'
                            ? 'text-pastel-pink font-bold'
                            : row.depth > 0
                              ? 'text-slate-400'
                              : 'text-slate-300'
                      }`}
                      title={row.name}
                    >
                      {row.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {layerKfs.length > 0 && (
                      <span className="text-[9px] font-mono text-pastel-pink bg-pastel-pink/15 px-1 py-0.5 rounded border border-pastel-pink/30">
                        {layerKfs.length} kf
                      </span>
                    )}
                    {motions.length > 0 && (
                      <span className="text-[9px] font-mono text-slate-400 bg-neutral-800/80 px-1 py-0.5 rounded">
                        {motions.length}m
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Mockup Track Header */}
            <div
              onClick={() => {
                setSelectedTrack({
                  type: 'mockup',
                  id: 'mockup',
                  name: 'Mockup',
                });
                state.selectTextLayer(null);
                state.selectPhosphorIconLayer(null);
                state.selectCanvasElement(null);
                state.selectShapeLayer(null);
                state.selectLayerGroup(null);
              }}
              className={`h-9 shrink-0 px-2.5 flex items-center justify-between overflow-hidden transition-colors cursor-pointer bg-neutral-950/90 ${
                selectedTrack.type === 'mockup'
                  ? 'bg-pastel-pink/15 border-l-2 border-pastel-pink'
                  : 'hover:bg-neutral-900/50'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <PhosphorIcons.CubeIcon className="w-3.5 h-3.5 text-pastel-pink shrink-0" />
                <span
                  className={`truncate text-[11px] font-bold leading-tight ${
                    selectedTrack.type === 'mockup' ? 'text-pastel-pink' : 'text-slate-200'
                  }`}
                >
                  Mockup
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 shrink-0">
                {state.keyframes.length} kf
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Time Ruler & Track Lanes (Horizontally Scrollable) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 relative flex flex-col select-none overflow-x-auto overflow-y-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div
            style={{ width: `${totalTrackWidth}px`, minWidth: '100%' }}
            className="relative flex flex-col"
          >
            {/* Track Time Ruler Header */}
            <div className="h-6 border-b border-neutral-800/80 bg-neutral-900/60 relative flex items-center">
              <div
                onClick={handleTimelineSeek}
                className="relative w-full h-full flex items-center cursor-pointer"
              >
                {/* Fixed 1-Second Grid Intervals & Half-Second Subticks */}
                {Array.from({ length: Math.floor(state.durationSec) + 1 }).map((_, i) => {
                  const tickX = PAD_PX + i * timelinePxPerSecond;
                  return (
                    <React.Fragment key={i}>
                      {/* Major 1s Tick */}
                      <div
                        style={{ left: `${tickX}px` }}
                        className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                      >
                        <span className="text-[9px] text-slate-400 font-mono font-medium tracking-tight mb-0.5 select-none">
                          {i}s
                        </span>
                        <div className="h-1.5 w-px bg-neutral-600" />
                      </div>

                      {/* Half-second Sub-tick */}
                      {i < state.durationSec && (
                        <div
                          style={{ left: `${tickX + timelinePxPerSecond / 2}px` }}
                          className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                        >
                          <div className="h-1 w-px bg-neutral-800" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Top Scrubber Playhead Handle (Downward-pointing triangle) */}
                <div
                  style={{ left: `${PAD_PX + state.currentTimeSec * timelinePxPerSecond}px` }}
                  className="absolute -translate-x-1/2 top-0 z-30 pointer-events-none flex flex-col items-center"
                >
                  <svg
                    width="8"
                    height="6"
                    viewBox="0 0 8 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-xs"
                  >
                    <path
                      d="M0.5 0.5H7.5L4 5L0.5 0.5Z"
                      fill="#f472b6"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Track Lanes with Shared Vertical Playhead Needle */}
            <div
              ref={trackContainerRef}
              onScroll={handleRightTracksScroll}
              className="min-h-[96px] max-h-48 overflow-y-auto cursor-pointer select-none"
            >
              <div
                className="relative flex flex-col min-h-full divide-y divide-neutral-800/40"
                style={{ minHeight: `${totalTracksHeight}px` }}
              >
                {/* Global Vertical Playhead Needle (extends through all tracks from top to bottom) */}
                <div
                  style={{
                    left: `${PAD_PX + state.currentTimeSec * timelinePxPerSecond}px`,
                    height: `${totalTracksHeight}px`,
                    minHeight: '100%',
                  }}
                  className="absolute top-0 bottom-0 w-px bg-pastel-pink pointer-events-none z-20 shadow-[0_0_8px_rgba(244,114,182,0.8)]"
                />
                {snapGuideTime !== null && (
                  <div
                    style={{
                      left: `${PAD_PX + snapGuideTime * timelinePxPerSecond}px`,
                      height: `${totalTracksHeight}px`,
                    }}
                    className="absolute top-0 bottom-0 z-[120] w-px bg-pastel-blue pointer-events-none shadow-[0_0_7px_rgba(147,197,253,0.9)]"
                  />
                )}

              {/* Top Empty Track Spacer */}
              <div className="h-2 shrink-0 pointer-events-none" />

              {layerTracks.length === 0 && <div className="flex-1 min-h-[52px]" />}

              {/* 1. Element Layer Lanes */}
              {layerTracks.map((row, trackIdx) => {
                const isTopTrack = trackIdx === 0;
                const motions = getLayerMotions(row.type, row.id);
                const layerKfs = getLayerKeyframes(row.type, row.id);
                return (
                  <div
                    key={row.key}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrack({
                        type: row.type,
                        id: row.id,
                        name: row.name,
                      });
                      if (row.type === 'text') state.selectTextLayer(row.id);
                      else if (row.type === 'phosphor') state.selectPhosphorIconLayer(row.id);
                      else if (row.type === 'element') state.selectCanvasElement(row.id);
                      else if (row.type === 'shape') state.selectShapeLayer(row.id);
                      else if (row.type === 'group') state.selectLayerGroup(row.id);
                    }}
                    className={`h-8 shrink-0 flex items-center relative group hover:z-[80] focus-within:z-[80] ${
                      row.type === 'group'
                        ? 'bg-pastel-pink/[0.025]'
                        : row.depth > 0
                          ? 'bg-white/[0.01]'
                          : ''
                    }`}
                  >
                    <div
                      onClick={handleTimelineSeek}
                      className="relative w-full h-full flex items-center"
                    >
                      {/* Layer Keyframe Path Line */}
                      {layerKfs.length >= 2 && (
                        <div
                          style={{
                            left: `${PAD_PX + layerKfs[0].timeSec * timelinePxPerSecond}px`,
                            width: `${(layerKfs[layerKfs.length - 1].timeSec - layerKfs[0].timeSec) * timelinePxPerSecond}px`,
                          }}
                          className="absolute h-0.5 rounded-full bg-pastel-pink/40 pointer-events-none z-10"
                        />
                      )}

                      {/* Layer Motion Blocks */}
                      {motions.map((motion) => {
                        const meta = MOTION_PRESETS.find((p) => p.id === motion.preset);
                        const isEntrance = meta?.category === 'entrance';
                        const isExit = meta?.category === 'exit';
                        const blockLeft = PAD_PX + motion.startTimeSec * timelinePxPerSecond;
                        const blockWidth = Math.max(motion.durationSec * timelinePxPerSecond, 38);
                        const isDraggingThis = draggingMotionBlock?.blockId === motion.id;
                        const isSelectedBlock = selectedBlockId === motion.id;
                        const isMultiSelected = isTimelineItemSelected({
                          kind: 'motion',
                          layerType: row.type,
                          layerId: row.id,
                          blockId: motion.id,
                        });
                        const motionEndTime = motion.startTimeSec + motion.durationSec;
                        let motionTooltipAlignClass = 'left-1/2 -translate-x-1/2';
                        if (motion.startTimeSec <= 2) {
                          motionTooltipAlignClass = 'left-0 translate-x-0';
                        } else if (motionEndTime >= state.durationSec - 2) {
                          motionTooltipAlignClass = 'right-0 left-auto translate-x-0';
                        }

                        return (
                          <div
                            key={motion.id}
                            data-timeline-item="motion"
                            data-timeline-item-id={motion.id}
                            style={{
                              left: `${blockLeft}px`,
                              width: `${blockWidth}px`,
                            }}
                            onPointerDown={(e) =>
                              handleMotionBlockPointerDown(e, row.type, row.id, motion, false)
                            }
                            onPointerMove={handleMotionBlockPointerMove}
                            onPointerUp={handleMotionBlockPointerUp}
                            onPointerCancel={handleMotionBlockPointerUp}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className={`absolute h-5 rounded-md flex items-center justify-between px-1.5 text-[10px] font-semibold shadow-xs select-none cursor-grab active:cursor-grabbing pointer-events-auto z-10 hover:z-[100] focus-within:z-[100] transition-colors group/motionblock ${
                              isDraggingThis ? 'ring-2 ring-white scale-[1.02] z-[100]' : ''
                            } ${isSelectedBlock ? 'ring-1.5 ring-white z-[100]' : ''} ${
                              isMultiSelected ? 'outline outline-2 outline-pastel-blue outline-offset-1' : ''
                            } ${
                              isEntrance
                                ? 'bg-gradient-to-r from-cyan-500/35 via-sky-500/25 to-cyan-500/35 border border-cyan-400 text-cyan-200 hover:border-white'
                                : isExit
                                  ? 'bg-gradient-to-r from-rose-500/35 via-amber-500/25 to-rose-500/35 border border-rose-400 text-rose-200 hover:border-white'
                                  : 'bg-gradient-to-r from-pastel-pink/35 via-purple-500/25 to-pastel-pink/35 border border-pastel-pink text-pastel-pink hover:border-white'
                            }`}
                            title="Placed motion block — Shift/Cmd/Ctrl-click to multi-select. Drag to move; drag the right edge to trim."
                          >
                            <span className="flex items-center gap-1 truncate mr-1 pointer-events-none">
                              <span className="text-[9px] shrink-0">
                                {isEntrance ? '📥' : isExit ? '📤' : '💫'}
                              </span>
                              <span className="truncate text-[10px]">
                                {meta?.name || motion.preset}
                              </span>
                            </span>

                            <span className="font-mono text-[8.5px] opacity-80 shrink-0 pointer-events-none mr-1.5">
                              {motion.durationSec.toFixed(1)}s
                            </span>

                            {/* Right Trim/Resize Handle */}
                            <div
                              onPointerDown={(e) =>
                                handleMotionBlockPointerDown(e, row.type, row.id, motion, true)
                              }
                              onPointerMove={handleMotionBlockPointerMove}
                              onPointerUp={handleMotionBlockPointerUp}
                              onPointerCancel={handleMotionBlockPointerUp}
                              className="w-2 absolute right-0 top-0 bottom-0 cursor-ew-resize hover:bg-white/40 rounded-r-md transition-colors z-20 flex items-center justify-center"
                              title="Drag to trim duration"
                            >
                              <div className="w-0.5 h-2 bg-white/60 rounded-full pointer-events-none" />
                            </div>

                            {/* Tooltip & Delete Popover */}
                            <div
                              className={`absolute ${
                                isTopTrack ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                              } ${motionTooltipAlignClass} flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 shadow-2xl whitespace-nowrap z-[110] transition-opacity before:content-[''] before:absolute ${
                                isTopTrack
                                  ? 'before:-top-2 before:h-3'
                                  : 'before:-bottom-2 before:h-3'
                              } before:left-0 before:right-0 before:pointer-events-auto ${
                                isSelectedBlock || isDraggingThis
                                  ? 'opacity-100 pointer-events-auto'
                                  : 'opacity-0 group-hover/motionblock:opacity-100 pointer-events-none group-hover/motionblock:pointer-events-auto'
                              }`}
                            >
                              <span className="font-semibold text-white">
                                {meta?.name || motion.preset}
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {motion.startTimeSec.toFixed(1)}s -{' '}
                                {(motion.startTimeSec + motion.durationSec).toFixed(1)}s
                              </span>
                              {meta?.textAnimation && (
                                <div className="flex items-center gap-1.5 border-l border-neutral-700 pl-1.5">
                                  <select
                                    value={motion.textUnit ?? 'character'}
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(event) =>
                                      state.updateLayerMotionBlock(
                                        row.type,
                                        row.id,
                                        motion.id,
                                        {
                                          textUnit: event.target.value as
                                            | 'character'
                                            | 'word',
                                        }
                                      )
                                    }
                                    className="rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-[9px] text-slate-200 outline-none focus:border-pastel-blue"
                                    title="Animate by character or word"
                                  >
                                    <option value="character">Characters</option>
                                    <option value="word">Words</option>
                                  </select>
                                  <select
                                    value={motion.textOrder ?? 'forward'}
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(event) =>
                                      state.updateLayerMotionBlock(
                                        row.type,
                                        row.id,
                                        motion.id,
                                        {
                                          textOrder: event.target.value as
                                            | 'forward'
                                            | 'reverse'
                                            | 'center'
                                            | 'random',
                                        }
                                      )
                                    }
                                    className="rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-[9px] text-slate-200 outline-none focus:border-pastel-blue"
                                    title="Animation order"
                                  >
                                    <option value="forward">First → last</option>
                                    <option value="reverse">Last → first</option>
                                    <option value="center">From center</option>
                                    <option value="random">Random</option>
                                  </select>
                                  <label className="flex items-center gap-1 text-[9px] text-slate-500">
                                    Stagger
                                    <input
                                      type="number"
                                      min={0}
                                      max={200}
                                      step={10}
                                      value={Math.round((motion.staggerSec ?? 0.05) * 1000)}
                                      onPointerDown={(event) => event.stopPropagation()}
                                      onClick={(event) => event.stopPropagation()}
                                      onChange={(event) =>
                                        state.updateLayerMotionBlock(
                                          row.type,
                                          row.id,
                                          motion.id,
                                          {
                                            staggerSec: Math.max(
                                              0,
                                              Math.min(0.2, Number(event.target.value) / 1000)
                                            ),
                                          }
                                        )
                                      }
                                      className="w-12 rounded border border-neutral-700 bg-neutral-950 px-1 py-0.5 font-mono text-[9px] text-pastel-blue outline-none focus:border-pastel-blue"
                                      title="Delay between animated units in milliseconds"
                                    />
                                    ms
                                  </label>
                                  <label className="flex items-center gap-1 text-[9px] text-slate-500">
                                    Duration
                                    <input
                                      type="number"
                                      min={0.2}
                                      max={state.durationSec}
                                      step={0.1}
                                      value={motion.durationSec}
                                      onPointerDown={(event) => event.stopPropagation()}
                                      onClick={(event) => event.stopPropagation()}
                                      onChange={(event) =>
                                        state.updateLayerMotionBlock(
                                          row.type,
                                          row.id,
                                          motion.id,
                                          { durationSec: Number(event.target.value) }
                                        )
                                      }
                                      className="w-11 rounded border border-neutral-700 bg-neutral-950 px-1 py-0.5 font-mono text-[9px] text-pastel-pink outline-none focus:border-pastel-pink"
                                    />
                                    s
                                  </label>
                                  <select
                                    value={motion.easing ?? (motion.preset === 'text-pop' ? 'spring' : 'ease-out')}
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(event) =>
                                      state.updateLayerMotionBlock(
                                        row.type,
                                        row.id,
                                        motion.id,
                                        { easing: event.target.value as AnimationEasingType }
                                      )
                                    }
                                    className="rounded border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 text-[9px] text-slate-200 outline-none focus:border-pastel-pink"
                                    title="Per-unit easing"
                                  >
                                    {EASING_PRESET_OPTIONS.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  state.removeLayerMotionBlock(row.type, row.id, motion.id);
                                  if (selectedBlockId === motion.id) setSelectedBlockId(null);
                                }}
                                className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                                title="Delete Motion Block"
                              >
                                <Trash01 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Layer Custom Keyframe Nodes */}
                      {layerKfs.map((kf) => {
                        const nodeX = PAD_PX + kf.timeSec * timelinePxPerSecond;
                        const isActive = Math.abs(state.currentTimeSec - kf.timeSec) < 0.2;
                        const isSelected = selectedKfId === kf.id;
                        const isDragging = draggingLayerKf?.keyframeId === kf.id;
                        const isMultiSelected = isTimelineItemSelected({
                          kind: 'layer-keyframe',
                          layerType: row.type,
                          layerId: row.id,
                          keyframeId: kf.id,
                        });
                        const sortedLayerKfs = [...layerKfs].sort((a, b) => a.timeSec - b.timeSec);
                        const keyframeIndex = sortedLayerKfs.findIndex(
                          (keyframe) => keyframe.id === kf.id
                        );
                        const nextKeyframe = sortedLayerKfs[keyframeIndex + 1];

                        let tooltipAlignClass = 'left-1/2 -translate-x-1/2';
                        if (kf.timeSec <= 2) {
                          tooltipAlignClass = 'left-0 translate-x-0';
                        } else if (kf.timeSec >= state.durationSec - 2) {
                          tooltipAlignClass = 'right-0 left-auto translate-x-0';
                        }

                        return (
                          <div
                            key={kf.id}
                            data-timeline-item="layer-keyframe"
                            data-timeline-item-id={kf.id}
                            style={{ left: `${nodeX}px` }}
                            onPointerDown={(e) => handleLayerKfPointerDown(e, row.type, row.id, kf)}
                            onPointerMove={handleLayerKfPointerMove}
                            onPointerUp={handleLayerKfPointerUp}
                            onMouseEnter={() => setHoveredKfId(kf.id)}
                            onMouseLeave={() =>
                              setHoveredKfId((cur) => (cur === kf.id ? null : cur))
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className={`absolute -translate-x-1/2 group cursor-grab active:cursor-grabbing top-1/2 -translate-y-1/2 pt-2 -mt-2 ${
                              isDragging ||
                              isMultiSelected ||
                              hoveredKfId === kf.id ||
                              selectedKfId === kf.id
                                ? 'z-[100]'
                                : 'z-20'
                            }`}
                            title={`Keyframe at ${kf.timeSec.toFixed(1)}s — Shift/Cmd/Ctrl-click to multi-select; drag to move`}
                          >
                            <div
                              className={`w-2.5 h-2.5 rotate-45 border transition-all ${
                                isActive ||
                                isSelected ||
                                isDragging ||
                                isMultiSelected ||
                                hoveredKfId === kf.id ||
                                selectedKfId === kf.id
                                  ? 'bg-pastel-pink border-white scale-125 shadow-md shadow-pastel-pink/60'
                                  : 'bg-indigo-600 border-indigo-300 group-hover:bg-pastel-pink'
                              }`}
                            />

                            {/* Tooltip & Delete Popover */}
                            <div
                              className={`absolute ${
                                isTopTrack ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                              } ${tooltipAlignClass} flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 shadow-2xl whitespace-nowrap transition-all duration-150 before:content-[''] before:absolute ${
                                isTopTrack
                                  ? 'before:-top-2 before:h-3'
                                  : 'before:-bottom-2 before:h-3'
                              } before:left-0 before:right-0 before:pointer-events-auto ${
                                hoveredKfId === kf.id || isDragging || selectedKfId === kf.id
                                  ? 'opacity-100 pointer-events-auto z-50 scale-100'
                                  : 'opacity-0 pointer-events-none z-0 scale-95'
                              }`}
                            >
                              <span className="font-mono text-pastel-pink font-semibold">
                                {kf.timeSec.toFixed(1)}s
                              </span>
                              {kf.width !== undefined && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {Math.round(kf.width)}w × {Math.round(kf.height || 0)}h
                                </span>
                              )}
                              {nextKeyframe ? (
                                <>
                                  <span className="text-[9px] text-slate-500">to next</span>
                                  <select
                                    value={
                                      typeof kf.easing === 'object'
                                        ? 'custom'
                                        : kf.easing || state.animationEasing || 'ease-in-out'
                                    }
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      state.updateLayerKeyframe(row.type, row.id, kf.id, {
                                        easing: e.target.value as AnimationEasingType,
                                      });
                                    }}
                                    className="bg-neutral-950 border border-neutral-700 text-slate-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-pastel-pink cursor-pointer"
                                    title="Easing from this keyframe to the next"
                                  >
                                    {typeof kf.easing === 'object' && (
                                      <option value="custom">Custom curve</option>
                                    )}
                                    {EASING_PRESET_OPTIONS.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEasingEditorTarget({
                                        layerType: row.type,
                                        layerId: row.id,
                                        keyframeId: kf.id,
                                        layerName: row.name,
                                      });
                                    }}
                                    className="rounded border border-pastel-pink/30 bg-pastel-pink/10 px-1.5 py-0.5 text-[10px] font-semibold text-pastel-pink transition-colors hover:bg-pastel-pink/20"
                                    title="Open custom easing curve editor"
                                  >
                                    Curve
                                  </button>
                                </>
                              ) : (
                                <span className="text-[9px] text-slate-500">Final keyframe</span>
                              )}
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  state.removeLayerKeyframe(row.type, row.id, kf.id);
                                  if (selectedKfId === kf.id) setSelectedKfId(null);
                                }}
                                className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                                title="Delete Keyframe"
                              >
                                <Trash01 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {motions.length === 0 && layerKfs.length === 0 && (
                        <div
                          style={{
                            left: `${PAD_PX}px`,
                            width: `${state.durationSec * timelinePxPerSecond}px`,
                          }}
                          className="absolute h-4 rounded-md border border-dashed border-neutral-800 bg-neutral-950/40 flex items-center px-2 text-[9px] text-slate-500 font-mono pointer-events-none"
                        >
                          <span>+ Click preset or "+ Keyframe" above to animate</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 2. Mockup Camera Lane */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTrack({
                    type: 'mockup',
                    id: 'mockup',
                    name: 'Mockup',
                  });
                }}
                className="h-9 shrink-0 flex items-center relative bg-neutral-950/90 hover:z-[80] focus-within:z-[80]"
              >
                <div
                  ref={mockupTrackRef}
                  onClick={handleTimelineSeek}
                  className="relative w-full h-full flex items-center"
                >
                  {/* Horizontal connecting track line */}
                  <div
                    style={{ left: `${PAD_PX}px`, width: `${state.durationSec * timelinePxPerSecond}px` }}
                    className="absolute h-1.5 rounded-full bg-neutral-900 border border-neutral-800"
                  />

                  {/* Keyframe Nodes */}
                  {state.keyframes.map((kf) => {
                    const nodeX = PAD_PX + kf.timeSec * timelinePxPerSecond;
                    const isActive = Math.abs(state.currentTimeSec - kf.timeSec) < 0.2;
                    const isSelected = selectedKfId === kf.id;
                    const isDragging = draggingKfId === kf.id;
                    const isMultiSelected = isTimelineItemSelected({
                      kind: 'mockup-keyframe',
                      keyframeId: kf.id,
                    });
                    const sortedKeyframes = [...state.keyframes].sort(
                      (a, b) => a.timeSec - b.timeSec
                    );
                    const keyframeIndex = sortedKeyframes.findIndex(
                      (keyframe) => keyframe.id === kf.id
                    );
                    const nextKeyframe = sortedKeyframes[keyframeIndex + 1];

                    let tooltipAlignClass = 'left-1/2 -translate-x-1/2';
                    if (kf.timeSec <= 2) {
                      tooltipAlignClass = 'left-0 translate-x-0';
                    } else if (kf.timeSec >= state.durationSec - 2) {
                      tooltipAlignClass = 'right-0 left-auto translate-x-0';
                    }

                    return (
                      <div
                        key={kf.id}
                        data-timeline-item="mockup-keyframe"
                        data-timeline-item-id={kf.id}
                        style={{ left: `${nodeX}px` }}
                        onPointerDown={(e) => handleMarkerPointerDown(e, kf)}
                        onPointerMove={(e) => handleMarkerPointerMove(e, kf.id)}
                        onPointerUp={handleMarkerPointerUp}
                        onMouseEnter={() => setHoveredKfId(kf.id)}
                        onMouseLeave={() => setHoveredKfId((cur) => (cur === kf.id ? null : cur))}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className={`absolute -translate-x-1/2 group cursor-grab active:cursor-grabbing top-1/2 -translate-y-1/2 pt-2 -mt-2 ${
                          isDragging ||
                          isMultiSelected ||
                          hoveredKfId === kf.id ||
                          selectedKfId === kf.id
                            ? 'z-[100]'
                            : 'z-20'
                        }`}
                        title={`Mockup keyframe at ${kf.timeSec.toFixed(1)}s — Shift/Cmd/Ctrl-click to multi-select; drag to move`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rotate-45 border transition-all ${
                            isActive ||
                            isSelected ||
                            isDragging ||
                            isMultiSelected ||
                            hoveredKfId === kf.id ||
                            selectedKfId === kf.id
                              ? 'bg-pastel-pink border-white scale-125 shadow-md shadow-pastel-pink/60'
                              : 'bg-slate-700 border-slate-400 group-hover:bg-slate-300'
                          }`}
                        />

                        {/* Tooltip & Delete Popover */}
                        <div
                          className={`absolute bottom-full mb-1.5 ${tooltipAlignClass} flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 shadow-2xl whitespace-nowrap transition-all duration-150 before:content-[''] before:absolute before:-bottom-2 before:h-3 before:left-0 before:right-0 before:pointer-events-auto ${
                            hoveredKfId === kf.id || isDragging || selectedKfId === kf.id
                              ? 'opacity-100 pointer-events-auto z-50 scale-100'
                              : 'opacity-0 pointer-events-none z-0 scale-95'
                          }`}
                        >
                          <span className="font-mono text-pastel-pink font-semibold">
                            {kf.timeSec.toFixed(1)}s
                          </span>
                          {nextKeyframe ? (
                            <>
                              <span className="text-[9px] text-slate-500">to next</span>
                              <select
                                value={
                                  typeof kf.easing === 'object'
                                    ? 'custom'
                                    : kf.easing || state.animationEasing || 'ease-in-out'
                                }
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  onChange({
                                    keyframes: state.keyframes.map((keyframe) =>
                                      keyframe.id === kf.id
                                        ? {
                                            ...keyframe,
                                            easing: e.target.value as AnimationEasingType,
                                          }
                                        : keyframe
                                    ),
                                  });
                                }}
                                className="bg-neutral-950 border border-neutral-700 text-slate-300 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-pastel-pink cursor-pointer"
                                title="Easing from this keyframe to the next"
                              >
                                {typeof kf.easing === 'object' && (
                                  <option value="custom">Custom curve</option>
                                )}
                                {EASING_PRESET_OPTIONS.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMockupEasingEditorKeyframeId(kf.id);
                                }}
                                className="rounded border border-pastel-pink/30 bg-pastel-pink/10 px-1.5 py-0.5 text-[10px] font-semibold text-pastel-pink transition-colors hover:bg-pastel-pink/20"
                                title="Open custom easing curve editor"
                              >
                                Curve
                              </button>
                            </>
                          ) : (
                            <span className="text-[9px] text-slate-500">Final keyframe</span>
                          )}
                          <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteKeyframe(kf.id);
                            }}
                            className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                            title="Delete Keyframe"
                          >
                            <Trash01 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
    {easingEditorTarget && easingEditorKeyframe && easingEditorNextKeyframe && (
      <EasingCurveEditor
        easing={
          (easingEditorKeyframe.easing || state.animationEasing || 'ease-in-out') as AnimationEasing
        }
        layerName={easingEditorTarget.layerName}
        startTimeSec={easingEditorKeyframe.timeSec}
        endTimeSec={easingEditorNextKeyframe.timeSec}
        onApply={(easing) =>
          state.updateLayerKeyframe(
            easingEditorTarget.layerType,
            easingEditorTarget.layerId,
            easingEditorTarget.keyframeId,
            { easing }
          )
        }
        onClose={() => setEasingEditorTarget(null)}
      />
    )}
    {mockupEasingEditorKeyframe && mockupEasingEditorNextKeyframe && (
      <EasingCurveEditor
        easing={
          (mockupEasingEditorKeyframe.easing ||
            state.animationEasing ||
            'ease-in-out') as AnimationEasing
        }
        layerName="Mockup camera"
        startTimeSec={mockupEasingEditorKeyframe.timeSec}
        endTimeSec={mockupEasingEditorNextKeyframe.timeSec}
        onApply={(easing) =>
          onChange({
            keyframes: state.keyframes.map((keyframe) =>
              keyframe.id === mockupEasingEditorKeyframe.id
                ? { ...keyframe, easing }
                : keyframe
            ),
          })
        }
        onClose={() => setMockupEasingEditorKeyframeId(null)}
      />
    )}
    </>
  );
};
