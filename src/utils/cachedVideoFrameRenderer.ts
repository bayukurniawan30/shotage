import { toCanvas } from 'html-to-image';
import type { StudioState } from '../types/studio';

const UNSUPPORTED_ANIMATED_BACKGROUNDS = new Set<StudioState['backgroundType']>([
  'animatedGradient',
  'animatedMesh',
]);

const EXPORT_FILTER = (node: Node) => {
  const element = node as HTMLElement;
  if (element.tagName === 'VIDEO') return false;
  return ![
    'delete-handle',
    'rotate-handle',
    'resize-handle',
    'selection-gizmo-container',
    'selection-gizmo-item',
  ].some((className) => element.classList?.contains(className));
};

/**
 * The cached renderer is deliberately conservative. It rasterizes the static
 * background and each mockup once, then only applies the mockups' 2D CSS
 * matrices for subsequent frames. Anything it cannot reproduce exactly keeps
 * using the DOM snapshot renderer.
 */
export function canUseCachedVideoFrameRenderer(state: StudioState) {
  if (UNSUPPORTED_ANIMATED_BACKGROUNDS.has(state.backgroundType)) return false;
  if (
    state.backgroundType === 'flow' &&
    ((state.bgBlur ?? 0) > 0 ||
      (state.bgGrain ?? 0) > 0 ||
      state.bgPatternEnabled ||
      (state.shadowOverlay && state.shadowOverlay !== 'none') ||
      (state.lensBlurEnabled && (state.lensBlurAmount ?? 0) > 0))
  ) {
    return false;
  }
  if (
    state.mediaType === 'video' ||
    (state.layoutCount === 2 && state.secondMediaType === 'video')
  ) {
    return false;
  }
  if (
    state.shapeLayers.length > 0 ||
    state.phosphorIconLayers.length > 0 ||
    state.canvasElements.length > 0 ||
    state.techStackConfig.enabled ||
    state.phosphorIconConfig.enabled ||
    state.watermarkType !== 'none'
  ) {
    return false;
  }

  const canCacheTextLayer = (layer: StudioState['textLayers'][number]) =>
    layer.visible === false ||
    ((layer.position || 'above') === 'above' &&
      (!layer.loopAnimation || layer.loopAnimation === 'none') &&
      (!layer.motions || layer.motions.length === 0) &&
      (!layer.keyframes || layer.keyframes.length === 0));
  if (!state.textLayers.every(canCacheTextLayer)) return false;

  if (state.hideMockup) return true;

  const has3dTilt = (rotateX: number | undefined, rotateY: number | undefined) =>
    Math.abs(rotateX || 0) > 0.001 || Math.abs(rotateY || 0) > 0.001;

  if (state.keyframes.length > 0) {
    return !state.keyframes.some((keyframe) => has3dTilt(keyframe.rotateX, keyframe.rotateY));
  }

  if (has3dTilt(state.rotateX, state.rotateY)) return false;
  if (
    state.layoutCount === 2 &&
    has3dTilt(state.slot2RotateX ?? state.rotateX, state.slot2RotateY ?? state.rotateY)
  ) {
    return false;
  }

  return true;
}

interface MockupSnapshot {
  element: HTMLElement;
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  layoutScaleX: number;
  layoutScaleY: number;
  opacity: number;
  zIndex: number;
}

interface FlowCanvasSnapshot {
  element: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CachedVideoFrameRenderer {
  render(context: CanvasRenderingContext2D): boolean;
  dispose(): void;
}

interface CreateRendererOptions {
  pixelRatio: number;
  fontEmbedCSS: string;
  transparent: boolean;
}

function parseZIndex(element: HTMLElement, root: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    const value = Number.parseInt(getComputedStyle(current).zIndex, 10);
    if (Number.isFinite(value)) return value;
    current = current.parentElement;
  }
  return 0;
}

function getOpacity(element: HTMLElement, root: HTMLElement) {
  let opacity = 1;
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    const value = Number.parseFloat(getComputedStyle(current).opacity);
    if (Number.isFinite(value)) opacity *= value;
    current = current.parentElement;
  }
  return opacity;
}

