import { create } from 'zustand';
import { useStudioStore } from './useStudioStore';
import { fixedCropFrame, type ImageCrop } from '../utils/imageCrop';

export interface ImageAdjustment {
  src: string;
  name: string;
  width: number;
  height: number;
  slot: 1 | 2;
  initial: ImageCrop;
  fixedRatio?: number;
  stage: number;
  frame: string;
  error?: string;
}
export const useImageAdjustmentStore = create<{
  request: ImageAdjustment | null;
  setRequest: (request: ImageAdjustment | null) => void;
}>((set) => ({ request: null, setRequest: (request) => set({ request }) }));

export function adjustUploadedImage(
  src: string,
  name: string,
  width: number,
  height: number,
  slot: 1 | 2 = 1,
  reopen = false
) {
  const state = useStudioStore.getState();
  if (state.isPreviewMode) return;
  if (state.frameType === 'code-window') {
    if (slot === 1) state.setImage(src, name, width, height);
    else state.setSecondImage(src, name, width, height);
    return;
  }
  const viewport = document.querySelector<HTMLElement>(
    `#shotage-canvas [data-video-export-mockup="${slot}"] [data-mockup-media-viewport]`
  );
  const fixed = fixedCropFrame(state.frameType);
  const fallbackRatio =
    state.frameType === 'ticket-pass'
      ? state.ticketPass?.variant === 'digital'
        ? 272 / 160
        : 430 / 150
      : state.frameType.startsWith('iphone') || state.frameType === 'samsung-s21'
        ? 9 / 19.5
        : state.frameType === 'tablet'
          ? 3 / 4
          : 16 / 10;
  const fixedRatio = fixed
    ? viewport?.clientWidth && viewport.clientHeight
      ? viewport.clientWidth / viewport.clientHeight
      : fallbackRatio
    : undefined;
  const previous = slot === 1 ? state.imageCrop : state.slot2ImageCrop;
  const legacyTicket =
    state.frameType === 'ticket-pass'
      ? {
          zoom: Math.max(1, (state.ticketPass?.imageZoom ?? 100) / 100),
          x: (state.ticketPass?.imageOffsetX ?? 0) / 100,
          y: (state.ticketPass?.imageOffsetY ?? 0) / 100,
        }
      : {};
  useImageAdjustmentStore
    .getState()
    .setRequest({
      src,
      name,
      width,
      height,
      slot,
      stage: state.activeStageIndex,
      frame: state.frameType,
      fixedRatio,
      initial:
        reopen && previous
          ? { ...previous, ratio: fixedRatio ?? previous.ratio }
          : {
              ratio: fixedRatio ?? width / height,
              zoom: 1,
              x: 0,
              y: 0,
              ...(reopen ? legacyTicket : {}),
            },
    });
}

export function reopenImageAdjustment(slot: 1 | 2) {
  const s = useStudioStore.getState();
  const src = slot === 1 ? s.imageSrc : s.secondImageSrc;
  const video = slot === 1 ? s.mediaType : s.secondMediaType;
  if (!src || video === 'video') return;
  const img = new Image();
  img.onload = () =>
    adjustUploadedImage(
      src,
      slot === 1 ? s.imageName : s.secondImageName,
      img.naturalWidth,
      img.naturalHeight,
      slot,
      true
    );
  img.onerror = () => alert('Unable to load this image for adjustment. Please upload it again.');
  img.src = src;
}
