import { create } from 'zustand';
import { StudioState, DEFAULT_STUDIO_STATE } from '../types/studio';

interface StudioStore extends StudioState {
  updateState: (updates: Partial<StudioState>) => void;
  setImage: (src: string, name: string) => void;
  reset3DPerspective: () => void;
  resetAll: () => void;
}

export const useStudioStore = create<StudioStore>((set) => ({
  ...DEFAULT_STUDIO_STATE,
  updateState: (updates) => set((state) => ({ ...state, ...updates })),
  setImage: (src, name) => set({ imageSrc: src, imageName: name }),
  reset3DPerspective: () => set({ rotateX: 0, rotateY: 0, perspective: 1000 }),
  resetAll: () => set({ ...DEFAULT_STUDIO_STATE }),
}));
