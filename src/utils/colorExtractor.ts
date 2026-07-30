/**
 * Extract dominant colors from an image HTML element using Canvas
 */
export function extractDominantColors(
  imageElement: HTMLImageElement,
  colorCount: number = 3
): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return ['#4158D0', '#C850C0', '#FFCC70'];

  // Scale down image for fast color quantization processing
  canvas.width = 64;
  canvas.height = 64;
  ctx.drawImage(imageElement, 0, 0, 64, 64);

  const imageData = ctx.getImageData(0, 0, 64, 64).data;
  const colorBuckets: { [key: string]: number } = {};

  for (let i = 0; i < imageData.length; i += 16) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const a = imageData[i + 3];

    if (a < 128) continue; // Skip semi-transparent pixels

    // Quantize colors (group similar hues into 32-step buckets)
    const qR = Math.round(r / 32) * 32;
    const qG = Math.round(g / 32) * 32;
    const qB = Math.round(b / 32) * 32;

    // Ignore extreme dark black (#000000) or pure white (#FFFFFF)
    const brightness = (qR + qG + qB) / 3;
    if (brightness < 20 || brightness > 235) continue;

    const hex = `#${((1 << 24) + (qR << 16) + (qG << 8) + qB).toString(16).slice(1)}`;
    colorBuckets[hex] = (colorBuckets[hex] || 0) + 1;
  }

  // Sort colors by frequency
  const sortedColors = Object.keys(colorBuckets).sort(
    (a, b) => colorBuckets[b] - colorBuckets[a]
  );

  if (sortedColors.length === 0) {
    return ['#4158D0', '#C850C0', '#FFCC70'];
  }

  // Guarantee at least colorCount colors by generating complementary shades if needed
  while (sortedColors.length < colorCount) {
    sortedColors.push(sortedColors[0] || '#4158D0');
  }

  return sortedColors.slice(0, colorCount);
}

/**
 * Generate derivative gradient color pairs from dominant colors
 */
export function generateGradientVariations(
  colors: string[]
): { name: string; c1: string; c2: string }[] {
  const c1 = colors[0] || '#4158D0';
  const c2 = colors[1] || colors[0] || '#C850C0';
  const c3 = colors[2] || colors[1] || colors[0] || '#FFCC70';

  return [
    { name: 'Auto Match 1', c1, c2 },
    { name: 'Auto Match 2', c1: c2, c2: c3 },
    { name: 'Auto Match 3', c1: c3, c2: c1 },
    { name: 'Soft Dark', c1: `${c1}dd`, c2: '#0f172a' },
    { name: 'Vibrant Blend', c1: c1, c2: `${c3}cc` },
  ];
}
