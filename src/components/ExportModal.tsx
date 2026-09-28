import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useStudioStore } from '../store/useStudioStore';
import { toPng, toJpeg, toBlob, toCanvas, getFontEmbedCSS } from 'html-to-image';
import {
  Download01,
  XClose,
  LinkExternal01,
  Film01,
  Image01,
  Share01,
  Copy01,
  Loading01,
  Check,
} from '@untitledui/icons';
import * as WebMMuxer from 'webm-muxer';
import * as Mp4Muxer from 'mp4-muxer';
import { activeVideoDecoders } from './VideoCanvasScreen';
import { CanvasStage } from './CanvasStage';
import { PROJECTS } from './ProjectSpotlight';
import { optimizeStudioStateForExport } from '../utils/imageOptimizer';
import { compressGzipString } from '../utils/gzipCompression';
import {
  canUseCachedVideoFrameRenderer,
  createCachedVideoFrameRenderer,
  type CachedVideoFrameRenderer,
} from '../utils/cachedVideoFrameRenderer';
import { AuthButton, CreditPackDialog } from './auth/AuthButton';
import {
  announceCreditBalanceUpdated,
  authClient,
  CreditApiError,
  fetchVerifiedAccount,
  getAuthToken,
  releaseExportReservation,
  reserveImageExport,
  reserveVideoExport,
  settleExportReservation,
  type ExportReservation,
  type VerifiedAccount,
} from '../lib/auth/client';
import {
  MAX_PAID_VIDEO_DURATION_SECONDS,
  getExportCapacity,
  getImageExportCost,
  getVideoExportCost,
} from '../lib/credits';
import type { StudioState } from '../types/studio';
import { calculateEasing } from '../types/animationTypes';
import {
  getStageSequenceTiming,
  getStageTransition,
  getStageTransitionLayerTransforms,
} from '../utils/stageTransitions';
import { ensureStudioFontsLoaded } from '../utils/fontLoader';
import { waitForCodeHighlights } from '../utils/codeHighlight';
import { apiUrl, isDesktopApp } from '../platform/runtime';
import { getDesktopFrameExportIssue } from '../platform/desktopFrameCompatibility';
import { saveExportToDevice } from '../platform/desktop';
import { convertAvcAnnexB } from '../utils/avcAnnexB';
import type { DesktopVideoExportSession } from '../utils/exportVideoDecoder';
import { captureDesktopVideoFrame } from '../utils/desktopVideoCapture';
import { applyLensBlurToExportCanvas } from '../utils/lensBlurExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

async function createProjectHash(value: unknown) {
  const ignoredKeys = new Set([
    'currentTimeSec',
    'exportTimeSec',
    'isExporting',
    'isPlaying',
    'isPositionDragging',
    'previewCanvasZoom',
    'shareId',
    'shareIdentifier',
    'sharedDesignName',
    'sharedDesignPublisher',
  ]);
  const serialized = JSON.stringify(value, (key, item) => {
    if (typeof item === 'function' || ignoredKeys.has(key) || key.startsWith('selected')) {
      return undefined;
    }
    return item;
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function retryReservationMutation(mutation: () => Promise<ExportReservation>, attempts = 3) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await mutation();
    } catch (error) {
      lastError = error;
      if (error instanceof CreditApiError && error.status < 500) throw error;
    }
  }
  throw lastError;
}

async function warmDesktopCapture(
  node: HTMLElement,
  options: Parameters<typeof toCanvas>[1]
) {
  if (!isDesktopApp()) return;
  // The video frame image has no source until the first frame is sought below.
  // It sits inside the mockup, so skip before decoding mockup images.
  if (node.querySelector('img[data-export-video-frame]')) return;
  const mockupImages = Array.from(
    node.querySelectorAll<HTMLImageElement>('[data-video-export-mockup] img')
  );
  // A loaded DOM image is not necessarily decoded inside html-to-image's SVG
  // foreignObject. WKWebView can omit it on the first rasterization, even when
  // the canvas preview already shows it. Wait for the source before priming.
  await Promise.all(mockupImages.map(async (image) => {
    await image.decode();
    if (!image.naturalWidth) throw new Error('The mockup image could not be loaded for export.');
  }));

  // Prime the foreignObject renderer once without paying the memory cost of
  // repeated full-stage captures. The mockup shadow is rendered separately
  // from its image-bearing foreground during desktop export.
  const warmCanvas = await toCanvas(node, { ...options, pixelRatio: 1 });
  warmCanvas.width = 0;
  warmCanvas.height = 0;
}

async function prepareDesktopMockupProbes(node: HTMLElement): Promise<() => void> {
  if (!isDesktopApp()) return () => {};
  const prepared: HTMLImageElement[] = [];
  const restore = () => {
    for (const image of prepared) {
      image.removeAttribute('data-export-probe');
    }
  };

  try {
    for (const image of node.querySelectorAll<HTMLImageElement>(
      'img[data-export-mockup-image="true"]'
    )) {
      if (!image.src.startsWith('data:image/') || image.src.startsWith('data:image/svg+xml')) {
        continue;
      }
      await image.decode();
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) throw new Error('The mockup image could not be loaded for export.');

      // Only probe an opaque center pixel. For transparent artwork the marker
      // could legitimately show through and incorrectly reject a good export.
      const sample = document.createElement('canvas');
      sample.width = 1;
      sample.height = 1;
      const context = sample.getContext('2d');
      if (!context) continue;
      context.drawImage(image, Math.floor(width / 2), Math.floor(height / 2), 1, 1, 0, 0, 1, 1);
      const alpha = context.getImageData(0, 0, 1, 1).data[3];
      sample.width = 0;
      sample.height = 0;
      if (alpha < 250) continue;
      image.setAttribute('data-export-probe', 'true');
      prepared.push(image);
    }
    return restore;
  } catch (error) {
    restore();
    throw error;
  }
}

function hasUnpaintedDesktopMockup(node: HTMLElement, canvas: HTMLCanvasElement): boolean {
  const probes = node.querySelectorAll<HTMLImageElement>('img[data-export-probe="true"]');
  if (probes.length === 0) return false;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not inspect the desktop image export.');
  const stageRect = node.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return false;

  const sample = (x: number, y: number) => {
    const pixelX = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
    const pixelY = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
    return context.getImageData(pixelX, pixelY, 1, 1).data;
  };

  for (const image of probes) {
    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const centerY = ((rect.top + rect.height / 2 - stageRect.top) / stageRect.height) * canvas.height;
    const leftX = ((rect.left + rect.width * 0.46 - stageRect.left) / stageRect.width) * canvas.width;
    const rightX = ((rect.left + rect.width * 0.54 - stageRect.left) / stageRect.width) * canvas.width;
    const left = sample(leftX, centerY);
    const right = sample(rightX, centerY);
    const magenta = left[0] > left[1] + 90 && left[2] > left[1] + 90;
    const green = right[1] > right[0] + 90 && right[1] > right[2] + 90;
    if (magenta && green) return true;
  }
  return false;
}

