import { StudioState } from '../types/studio';

/**
 * Compresses and resizes a base64 / blob image data URL client-side to WebP format.
 * Skips SVGs, external URLs, or invalid formats.
 * Utilizes a memoization cache to avoid re-compressing duplicate images across stages.
 */
export async function optimizeImageSrc(
  src: string | null | undefined,
  maxDimension = 1920,
  quality = 0.82,
  cache?: Map<string, string>
): Promise<string | null> {
  if (!src || typeof src !== 'string') return null;

  // Skip SVGs (already lightweight vector text) or remote HTTPS URLs
  if (src.startsWith('data:image/svg+xml') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  // Only optimize base64 data URLs or blob URLs
  if (!src.startsWith('data:image/') && !src.startsWith('blob:')) {
    return src;
  }

  // Check cache first
  if (cache && cache.has(src)) {
    return cache.get(src)!;
  }

  try {
    const optimized = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const naturalWidth = img.naturalWidth || img.width;
          const naturalHeight = img.naturalHeight || img.height;

          if (!naturalWidth || !naturalHeight) {
            resolve(src);
            return;
          }

          // Calculate aspect ratio preserving bounds
          let targetWidth = naturalWidth;
          let targetHeight = naturalHeight;

          if (targetWidth > maxDimension || targetHeight > maxDimension) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.max(1, Math.round((naturalHeight * maxDimension) / naturalWidth));
              targetWidth = maxDimension;
            } else {
              targetWidth = Math.max(1, Math.round((naturalWidth * maxDimension) / naturalHeight));
              targetHeight = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) {
            resolve(src);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Try exporting to WebP first
          let dataUrl = canvas.toDataURL('image/webp', quality);

          // Fallback to JPEG if browser doesn't support WebP data URL export
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Only use new dataURL if it's actually smaller or if the original was a blob
          if (src.startsWith('blob:') || dataUrl.length < src.length) {
            resolve(dataUrl);
          } else {
            resolve(src);
          }
        } catch (e) {
          console.warn('Failed to resize canvas image:', e);
          resolve(src);
        }
      };

      img.onerror = (err) => {
        console.warn('Failed to load image for optimization:', err);
        resolve(src);
      };

      img.src = src;
    });

    if (cache) {
      cache.set(src, optimized);
    }
    return optimized;
  } catch (err) {
    console.warn('Error during image optimization:', err);
    return src;
  }
}

/**
 * Sanitizes and compresses all image assets in a StudioState object (root + all stages + canvas elements).
 * Returns a deeply optimized clone ready for JSON export or POST /api/share.
 */
export async function optimizeStudioStateForExport(
  state: StudioState,
  onProgress?: (progressText: string) => void
): Promise<StudioState> {
  const cache = new Map<string, string>();
  onProgress?.('Optimizing screen images...');

  // Deep clone to avoid mutating the live studio canvas in-memory
  const clonedState: StudioState = JSON.parse(JSON.stringify(state));

  // 1. Optimize Root Level Images
  if (clonedState.imageSrc) {
    clonedState.imageSrc = await optimizeImageSrc(clonedState.imageSrc, 1920, 0.82, cache);
  }
  if (clonedState.secondImageSrc) {
    clonedState.secondImageSrc = await optimizeImageSrc(clonedState.secondImageSrc, 1920, 0.82, cache);
  }
  if (clonedState.bgImageUrl) {
    clonedState.bgImageUrl = await optimizeImageSrc(clonedState.bgImageUrl, 1920, 0.80, cache);
  }

  // 2. Optimize Root Canvas Elements (stickers/custom image layers)
  if (Array.isArray(clonedState.canvasElements) && clonedState.canvasElements.length > 0) {
    clonedState.canvasElements = await Promise.all(
      clonedState.canvasElements.map(async (el) => {
        if (el.src && (el.src.startsWith('data:image/') || el.src.startsWith('blob:'))) {
          const optimizedSrc = await optimizeImageSrc(el.src, 1200, 0.82, cache);
          return { ...el, src: optimizedSrc || el.src };
        }
        return el;
      })
    );
  }

  // 3. Optimize Stages Array
  if (Array.isArray(clonedState.stages) && clonedState.stages.length > 0) {
    const total = clonedState.stages.length;
    clonedState.stages = await Promise.all(
      clonedState.stages.map(async (stage, idx) => {
        onProgress?.(`Optimizing stage ${idx + 1} of ${total}...`);
        const stageClone = { ...stage };

        if (stageClone.imageSrc) {
          stageClone.imageSrc = await optimizeImageSrc(stageClone.imageSrc, 1920, 0.82, cache);
        }
        if (stageClone.secondImageSrc) {
          stageClone.secondImageSrc = await optimizeImageSrc(stageClone.secondImageSrc, 1920, 0.82, cache);
        }
        if (stageClone.bgImageUrl) {
          stageClone.bgImageUrl = await optimizeImageSrc(stageClone.bgImageUrl, 1920, 0.80, cache);
        }
        if (Array.isArray(stageClone.canvasElements) && stageClone.canvasElements.length > 0) {
          stageClone.canvasElements = await Promise.all(
            stageClone.canvasElements.map(async (el) => {
              if (el.src && (el.src.startsWith('data:image/') || el.src.startsWith('blob:'))) {
                const optimizedSrc = await optimizeImageSrc(el.src, 1200, 0.82, cache);
                return { ...el, src: optimizedSrc || el.src };
              }
              return el;
            })
          );
        }

        return stageClone;
      })
    );
  }

  return clonedState;
}
