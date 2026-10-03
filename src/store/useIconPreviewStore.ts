import { create } from 'zustand';

export type IconPreviewShape = 'rounded' | 'circle' | 'square';

// Editor preferences, deliberately separate from the saved/exported design.
export const useIconPreviewStore = create<{
  shape: IconPreviewShape;
  guides: boolean;
  construction: boolean;
  setShape: (shape: IconPreviewShape) => void;
  setGuides: (guides: boolean) => void;
  setConstruction: (construction: boolean) => void;
}>((set) => ({
  shape: 'rounded',
  guides: true,
  construction: false,
  setShape: (shape) => set({ shape }),
  setGuides: (guides) => set({ guides }),
  setConstruction: (construction) => set({ construction }),
}));