async function captureDesktopImageCanvas(
  node: HTMLElement,
  options: Parameters<typeof toCanvas>[1]
): Promise<HTMLCanvasElement> {
  const hasMockupImage = !!node.querySelector('img[data-export-mockup-image="true"]');
  for (let attempt = 0; attempt < 4; attempt++) {
    const canvas = await toCanvas(node, options);
    // The 1× warm-up did not prime 2× captures in WKWebView. Always discard
    // the first capture at the *requested* resolution when a mockup is present.
    if ((!hasMockupImage || attempt > 0) && !hasUnpaintedDesktopMockup(node, canvas)) {
      return canvas;
    }
    canvas.width = 0;
    canvas.height = 0;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('The mockup image did not render. Please retry the export.');
}

async function captureAnimationFrameCanvas(
  node: HTMLElement,
  options: Parameters<typeof toCanvas>[1],
  firstFrame: boolean
): Promise<HTMLCanvasElement> {
  if (!isDesktopApp()) return toCanvas(node, options);

  // Validate the frozen video images before passing a snapshot to the encoder.
  if (node.querySelector('canvas[data-slot-canvas]')) {
    return captureDesktopVideoFrame(node, options, (canvas) => !hasUnpaintedDesktopMockup(node, canvas));
  }

  return firstFrame ? captureDesktopImageCanvas(node, options) : toCanvas(node, options);
}

async function syncUploadedVideoFrames(
  stage: HTMLElement,
  timeSec: number,
  fallbackDurationSec: number,
  desktopSession: DesktopVideoExportSession | null
) {
  const decoders = Array.from(activeVideoDecoders.values()).filter(({ canvas }) =>
    stage.contains(canvas)
  );
  if (stage.querySelectorAll('canvas[data-slot-canvas]').length > decoders.length) {
    throw new Error('The uploaded video is still initializing. Please retry the export.');
  }
  const frames = await Promise.allSettled(
    decoders.map(async ({ canvas, src, video, drawFrame, prepareCaptureFrame }) => {
      if (desktopSession) {
        video.pause();
        const timing = await desktopSession.paint(canvas, src, timeSec);
        await prepareCaptureFrame();
        // Small, local-only diagnostics; no source URLs or media are logged.
        canvas.dataset.exportRequestedTime = String(timing.sourceTime);
        canvas.dataset.exportDecodedTime = String(timing.decodedTime);
        return;
      }
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('error', onError);
            window.clearTimeout(timeout);
          };
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error('The uploaded video could not be decoded.'));
          };
          const timeout = window.setTimeout(() => {
            cleanup();
            reject(new Error('The uploaded video did not become ready for export.'));
          }, 5000);
          video.addEventListener('loadeddata', onReady, { once: true });
          video.addEventListener('error', onError, { once: true });
          video.load();
        });
      }

      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : fallbackDurationSec;
      const target = timeSec % duration;
      video.pause();
      if (Math.abs(video.currentTime - target) > 0.001) {
        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            window.clearTimeout(timeout);
          };
          const onSeeked = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error('The uploaded video could not seek.'));
          };
          const timeout = window.setTimeout(() => {
            cleanup();
            reject(new Error('The uploaded video frame did not become ready for export.'));
          }, 3000);
          video.addEventListener('seeked', onSeeked, { once: true });
          video.addEventListener('error', onError, { once: true });
          video.currentTime = target;
        });
      }
      if (!drawFrame()) {
        throw new Error('The uploaded video frame could not be painted for export.');
      }
    })
  );
  // Wait for every slot before cleanup, even if one fails during initialization.
  const failure = frames.find((frame) => frame.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, canvasRef }) => {
  const state = useStudioStore();
  const session = authClient.useSession();
  const onChange = state.updateState;
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [exportingType, setExportingType] = useState<'image' | 'video' | null>(null);
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm'>('mp4');
  const [videoFps, setVideoFps] = useState<30 | 60>(30);
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'share'>(
    state.isAnimationMode ? 'video' : 'image'
  );
  const [exportProgress, setExportProgress] = useState(0);
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [shareName, setShareName] = useState('');
  const [sharePublisher, setSharePublisher] = useState('');
  const [shareVisibility, setShareVisibility] = useState<'private' | 'public'>('private');
  const [isSharing, setIsSharing] = useState(false);
  const [sponsoredProject] = useState(() => PROJECTS[Math.floor(Math.random() * PROJECTS.length)]);
  const [shareUrl, setShareUrl] = useState('');
  const [shareError, setShareError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);
  const [accountPending, setAccountPending] = useState(false);
  const [imageExportError, setImageExportError] = useState('');
  const [imageExportNotice, setImageExportNotice] = useState('');
  const [videoExportError, setVideoExportError] = useState('');
  const [videoExportNotice, setVideoExportNotice] = useState('');
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const cancelVideoRef = useRef(false);
  const imageExportLockRef = useRef(false);
  const videoExportLockRef = useRef(false);
  const transitionCanvasRef = useRef<HTMLDivElement>(null);
  const [transitionStage, setTransitionStage] = useState<Partial<StudioState> | null>(null);

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!isOpen) return;
    setShareUrl('');
    setShareError('');
    setIsSharing(false);
    setTurnstileToken('');
    setIsShareCopied(false);
    setImageExportError('');
    setImageExportNotice('');
    setVideoExportError('');
    setVideoExportNotice('');
    setCreditDialogOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!session.isPending && !session.data?.user && activeTab === 'share') {
      setActiveTab(state.isAnimationMode ? 'video' : 'image');
    }
  }, [activeTab, session.data?.user, session.isPending, state.isAnimationMode]);

  useEffect(() => {
    const user = session.data?.user;
    if (!isOpen || !user) return;
    setSharePublisher((current) =>
      current.trim() ? current : user.name?.trim() || user.email?.split('@')[0] || 'Shotage Creator'
    );
  }, [isOpen, session.data?.user]);

  useEffect(() => {
    const sessionId = session.data?.session?.id;
    if (!isOpen || !sessionId) {
      setVerifiedAccount(null);
      setAccountPending(false);
      return;
    }

    let cancelled = false;
    setAccountPending(true);
    fetchVerifiedAccount()
      .then((account) => !cancelled && setVerifiedAccount(account))
      .catch(() => !cancelled && setVerifiedAccount(null))
      .finally(() => !cancelled && setAccountPending(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, session.data?.session?.id]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'share' || !turnstileRef.current || !turnstileSiteKey) return;
    const scriptId = 'cf-turnstile-script';
    const renderWidget = () => {
      if (!turnstileRef.current) return;
      // @ts-ignore
      if (window.turnstile) {
        // @ts-ignore
        const widgetId = window.turnstile.render(turnstileRef.current, {
          sitekey: turnstileSiteKey,
          theme: 'dark',
          callback: (token: string) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
        });
        turnstileWidgetIdRef.current = widgetId;
      }
    };
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.body.appendChild(script);
    } else {
      renderWidget();
    }
    return () => {
      removeTurnstileWidget();
    };
  }, [isOpen, activeTab, turnstileSiteKey]);

  const turnstileWidgetIdRef = useRef<string | null>(null);

  const removeTurnstileWidget = () => {
    // @ts-ignore
    if (window.turnstile && turnstileWidgetIdRef.current) {
      // @ts-ignore
      window.turnstile.remove(turnstileWidgetIdRef.current);
      turnstileWidgetIdRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsExporting(false);
      setExportingType(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !creditDialogOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [creditDialogOpen, isOpen, onClose]);

  const totalImageStages = state.stages?.length || 1;
  const imageStageCount = exportScope === 'all' ? totalImageStages : 1;
  const imageDownloadCost = getImageExportCost(state.exportScale, imageStageCount);
  const imageCopyCost = getImageExportCost(state.exportScale);
  const customImageBaseSize =
    state.aspectRatio === 'custom'
      ? {
          width: Math.max(160, state.customWidth || 1280),
          height: Math.max(160, state.customHeight || 720),
        }
      : null;
  const customImageOutputSize = customImageBaseSize && {
    width: customImageBaseSize.width * state.exportScale,
    height: customImageBaseSize.height * state.exportScale,
  };
  const sessionUser = session.data?.user;
  const hasUnlimitedExports = verifiedAccount?.credits.unlimited === true;
  const imageDownloadInsufficient = Boolean(
    verifiedAccount && !hasUnlimitedExports && verifiedAccount.credits.balance < imageDownloadCost
  );
  const imageCopyInsufficient = Boolean(
    verifiedAccount && !hasUnlimitedExports && verifiedAccount.credits.balance < imageCopyCost
  );
  const desktopImageIssue = isDesktopApp() ? getDesktopFrameExportIssue(state, exportScope) : null;
  const desktopCopyIssue = isDesktopApp() ? getDesktopFrameExportIssue(state, 'current') : null;
  const imageActionsDisabled = isExporting || session.isPending || accountPending || !sessionUser;
  const videoStageCount = exportScope === 'all' ? totalImageStages : 1;
  const durationStages = (state.stages || []).map((stage, index) =>
    index === state.activeStageIndex
      ? {
          ...stage,
          durationSec: state.durationSec,
          transitionOut: state.transitionOut,
        }
      : stage
  );
  const videoDurationSeconds = Number(
    (exportScope === 'all' && totalImageStages > 1
      ? getStageSequenceTiming(durationStages).totalDurationSec
      : state.durationSec || 10
    ).toFixed(3)
  );
  const videoExportCost = getVideoExportCost(videoDurationSeconds);
  const videoDurationInvalid =
    videoDurationSeconds < 1 || videoDurationSeconds > MAX_PAID_VIDEO_DURATION_SECONDS;
  const videoExportInsufficient = Boolean(
    verifiedAccount && !hasUnlimitedExports && verifiedAccount.credits.balance < videoExportCost
  );
  const desktopVideoIssue = isDesktopApp() ? getDesktopFrameExportIssue(state, exportScope) : null;
  const videoActionsDisabled =
    isExporting || session.isPending || accountPending || !sessionUser || videoDurationInvalid || Boolean(desktopVideoIssue);

  const syncCreditBalance = (balance: number) => {
    setVerifiedAccount((account) =>
      account
        ? {
            ...account,
            credits: {
              ...account.credits,
              balance,
              exportCapacity: getExportCapacity(balance),
            },
          }
        : account
    );
    announceCreditBalanceUpdated(balance);
  };

  const ensureDesignFontsReady = async () => {
    const latest = useStudioStore.getState();
    const fontNames = [
      ...(latest.textLayers || []).map((layer) => layer.fontFamily),
      ...(latest.stages || []).flatMap((stage) =>
        (stage.textLayers || []).map((layer) => layer.fontFamily)
      ),
    ];
    await ensureStudioFontsLoaded(fontNames);
  };

  if (!isOpen) return null;

  const handleExport = async (format: 'png' | 'jpeg' | 'webp', isCopy = false) => {
    if (!canvasRef.current || imageExportLockRef.current) return;
    if (!sessionUser) {
      setImageExportError('Sign in before exporting a high-resolution image.');
      return;
    }

    const stageScope = isCopy ? 'current' : exportScope;
    const desktopFrameIssue = isDesktopApp()
      ? getDesktopFrameExportIssue(useStudioStore.getState(), stageScope)
      : null;
    if (desktopFrameIssue) {
      setImageExportError(desktopFrameIssue);
      return;
    }
    const stageCount = stageScope === 'all' ? totalImageStages : 1;
    const expectedCost = getImageExportCost(state.exportScale, stageCount);
    if (
      verifiedAccount &&
      !verifiedAccount.credits.unlimited &&
      verifiedAccount.credits.balance < expectedCost
    ) {
      setImageExportError(
        `You need ${expectedCost} credits for this export. Your balance is ${verifiedAccount.credits.balance}.`
      );
      setCreditDialogOpen(true);
      return;
    }

    imageExportLockRef.current = true;
    state.selectTextLayer(null);
    state.selectShapeLayer(null);
    state.selectPhosphorIconLayer(null);
    state.selectCanvasElement(null);
    setImageExportError('');
    setImageExportNotice('');
    setIsExporting(true);
    setExportingType('image');

    let reservation: ExportReservation | null = null;
    let renderCompleted = false;
    const initialStageIndex = state.activeStageIndex;
    const temporaryObjectUrls: string[] = [];
    let restoreDesktopMockupProbes: (() => void) | null = null;
    const reservationKey = crypto.randomUUID();
    const settlementKey = crypto.randomUUID();
    const releaseKey = crypto.randomUUID();

    try {
      const projectHash = await createProjectHash(useStudioStore.getState());
      reservation = await retryReservationMutation(() =>
        reserveImageExport({
          idempotencyKey: reservationKey,
          projectHash,
          kind: 'image',
          format,
          scale: state.exportScale,
          stageScope,
          stageCount,
          videoDurationSeconds: null,
        })
      );
      syncCreditBalance(reservation.balance);
      if (reservation.unlimited) {
        setImageExportNotice('Included with your Creator plan — no credits charged.');
      } else if (reservation.protectedRetry) {
        setImageExportNotice('Free retry applied — no credits charged.');
      }

      // Suppress transitions and wait for every design font so capture is stable.
      canvasRef.current.classList.add('exporting-no-transitions');
      if (isDesktopApp()) {
        canvasRef.current.classList.add('exporting-desktop-shadow-fallback');
        canvasRef.current.classList.add('exporting-desktop-lens-blur-fallback');
      }
      await ensureDesignFontsReady();
      await waitForCodeHighlights(canvasRef.current);
      await new Promise((resolve) => setTimeout(resolve, 50));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const options = {
        pixelRatio: state.exportScale,
        quality: 0.95,
        cacheBust: true,
        filter: (node: HTMLElement) => {
          if (node && node.classList) {
            if (
              node.classList.contains('delete-handle') ||
              node.classList.contains('rotate-handle') ||
              node.classList.contains('resize-handle') ||
              node.classList.contains('selection-gizmo-container') ||
              node.classList.contains('selection-gizmo-item')
            ) {
              return false;
            }
          }
          return true;
        },
        ...(state.backgroundType === 'transparent' ? { backgroundColor: 'transparent' } : {}),
      };

      const applyDesktopLensBlur = (canvas: HTMLCanvasElement, pixelRatio: number = state.exportScale) => {
        if (!isDesktopApp()) return canvas;
        const latestState = useStudioStore.getState();
        applyLensBlurToExportCanvas(canvas, {
          enabled: latestState.lensBlurEnabled,
          amount: latestState.lensBlurAmount ?? 0,
          focalX: latestState.lensBlurFocalX ?? 50,
          focalY: latestState.lensBlurFocalY ?? 50,
          radius: latestState.lensBlurRadius ?? 20,
          pixelRatio,
        });
        return canvas;
      };

      // The editor deliberately displays custom canvases at 45% of their entered
      // pixel dimensions. html-to-image normally exports that displayed size,
      // so render it at the compensating ratio and normalize the final bitmap to
      // the exact custom size (then multiply it for 2×/3×).
      const renderCustomSizedCanvas = async () => {
        if (!customImageOutputSize || !canvasRef.current) return null;
        // CanvasStage renders custom artboards at a fixed 45% display scale.
        // Do not read getBoundingClientRect(): it includes the editor's zoom.
        const capturePixelRatio = state.exportScale / 0.45;
        const captureOptions = { ...options, pixelRatio: capturePixelRatio };
        const capturedCanvas = isDesktopApp()
          ? await captureDesktopImageCanvas(canvasRef.current, captureOptions)
          : await toCanvas(canvasRef.current, captureOptions);
        applyDesktopLensBlur(capturedCanvas, capturePixelRatio);
        if (
          capturedCanvas.width === customImageOutputSize.width &&
          capturedCanvas.height === customImageOutputSize.height
        ) {
          return capturedCanvas;
        }
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = customImageOutputSize.width;
        outputCanvas.height = customImageOutputSize.height;
        const outputContext = outputCanvas.getContext('2d');
        if (!outputContext) throw new Error('Could not create the export canvas.');
        outputContext.drawImage(
          capturedCanvas,
          0,
          0,
          customImageOutputSize.width,
          customImageOutputSize.height
        );
        capturedCanvas.width = 0;
        capturedCanvas.height = 0;
        return outputCanvas;
      };

      const customCanvasToBlob = (canvas: HTMLCanvasElement, type = 'image/png') =>
        new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.95));

      if (stageScope === 'all' && totalImageStages > 1 && !isCopy) {
        const stagedDownloads: Array<{ href: string; filename: string }> = [];

        for (let i = 0; i < totalImageStages; i++) {
          state.selectStage(i);
          setExportProgress(Math.round(((i + 1) / totalImageStages) * 100));

          // Wait for React DOM flush and browser layout computation
          await new Promise((resolve) => setTimeout(resolve, 80));
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          if ('fonts' in document) await document.fonts.ready;
          await waitForCodeHighlights(canvasRef.current);
          if (isDesktopApp()) canvasRef.current.classList.add('exporting-desktop-shadow-fallback');
          restoreDesktopMockupProbes = await prepareDesktopMockupProbes(canvasRef.current);

          let dataUrl: string;
          if (customImageOutputSize) {
            const customCanvas = await renderCustomSizedCanvas();
            if (!customCanvas) throw new Error('Failed to generate the custom-size image.');
            dataUrl = customCanvas.toDataURL(
              format === 'jpeg' ? 'image/jpeg' : `image/${format}`,
              0.95
            );
            customCanvas.width = 0;
            customCanvas.height = 0;
          } else if (isDesktopApp()) {
            const capturedCanvas = applyDesktopLensBlur(
              await captureDesktopImageCanvas(canvasRef.current, options)
            );
            dataUrl = capturedCanvas.toDataURL(
              format === 'jpeg' ? 'image/jpeg' : `image/${format}`,
              0.95
            );
            capturedCanvas.width = 0;
            capturedCanvas.height = 0;
          } else if (format === 'webp') {
            const blob = await toBlob(canvasRef.current, { ...options, type: 'image/webp' });
            if (!blob) throw new Error('Failed to generate WebP blob');
            dataUrl = URL.createObjectURL(blob);
            temporaryObjectUrls.push(dataUrl);
          } else if (format === 'jpeg') {
            dataUrl = await toJpeg(canvasRef.current, options);
          } else {
            dataUrl = await toPng(canvasRef.current, options);
          }

          stagedDownloads.push({
            href: dataUrl,
            filename: `shotage-stage-${i + 1}-${Date.now()}.${format}`,
          });
          restoreDesktopMockupProbes();
          restoreDesktopMockupProbes = null;
        }

        state.selectStage(initialStageIndex);
        for (const download of stagedDownloads) {
          if (isDesktopApp()) {
            const saved = await saveExportToDevice(
              await (await fetch(download.href)).blob(),
              download.filename
            );
            if (!saved) throw new Error('Image export was cancelled.');
          } else {
            const link = document.createElement('a');
            link.download = download.filename;
            link.href = download.href;
            link.click();
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } else {
        restoreDesktopMockupProbes = await prepareDesktopMockupProbes(canvasRef.current);
        if (isCopy) {
          const customCanvas = customImageOutputSize ? await renderCustomSizedCanvas() : null;
          const blob = customCanvas
            ? await customCanvasToBlob(customCanvas)
            : isDesktopApp()
              ? await (async () => {
                  const capturedCanvas = await captureDesktopImageCanvas(canvasRef.current!, options);
                  applyDesktopLensBlur(capturedCanvas);
                  const result = await customCanvasToBlob(capturedCanvas);
                  capturedCanvas.width = 0;
                  capturedCanvas.height = 0;
                  return result;
                })()
              : await toBlob(canvasRef.current, options);
          if (customCanvas) {
            customCanvas.width = 0;
            customCanvas.height = 0;
          }
          if (!blob) throw new Error('Failed to generate image for the clipboard');
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          alert('Copied high-res image to clipboard!');
        } else {
          let dataUrl: string;
          if (customImageOutputSize) {
            const customCanvas = await renderCustomSizedCanvas();
            if (!customCanvas) throw new Error('Failed to generate the custom-size image.');
            dataUrl = customCanvas.toDataURL(
              format === 'jpeg' ? 'image/jpeg' : `image/${format}`,
              0.95
            );
            customCanvas.width = 0;
            customCanvas.height = 0;
          } else if (isDesktopApp()) {
            const capturedCanvas = applyDesktopLensBlur(
              await captureDesktopImageCanvas(canvasRef.current, options)
            );
            dataUrl = capturedCanvas.toDataURL(
              format === 'jpeg' ? 'image/jpeg' : `image/${format}`,
              0.95
            );
            capturedCanvas.width = 0;
            capturedCanvas.height = 0;
          } else if (format === 'webp') {
            const blob = await toBlob(canvasRef.current, { ...options, type: 'image/webp' });
            if (!blob) throw new Error('Failed to generate WebP blob');
            dataUrl = URL.createObjectURL(blob);
            temporaryObjectUrls.push(dataUrl);
          } else if (format === 'jpeg') {
            dataUrl = await toJpeg(canvasRef.current, options);
          } else {
            dataUrl = await toPng(canvasRef.current, options);
          }

          if (isDesktopApp()) {
            const saved = await saveExportToDevice(
              await (await fetch(dataUrl)).blob(),
              `shotage-${Date.now()}.${format}`
            );
            if (!saved) throw new Error('Image export was cancelled.');
          } else {
            const link = document.createElement('a');
            link.download = `shotage-${Date.now()}.${format}`;
            link.href = dataUrl;
            link.click();
          }
        }
      }
      renderCompleted = true;

      const settled = await retryReservationMutation(() =>
        settleExportReservation(reservation!.reservationId, settlementKey)
      );
      syncCreditBalance(settled.balance);
      setImageExportNotice(
        reservation.unlimited
          ? 'Export complete — included with your Creator plan.'
          : reservation.protectedRetry
            ? 'Free retry complete — no credits charged.'
            : `Export complete — ${reservation.creditAmount} credits used. One matching retry is free for 5 minutes.`
      );
    } catch (err) {
      console.error('Export error:', err);
      if (reservation && !renderCompleted && reservation.status === 'reserved') {
        try {
          const released = await retryReservationMutation(() =>
            releaseExportReservation(reservation!.reservationId, releaseKey)
          );
          syncCreditBalance(released.balance);
        } catch (releaseError) {
          console.error('Credit reservation release failed:', releaseError);
        }
      }

      if (err instanceof CreditApiError) {
        if (typeof err.balance === 'number') syncCreditBalance(err.balance);
        if (err.code === 'INSUFFICIENT_CREDITS') setCreditDialogOpen(true);
        setImageExportError(err.message);
      } else if (renderCompleted) {
        setImageExportError(
          'Your image was exported, but credit finalization is still pending. Do not export again yet.'
        );
      } else if (err instanceof Error && err.message.startsWith('The mockup image did not render')) {
        setImageExportError(`${err.message} Reserved credits were released.`);
      } else {
        setImageExportError('The image export failed. Reserved credits were released.');
      }
    } finally {
      restoreDesktopMockupProbes?.();
      if (canvasRef.current) {
        canvasRef.current.classList.remove('exporting-no-transitions');
        canvasRef.current.classList.remove('exporting-desktop-shadow-fallback');
        canvasRef.current.classList.remove('exporting-desktop-lens-blur-fallback');
      }
      if (useStudioStore.getState().activeStageIndex !== initialStageIndex) {
        state.selectStage(initialStageIndex);
      }
      temporaryObjectUrls.forEach((url) => setTimeout(() => URL.revokeObjectURL(url), 2_000));
      setIsExporting(false);
      setExportingType(null);
      imageExportLockRef.current = false;
    }
  };

  // High-quality WebCodecs video export with a cached Canvas fast path.
  const handleExportVideo = async () => {
    if (!canvasRef.current || videoExportLockRef.current) return;
    if (!sessionUser) {
      setVideoExportError('Sign in before exporting a video.');
      return;
    }
    const desktopFrameIssue = isDesktopApp()
      ? getDesktopFrameExportIssue(useStudioStore.getState(), exportScope)
      : null;
    if (desktopFrameIssue) {
      setVideoExportError(desktopFrameIssue);
      return;
    }
    if (videoDurationInvalid) {
      setVideoExportError(
        `Paid video exports must be between 1 and ${MAX_PAID_VIDEO_DURATION_SECONDS} seconds.`
      );
      return;
    }
    if (
      verifiedAccount &&
      !verifiedAccount.credits.unlimited &&
      verifiedAccount.credits.balance < videoExportCost
    ) {
      setVideoExportError(
        `You need ${videoExportCost} credits for this video. Your balance is ${verifiedAccount.credits.balance}.`
      );
      setCreditDialogOpen(true);
      return;
    }

    videoExportLockRef.current = true;
    cancelVideoRef.current = false;
    setVideoExportError('');
    setVideoExportNotice('');
    setIsExporting(true);
    setExportingType('video');
    setExportProgress(0);

    let exportCanvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let videoEncoder: VideoEncoder | null = null;
    let muxer: any = null;
    let cachedFrameRenderer: CachedVideoFrameRenderer | null = null;
    let desktopVideoSession: DesktopVideoExportSession | null = null;
    let transitionOutgoingCanvas: HTMLCanvasElement | null = null;
    let transitionIncomingCanvas: HTMLCanvasElement | null = null;
    let cachedFontEmbedCSS = '';
    const initialStageIndex = state.activeStageIndex;
    let reservation: ExportReservation | null = null;
    let renderCompleted = false;
    let usedCachedFrameRenderer = false;
    let restoreDesktopMockupProbes: (() => void) | null = null;
    const reservationKey = crypto.randomUUID();
    const settlementKey = crypto.randomUUID();
    const releaseKey = crypto.randomUUID();

    try {
      state.selectTextLayer(null);
      state.selectShapeLayer(null);
      state.selectPhosphorIconLayer(null);
      state.selectCanvasElement(null);

      // Snapshot the live stage before reading the stage sequence. The active
      // stage is otherwise only persisted when the user switches stages.
      if ((state.stages?.length || 0) > 1) {
        state.selectStage(initialStageIndex);
      }
      const synchronizedState = useStudioStore.getState();
      const stageSnapshots = synchronizedState.stages || [];

      const projectHash = await createProjectHash(synchronizedState);
      reservation = await retryReservationMutation(() =>
        reserveVideoExport({
          idempotencyKey: reservationKey,
          projectHash,
          kind: 'video',
          format: videoFormat,
          scale: state.exportScale,
          stageScope: exportScope,
          stageCount: videoStageCount,
          videoDurationSeconds,
        })
      );
      syncCreditBalance(reservation.balance);
      if (reservation.unlimited) {
        setVideoExportNotice('Included with your Creator plan — no credits charged.');
      } else if (reservation.protectedRetry) {
        setVideoExportNotice('Free retry applied — no credits charged.');
      }

      onChange({ isExporting: true, exportTimeSec: 0, isPlaying: false, currentTimeSec: 0 });
      canvasRef.current.classList.add('exporting-no-transitions');
      if (isDesktopApp()) canvasRef.current.classList.add('exporting-desktop-shadow-fallback');

      const totalStages = stageSnapshots.length || 1;
      const isMultiStage = exportScope === 'all' && totalStages > 1;
      const stagesToRecord = isMultiStage
        ? Array.from({ length: totalStages }, (_, i) => i)
        : [state.activeStageIndex];

      const fps = videoFps;
      if (isDesktopApp() && stagesToRecord.some((index) => {
        const stage = isMultiStage ? stageSnapshots[index] : synchronizedState;
        return stage?.mediaType === 'video' || (stage?.layoutCount === 2 && stage.secondMediaType === 'video');
      })) {
        const { DesktopVideoExportSession } = await import('../utils/exportVideoDecoder');
        desktopVideoSession = new DesktopVideoExportSession(fps);
      }

      const stageFrameCounts = stagesToRecord.map((idx) =>
        Math.max(
          1,
          Math.round(
            (isMultiStage ? stageSnapshots[idx]?.durationSec || 10 : state.durationSec || 10) * fps
          )
        )
      );
      const overlapFrameCounts = stagesToRecord.map((stageIndex, sequenceIndex) => {
        const nextStageIndex = stagesToRecord[sequenceIndex + 1];
        if (!isMultiStage || nextStageIndex === undefined) return 0;
        const transition = getStageTransition(
          stageSnapshots[stageIndex],
          stageSnapshots[nextStageIndex]
        );
        if (transition.type === 'none') return 0;
        return Math.min(
          Math.max(1, Math.round(transition.durationSec * fps)),
          stageFrameCounts[sequenceIndex] - 1,
          stageFrameCounts[sequenceIndex + 1] - 1
        );
      });
      const grandTotalFrames = Math.max(
        1,
        stageFrameCounts.reduce((total, frames) => total + frames, 0) -
          overlapFrameCounts.reduce((total, frames) => total + frames, 0)
      );

      const rawWidth = canvasRef.current.offsetWidth || canvasRef.current.clientWidth || 1200;
      const rawHeight = canvasRef.current.offsetHeight || canvasRef.current.clientHeight || 800;
      const scale = Math.max(1, state.exportScale || 2);

      let width = Math.floor((rawWidth * scale) / 2) * 2;
      let height = Math.floor((rawHeight * scale) / 2) * 2;

      // Ensure max dimension does not exceed 3840 (4K UHD)
      if (width > 3840 || height > 2160) {
        const r = Math.min(3840 / width, 2160 / height);
        width = Math.floor((width * r) / 2) * 2;
        height = Math.floor((height * r) / 2) * 2;
      }

      let targetBitrate = Math.max(
        10_000_000,
        Math.min(30_000_000, Math.round(width * height * fps * 0.15))
      );

      let wantMp4 = videoFormat === 'mp4';
      // WKWebView can omit the decoderConfig callback needed by mp4-muxer.
      // Annex B carries SPS/PPS in the keyframe, so desktop exports can build it themselves.
      const useDesktopAnnexB = wantMp4 && isDesktopApp();
      let extension = wantMp4 ? 'mp4' : 'webm';
      let mimeType = wantMp4 ? 'video/mp4' : 'video/webm';
      let webmMuxerCodec: 'V_VP9' | 'V_VP8' = 'V_VP9';

      const mp4Candidates = [
        'avc1.640033', // High Profile Level 5.1 (Up to 4K)
        'avc1.64002a', // High Profile Level 4.2
        'avc1.640028', // High Profile Level 4.0 (1080p)
        'avc1.4d0033', // Main Profile Level 5.1
        'avc1.4d002a', // Main Profile Level 4.2
        'avc1.4d0028', // Main Profile Level 4.0
        'avc1.420033', // Baseline Level 5.1
        'avc1.42002a', // Baseline Level 4.2
        'avc1.42001f', // Baseline Level 3.1
        'avc1.42001e', // Baseline Level 3.0
      ];

      const webmCandidates: { codec: string; muxerCodec: 'V_VP9' | 'V_VP8' }[] = [
        { codec: 'vp09.00.10.08', muxerCodec: 'V_VP9' },
        { codec: 'vp9', muxerCodec: 'V_VP9' },
        { codec: 'vp8', muxerCodec: 'V_VP8' },
      ];

      // Test configuration support with automatic resolution negotiation
      let supportedConfig: VideoEncoderConfig | null = null;

      while (!supportedConfig && width >= 480 && height >= 320) {
        if (wantMp4) {
          for (const c of mp4Candidates) {
            const cfg: VideoEncoderConfig = {
              codec: c,
              width,
              height,
              bitrate: targetBitrate,
              avc: { format: useDesktopAnnexB ? 'annexb' : 'avc' },
            };
            try {
              const res = await VideoEncoder.isConfigSupported(cfg);
              if (res.supported) {
                supportedConfig = { ...(res.config || cfg), avc: cfg.avc };
                break;
              }
            } catch (e) {}
          }
        } else {
          const isTransparent = state.backgroundType === 'transparent';
          // When transparent, only try VP9 candidates (VP8 does not support alpha)
          const candidates = isTransparent
            ? webmCandidates.filter((c) => c.muxerCodec === 'V_VP9')
            : webmCandidates;
          for (const item of candidates) {
            const cfg: VideoEncoderConfig = {
              codec: item.codec,
              width,
              height,
              bitrate: targetBitrate,
              ...(isTransparent ? { alpha: 'keep' } : {}),
            };
            try {
              const res = await VideoEncoder.isConfigSupported(cfg);
              if (res.supported) {
                supportedConfig = res.config || cfg;
                webmMuxerCodec = item.muxerCodec;
                break;
              }
            } catch (e) {}
          }
        }

        if (!supportedConfig) {
          // If GPU hardware encoder rejected excessive resolution, step down slightly
          width = Math.floor((width * 0.85) / 2) * 2;
          height = Math.floor((height * 0.85) / 2) * 2;
          targetBitrate = Math.max(
            6_000_000,
            Math.min(25_000_000, Math.round(width * height * fps * 0.15))
          );
        }
      }

      if (!supportedConfig) {
        // Fallback default
        if (wantMp4) {
          supportedConfig = {
            codec: 'avc1.42001f',
            width: Math.min(1920, width),
            height: Math.min(1080, height),
            bitrate: 8_000_000,
            avc: { format: useDesktopAnnexB ? 'annexb' : 'avc' },
          };
        } else {
          const isTransparent = state.backgroundType === 'transparent';
          supportedConfig = {
            codec: isTransparent ? 'vp09.00.10.08' : 'vp8',
            width: Math.min(1920, width),
            height: Math.min(1080, height),
            bitrate: 8_000_000,
            ...(isTransparent ? { alpha: 'keep' } : {}),
          };
          webmMuxerCodec = isTransparent ? 'V_VP9' : 'V_VP8';
        }
      }

      // At this point supportedConfig is guaranteed non-null (set by negotiation or fallback above)
      if (!supportedConfig) throw new Error('No supported video encoder configuration found.');

      // Pre-flight: test if the browser's encoder ACTUALLY supports alpha encoding.
      // Chrome's isConfigSupported() can return true for alpha:'keep' but the encoder
      // throws "Alpha encoding is not currently supported" at runtime.
      let isTransparentExport = state.backgroundType === 'transparent' && !wantMp4;
      if (isTransparentExport && supportedConfig.alpha === 'keep') {
        const testConfig = supportedConfig; // captured for closure
        const alphaWorks = await new Promise<boolean>((resolve) => {
          let failed = false;
          const testEnc = new VideoEncoder({
            output: () => {},
            error: () => {
              failed = true;
            },
          });
          try {
            testEnc.configure(testConfig);
            const tc = document.createElement('canvas');
            tc.width = 4;
            tc.height = 4;
            const tf = new VideoFrame(tc, { timestamp: 0, alpha: 'keep' });
            testEnc.encode(tf, { keyFrame: true });
            tf.close();
            tc.width = 0;
            tc.height = 0;
            testEnc
              .flush()
              .then(() => {
                try {
                  testEnc.close();
                } catch {}
                resolve(!failed);
              })
              .catch(() => {
                try {
                  testEnc.close();
                } catch {}
                resolve(false);
              });
          } catch {
            try {
              testEnc.close();
            } catch {}
            resolve(false);
          }
        });

        if (!alphaWorks) {
          console.warn(
            'Browser does not support VP9 alpha encoding – falling back to opaque video.'
          );
          // Strip alpha from encoder config
          const { alpha: _a, ...opaqueConfig } = supportedConfig;
          supportedConfig = opaqueConfig as VideoEncoderConfig;
          isTransparentExport = false;
        }
      }

      exportCanvas = document.createElement('canvas');
      exportCanvas.width = supportedConfig.width;
      exportCanvas.height = supportedConfig.height;
      ctx = exportCanvas.getContext('2d', { alpha: isTransparentExport });

      if (!ctx) throw new Error('Could not create canvas 2d context');

      if (overlapFrameCounts.some((frames) => frames > 0)) {
        transitionOutgoingCanvas = document.createElement('canvas');
        transitionIncomingCanvas = document.createElement('canvas');
        transitionOutgoingCanvas.width = transitionIncomingCanvas.width = exportCanvas.width;
        transitionOutgoingCanvas.height = transitionIncomingCanvas.height = exportCanvas.height;
      }

      if (wantMp4) {
        muxer = new Mp4Muxer.Muxer({
          target: new Mp4Muxer.ArrayBufferTarget(),
          video: {
            codec: 'avc',
            width: exportCanvas.width,
            height: exportCanvas.height,
          },
          fastStart: 'in-memory',
        });
      } else {
        muxer = new WebMMuxer.Muxer({
          target: new WebMMuxer.ArrayBufferTarget(),
          video: {
            codec: webmMuxerCodec,
            width: exportCanvas.width,
            height: exportCanvas.height,
            ...(isTransparentExport ? { alpha: true } : {}),
          },
        });
      }

      let encodedChunksCount = 0;
      let encoderError: Error | null = null;
      let desktopAvcDescription: Uint8Array | null = null;

      videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
          try {
            if (useDesktopAnnexB) {
              const encoded = new Uint8Array(chunk.byteLength);
              chunk.copyTo(encoded);
              const { sample, decoderDescription } = convertAvcAnnexB(encoded);
              if (decoderDescription) desktopAvcDescription = decoderDescription;
              if (!desktopAvcDescription) {
                throw new Error('The H.264 encoder did not provide SPS/PPS headers for the MP4 export.');
              }
              const decoderConfig: VideoDecoderConfig = {
                codec: supportedConfig!.codec,
                codedWidth: exportCanvas!.width,
                codedHeight: exportCanvas!.height,
                ...meta?.decoderConfig,
                description: desktopAvcDescription.buffer,
              };
              muxer.addVideoChunkRaw(
                sample,
                chunk.type,
                chunk.timestamp,
                chunk.duration ?? Math.round(1_000_000 / fps),
                { ...meta, decoderConfig }
              );
            } else {
              muxer?.addVideoChunk(chunk, meta);
            }
            encodedChunksCount++;
          } catch (error) {
            encoderError = error instanceof Error ? error : new Error(String(error));
          }
        },
        error: (e) => {
          console.error('VideoEncoder error:', e);
          encoderError = e instanceof Error ? e : new Error(String(e));
        },
      });

      videoEncoder.configure(supportedConfig);

      // Pause live player during frame rendering
      onChange({ isPlaying: false, currentTimeSec: 0 });

      // Ensure every font used across the recorded stages is ready first.
      await ensureDesignFontsReady();
      await waitForCodeHighlights(canvasRef.current);

      let globalFrameIndex = 0;
      let completedFramesCount = 0;
      let lastReportedProgress = 0;

      // Sequentially record each stage into the single video stream
      for (let sIdx = 0; sIdx < stagesToRecord.length; sIdx++) {
        const stageIndex = stagesToRecord[sIdx];

        if (isMultiStage) {
          state.selectStage(stageIndex);
          await new Promise((resolve) => setTimeout(resolve, 80));
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          );
          if ('fonts' in document) await document.fonts.ready;
          await waitForCodeHighlights(canvasRef.current);
        }

        try {
          cachedFontEmbedCSS = await getFontEmbedCSS(canvasRef.current);
        } catch (err) {
          console.warn('Could not pre-cache font embed CSS:', err);
        }

        const durationSec = isMultiStage
          ? stageSnapshots[stageIndex]?.durationSec || 10
          : state.durationSec || 10;
        const totalFrames = stageFrameCounts[sIdx];
        const incomingSkipFrames = sIdx > 0 ? overlapFrameCounts[sIdx - 1] : 0;
        const transitionFrames = overlapFrameCounts[sIdx];
        const nextStageIndex = stagesToRecord[sIdx + 1];
        const transition =
          transitionFrames > 0 && nextStageIndex !== undefined
            ? getStageTransition(stageSnapshots[stageIndex], stageSnapshots[nextStageIndex])
            : null;
        const framePixelRatio =
          exportCanvas.width / (canvasRef.current.offsetWidth || exportCanvas.width);

        flushSync(() => {
          onChange({ currentTimeSec: 0, exportTimeSec: globalFrameIndex / fps });
        });

        if (isDesktopApp()) canvasRef.current.classList.add('exporting-desktop-shadow-fallback');
        // Keep the image paint probes active through the first full-resolution
        // capture (or the fast renderer's mockup snapshot) for this stage.
        restoreDesktopMockupProbes?.();
        restoreDesktopMockupProbes = await prepareDesktopMockupProbes(canvasRef.current);

        await warmDesktopCapture(canvasRef.current, {
          cacheBust: false,
          fontEmbedCSS: cachedFontEmbedCSS,
          ...(isTransparentExport ? { backgroundColor: 'transparent' } : {}),
          filter: (node) => {
            const element = node as HTMLElement;
            return element.tagName !== 'VIDEO' && ![
              'delete-handle',
              'rotate-handle',
              'resize-handle',
              'selection-gizmo-container',
              'selection-gizmo-item',
            ].some((className) => element.classList?.contains(className));
          },
        });

        if (canUseCachedVideoFrameRenderer(useStudioStore.getState())) {
          cachedFrameRenderer = await createCachedVideoFrameRenderer(canvasRef.current, {
            pixelRatio: framePixelRatio,
            fontEmbedCSS: cachedFontEmbedCSS,
            transparent: isTransparentExport,
            captureMockup: isDesktopApp() ? captureDesktopImageCanvas : undefined,
          });
          usedCachedFrameRenderer ||= cachedFrameRenderer !== null;
        }

        for (let frame = incomingSkipFrames; frame < totalFrames; frame++) {
          if (cancelVideoRef.current || encoderError) {
            if (encoderError)
              console.error('Video export aborted due to encoder error:', encoderError);
            break;
          }

          const targetTimeSec = frame / fps;
          const frameTimeSec = globalFrameIndex / fps;
          flushSync(() => {
            onChange({ currentTimeSec: targetTimeSec, exportTimeSec: frameTimeSec });
          });

          // Do not capture until the source video has painted the requested frame.
          await syncUploadedVideoFrames(canvasRef.current, targetTimeSec, durationSec, desktopVideoSession);

          try {
            const isTransitionFrame =
              transition !== null && frame >= totalFrames - transitionFrames;
            const outgoingContext = isTransitionFrame
              ? transitionOutgoingCanvas?.getContext('2d', { alpha: isTransparentExport }) || null
              : ctx;
            if (!outgoingContext) throw new Error('Could not prepare transition canvas');

            const fastFrameRendered = cachedFrameRenderer?.render(outgoingContext) ?? false;
            if (!fastFrameRendered) {
              const captureOptions: Parameters<typeof toCanvas>[1] = {
                pixelRatio: framePixelRatio,
                cacheBust: false,
                fontEmbedCSS: cachedFontEmbedCSS,
                ...(isTransparentExport ? { backgroundColor: 'transparent' } : {}),
                filter: (node) => {
                  const el = node as HTMLElement;
                  if (el.tagName === 'VIDEO') return false;
                  if (
                    el.classList?.contains('delete-handle') ||
                    el.classList?.contains('rotate-handle') ||
                    el.classList?.contains('resize-handle') ||
                    el.classList?.contains('selection-gizmo-container') ||
                    el.classList?.contains('selection-gizmo-item')
                  ) {
                    return false;
                  }
                  return true;
                },
              };
              const renderedCanvas = await captureAnimationFrameCanvas(
                canvasRef.current,
                captureOptions,
                frame === incomingSkipFrames
              );

              outgoingContext.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
              outgoingContext.drawImage(
                renderedCanvas,
                0,
                0,
                exportCanvas.width,
                exportCanvas.height
              );
              renderedCanvas.width = 0;
              renderedCanvas.height = 0;
            }

            if (isTransitionFrame && transition && nextStageIndex !== undefined) {
              const incomingFrame = frame - (totalFrames - transitionFrames);
              const incomingTimeSec = incomingFrame / fps;
              flushSync(() => {
                setTransitionStage({
                  ...stageSnapshots[nextStageIndex],
                  currentTimeSec: incomingTimeSec,
                  exportTimeSec: frameTimeSec,
                  isAnimationMode: true,
                  isExporting: true,
                  isPlaying: false,
                  previewCanvasZoom: state.previewCanvasZoom,
                });
              });
              await new Promise((resolve) => requestAnimationFrame(resolve));

              const incomingElement = transitionCanvasRef.current;
              const incomingContext = transitionIncomingCanvas?.getContext('2d', {
                alpha: isTransparentExport,
              });
              if (!incomingElement || !incomingContext || !transitionIncomingCanvas) {
                throw new Error('Could not render the incoming transition stage');
              }
              await waitForCodeHighlights(incomingElement);
              await syncUploadedVideoFrames(
                incomingElement,
                incomingTimeSec,
                stageSnapshots[nextStageIndex]?.durationSec || durationSec,
                desktopVideoSession
              );

              const incomingPixelRatio =
                exportCanvas.width / (incomingElement.offsetWidth || exportCanvas.width);
              if (incomingFrame === 0) {
                await warmDesktopCapture(incomingElement, {
                  cacheBust: false,
                  fontEmbedCSS: cachedFontEmbedCSS,
                  ...(isTransparentExport ? { backgroundColor: 'transparent' } : {}),
                  filter: (node) => {
                    const element = node as HTMLElement;
                    return element.tagName !== 'VIDEO' && ![
                      'delete-handle',
                      'rotate-handle',
                      'resize-handle',
                      'selection-gizmo-container',
                      'selection-gizmo-item',
                    ].some((className) => element.classList?.contains(className));
                  },
                });
              }
              const incomingCaptureOptions: Parameters<typeof toCanvas>[1] = {
                pixelRatio: incomingPixelRatio,
                cacheBust: false,
                fontEmbedCSS: cachedFontEmbedCSS,
                ...(isTransparentExport ? { backgroundColor: 'transparent' } : {}),
                filter: (node) => {
                  const el = node as HTMLElement;
                  if (el.tagName === 'VIDEO') return false;
                  return !(
                    el.classList?.contains('delete-handle') ||
                    el.classList?.contains('rotate-handle') ||
                    el.classList?.contains('resize-handle') ||
                    el.classList?.contains('selection-gizmo-container') ||
                    el.classList?.contains('selection-gizmo-item')
                  );
                },
              };
              const restoreIncomingProbes = incomingFrame === 0
                ? await prepareDesktopMockupProbes(incomingElement)
                : null;
              let incomingRenderedCanvas: HTMLCanvasElement;
              try {
                incomingRenderedCanvas = await captureAnimationFrameCanvas(
                  incomingElement,
                  incomingCaptureOptions,
                  incomingFrame === 0
                );
              } finally {
                restoreIncomingProbes?.();
              }
              incomingContext.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
              incomingContext.drawImage(
                incomingRenderedCanvas,
                0,
                0,
                exportCanvas.width,
                exportCanvas.height
              );
              incomingRenderedCanvas.width = 0;
              incomingRenderedCanvas.height = 0;

              const rawProgress =
                transitionFrames <= 1 ? 1 : incomingFrame / (transitionFrames - 1);
              const transforms = getStageTransitionLayerTransforms(
                transition.type,
                calculateEasing(rawProgress, transition.easing)
              );
              ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
              const drawTransitionLayer = (
                source: HTMLCanvasElement,
                layer: (typeof transforms)['outgoing']
              ) => {
                ctx!.save();
                ctx!.globalAlpha = layer.opacity;
                ctx!.translate(exportCanvas!.width / 2, exportCanvas!.height / 2);
                ctx!.translate((exportCanvas!.width * layer.translateXPercent) / 100, 0);
                ctx!.scale(layer.scale, layer.scale);
                ctx!.drawImage(
                  source,
                  -exportCanvas!.width / 2,
                  -exportCanvas!.height / 2,
                  exportCanvas!.width,
                  exportCanvas!.height
                );
                ctx!.restore();
              };
              drawTransitionLayer(transitionOutgoingCanvas!, transforms.outgoing);
              drawTransitionLayer(transitionIncomingCanvas, transforms.incoming);
            }

            // Compute exact continuous timestamp in microseconds for video output
            const timestampMicros = Math.round(frameTimeSec * 1_000_000);
            const isKeyFrame = globalFrameIndex === 0 || globalFrameIndex % (fps * 2) === 0;

            const videoFrame = new VideoFrame(exportCanvas, {
              timestamp: timestampMicros,
              alpha: isTransparentExport ? 'keep' : 'discard',
            });
            videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
            videoFrame.close();

            // Bound queued frame memory without serializing every encode.
            if (videoEncoder.encodeQueueSize > (fps === 60 ? 12 : 6)) {
              await videoEncoder.flush();
            }
          } catch (e) {
            console.error('Frame render failed at frame', frame, e);
            throw e;
          }

          completedFramesCount++;
          globalFrameIndex++;
          const nextProgress = Math.min(
            99,
            Math.round((completedFramesCount / grandTotalFrames) * 100)
          );
          if (nextProgress !== lastReportedProgress) {
            lastReportedProgress = nextProgress;
            setExportProgress(nextProgress);
          }

          // DOM capture already yields. The cached renderer only needs a periodic
          // event-loop yield for cancellation and UI updates.
          if (cachedFrameRenderer && frame % 4 === 3) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
          if (cancelVideoRef.current) break;
        }

        cachedFrameRenderer?.dispose();
        cachedFrameRenderer = null;

        setTransitionStage(null);
        if (cancelVideoRef.current) break;
      }

      if (isMultiStage) {
        state.selectStage(initialStageIndex);
      }

      if (cancelVideoRef.current) {
        onChange({ isExporting: false, exportTimeSec: null });
        setIsExporting(false);
        setExportingType(null);
        setExportProgress(0);
        return;
      }

      if (encoderError) {
        throw encoderError;
      }

      if (videoEncoder && videoEncoder.state !== 'closed') {
        await videoEncoder.flush();
        try {
          videoEncoder.close();
        } catch (e) {
          // already closed
        }
      }

      if (encoderError) throw encoderError;

      if (encodedChunksCount === 0) {
        throw new Error('No video frames were encoded by the browser.');
      }

      if (muxer) {
        muxer.finalize();
        const { buffer } = muxer.target;
        const blob = new Blob([buffer], { type: mimeType });
        const filename = isMultiStage
          ? `shotage-stages-animation-${Date.now()}.${extension}`
          : `shotage-animation-${Date.now()}.${extension}`;
        if (isDesktopApp()) {
          const saved = await saveExportToDevice(blob, filename);
          if (!saved) throw new Error('Video export was cancelled.');
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
        renderCompleted = true;
      } else {
        throw new Error('Could not finalize the video file.');
      }

      const settled = await retryReservationMutation(() =>
        settleExportReservation(reservation!.reservationId, settlementKey)
      );
      syncCreditBalance(settled.balance);
      setVideoExportNotice(
        reservation.unlimited
          ? `Video complete — included with your Creator plan.${usedCachedFrameRenderer ? ' Fast Canvas renderer used.' : ''}`
          : reservation.protectedRetry
            ? `Free retry complete — no credits charged.${usedCachedFrameRenderer ? ' Fast Canvas renderer used.' : ''}`
            : `Video complete — ${reservation.creditAmount} credits used. One matching retry is free for 5 minutes.${usedCachedFrameRenderer ? ' Fast Canvas renderer used.' : ''}`
      );

      // Trigger 3D Success State
      setExportProgress(100);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsExporting(false);
        setExportingType(null);
        setExportProgress(0);
      }, 2500);
    } catch (err) {
      console.error('Video Export error:', err);
      if (err instanceof CreditApiError) {
        if (typeof err.balance === 'number') syncCreditBalance(err.balance);
        if (err.code === 'INSUFFICIENT_CREDITS') setCreditDialogOpen(true);
        setVideoExportError(err.message);
      } else if (renderCompleted) {
        setVideoExportError(
          'Your video was exported, but credit finalization is still pending. Do not export again yet.'
        );
      } else if (!cancelVideoRef.current) {
        const message = err instanceof Error ? err.message : String(err);
        setVideoExportError(`Video export failed: ${message}`);
      }
      setIsExporting(false);
      setExportingType(null);
      setExportProgress(0);
    } finally {
      await desktopVideoSession?.dispose();
      cachedFrameRenderer?.dispose();
      restoreDesktopMockupProbes?.();
      if (reservation && !renderCompleted && reservation.status === 'reserved') {
        try {
          const released = await retryReservationMutation(() =>
            releaseExportReservation(reservation!.reservationId, releaseKey)
          );
          syncCreditBalance(released.balance);
          if (cancelVideoRef.current) {
            setVideoExportNotice('Video export cancelled — reserved credits were returned.');
          }
        } catch (releaseError) {
          console.error('Video credit reservation release failed:', releaseError);
          setVideoExportError(
            'The video stopped, but credit release is pending. Your reservation will expire automatically.'
          );
        }
      }
      onChange({ isExporting: false, exportTimeSec: null });
      if (canvasRef.current) {
        canvasRef.current.classList.remove('exporting-no-transitions');
        canvasRef.current.classList.remove('exporting-desktop-shadow-fallback');
      }
      // Complete memory purge
      if (exportCanvas) {
        exportCanvas.width = 0;
        exportCanvas.height = 0;
        exportCanvas = null;
      }
      if (transitionOutgoingCanvas) {
        transitionOutgoingCanvas.width = 0;
        transitionOutgoingCanvas.height = 0;
        transitionOutgoingCanvas = null;
      }
      if (transitionIncomingCanvas) {
        transitionIncomingCanvas.width = 0;
        transitionIncomingCanvas.height = 0;
        transitionIncomingCanvas = null;
      }
      setTransitionStage(null);
      ctx = null;
      if (videoEncoder && videoEncoder.state !== 'closed') {
        try {
          videoEncoder.close();
        } catch (e) {}
      }
      videoEncoder = null;
      muxer = null;
      cachedFontEmbedCSS = '';
      if (useStudioStore.getState().activeStageIndex !== initialStageIndex) {
        state.selectStage(initialStageIndex);
      }
      videoExportLockRef.current = false;
    }
  };

  // Share the current design to the community gallery via the server-side proxy
  const handleShare = async () => {
    setShareError('');
    setIsShareCopied(false);

    if (!sessionUser) {
      setShareError('Please sign in before sharing a design.');
      return;
    }

    if (!shareName.trim() || !sharePublisher.trim()) {
      setShareError('Please fill in both Design Name and Publisher.');
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setShareError('Please complete the security check first.');
      return;
    }

    setIsSharing(true);
    setShareUrl('');

    const rawStore = useStudioStore.getState();
    const initialStageIndex = rawStore.activeStageIndex ?? 0;
    const hasMultipleStages = (rawStore.stages?.length || 0) > 1;

    try {
      // 1. Select Stage 1 even when it is already active. selectStage() first
      // snapshots the live stage, preventing stale stages[0] data from replacing
      // recent text transforms (including scaleX/scaleY) when the share is loaded.
      if (hasMultipleStages) {
        rawStore.selectStage(0);
        await new Promise((resolve) => setTimeout(resolve, 80));
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }

      // 2. Fetch the fully synchronized store state and optimize all images (root + all stages)
      const synchronizedState = useStudioStore.getState();
      const storeState = await optimizeStudioStateForExport(synchronizedState);

      // Keep imageSrc, secondImageSrc, bgImageUrl, stages, etc. intact in the serialized payload
      const { isPlaying, isPositionDragging, shareId, shareIdentifier, ...rest } = storeState;

      // Stable session identifier: generated once, reused so the share URL never changes
      const identifier =
        (shareId && shareIdentifier ? shareIdentifier : null) ||
        (crypto.randomUUID && crypto.randomUUID()) ||
        `share-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // 3. Generate optimized thumbnail image (max 350px, < 200KB) strictly from Stage 1
      let thumbnailDataUrl: string | null = null;
      if (canvasRef.current) {
        try {
          canvasRef.current.classList.add('exporting-no-transitions');
          rawStore.selectTextLayer(null);
          rawStore.selectShapeLayer(null);
          rawStore.selectPhosphorIconLayer(null);
          rawStore.selectCanvasElement(null);
          await new Promise((resolve) => setTimeout(resolve, 50));
          if ('fonts' in document) await document.fonts.ready;

          const stage0BackgroundType =
            (storeState.stages && storeState.stages[0]?.backgroundType) ||
            storeState.backgroundType;

          const rawCanvas = await toCanvas(canvasRef.current, {
            pixelRatio: 1,
            cacheBust: true,
            ...(stage0BackgroundType === 'transparent' ? { backgroundColor: 'transparent' } : {}),
          });

          const maxDim = 350;
          let targetWidth = rawCanvas.width;
          let targetHeight = rawCanvas.height;

          if (targetWidth > targetHeight) {
            if (targetWidth > maxDim) {
              targetHeight = Math.max(1, Math.round((targetHeight * maxDim) / targetWidth));
              targetWidth = maxDim;
            }
          } else {
            if (targetHeight > maxDim) {
              targetWidth = Math.max(1, Math.round((targetWidth * maxDim) / targetHeight));
              targetHeight = maxDim;
            }
          }

          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = targetWidth;
          thumbCanvas.height = targetHeight;
          const ctx = thumbCanvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(rawCanvas, 0, 0, targetWidth, targetHeight);
          }

          let thumbUrl = thumbCanvas.toDataURL('image/webp', 0.82);
          if (!thumbUrl.startsWith('data:image/webp')) {
            thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.82);
          }
          thumbnailDataUrl = thumbUrl;
        } catch (thumbErr) {
          console.warn('Could not generate thumbnail for share:', thumbErr);
        } finally {
          canvasRef.current.classList.remove('exporting-no-transitions');
        }
      }

      const rawJson = JSON.stringify(rest);
      const compressedJson = await compressGzipString(rawJson);
      const authToken = await getAuthToken();

      const res = await fetch(apiUrl('/api/share'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: shareName.trim(),
          publisher: sharePublisher.trim(),
          identifier: identifier,
          json_string: compressedJson,
          visibility: shareVisibility,
          turnstileToken,
          entryId: shareId,
          thumbnail: thumbnailDataUrl,
        }),
      });

      const data = await res.json();
      console.log('Share POST response:', data);
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to share design. Please try again.');
      }

      // Persist the CMS entry id so the next share PUTs instead of creating a duplicate
      if (data.entryId) {
        useStudioStore.getState().updateState({ shareId: data.entryId });
      }
      if (data.identifier) {
        useStudioStore.getState().updateState({ shareIdentifier: data.identifier });
      }

      removeTurnstileWidget();
      setShareUrl(data.url);
    } catch (err) {
      console.error('Share error:', err);
      setShareError(
        err instanceof Error ? err.message : 'Failed to share design. Please try again.'
      );
    } finally {
      // Restore the user's previously active stage
      if (hasMultipleStages && initialStageIndex !== 0) {
        rawStore.selectStage(initialStageIndex);
      }
      setIsSharing(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 3000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
    >
      {transitionStage && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed overflow-hidden"
          style={{
            left: '-10000px',
            top: 0,
            width: `${Math.max(640, canvasRef.current?.offsetWidth || 1200)}px`,
            height: `${Math.max(640, canvasRef.current?.offsetHeight || 800)}px`,
          }}
        >
          <CanvasStage
            canvasRef={transitionCanvasRef}
            stateOverride={transitionStage}
            readOnly
            canvasId="shotage-transition-export-incoming"
          />
        </div>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-5 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-950 font-bold shadow-md"
              style={{
                backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
              }}
            >
              <Download01 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {activeTab === 'video'
                  ? 'Export Video Animation'
                  : activeTab === 'share'
                    ? 'Share Your Design'
                    : 'Export High-Res Graphics'}
              </h3>
              <p className="text-xs text-slate-400">
                {activeTab === 'video'
                  ? 'Record 3D motion animation as video'
                  : activeTab === 'share'
                    ? shareVisibility === 'public'
                      ? 'Submit your design for Explore review'
                      : 'Save a design only your account can open'
                    : 'Select file format and scale multiplier'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Close"
          >
            <XClose className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs Header: Image vs Video vs Share */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 gap-1">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'image'
                ? 'bg-[#a2d2ff]/20 text-[#a2d2ff] border border-[#a2d2ff]/40 shadow-xs font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900 border border-transparent'
            }`}
          >
            <Image01 className="w-3.5 h-3.5" />
            <span>
              <span className="inline sm:hidden">Image</span>
              <span className="hidden sm:inline">Image Export</span>
            </span>
          </button>
          {state.isAnimationMode && (
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-[#a2d2ff]/20 text-[#a2d2ff] border border-[#a2d2ff]/40 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900 border border-transparent'
              }`}
            >
              <Film01 className="w-3.5 h-3.5" />
              <span>
                <span className="inline sm:hidden">Video</span>
                <span className="hidden sm:inline">Video Animation</span>
              </span>
            </button>
          )}
          {sessionUser && (
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'share'
                  ? 'bg-[#a2d2ff]/20 text-[#a2d2ff] border border-[#a2d2ff]/40 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900 border border-transparent'
              }`}
            >
              <Share01 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}
        </div>

        {/* Tab 1: Image Export */}
        {activeTab === 'image' && (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                File Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onChange({ exportFormat: fmt })}
                    className={`py-2 text-xs font-mono uppercase rounded-xl border transition-all cursor-pointer ${
                      state.exportFormat === fmt
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {customImageOutputSize && (
              <div className="rounded-xl border border-pastel-blue/25 bg-pastel-blue/8 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Image output
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold text-pastel-blue">
                  {customImageOutputSize.width.toLocaleString()} ×{' '}
                  {customImageOutputSize.height.toLocaleString()} px
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {state.exportScale}× of your {customImageBaseSize!.width.toLocaleString()} ×{' '}
                  {customImageBaseSize!.height.toLocaleString()} custom canvas.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pixel Density Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onChange({ exportScale: scale })}
                    className={`py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                      state.exportScale === scale
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {scale}x Density
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Scope Selector when multiple stages exist */}
            {(state.stages?.length || 1) > 1 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Export Target
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportScope('current')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      exportScope === 'current'
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    Current Stage ({state.activeStageIndex + 1})
                  </button>
                  <button
                    onClick={() => setExportScope('all')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      exportScope === 'all'
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    All Stages (1..{state.stages?.length})
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-3">
              {session.isPending || accountPending ? (
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-400">
                  <Loading01 className="h-3.5 w-3.5 animate-spin text-pastel-pink" />
                  Checking your credits…
                </div>
              ) : !sessionUser ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Sign in to export</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      New accounts receive 100 welcome credits.
                    </p>
                  </div>
                  <AuthButton variant="studio" />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Your balance
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-white">
                      {verifiedAccount
                        ? verifiedAccount.credits.unlimited
                          ? '∞ Unlimited'
                          : `${verifiedAccount.credits.balance.toLocaleString()} credits`
                        : 'Balance unavailable'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Export cost
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-pastel-pink">
                      {hasUnlimitedExports ? 'Included' : `${imageDownloadCost} credits`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {(desktopImageIssue || desktopCopyIssue) && (
              <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[11px] leading-5 text-amber-200">
                {desktopImageIssue || desktopCopyIssue}
              </div>
            )}
            {imageExportError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-[11px] leading-5 text-rose-200"
              >
                {imageExportError}
              </div>
            )}
            {imageExportNotice && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-[11px] leading-5 text-emerald-200"
              >
                {imageExportNotice}
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <button
                disabled={imageActionsDisabled || Boolean(desktopImageIssue)}
                onClick={() =>
                  imageDownloadInsufficient
                    ? setCreditDialogOpen(true)
                    : handleExport(state.exportFormat, false)
                }
                className={`w-full py-3 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                  imageActionsDisabled || desktopImageIssue
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:brightness-110 active:scale-[0.99] cursor-pointer'
                }`}
                style={{
                  backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                }}
              >
                {exportingType === 'image' ? (
                  <>
                    <Loading01 className="w-4 h-4 text-slate-950 animate-spin" />
                    <span>Generating Image...</span>
                  </>
                ) : hasUnlimitedExports ? (
                  `Download ${state.exportFormat.toUpperCase()} (${state.exportScale}x) · Included`
                ) : imageDownloadInsufficient ? (
                  `Buy credits to export (${imageDownloadCost} needed)`
                ) : (
                  `Download ${state.exportFormat.toUpperCase()} (${state.exportScale}x) · ${imageDownloadCost} credits`
                )}
              </button>

              <button
                disabled={imageActionsDisabled || Boolean(desktopCopyIssue)}
                onClick={() =>
                  imageCopyInsufficient ? setCreditDialogOpen(true) : handleExport('png', true)
                }
                className={`w-full py-2.5 bg-neutral-800 text-slate-200 font-semibold text-xs rounded-xl border border-neutral-700 transition-all flex items-center justify-center gap-2 ${
                  imageActionsDisabled || desktopCopyIssue
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-neutral-750 hover:border-neutral-600 hover:text-white cursor-pointer'
                }`}
              >
                {hasUnlimitedExports
                  ? 'Copy PNG to Clipboard · Included'
                  : imageCopyInsufficient
                    ? `Buy credits to copy (${imageCopyCost} needed)`
                    : `Copy PNG to Clipboard · ${imageCopyCost} credits`}
              </button>
            </div>
          </>
        )}

        {/* Tab 2: Video Export (When Animation Mode is active) */}
        {state.isAnimationMode && activeTab === 'video' && (
          <>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Video Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVideoFormat('mp4')}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    videoFormat === 'mp4'
                      ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  MP4 (H.264) — Universal
                </button>
                <button
                  onClick={() => setVideoFormat('webm')}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    videoFormat === 'webm'
                      ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  WebM (VP9) — Web
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Resolution Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onChange({ exportScale: scale })}
                    className={`py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                      state.exportScale === scale
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    {scale}x Density
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Frame Rate
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVideoFps(30)}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    videoFps === 30
                      ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  30 FPS (Standard)
                </button>
                <button
                  onClick={() => setVideoFps(60)}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    videoFps === 60
                      ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  60 FPS (Ultra Smooth)
                </button>
              </div>
            </div>

            {/* Stage Scope Selector when multiple stages exist */}
            {(state.stages?.length || 1) > 1 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Export Target
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportScope('current')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      exportScope === 'current'
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    Current Stage ({state.activeStageIndex + 1})
                  </button>
                  <button
                    onClick={() => setExportScope('all')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      exportScope === 'all'
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    All Stages Combined (1..{state.stages?.length})
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-3.5 py-3">
              {session.isPending || accountPending ? (
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-400">
                  <Loading01 className="h-3.5 w-3.5 animate-spin text-pastel-pink" />
                  Checking your credits…
                </div>
              ) : !sessionUser ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">Sign in to export</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      New accounts receive 100 welcome credits.
                    </p>
                  </div>
                  <AuthButton variant="studio" />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Your balance
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-white">
                      {verifiedAccount
                        ? verifiedAccount.credits.unlimited
                          ? '∞ Unlimited'
                          : `${verifiedAccount.credits.balance.toLocaleString()} credits`
                        : 'Balance unavailable'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {videoDurationSeconds}s video
                    </p>
                    <p className="mt-1 text-sm font-bold tabular-nums text-pastel-pink">
                      {hasUnlimitedExports ? 'Included' : `${videoExportCost} credits`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {desktopVideoIssue && (
              <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[11px] leading-5 text-amber-200">
                {desktopVideoIssue}
              </div>
            )}
            {videoDurationInvalid && (
              <div
                role="alert"
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[11px] leading-5 text-amber-200"
              >
                Paid video exports must be between 1 and {MAX_PAID_VIDEO_DURATION_SECONDS} seconds.
                Shorten the animation or export fewer stages.
              </div>
            )}
            {videoExportError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-[11px] leading-5 text-rose-200"
              >
                {videoExportError}
              </div>
            )}
            {videoExportNotice && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-[11px] leading-5 text-emerald-200"
              >
                {videoExportNotice}
              </div>
            )}

            <div className="pt-2 w-full">
              {isExporting && exportingType === 'video' ? (
                /* Active Video Export Progress & 100% Clickable Stop Button */
                <div className="w-full h-11 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-1.5 animate-in fade-in duration-200">
                  {/* Progress Track */}
                  <div className="relative flex-1 h-full bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800/80 flex items-center min-w-0">
                    <div
                      className="h-full bg-gradient-to-r from-pastel-pink via-[#bde0fe] to-[#a2d2ff] transition-all duration-150 ease-out shadow-[0_0_15px_#a2d2ff]"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>

                  {/* Percentage & Stop Button */}
                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-pastel-pink px-1">
                      {exportProgress}%
                    </span>
                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        cancelVideoRef.current = true;
                        setIsExporting(false);
                        setExportingType(null);
                        setExportProgress(0);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelVideoRef.current = true;
                        setIsExporting(false);
                        setExportingType(null);
                        setExportProgress(0);
                      }}
                      className="flex px-3 py-1.5 text-xs font-bold bg-rose-500/25 hover:bg-rose-600 active:scale-95 text-rose-300 hover:text-white border border-rose-500/50 rounded-lg transition-all items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Cancel Video Export"
                    >
                      <XClose className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Stop</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Idle or Success Action Button */
                <button
                  disabled={videoActionsDisabled}
                  onClick={() =>
                    videoExportInsufficient ? setCreditDialogOpen(true) : handleExportVideo()
                  }
                  className={`w-full h-11 rounded-xl transition-all flex items-center justify-center gap-2 font-extrabold text-xs shadow-lg ${
                    isSuccess
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 font-black'
                      : videoActionsDisabled
                        ? 'bg-gradient-to-r from-pastel-pink to-[#a2d2ff] text-slate-950 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pastel-pink to-[#a2d2ff] text-slate-950 hover:brightness-110 cursor-pointer'
                  }`}
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      <span>Export Complete!</span>
                    </>
                  ) : (
                    <>
                      <Film01 className="w-4 h-4 text-slate-950" />
                      <span>
                        {hasUnlimitedExports
                          ? exportScope === 'all' && (state.stages?.length || 1) > 1
                            ? `Record All Stages (${state.stages?.length}) · Included`
                            : `Record & Export ${videoFormat.toUpperCase()} · Included`
                          : videoExportInsufficient
                            ? `Buy credits to export (${videoExportCost} needed)`
                            : exportScope === 'all' && (state.stages?.length || 1) > 1
                              ? `Record All Stages (${state.stages?.length}) · ${videoExportCost} credits`
                              : `Record & Export ${videoFormat.toUpperCase()} · ${videoExportCost} credits`}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* Tab 3: Share */}
        {sessionUser && activeTab === 'share' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Design Name
                </label>
                <input
                  type="text"
                  value={shareName}
                  onChange={(e) => setShareName(e.target.value)}
                  placeholder="e.g. Product Showoff"
                  disabled={isSharing}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pastel-pink disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Publisher
                </label>
                <input
                  type="text"
                  value={sharePublisher}
                  onChange={(e) => setSharePublisher(e.target.value)}
                  placeholder="e.g. Studio Name"
                  disabled={isSharing}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pastel-pink disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['private', 'public'] as const).map((visibility) => (
                  <button
                    key={visibility}
                    type="button"
                    disabled={isSharing}
                    onClick={() => setShareVisibility(visibility)}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      shareVisibility === visibility
                        ? 'border-[#a2d2ff]/50 bg-[#a2d2ff]/15 text-white'
                        : 'border-neutral-800 bg-neutral-950/70 text-slate-400 hover:border-neutral-700 hover:text-slate-200'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span className="block text-xs font-bold capitalize">{visibility}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                      {visibility === 'private'
                        ? 'Only you can open this design.'
                        : 'Submit it for review before Explore.'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {shareUrl ? (
              <div className="pt-1 space-y-2.5">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-300 font-semibold">
                    {shareVisibility === 'public'
                      ? 'Design submitted for review!'
                      : 'Private design saved successfully!'}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Share URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 min-w-0 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-[11px] font-mono text-pastel-pink focus:outline-none focus:border-pastel-pink truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareUrl}
                      title="Copy share URL"
                      className={`shrink-0 w-9 h-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                        isShareCopied
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-neutral-800 border-neutral-700 text-slate-200 hover:bg-neutral-700 hover:border-neutral-600 hover:text-white'
                      }`}
                    >
                      {isShareCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy01 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                {turnstileSiteKey && (
                  <div
                    ref={turnstileRef}
                    className="flex items-center justify-center scale-95 origin-center"
                  />
                )}
                {shareError && (
                  <div className="text-[11px] text-rose-400 text-center font-medium">
                    {shareError}
                  </div>
                )}
                <button
                  disabled={isSharing}
                  onClick={handleShare}
                  className={`w-full py-3 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isSharing
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:brightness-110 active:scale-[0.99] cursor-pointer'
                  }`}
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
                  }}
                >
                  {isSharing ? (
                    <>
                      <Loading01 className="w-4 h-4 text-slate-950 animate-spin" />
                      <span>Sharing Design...</span>
                    </>
                  ) : (
                    <>
                      <LinkExternal01 className="w-4 h-4 text-slate-950" />
                      <span>Share Design</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-500 text-center leading-snug">
                  {shareVisibility === 'public'
                    ? 'Public designs are reviewed before they can appear in Explore. Your design name and publisher will be visible.'
                    : 'Private designs stay out of Explore and can only be opened while signed in to this account.'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Sponsorer Box */}
        {sponsoredProject && (
          <div className="pt-3 border-t border-neutral-800/80">
            <a
              href={sponsoredProject.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 bg-neutral-950/60 hover:bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all shadow-inner"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Sponsored
                </span>
                <LinkExternal01 className="w-3 h-3 text-slate-500 group-hover:text-pastel-pink transition-colors" />
              </div>
              <div className="flex items-center gap-2.5">
                <img
                  src={sponsoredProject.favicon}
                  alt={`${sponsoredProject.name} Logo`}
                  className="w-6 h-6 rounded-md shrink-0 object-contain"
                />
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-pastel-pink transition-colors leading-tight">
                    {sponsoredProject.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                    {sponsoredProject.tagline}
                  </p>
                </div>
              </div>
            </a>
          </div>
        )}
      </div>
      {creditDialogOpen && !hasUnlimitedExports && (
        <CreditPackDialog variant="studio" onClose={() => setCreditDialogOpen(false)} />
      )}
    </div>
  );
};
