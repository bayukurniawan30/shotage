import React, { useEffect, useRef, useState } from 'react';
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
import {
  ANIMATION_PRESETS,
  AnimationKeyframe,
  ELEMENT_LOOP_PRESETS,
  ElementLoopAnimation,
  EASING_PRESET_OPTIONS,
  AnimationEasingType,
  MOTION_PRESETS,
  LayerMotionBlock,
  MotionPresetId,
  MotionCategory,
} from '../types/animationTypes';

export const AnimationTimeline: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const leftTracksRef = useRef<HTMLDivElement>(null);
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const mockupTrackRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef(false);

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

  const PX_PER_SECOND = 72;
  const PAD_PX = 20;
  const totalTrackWidth = Math.max(state.durationSec * PX_PER_SECOND + PAD_PX * 2, 400);

  const [draggingKfId, setDraggingKfId] = useState<string | null>(null);
  const [selectedKfId, setSelectedKfId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [motionCategoryFilter, setMotionCategoryFilter] = useState<'all' | 'entrance' | 'emphasis' | 'exit'>('all');
  const [draggingMotionBlock, setDraggingMotionBlock] = useState<{
    layerType: 'text' | 'phosphor' | 'element' | 'shape';
    layerId: string;
    blockId: string;
    startX: number;
    initialStartT: number;
    isResize?: boolean;
    initialDur?: number;
  } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Selected track state: 'mockup' or a specific layer
  const [selectedTrack, setSelectedTrack] = useState<{
    type: 'mockup' | 'text' | 'phosphor' | 'element' | 'shape';
    id: string;
    name: string;
  }>({ type: 'mockup', id: 'mockup', name: 'Mockup' });

  // Auto-scroll when playing if playhead reaches edge of scroll container
  useEffect(() => {
    if (state.isPlaying && scrollContainerRef.current) {
      const playheadX = PAD_PX + state.currentTimeSec * PX_PER_SECOND;
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const visibleWidth = container.clientWidth;

      if (playheadX > scrollLeft + visibleWidth - 80) {
        container.scrollLeft = playheadX - 80;
      } else if (playheadX < scrollLeft) {
        container.scrollLeft = Math.max(0, playheadX - 40);
      }
    }
  }, [state.currentTimeSec, state.isPlaying]);

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
      updatedKf[existingIndex] = newKf;
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
    const time = (relativeX - PAD_PX) / PX_PER_SECOND;
    return Math.max(0, Math.min(state.durationSec, time));
  };

  // Keyframe Dragging Pointer Handlers
  const handleMarkerPointerDown = (e: React.PointerEvent, kf: AnimationKeyframe) => {
    e.stopPropagation();
    setDraggingKfId(kf.id);
    setSelectedKfId(kf.id);
    onChange({ currentTimeSec: kf.timeSec, isPlaying: false });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleMarkerPointerMove = (e: React.PointerEvent, kfId: string) => {
    if (draggingKfId !== kfId || !mockupTrackRef.current) return;
    const newTime = Math.round(getTimeFromX(e.clientX, mockupTrackRef.current) * 10) / 10;

    const updatedKeyframes = state.keyframes
      .map((kf) => (kf.id === kfId ? { ...kf, timeSec: newTime } : kf))
      .sort((a, b) => a.timeSec - b.timeSec);

    onChange({ keyframes: updatedKeyframes, currentTimeSec: newTime });
  };

  const handleMarkerPointerUp = (e: React.PointerEvent) => {
    if (draggingKfId) {
      setDraggingKfId(null);
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  const handleDurationChange = (newDur: number) => {
    const targetDur = Math.min(20, Math.max(2, newDur));
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

  const getLayerMotions = (type: 'text' | 'phosphor' | 'element' | 'shape', id: string): LayerMotionBlock[] => {
    let layer: any = null;
    if (type === 'text') layer = (state.textLayers || []).find((l) => l.id === id);
    else if (type === 'phosphor') layer = (state.phosphorIconLayers || []).find((l) => l.id === id);
    else if (type === 'element') layer = (state.canvasElements || []).find((l) => l.id === id);
    else if (type === 'shape') layer = (state.shapeLayers || []).find((l) => l.id === id);

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

  const hasDraggedMotionRef = useRef(false);

  const handleMotionBlockPointerDown = (
    e: React.PointerEvent,
    layerType: 'text' | 'phosphor' | 'element' | 'shape',
    layerId: string,
    block: LayerMotionBlock,
    isResize = false
  ) => {
    e.stopPropagation();
    hasDraggedMotionRef.current = false;
    setSelectedTrack({
      type: layerType,
      id: layerId,
      name: selectedTrack.name,
    });
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
    if (Math.abs(deltaX) > 2) {
      hasDraggedMotionRef.current = true;
    }
    const deltaTime = deltaX / PX_PER_SECOND;

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
      const snappedDur = Math.round(rawDur * 10) / 10;
      state.updateLayerMotionBlock(
        draggingMotionBlock.layerType,
        draggingMotionBlock.layerId,
        draggingMotionBlock.blockId,
        {
          durationSec: snappedDur,
        }
      );
    } else {
      const dur = draggingMotionBlock.initialDur || 1.5;
      const maxStart = Math.max(minAllowedStart, maxBoundary - dur);
      const rawStart = Math.max(
        minAllowedStart,
        Math.min(maxStart, draggingMotionBlock.initialStartT + deltaTime)
      );
      const snappedStart = Math.round(rawStart * 10) / 10;
      state.updateLayerMotionBlock(
        draggingMotionBlock.layerType,
        draggingMotionBlock.layerId,
        draggingMotionBlock.blockId,
        {
          startTimeSec: snappedStart,
        }
      );
      onChange({ currentTimeSec: snappedStart });
    }
  };

  const handleMotionBlockPointerUp = (e: React.PointerEvent) => {
    if (draggingMotionBlock) {
      setDraggingMotionBlock(null);
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  // Build Layer Track Rows matching the exact order in RightSidebar Layers panel
  const buildLayerRows = () => {
    const buildRow = (
      type: 'text' | 'phosphor' | 'element' | 'shape',
      id: string,
      name: string,
      indicator: React.ReactNode
    ) => ({ key: `${type}-${id}`, type, id, name, indicator });

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
      const IconComp = (PhosphorIcons as any)[l.iconId] || PhosphorIcons.Sparkle;
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
          ? PhosphorIcons.Smiley
          : el.category === 'line'
            ? PhosphorIcons.LineSegment
            : PhosphorIcons.ArrowRight;
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
          ? PhosphorIcons.Circle
          : s.shapeType === 'hexagon'
            ? PhosphorIcons.Hexagon
            : s.shapeType === 'quote'
              ? (PhosphorIcons as any).Quotes || PhosphorIcons.ChatCircle || PhosphorIcons.Square
              : s.shapeType === 'rectangle'
                ? PhosphorIcons.Rectangle
                : PhosphorIcons.Square;
      allRows.push(
        buildRow(
          'shape',
          s.id,
          s.name || s.shapeType || 'Shape',
          <ShapeCatIcon className="w-3.5 h-3.5 text-pastel-green shrink-0" />
        )
      );
    });

    // Sort by layerOrder (topmost layer on top)
    const layerOrder = state.layerOrder || [];
    return [...allRows].sort((a, b) => {
      const idxA = layerOrder.findIndex((item) => item.type === a.type && item.id === a.id);
      const idxB = layerOrder.findIndex((item) => item.type === b.type && item.id === b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  };

  const layerTracks = buildLayerRows();

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
    <div className="w-full bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 z-50 text-white shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-2.5">
      {/* Top Header Row: Play Controls, Duration, Minimize */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2 gap-2">
        {/* Left: Play/Pause, Time, Reset */}
        <div className="flex items-center gap-2.5">
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
        </div>

        {/* Right: Length Selector, Add Keyframe (for Mockup), Collapse */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg px-1.5 sm:px-2 py-1 text-xs text-slate-300 shrink-0">
            <span className="text-[10px] text-slate-400 font-semibold uppercase hidden sm:inline">
              Duration:
            </span>
            <select
              value={state.durationSec}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              className="bg-transparent text-pastel-pink font-mono font-bold text-xs outline-none cursor-pointer w-auto min-w-[32px] text-center sm:text-left"
            >
              {[3, 5, 8, 9, 10, 12, 15, 20].includes(state.durationSec) ? null : (
                <option value={state.durationSec} className="bg-neutral-900 text-white">
                  {state.durationSec}s
                </option>
              )}
              <option value={3} className="bg-neutral-900 text-white">
                3s
              </option>
              <option value={5} className="bg-neutral-900 text-white">
                5s
              </option>
              <option value={8} className="bg-neutral-900 text-white">
                8s
              </option>
              <option value={9} className="bg-neutral-900 text-white">
                9s
              </option>
              <option value={10} className="bg-neutral-900 text-white">
                10s
              </option>
              <option value={12} className="bg-neutral-900 text-white">
                12s
              </option>
              <option value={15} className="bg-neutral-900 text-white">
                15s
              </option>
              <option value={20} className="bg-neutral-900 text-white">
                20s
              </option>
            </select>
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

          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-neutral-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title="Minimize Timeline"
          >
            <ChevronDown className="w-4 h-4 text-slate-400 hover:text-pastel-pink" />
          </button>
        </div>
      </div>

      {/* Row 2: Context-Aware Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar bg-neutral-900/50 p-1.5 rounded-xl border border-neutral-800/80">
        {selectedTrack.type === 'mockup' ? (
          <>
            <span className="text-[10px] uppercase font-bold text-pastel-pink mr-1 shrink-0 flex items-center gap-1">
              <PhosphorIcons.Cube className="w-3.5 h-3.5" />
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
                  {cat === 'all' ? 'All' : cat === 'entrance' ? 'In (Entrance)' : cat === 'emphasis' ? 'Loop / Motion' : 'Out (Exit)'}
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
                    state.addLayerMotionBlock(selectedTrack.type as any, selectedTrack.id, preset.id)
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
            {layerTracks.length === 0 && <div className="flex-1 min-h-[52px]" />}
            {layerTracks.map((row) => {
              const isSelected = selectedTrack.id === row.id;
              const motions = getLayerMotions(row.type, row.id);
              return (
                <div
                  key={row.key}
                  onClick={() =>
                    setSelectedTrack({
                      type: row.type,
                      id: row.id,
                      name: row.name,
                    })
                  }
                  className={`h-8 shrink-0 px-2.5 flex items-center justify-between overflow-hidden transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-pastel-blue/15 border-l-2 border-pastel-blue'
                      : 'hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {row.indicator}
                    <span
                      className={`truncate text-[11px] font-medium leading-tight ${
                        isSelected ? 'text-pastel-blue font-bold' : 'text-slate-300'
                      }`}
                      title={row.name}
                    >
                      {row.name}
                    </span>
                  </div>
                  {motions.length > 0 && (
                    <span className="text-[9px] font-mono text-slate-400 shrink-0 bg-neutral-800/80 px-1 py-0.5 rounded">
                      {motions.length}m
                    </span>
                  )}
                </div>
              );
            })}

            {/* Mockup Track Header */}
            <div
              onClick={() =>
                setSelectedTrack({
                  type: 'mockup',
                  id: 'mockup',
                  name: 'Mockup',
                })
              }
              className={`h-9 shrink-0 px-2.5 flex items-center justify-between overflow-hidden transition-colors cursor-pointer bg-neutral-950/90 ${
                selectedTrack.type === 'mockup'
                  ? 'bg-pastel-pink/15 border-l-2 border-pastel-pink'
                  : 'hover:bg-neutral-900/50'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <PhosphorIcons.Cube className="w-3.5 h-3.5 text-pastel-pink shrink-0" />
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
          <div style={{ width: `${totalTrackWidth}px`, minWidth: '100%' }} className="relative flex flex-col">
            {/* Track Time Ruler Header */}
            <div className="h-6 border-b border-neutral-800/80 bg-neutral-900/60 relative flex items-center">
              <div
                onClick={handleTimelineSeek}
                className="relative w-full h-full flex items-center cursor-pointer"
              >
                {/* Fixed 1-Second Grid Intervals & Half-Second Subticks */}
                {Array.from({ length: Math.floor(state.durationSec) + 1 }).map((_, i) => {
                  const tickX = PAD_PX + i * PX_PER_SECOND;
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
                          style={{ left: `${tickX + PX_PER_SECOND / 2}px` }}
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
                  style={{ left: `${PAD_PX + state.currentTimeSec * PX_PER_SECOND}px` }}
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
              className="relative flex flex-col min-h-[96px] max-h-48 overflow-y-auto divide-y divide-neutral-800/40 cursor-pointer select-none"
            >
              {/* Global Vertical Playhead Needle (extends through all tracks from top to bottom) */}
              <div
                style={{ left: `${PAD_PX + state.currentTimeSec * PX_PER_SECOND}px` }}
                className="absolute top-0 bottom-0 w-px bg-pastel-pink pointer-events-none z-20 shadow-[0_0_8px_rgba(244,114,182,0.8)]"
              />

              {layerTracks.length === 0 && <div className="flex-1 min-h-[52px]" />}

              {/* 1. Element Layer Lanes */}
              {layerTracks.map((row) => {
                const motions = getLayerMotions(row.type, row.id);
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
                    }}
                    className="h-8 shrink-0 flex items-center relative group"
                  >
                    <div
                      onClick={handleTimelineSeek}
                      className="relative w-full h-full flex items-center"
                    >
                      {motions.length > 0 ? (
                        motions.map((motion) => {
                          const meta = MOTION_PRESETS.find((p) => p.id === motion.preset);
                          const isEntrance = meta?.category === 'entrance';
                          const isExit = meta?.category === 'exit';
                          const blockLeft = PAD_PX + motion.startTimeSec * PX_PER_SECOND;
                          const blockWidth = Math.max(motion.durationSec * PX_PER_SECOND, 38);
                          const isDraggingThis = draggingMotionBlock?.blockId === motion.id;
                          const isSelectedBlock = selectedBlockId === motion.id;

                          return (
                            <div
                              key={motion.id}
                              style={{
                                left: `${blockLeft}px`,
                                width: `${blockWidth}px`,
                              }}
                              onPointerDown={(e) => handleMotionBlockPointerDown(e, row.type, row.id, motion, false)}
                              onPointerMove={handleMotionBlockPointerMove}
                              onPointerUp={handleMotionBlockPointerUp}
                              onPointerCancel={handleMotionBlockPointerUp}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!hasDraggedMotionRef.current) {
                                  setSelectedBlockId((prev) => (prev === motion.id ? null : motion.id));
                                }
                              }}
                              className={`absolute h-5 rounded-md flex items-center justify-between px-1.5 text-[10px] font-semibold shadow-xs select-none cursor-grab active:cursor-grabbing pointer-events-auto z-10 transition-colors group/motionblock ${
                                isDraggingThis ? 'ring-2 ring-white scale-[1.02] z-30' : ''
                              } ${
                                isSelectedBlock ? 'ring-1.5 ring-white' : ''
                              } ${
                                isEntrance
                                  ? 'bg-gradient-to-r from-cyan-500/35 via-sky-500/25 to-cyan-500/35 border border-cyan-400 text-cyan-200 hover:border-white'
                                  : isExit
                                    ? 'bg-gradient-to-r from-rose-500/35 via-amber-500/25 to-rose-500/35 border border-rose-400 text-rose-200 hover:border-white'
                                    : 'bg-gradient-to-r from-pastel-pink/35 via-purple-500/25 to-pastel-pink/35 border border-pastel-pink text-pastel-pink hover:border-white'
                              }`}
                              title="Drag to move. Drag right edge to trim duration."
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
                                onPointerDown={(e) => handleMotionBlockPointerDown(e, row.type, row.id, motion, true)}
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
                                className={`absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 shadow-2xl whitespace-nowrap z-50 transition-opacity ${
                                  isSelectedBlock || isDraggingThis
                                    ? 'opacity-100 pointer-events-auto'
                                    : 'opacity-0 group-hover/motionblock:opacity-100 pointer-events-none group-hover/motionblock:pointer-events-auto'
                                }`}
                              >
                                <span className="font-semibold text-white">
                                  {meta?.name || motion.preset}
                                </span>
                                <span className="font-mono text-slate-400 text-[10px]">
                                  {motion.startTimeSec.toFixed(1)}s - {(motion.startTimeSec + motion.durationSec).toFixed(1)}s
                                </span>
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
                        })
                      ) : (
                        <div
                          style={{ left: `${PAD_PX}px`, width: `${state.durationSec * PX_PER_SECOND}px` }}
                          className="absolute h-4 rounded-md border border-dashed border-neutral-800 bg-neutral-950/40 flex items-center px-2 text-[9px] text-slate-500 font-mono pointer-events-none"
                        >
                          <span>+ Click any preset above to add motion</span>
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
                className="h-9 shrink-0 flex items-center relative bg-neutral-950/90"
              >
                <div
                  ref={mockupTrackRef}
                  onClick={handleTimelineSeek}
                  className="relative w-full h-full flex items-center"
                >
                  {/* Horizontal connecting track line */}
                  <div
                    style={{ left: `${PAD_PX}px`, width: `${state.durationSec * PX_PER_SECOND}px` }}
                    className="absolute h-1.5 rounded-full bg-neutral-900 border border-neutral-800"
                  />

                  {/* Keyframe Nodes */}
                  {state.keyframes.map((kf) => {
                    const nodeX = PAD_PX + kf.timeSec * PX_PER_SECOND;
                    const isActive = Math.abs(state.currentTimeSec - kf.timeSec) < 0.2;
                    const isSelected = selectedKfId === kf.id;
                    const isDragging = draggingKfId === kf.id;

                    let tooltipAlignClass = 'left-1/2 -translate-x-1/2';
                    if (nodeX < PAD_PX + 40) {
                      tooltipAlignClass = 'left-0 translate-x-0';
                    } else if (nodeX > totalTrackWidth - 60) {
                      tooltipAlignClass = 'right-0 left-auto translate-x-0';
                    }

                    return (
                      <div
                        key={kf.id}
                        style={{ left: `${nodeX}px` }}
                        onPointerDown={(e) => handleMarkerPointerDown(e, kf)}
                        onPointerMove={(e) => handleMarkerPointerMove(e, kf.id)}
                        onPointerUp={handleMarkerPointerUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedKfId((prev) => (prev === kf.id ? null : kf.id));
                        }}
                        className={`absolute -translate-x-1/2 group cursor-grab active:cursor-grabbing top-1/2 -translate-y-1/2 pt-2 -mt-2 ${
                          isDragging ? 'z-50' : 'z-20'
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rotate-45 border transition-all ${
                            isActive || isSelected || isDragging
                              ? 'bg-pastel-pink border-white scale-125 shadow-md shadow-pastel-pink/60'
                              : 'bg-slate-700 border-slate-400 group-hover:bg-slate-300'
                          }`}
                        />

                        {/* Tooltip & Delete Popover */}
                        <div
                          className={`absolute bottom-full mb-1.5 ${tooltipAlignClass} flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 shadow-2xl whitespace-nowrap z-50 transition-opacity ${
                            isActive || isSelected || isDragging
                              ? 'opacity-100 pointer-events-auto'
                              : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'
                          }`}
                        >
                          <span className="font-mono text-pastel-pink font-semibold">
                            {kf.timeSec.toFixed(1)}s
                          </span>
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
  );
};
