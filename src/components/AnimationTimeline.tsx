import React, { useEffect, useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Play, PauseSquare, Plus, Trash01, Film01, RefreshCw01 } from '@untitledui/icons';
import { ANIMATION_PRESETS, AnimationKeyframe } from '../types/animationTypes';

export const AnimationTimeline: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Initialize default keyframes from active preset if empty
  useEffect(() => {
    if (state.keyframes.length === 0) {
      const preset =
        ANIMATION_PRESETS.find((p) => p.id === state.activePresetId) || ANIMATION_PRESETS[0];
      const initialKeyframes: AnimationKeyframe[] = preset.keyframes.map((kf, i) => ({
        ...kf,
        id: `kf-${i}-${Date.now()}`,
      }));
      onChange({ keyframes: initialKeyframes });
    }
  }, [state.activePresetId, state.keyframes.length, onChange]);

  // Playback Loop
  useEffect(() => {
    if (!state.isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000;
        let nextTime = state.currentTimeSec + delta;
        if (nextTime >= state.durationSec) {
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
  }, [state.isPlaying, state.currentTimeSec, state.durationSec, onChange]);

  // Load animation preset template
  const applyPreset = (presetId: string) => {
    const preset = ANIMATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newKeyframes: AnimationKeyframe[] = preset.keyframes.map((kf, i) => ({
      ...kf,
      id: `kf-preset-${i}-${Date.now()}`,
    }));
    onChange({
      activePresetId: presetId,
      keyframes: newKeyframes,
      currentTimeSec: 0,
    });
  };

  // Add current canvas state as a new keyframe
  const addCurrentStateKeyframe = () => {
    const currentT = Math.round(state.currentTimeSec * 10) / 10;
    // Check if keyframe exists at current time
    const existingIndex = state.keyframes.findIndex((kf) => Math.abs(kf.timeSec - currentT) < 0.2);

    const newKf: AnimationKeyframe = {
      id: `kf-user-${Date.now()}`,
      timeSec: currentT,
      rotateX: state.rotateX,
      rotateY: state.rotateY,
      zoom: state.zoom,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
    };

    let updatedKf = [...state.keyframes];
    if (existingIndex >= 0) {
      updatedKf[existingIndex] = newKf;
    } else {
      updatedKf.push(newKf);
      updatedKf.sort((a, b) => a.timeSec - b.timeSec);
    }
    onChange({ keyframes: updatedKf });
  };

  // Remove keyframe at index
  const deleteKeyframe = (id: string) => {
    if (state.keyframes.length <= 1) return;
    onChange({ keyframes: state.keyframes.filter((kf) => kf.id !== id) });
  };

  return (
    <div className="w-full bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3 sm:p-4 space-y-2.5 z-50 text-white shadow-2xl animate-in slide-in-from-bottom duration-200">
      {/* Header Bar: Presets & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pastel-pink/20 text-pastel-pink flex items-center justify-center">
            <Film01 className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Animation Timeline
          </h3>
        </div>

        {/* Preset Animation Selector Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1">Presets:</span>
          {ANIMATION_PRESETS.map((preset) => {
            const isSelected = state.activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                    : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scrubber Track & Keyframe Controls */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          {/* Play / Pause Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ isPlaying: !state.isPlaying })}
              className="w-8 h-8 rounded-xl bg-pastel-pink hover:bg-pastel-pinkLight text-slate-950 font-bold flex items-center justify-center transition-all shadow-md cursor-pointer"
            >
              {state.isPlaying ? (
                <PauseSquare className="w-4 h-4 fill-slate-950" />
              ) : (
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              )}
            </button>
            <span className="font-mono text-xs font-bold text-slate-200">
              {state.currentTimeSec.toFixed(1)}s / {state.durationSec}s
            </span>
          </div>

          {/* Keyframe Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={addCurrentStateKeyframe}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-pastel-pink" />
              <span>Add Keyframe</span>
            </button>

            <button
              onClick={() => onChange({ currentTimeSec: 0, isPlaying: false })}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition-all cursor-pointer"
              title="Reset Timeline to 0s"
            >
              <RefreshCw01 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrubber Range Input & Keyframe Marker Track */}
        <div className="relative pt-2">
          {/* Keyframe Marker Nodes Track (Placed above slider for clear visibility) */}
          <div className="relative w-full h-4 mb-1">
            {state.keyframes.map((kf) => {
              const posPercent = (kf.timeSec / state.durationSec) * 100;
              const isActive = Math.abs(state.currentTimeSec - kf.timeSec) < 0.2;

              return (
                <div
                  key={kf.id}
                  style={{ left: `${posPercent}%` }}
                  className="absolute -translate-x-1/2 group cursor-pointer top-0.5"
                  onClick={() => onChange({ currentTimeSec: kf.timeSec })}
                >
                  <div
                    className={`w-2.5 h-2.5 rotate-45 border transition-all ${
                      isActive
                        ? 'bg-pastel-pink border-white scale-125 shadow-md shadow-pastel-pink/50'
                        : 'bg-slate-700 border-slate-500 group-hover:bg-slate-300'
                    }`}
                  />
                  {/* Tooltip & Delete Keyframe Button */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1 text-[10px] text-slate-200 shadow-xl whitespace-nowrap z-50">
                    <span>{kf.timeSec.toFixed(1)}s</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteKeyframe(kf.id);
                      }}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash01 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <input
            type="range"
            min="0"
            max={state.durationSec}
            step="0.1"
            value={state.currentTimeSec}
            onChange={(e) => onChange({ currentTimeSec: parseFloat(e.target.value) })}
            className="w-full bg-neutral-800 rounded-lg cursor-pointer accent-pastel-pink"
          />
        </div>
      </div>
    </div>
  );
};
