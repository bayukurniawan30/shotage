import { create } from 'zustand';
import { temporal } from 'zundo';
import { StudioState, DEFAULT_STUDIO_STATE } from '../types/studio';

interface StudioStore extends StudioState {
  isPreviewMode: boolean;
  updateState: (updates: Partial<StudioState>) => void;
  setImage: (src: string, name: string) => void;
  setSecondImage: (src: string, name: string) => void;
  reset3DPerspective: () => void;
  resetAll: () => void;
  togglePreviewMode: () => void;
  addTextLayer: (text?: string) => void;
  addSocialLayer: (platform?: import('../types/studio').SocialPlatform, handle?: string) => void;
  updateTextLayer: (id: string, updates: Partial<import('../types/studio').TextLayer>) => void;
  removeTextLayer: (id: string) => void;
  duplicateTextLayer: (id: string) => void;
  selectTextLayer: (id: string | null) => void;
}

export const useStudioStore = create<StudioStore>()(
  temporal(
    (set) => ({
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
              const ease = (p: number) => (p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p);
              const factor = ease(progress);

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
      setImage: (src, name) => set({ imageSrc: src, imageName: name }),
      setSecondImage: (src, name) => set({ secondImageSrc: src, secondImageName: name }),
      reset3DPerspective: () =>
        set({
          zoom: 100,
          slot2Zoom: 100,
          rotateX: 0,
          rotateY: 0,
          slot1Rotate: 0,
          slot2Rotate: 0,
          perspective: 1000,
          offsetX: 0,
          offsetY: 0,
          slot2OffsetX: 0,
          slot2OffsetY: 0,
        }),
      resetAll: () => set((s) => ({ ...DEFAULT_STUDIO_STATE, resetKey: s.resetKey + 1 })),
      togglePreviewMode: () => set((state) => ({ isPreviewMode: !state.isPreviewMode })),
      addTextLayer: (initialText) =>
        set((state) => {
          const newLayer: import('../types/studio').TextLayer = {
            id: `text-${Date.now()}`,
            text: initialText || `Text ${state.textLayers.length + 1}`,
            fontFamily: 'Inter',
            fontSize: 32,
            fontWeight: '700',
            fontStyle: 'normal',
            color: '#ffffff',
            textAlign: 'center',
            x: 0,
            y: 0,
            shadow: true,
            opacity: 100,
            rotation: 0,
            position: 'above',
          };
          return {
            textLayers: [...state.textLayers, newLayer],
            selectedTextLayerId: newLayer.id,
          };
        }),
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
            position: 'above',
            socialPlatform: plat,
            socialStyle: 'default',
            iconColor: '#ffffff',
            iconSize: 20,
          };
          return {
            textLayers: [...state.textLayers, newLayer],
            selectedTextLayerId: newLayer.id,
          };
        }),
      updateTextLayer: (id, updates) =>
        set((state) => ({
          textLayers: state.textLayers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),
      removeTextLayer: (id) =>
        set((state) => ({
          textLayers: state.textLayers.filter((l) => l.id !== id),
          selectedTextLayerId: state.selectedTextLayerId === id ? null : state.selectedTextLayerId,
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
          return {
            textLayers: [...state.textLayers, dup],
            selectedTextLayerId: dup.id,
          };
        }),
      selectTextLayer: (id) => set({ selectedTextLayerId: id }),
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
