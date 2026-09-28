import { toCanvas } from 'html-to-image';

interface PaintProbe {
  points: HTMLElement[];
  restore: () => void;
}

function prepareProbe(image: HTMLImageElement): PaintProbe | null {
  const parent = image.parentElement;
  const source = parent?.querySelector<HTMLCanvasElement>('canvas[data-slot-canvas]');
  if (!parent || !source || !image.offsetWidth || !image.offsetHeight) return null;
  const context = source.getContext('2d');
  if (!context) return null;
  const fit = getComputedStyle(image).objectFit;
  const scale =
    fit === 'contain'
      ? Math.min(image.offsetWidth / source.width, image.offsetHeight / source.height)
      : Math.max(image.offsetWidth / source.width, image.offsetHeight / source.height);
  const sourceX = (fraction: number) =>
    fit === 'fill'
      ? fraction * source.width
      : source.width / 2 + ((fraction - 0.5) * image.offsetWidth) / scale;
  const sourceY = (fraction: number) =>
    fit === 'fill'
      ? fraction * source.height
      : source.height / 2 + ((fraction - 0.5) * image.offsetHeight) / scale;
  const left = Math.floor(sourceX(0.4)) - 1;
  const top = Math.floor(sourceY(0.4)) - 1;
  const right = Math.ceil(sourceX(0.6)) + 1;
  const bottom = Math.ceil(sourceY(0.6)) + 1;
  if (left < 0 || top < 0 || right > source.width || bottom > source.height) return null;
  // Check the WHOLE background footprint, not only the two sample points:
  // a transparent hole anywhere in it would otherwise expose the marker.
  const footprint = context.getImageData(left, top, right - left, bottom - top).data;
  for (let index = 3; index < footprint.length; index += 4) {
    if (footprint[index] !== 255) return null;
  }
  const sourcePixels = [0.46, 0.54].map((fraction) => {
    const x = sourceX(fraction);
    if (x < 0 || x >= source.width) return null;
    return context.getImageData(Math.floor(x), Math.floor(source.height / 2), 1, 1).data;
  });
  // Never expose the probe through legitimate transparency or confuse it with
  // source artwork that already has the same distinctive pair of colors.
  if (sourcePixels.some((pixel) => !pixel || pixel[3] < 250)) return null;
  if (isProbePair(sourcePixels[0]!, sourcePixels[1]!)) return null;

  const background = image.style.background;
  const position = parent.style.position;
  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  image.style.background =
    'linear-gradient(90deg, #ff00ff 50%, #00ff00 50%) center / 20% 20% no-repeat';
  // DOM points follow perspective/rotation exactly. Sampling the image's axis-
  // aligned bounding box would fail when a mockup is rotated or tilted.
  const points = [0.46, 0.54].map((fraction) => {
    const point = document.createElement('span');
    point.setAttribute('data-export-video-probe-anchor', '');
    Object.assign(point.style, {
      position: 'absolute',
      visibility: 'hidden',
      pointerEvents: 'none',
      left: `${image.offsetLeft + fraction * image.offsetWidth}px`,
      top: `${image.offsetTop + image.offsetHeight / 2}px`,
      width: '0',
      height: '0',
    });
    parent.append(point);
    return point;
  });
  return {
    points,
    restore: () => {
      points.forEach((point) => point.remove());
      image.style.background = background;
      parent.style.position = position;
    },
  };
}

function isProbePair(left: ArrayLike<number>, right: ArrayLike<number>) {
  return (
    left[0] > left[1] + 90 &&
    left[2] > left[1] + 90 &&
    right[1] > right[0] + 90 &&
    right[1] > right[2] + 90
  );
}

function missingVideo(node: HTMLElement, canvas: HTMLCanvasElement, probes: PaintProbe[]) {
  const root = node.getBoundingClientRect();
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !root.width || !root.height)
    throw new Error('Could not verify the video export frame.');
  return probes.some(({ points }) => {
    const samples = points.map((point) => {
      const rect = point.getBoundingClientRect();
      const x = Math.floor(((rect.left - root.left) / root.width) * canvas.width);
      const y = Math.floor(((rect.top - root.top) / root.height) * canvas.height);
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
      return context.getImageData(x, y, 1, 1).data;
    });
    return samples[0] && samples[1] && isProbePair(samples[0], samples[1]);
  });
}

/** Capture only the immutable decoded video images, never the preview canvases. */
export async function captureDesktopVideoFrame(
  node: HTMLElement,
  options: Parameters<typeof toCanvas>[1],
  validateOtherImages: (canvas: HTMLCanvasElement) => boolean = () => true
) {
  const images = node.querySelectorAll<HTMLImageElement>('img[data-export-video-frame]');
  for (const image of images) {
    if (!image.getAttribute('src'))
      throw new Error('The video export frame has not been prepared.');
    await image.decode();
  }
  const captureOptions: Parameters<typeof toCanvas>[1] = {
    ...options,
    filter: (element) => {
      if (element instanceof HTMLCanvasElement && element.hasAttribute('data-slot-canvas')) {
        return false;
      }
      return options?.filter?.(element) ?? true;
    },
  };
  const probes: PaintProbe[] = [];
  try {
    for (const image of images) {
      const probe = prepareProbe(image);
      if (probe) probes.push(probe);
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const captured = await toCanvas(node, captureOptions);
      // Where a transparent source cannot safely cover a probe, keep the
      // conservative first-rasterization warm-up.
      if (
        (probes.length === images.length || attempt > 0) &&
        !missingVideo(node, captured, probes) &&
        validateOtherImages(captured)
      ) {
        if (attempt > 0)
          console.debug('Desktop video capture recovered a missing image', {
            attempts: attempt + 1,
          });
        return captured;
      }
      captured.width = captured.height = 0;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    throw new Error(
      'A video frame did not render correctly. Export stopped before encoding the missing image.'
    );
  } finally {
    probes.forEach((probe) => probe.restore());
  }
}
