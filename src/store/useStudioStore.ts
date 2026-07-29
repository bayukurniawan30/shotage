import { create } from 'zustand';
import { temporal } from 'zundo';
import { StudioState, DEFAULT_STUDIO_STATE } from '../types/studio';

interface StudioStore extends StudioState {
  isPreviewMode: boolean;
  updateState: (updates: Partial<StudioState>) => void;
  setImage: (src: string, name: string) => void;
  reset3DPerspective: () => void;
  resetAll: () => void;
  togglePreviewMode: () => void;
}

export const useStudioStore = create<StudioStore>()(
  temporal(
    (set) => ({
      ...DEFAULT_STUDIO_STATE,
      isPreviewMode: false,
      updateState: (updates) => set((state) => ({ ...state, ...updates })),
      setImage: (src, name) => set({ imageSrc: src, imageName: name }),
      reset3DPerspective: () =>
        set({ rotateX: 0, rotateY: 0, perspective: 1000, offsetX: 0, offsetY: 0 }),
      resetAll: () => set({ ...DEFAULT_STUDIO_STATE }),
      togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
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
