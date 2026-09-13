import React, { Fragment, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStudioStore } from '../store/useStudioStore';
import { ChevronDown, Film01, Play, Plus, XClose, Trash01 } from '@untitledui/icons';
import { CardsThree } from '@phosphor-icons/react';
import type { AnimationEasingType } from '../types/animationTypes';
import {
  getStageSequenceTiming,
  getStageTransition,
  STAGE_TRANSITION_OPTIONS,
} from '../utils/stageTransitions';

interface StageManagerToolbarProps {
  onPreviewAll?: () => void;
  onPreviewTransition?: (boundaryIndex: number) => void;
}

export const StageManagerToolbar: React.FC<StageManagerToolbarProps> = ({
  onPreviewAll,
  onPreviewTransition,
}) => {
  const isPreviewMode = useStudioStore((state) => state.isPreviewMode);
  const activeStageIndex = useStudioStore((state) => state.activeStageIndex ?? 0);
  const stages = useStudioStore((state) => state.stages || []);
  const selectStage = useStudioStore((state) => state.selectStage);
  const addStage = useStudioStore((state) => state.addStage);
  const removeStage = useStudioStore((state) => state.removeStage);
  const updateStageTransition = useStudioStore((state) => state.updateStageTransition);

  const [stageToDelete, setStageToDelete] = useState<number | null>(null);
  const [openBoundaryIndex, setOpenBoundaryIndex] = useState<number | null>(null);
  const stageScrollerRef = useRef<HTMLDivElement>(null);

  // Close confirmation modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stageToDelete !== null) {
        setStageToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageToDelete]);

  // Number of stages (at least 1 stage active)
  const stageCount = Math.max(1, stages.length > 0 ? stages.length : 1);

  const handleConfirmDelete = () => {
    if (stageToDelete !== null) {
      removeStage(stageToDelete);
      setStageToDelete(null);
    }
  };

  const sequenceDuration = getStageSequenceTiming(stages).totalDurationSec;
  const openTransition =
    openBoundaryIndex !== null
      ? getStageTransition(stages[openBoundaryIndex], stages[openBoundaryIndex + 1])
      : null;

  useEffect(() => {
    if (stageCount <= 3 || window.innerWidth >= 640) return;
    stageScrollerRef.current
      ?.querySelector<HTMLElement>(`[data-stage-index="${activeStageIndex}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeStageIndex, stageCount]);

  if (isPreviewMode) return null;

  return (
    <>
      <div className="fixed top-16 left-1/2 z-30 flex w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/95 px-2.5 py-1 shadow-xl backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in-95 duration-200 sm:w-auto">
        {/* Icon & Stage Text Label */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-800/80 text-xs font-bold text-slate-400 select-none">
          <CardsThree weight="duotone" className="w-4 h-4 text-pastel-pink shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300">Stage</span>
        </div>

        {/* Compact Stage Buttons with Bigger Number Text */}
        <div
          ref={stageScrollerRef}
          data-testid="stage-manager-scroller"
          className={`min-w-0 overscroll-x-contain ${
            stageCount > 3 ? 'overflow-x-auto pb-1 -mb-1 sm:overflow-visible sm:pb-0 sm:mb-0' : ''
          }`}
        >
          <div className="flex w-max items-center gap-1">
            {Array.from({ length: stageCount }).map((_, index) => {
              const isActive = index === activeStageIndex;
              const transition = getStageTransition(stages[index], stages[index + 1]);
              const transitionOption = STAGE_TRANSITION_OPTIONS.find(
                (option) => option.type === transition.type
              );

              return (
                <Fragment key={index}>
                  <div className="relative group">
                    <button
                      type="button"
                      data-stage-index={index}
                      onClick={() => selectStage(index)}
                      className={`w-6 h-6 rounded text-sm font-extrabold flex items-center justify-center transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-gradient-to-r from-pastel-pink to-[#a2d2ff] text-slate-950 shadow-sm shadow-pastel-pink/20 ring-1 ring-pastel-pink/50 scale-105'
                          : 'bg-neutral-800/80 hover:bg-neutral-700 text-slate-300 border border-neutral-700/60'
                      }`}
                      title={`Switch to Stage ${index + 1}`}
                    >
                      {index + 1}
                    </button>

                    {stageCount > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStageToDelete(index);
                        }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        title={`Delete Stage ${index + 1}`}
                      >
                        <XClose className="w-2 h-2 stroke-[3]" />
                      </button>
                    )}
                  </div>

                  {index < stageCount - 1 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBoundaryIndex((current) => (current === index ? null : index))
                        }
                        className={`flex h-6 items-center gap-0.5 rounded-md border px-1.5 text-[9px] font-bold transition-colors ${
                          transition.type === 'none'
                            ? 'border-neutral-700 bg-neutral-950 text-slate-500 hover:text-slate-300'
                            : 'border-pastel-pink/50 bg-pastel-pink/10 text-pastel-pink hover:bg-pastel-pink/20'
                        }`}
                        title={`Transition from Stage ${index + 1} to ${index + 2}`}
                      >
                        <span>{transitionOption?.shortLabel || 'Cut'}</span>
                        <ChevronDown className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </Fragment>
              );
            })}

            {/* Add Stage (+) Button (Visible when stage count < 5) */}
            {stageCount < 5 && (
              <button
                type="button"
                onClick={() => addStage()}
                className="w-6 h-6 rounded bg-neutral-950/80 hover:bg-pastel-pink/20 text-slate-400 hover:text-pastel-pink border border-dashed border-neutral-700 hover:border-pastel-pink/60 transition-all flex items-center justify-center cursor-pointer"
                title="Add Stage (Max 5)"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}

            {stageCount > 1 && (
              <button
                type="button"
                onClick={onPreviewAll}
                className="ml-1 flex h-6 items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-2 text-[9px] font-bold text-slate-300 hover:border-pastel-pink/50 hover:text-pastel-pink"
                title={`Preview all stages (${sequenceDuration.toFixed(1)}s)`}
              >
                <Film01 className="h-3 w-3" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {openBoundaryIndex !== null &&
        openTransition &&
        createPortal(
          <div className="fixed left-1/2 top-24 z-[70] w-64 -translate-x-1/2 rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">Stage transition</p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Stage {openBoundaryIndex + 1} → {openBoundaryIndex + 2}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenBoundaryIndex(null)}
                className="rounded p-0.5 text-slate-500 hover:text-white"
              >
                <XClose className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {STAGE_TRANSITION_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() =>
                    updateStageTransition(openBoundaryIndex, {
                      ...openTransition,
                      type: option.type,
                    })
                  }
                  className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold ${
                    openTransition.type === option.type
                      ? 'border-pastel-pink bg-pastel-pink/15 text-pastel-pink'
                      : 'border-neutral-700 bg-neutral-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="mt-3 block text-[10px] font-semibold text-slate-400">
              Duration{' '}
              <span className="font-mono text-white">{openTransition.durationSec.toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.1"
              disabled={openTransition.type === 'none'}
              value={openTransition.durationSec}
              onChange={(event) =>
                updateStageTransition(openBoundaryIndex, {
                  ...openTransition,
                  durationSec: Number(event.target.value),
                })
              }
              className="mt-1 w-full accent-pastel-pink disabled:opacity-40"
            />

            <label className="mt-2 block text-[10px] font-semibold text-slate-400">Easing</label>
            <select
              value={openTransition.easing}
              disabled={openTransition.type === 'none'}
              onChange={(event) =>
                updateStageTransition(openBoundaryIndex, {
                  ...openTransition,
                  easing: event.target.value as AnimationEasingType,
                })
              }
              className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-[10px] text-slate-200 outline-none disabled:opacity-40"
            >
              <option value="ease-in-out">Ease In-Out</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in">Ease In</option>
              <option value="linear">Linear</option>
            </select>

            <button
              type="button"
              onClick={() => {
                const boundaryIndex = openBoundaryIndex;
                setOpenBoundaryIndex(null);
                onPreviewTransition?.(boundaryIndex);
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-pastel-pink/40 bg-pastel-pink/15 px-2 py-2 text-[10px] font-bold text-pastel-pink hover:bg-pastel-pink/25"
            >
              <Play className="h-3.5 w-3.5" />
              Preview transition
            </button>
          </div>,
          document.body
        )}

      {/* Delete Stage Confirmation Pop Up Modal */}
      {stageToDelete !== null && (
        <div
          className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setStageToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Icon & Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash01 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Delete Stage {stageToDelete + 1}?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Are you sure you want to remove this stage? This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStageToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Cancel"
              >
                <XClose className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80">
              <button
                type="button"
                onClick={() => setStageToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                Delete Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
