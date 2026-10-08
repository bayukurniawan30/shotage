export interface ImageCrop {
  ratio: number;
  zoom: number;
  x: number;
  y: number;
}
export function cropGeometry(iw: number, ih: number, vw: number, vh: number, crop: ImageCrop) {
  const scale = Math.max(vw / Math.max(1, iw), vh / Math.max(1, ih)) * Math.max(1, crop.zoom);
  const width = iw * scale,
    height = ih * scale;
  return {
    width,
    height,
    left: (-(width - vw) * (1 - Math.max(-1, Math.min(1, crop.x)))) / 2,
    top: (-(height - vh) * (1 - Math.max(-1, Math.min(1, crop.y)))) / 2,
  };
}
export function fixedCropFrame(frame: string) {
  return [
    'iphone',
    'iphone14pro',
    'iphone16',
    'iphone16-floating',
    'iphone17-dual-side',
    'samsung-s21',
    'macbook',
    'macbookair13',
    'tablet',
    'ticket-pass',
  ].includes(frame);
}
