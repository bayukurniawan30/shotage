import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Plus, XClose, Trash01 } from '@untitledui/icons';
import { CardsThree } from '@phosphor-icons/react';

export const StageManagerToolbar: React.FC = () => {
  const isPreviewMode = useStudioStore((state) => state.isPreviewMode);
  const activeStageIndex = useStudioStore((state) => state.activeStageIndex ?? 0);
  const stages = useStudioStore((state) => state.stages || []);
  const selectStage = useStudioStore((state) => state.selectStage);
  const addStage = useStudioStore((state) => state.addStage);
  const removeStage = useStudioStore((state) => state.removeStage);

  const [stageToDelete, setStageToDelete] = useState<number | null>(null);

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

  if (isPreviewMode) return null;

  // Number of stages (at least 1 stage active)
  const stageCount = Math.max(1, stages.length > 0 ? stages.length : 1);

  const handleConfirmDelete = () => {
    if (stageToDelete !== null) {
      removeStage(stageToDelete);
      setStageToDelete(null);
    }
  };

  return (
    <>
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/95 border border-neutral-800 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
        {/* Icon & Stage Text Label */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-800/80 text-xs font-bold text-slate-400 select-none">
          <CardsThree weight="duotone" className="w-4 h-4 text-pastel-pink shrink-0" />
          <span className="text-[11px] font-semibold text-slate-300">Stage</span>
        </div>

        {/* Compact Stage Buttons with Bigger Number Text */}
        <div className="flex items-center gap-1">
          {Array.from({ length: stageCount }).map((_, index) => {
            const isActive = index === activeStageIndex;

            return (
              <div key={index} className="relative group">
                <button
                  type="button"
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

                {/* Close/Remove stage badge (only when more than 1 stage exists) */}
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
        </div>
      </div>

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
