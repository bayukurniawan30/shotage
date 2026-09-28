export interface LensBlurExportSettings {
  enabled: boolean;
  amount: number;
  focalX: number;
  focalY: number;
  radius: number;
  /** Output pixels per displayed canvas pixel at capture time. */
  pixelRatio: number;
}

function boxBlurPass(
  source: Uint8ClampedArray,
  target: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  horizontal: boolean
) {
  const span = radius * 2 + 1;
  const lines = horizontal ? height : width;
  const lineLength = horizontal ? width : height;

  for (let line = 0; line < lines; line++) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 0;
    const offset = (position: number) => {
      const clamped = Math.max(0, Math.min(lineLength - 1, position));
      return horizontal ? (line * width + clamped) * 4 : (clamped * width + line) * 4;
    };

    for (let sample = -radius; sample <= radius; sample++) {
      const index = offset(sample);
      red += source[index];
      green += source[index + 1];
      blue += source[index + 2];
      alpha += source[index + 3];
    }

    for (let position = 0; position < lineLength; position++) {
      const output = offset(position);
      target[output] = Math.round(red / span);
      target[output + 1] = Math.round(green / span);
      target[output + 2] = Math.round(blue / span);
      target[output + 3] = Math.round(alpha / span);

      const outgoing = offset(position - radius);
      const incoming = offset(position + radius + 1);
      red += source[incoming] - source[outgoing];
      green += source[incoming + 1] - source[outgoing + 1];
      blue += source[incoming + 2] - source[outgoing + 2];
      alpha += source[incoming + 3] - source[outgoing + 3];
    }
  }
}

/** Three box-blur passes closely approximate the browser's Gaussian blur. */
function applyGaussianLikeBlur(imageData: ImageData, radius: number) {
  if (radius < 1) return;
  const { width, height, data } = imageData;
  let source = data;
  let target = new Uint8ClampedArray(data.length);

  for (let pass = 0; pass < 3; pass++) {
    boxBlurPass(source, target, width, height, radius, true);
    [source, target] = [target, source];
    boxBlurPass(source, target, width, height, radius, false);
    [source, target] = [target, source];
  }

  if (source !== data) data.set(source);
}

/**
 * Recreates the canvas-stage depth-of-field overlay after DOM capture.
 *
 * Tauri's WKWebView does not paint `backdrop-filter` through html-to-image's
 * SVG foreignObject pipeline. Applying the effect to the captured bitmap keeps
 * desktop image exports visually aligned with the browser export instead.
 */
export function applyLensBlurToExportCanvas(
  canvas: HTMLCanvasElement,
  settings: LensBlurExportSettings
): void {
  if (!settings.enabled || settings.amount <= 0 || !canvas.width || !canvas.height) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  const source = document.createElement('canvas');
  source.width = canvas.width;
  source.height = canvas.height;
  const sourceContext = source.getContext('2d');
  if (!sourceContext) return;
  sourceContext.drawImage(canvas, 0, 0);

  const blurPx = Math.max(0, settings.amount * settings.pixelRatio);
  const focalX = (Math.min(100, Math.max(0, settings.focalX)) / 100) * canvas.width;
  const focalY = (Math.min(100, Math.max(0, settings.focalY)) / 100) * canvas.height;
  const minDimension = Math.min(canvas.width, canvas.height);
  const clearRadius = (Math.min(100, Math.max(0, settings.radius)) / 100) * minDimension;
  const blurRadius = (Math.min(100, Math.max(0, settings.radius + 35)) / 100) * minDimension;

  // WKWebView can ignore CanvasRenderingContext2D.filter as well as the
  // backdrop filter which triggered this fallback. Three separable box passes
  // approximate a Gaussian blur without relying on either filter API.
  const blurredBackdrop = document.createElement('canvas');
  blurredBackdrop.width = canvas.width;
  blurredBackdrop.height = canvas.height;
  const blurredBackdropContext = blurredBackdrop.getContext('2d');
  if (!blurredBackdropContext) return;
  blurredBackdropContext.drawImage(source, 0, 0);
  const blurredImageData = blurredBackdropContext.getImageData(0, 0, canvas.width, canvas.height);
  // CSS blur's radius is wider than a single box pass. Half the requested
  // radius across three passes gives a similarly soft, non-blocky falloff.
  applyGaussianLikeBlur(blurredImageData, Math.max(1, Math.round(blurPx / 2)));
  blurredBackdropContext.putImageData(blurredImageData, 0, 0);

  // First paint the blurred, slightly darker backdrop. The colour treatment is
  // intentionally subtle; the focal blur itself must remain dependable even
  // on WebKit versions without canvas-filter support.
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.drawImage(blurredBackdrop, 0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'source-atop';
  context.fillStyle = 'rgba(0, 0, 0, 0.08)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();

  // Restore the sharp focal area using the same clear-centre / feathered-edge
  // profile as the stage's radial CSS mask.
  const sharpFocalArea = document.createElement('canvas');
  sharpFocalArea.width = canvas.width;
  sharpFocalArea.height = canvas.height;
  const sharpContext = sharpFocalArea.getContext('2d');
  if (!sharpContext) return;
  sharpContext.drawImage(source, 0, 0);
  sharpContext.globalCompositeOperation = 'destination-in';
  const gradient = sharpContext.createRadialGradient(
    focalX,
    focalY,
    0,
    focalX,
    focalY,
    Math.max(clearRadius + 1, blurRadius)
  );
  const featherStart = Math.min(1, clearRadius / Math.max(clearRadius + 1, blurRadius));
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(featherStart, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sharpContext.fillStyle = gradient;
  sharpContext.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sharpFocalArea, 0, 0);

  source.width = source.height = 0;
  blurredBackdrop.width = blurredBackdrop.height = 0;
  sharpFocalArea.width = sharpFocalArea.height = 0;
}