function parseTransformOrigin(value: string, width: number, height: number) {
  const [rawX = '50%', rawY = '50%'] = value.split(/\s+/);
  const resolve = (raw: string, size: number) =>
    raw.endsWith('%') ? (Number.parseFloat(raw) / 100) * size : Number.parseFloat(raw);
  return {
    x: Number.isFinite(resolve(rawX, width)) ? resolve(rawX, width) : width / 2,
    y: Number.isFinite(resolve(rawY, height)) ? resolve(rawY, height) : height / 2,
  };
}

export async function createCachedVideoFrameRenderer(
  root: HTMLElement,
  options: CreateRendererOptions
): Promise<CachedVideoFrameRenderer | null> {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-video-export-mockup]'));
  const originalStyles = elements.map((element) => ({
    element,
    visibility: element.style.visibility,
    transform: element.style.transform,
    transition: element.style.transition,
  }));
  const rootRect = root.getBoundingClientRect();
  const cssWidth = root.offsetWidth || root.clientWidth;
  const cssHeight = root.offsetHeight || root.clientHeight;
  if (!cssWidth || !cssHeight || !rootRect.width || !rootRect.height) return null;

  const flowElement = root.querySelector<HTMLCanvasElement>(
    '[data-video-export-flow-canvas="true"]'
  );
  const flowRect = flowElement?.getBoundingClientRect();
  const flowCanvas: FlowCanvasSnapshot | null =
    flowElement && flowRect && flowRect.width > 0 && flowRect.height > 0
      ? {
          element: flowElement,
          x: ((flowRect.left - rootRect.left) / rootRect.width) * cssWidth,
          y: ((flowRect.top - rootRect.top) / rootRect.height) * cssHeight,
          width: (flowRect.width / rootRect.width) * cssWidth,
          height: (flowRect.height / rootRect.height) * cssHeight,
        }
      : null;

  const snapshotOptions = {
    pixelRatio: options.pixelRatio,
    cacheBust: false,
    fontEmbedCSS: options.fontEmbedCSS,
    ...(options.transparent ? { backgroundColor: 'transparent' } : {}),
    filter: EXPORT_FILTER,
  };

  let background: HTMLCanvasElement | null = null;
  let foreground: HTMLCanvasElement | null = null;
  const mockups: MockupSnapshot[] = [];
  const flowWrapper = flowElement?.closest<HTMLElement>(
    '[data-video-export-dynamic-background="flow"]'
  );
  const backgroundLayer = root.querySelector<HTMLElement>(
    '[data-video-export-background-layer="true"]'
  );
  const originalFlowVisibility = flowWrapper?.style.visibility ?? '';
  const originalRootBackground = {
    background: root.style.background,
    backgroundColor: root.style.backgroundColor,
    backgroundImage: root.style.backgroundImage,
  };
  const originalLayerBackground = backgroundLayer
    ? {
        background: backgroundLayer.style.background,
        backgroundColor: backgroundLayer.style.backgroundColor,
        backgroundImage: backgroundLayer.style.backgroundImage,
      }
    : null;

  try {
    for (const { element } of originalStyles) element.style.visibility = 'hidden';
    // Flow already renders deterministically into its WebGL canvas during export.
    // Drawing that live canvas directly avoids cloning and rasterizing the entire
    // Studio DOM for every frame. Static backgrounds are still captured once.
    if (!flowCanvas) {
      background = await toCanvas(root, snapshotOptions);
    } else if (root.querySelector('.text-layer-item')) {
      if (flowWrapper) flowWrapper.style.visibility = 'hidden';
      root.style.background = 'transparent';
      root.style.backgroundColor = 'transparent';
      root.style.backgroundImage = 'none';
      if (backgroundLayer) {
        backgroundLayer.style.background = 'transparent';
        backgroundLayer.style.backgroundColor = 'transparent';
        backgroundLayer.style.backgroundImage = 'none';
      }
      foreground = await toCanvas(root, {
        ...snapshotOptions,
        backgroundColor: 'transparent',
      });
    }

    for (const entry of originalStyles) {
      const { element } = entry;
      element.style.visibility = 'visible';
      element.style.transition = 'none';
      element.style.transform = 'none';

      const rect = element.getBoundingClientRect();
      const width = element.offsetWidth || rect.width;
      const height = element.offsetHeight || rect.height;
      if (!width || !height) continue;

      const canvas = await toCanvas(element, snapshotOptions);
      mockups.push({
        element,
        canvas,
        x: ((rect.left - rootRect.left) / rootRect.width) * cssWidth,
        y: ((rect.top - rootRect.top) / rootRect.height) * cssHeight,
        width,
        height,
        layoutScaleX: rect.width / width,
        layoutScaleY: rect.height / height,
        opacity: getOpacity(element, root),
        zIndex: parseZIndex(element, root),
      });
      element.style.visibility = 'hidden';
    }
  } catch (error) {
    console.warn('Fast video renderer initialization failed; using DOM renderer.', error);
    if (background) {
      background.width = 0;
      background.height = 0;
    }
    if (foreground) {
      foreground.width = 0;
      foreground.height = 0;
    }
    for (const mockup of mockups) {
      mockup.canvas.width = 0;
      mockup.canvas.height = 0;
    }
    return null;
  } finally {
    if (flowWrapper) flowWrapper.style.visibility = originalFlowVisibility;
    root.style.background = originalRootBackground.background;
    root.style.backgroundColor = originalRootBackground.backgroundColor;
    root.style.backgroundImage = originalRootBackground.backgroundImage;
    if (backgroundLayer && originalLayerBackground) {
      backgroundLayer.style.background = originalLayerBackground.background;
      backgroundLayer.style.backgroundColor = originalLayerBackground.backgroundColor;
      backgroundLayer.style.backgroundImage = originalLayerBackground.backgroundImage;
    }
    for (const entry of originalStyles) {
      entry.element.style.visibility = entry.visibility;
      entry.element.style.transform = entry.transform;
      entry.element.style.transition = entry.transition;
    }
  }

  if (!background && !flowCanvas) return null;
  mockups.sort((a, b) => a.zIndex - b.zIndex);

  return {
    render(context) {
      const output = context.canvas;
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, output.width, output.height);
      if (background) {
        context.drawImage(background, 0, 0, output.width, output.height);
      }
      context.scale(output.width / cssWidth, output.height / cssHeight);
      if (flowCanvas) {
        if (!flowCanvas.element.width || !flowCanvas.element.height) {
          context.restore();
          return false;
        }
        context.drawImage(
          flowCanvas.element,
          flowCanvas.x,
          flowCanvas.y,
          flowCanvas.width,
          flowCanvas.height
        );
      }

      for (const mockup of mockups) {
        const computed = getComputedStyle(mockup.element);
        const matrix = new DOMMatrix(
          computed.transform === 'none' ? undefined : computed.transform
        );
        if (!matrix.is2D) {
          context.restore();
          return false;
        }

        const origin = parseTransformOrigin(computed.transformOrigin, mockup.width, mockup.height);
        context.save();
        context.globalAlpha = mockup.opacity;
        context.translate(
          mockup.x + origin.x * mockup.layoutScaleX,
          mockup.y + origin.y * mockup.layoutScaleY
        );
        context.transform(
          matrix.a,
          matrix.b,
          matrix.c,
          matrix.d,
          matrix.e * mockup.layoutScaleX,
          matrix.f * mockup.layoutScaleY
        );
        context.scale(mockup.layoutScaleX, mockup.layoutScaleY);
        context.translate(-origin.x, -origin.y);
        context.drawImage(mockup.canvas, 0, 0, mockup.width, mockup.height);
        context.restore();
      }

      if (foreground) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.drawImage(foreground, 0, 0, output.width, output.height);
      }

      context.restore();
      return true;
    },
    dispose() {
      if (background) {
        background.width = 0;
        background.height = 0;
      }
      if (foreground) {
        foreground.width = 0;
        foreground.height = 0;
      }
      for (const mockup of mockups) {
        mockup.canvas.width = 0;
        mockup.canvas.height = 0;
      }
    },
  };
}
