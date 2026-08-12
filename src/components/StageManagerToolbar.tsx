import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Plus, XClose } from '@untitledui/icons';
import { CardsThree } from '@phosphor-icons/react';

export const StageManagerToolbar: React.FC = () => {
  const isPreviewMode = useStudioStore((state) => state.isPreviewMode);
  const activeStageIndex = useStudioStore((state) => state.activeStageIndex ?? 0);
  const stages = useStudioStore((state) => state.stages || []);
  const selectStage = useStudioStore((state) => state.selectStage);
  const addStage = useStudioStore((state) => state.addStage);
  const removeStage = useStudioStore((state) => state.removeStage);

  if (isPreviewMode) return null;

  // Number of stages (at least 1 stage active)
  const stageCount = Math.max(1, stages.length > 0 ? stages.length : 1);

  return (
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
                    removeStage(index);
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
  );
};
