export const EXPORT_COSTS = {
  imageStandard: 15,
  image4k: 30,
  videoShort: 75,
  videoLong: 120,
} as const;

export const MAX_PAID_VIDEO_DURATION_SECONDS = 60;

export function getExportCapacity(balance: number) {
  return {
    standardImages: Math.floor(balance / EXPORT_COSTS.imageStandard),
    fourKImages: Math.floor(balance / EXPORT_COSTS.image4k),
    shortVideos: Math.floor(balance / EXPORT_COSTS.videoShort),
    longVideos: Math.floor(balance / EXPORT_COSTS.videoLong),
  };
}

export function getImageExportCost(scale: number, stageCount = 1) {
  const perStage = scale <= 2 ? EXPORT_COSTS.imageStandard : EXPORT_COSTS.image4k;
  return perStage * Math.max(1, stageCount);
}

export function getVideoExportCost(durationSeconds: number) {
  return durationSeconds <= 10 ? EXPORT_COSTS.videoShort : EXPORT_COSTS.videoLong;
}
