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
import { getExportCapacity, getImageExportCost, getVideoExportCost } from '../lib/credits';

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
  const sessionUser = session.data?.user;
  const hasUnlimitedExports = verifiedAccount?.credits.unlimited === true;
  const imageDownloadInsufficient = Boolean(
    verifiedAccount && !hasUnlimitedExports && verifiedAccount.credits.balance < imageDownloadCost
  );
  const imageCopyInsufficient = Boolean(
    verifiedAccount && !hasUnlimitedExports && verifiedAccount.credits.balance < imageCopyCost
  );
  const imageActionsDisabled = isExporting || session.isPending || accountPending || !sessionUser;
  const videoStageCount = exportScope === 'all' ? totalImageStages : 1;
  const videoDurationSeconds = Number(
    (exportScope === 'all' && totalImageStages > 1
      ? (state.stages || []).reduce((total, stage) => total + (stage.durationSec || 10), 0)
      : state.durationSec || 10
    ).toFixed(3)
  );
  const videoExportCost = getVideoExportCost(videoDurationSeconds);
  const videoDurationInvalid = videoDurationSeconds <= 0 || videoDurationSeconds > 30;
  const videoExportInsufficient = Boolean(
    verifiedAccount && !hasUnlimitedExports && verifiedAccount.credits.balance < videoExportCost
  );
  const videoActionsDisabled =
    isExporting || session.isPending || accountPending || !sessionUser || videoDurationInvalid;

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

  if (!isOpen) return null;

  const handleExport = async (format: 'png' | 'jpeg' | 'webp', isCopy = false) => {
    if (!canvasRef.current || imageExportLockRef.current) return;
    if (!sessionUser) {
      setImageExportError('Sign in before exporting a high-resolution image.');
      return;
    }

    const stageScope = isCopy ? 'current' : exportScope;
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

      // Suppress transitions and wait for fonts so the captured DOM is stable.
      canvasRef.current.classList.add('exporting-no-transitions');
      if ('fonts' in document) await document.fonts.ready;
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

          let dataUrl: string;
          if (format === 'webp') {
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
        }

        state.selectStage(initialStageIndex);
        for (const download of stagedDownloads) {
          const link = document.createElement('a');
          link.download = download.filename;
          link.href = download.href;
          link.click();
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } else {
        if (isCopy) {
          const blob = await toBlob(canvasRef.current, options);
          if (!blob) throw new Error('Failed to generate image for the clipboard');
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          alert('Copied high-res image to clipboard!');
        } else {
          let dataUrl: string;
          if (format === 'webp') {
            const blob = await toBlob(canvasRef.current, { ...options, type: 'image/webp' });
            if (!blob) throw new Error('Failed to generate WebP blob');
            dataUrl = URL.createObjectURL(blob);
            temporaryObjectUrls.push(dataUrl);
          } else if (format === 'jpeg') {
            dataUrl = await toJpeg(canvasRef.current, options);
          } else {
            dataUrl = await toPng(canvasRef.current, options);
          }

          const link = document.createElement('a');
          link.download = `shotage-${Date.now()}.${format}`;
          link.href = dataUrl;
          link.click();
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
      } else {
        setImageExportError('The image export failed. Reserved credits were released.');
      }
    } finally {
      if (canvasRef.current) {
        canvasRef.current.classList.remove('exporting-no-transitions');
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
    if (videoDurationInvalid) {
      setVideoExportError('Paid video exports must be between 1 and 30 seconds.');
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
    let cachedFontEmbedCSS = '';
    const initialStageIndex = state.activeStageIndex;
    let reservation: ExportReservation | null = null;
    let renderCompleted = false;
    let usedCachedFrameRenderer = false;
    const reservationKey = crypto.randomUUID();
    const settlementKey = crypto.randomUUID();
    const releaseKey = crypto.randomUUID();

    try {
      state.selectTextLayer(null);
      state.selectShapeLayer(null);
      state.selectPhosphorIconLayer(null);
      state.selectCanvasElement(null);

      const projectHash = await createProjectHash(useStudioStore.getState());
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

      const totalStages = state.stages?.length || 1;
      const isMultiStage = exportScope === 'all' && totalStages > 1;
      const stagesToRecord = isMultiStage
        ? Array.from({ length: totalStages }, (_, i) => i)
        : [state.activeStageIndex];

      const fps = videoFps;

      // Calculate total duration across all stages to record
      let grandTotalFrames = 0;
      for (const idx of stagesToRecord) {
        const stageDuration = isMultiStage
          ? state.stages?.[idx]?.durationSec || 10
          : state.durationSec || 10;
        grandTotalFrames += Math.max(1, Math.round(stageDuration * fps));
      }

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
              avc: { format: 'avc' },
            };
            try {
              const res = await VideoEncoder.isConfigSupported(cfg);
              if (res.supported) {
                supportedConfig = res.config || cfg;
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
            avc: { format: 'avc' },
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

      videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
          encodedChunksCount++;
          muxer?.addVideoChunk(chunk, meta);
        },
        error: (e) => {
          console.error('VideoEncoder error:', e);
          encoderError = e instanceof Error ? e : new Error(String(e));
        },
      });

      videoEncoder.configure(supportedConfig);

      // Pause live player during frame rendering
      onChange({ isPlaying: false, currentTimeSec: 0 });

      // Ensure all loaded web fonts are ready in browser cache before recording
      if ('fonts' in document) {
        await document.fonts.ready;
      }

      let globalTimeOffsetSec = 0;
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
        }

        try {
          cachedFontEmbedCSS = await getFontEmbedCSS(canvasRef.current);
        } catch (err) {
          console.warn('Could not pre-cache font embed CSS:', err);
        }

        const durationSec = isMultiStage
          ? state.stages?.[stageIndex]?.durationSec || 10
          : state.durationSec || 10;
        const totalFrames = Math.max(1, Math.round(durationSec * fps));
        const framePixelRatio =
          exportCanvas.width / (canvasRef.current.offsetWidth || exportCanvas.width);

        flushSync(() => {
          onChange({ currentTimeSec: 0, exportTimeSec: globalTimeOffsetSec });
        });

        if (canUseCachedVideoFrameRenderer(useStudioStore.getState())) {
          cachedFrameRenderer = await createCachedVideoFrameRenderer(canvasRef.current, {
            pixelRatio: framePixelRatio,
            fontEmbedCSS: cachedFontEmbedCSS,
            transparent: isTransparentExport,
          });
          usedCachedFrameRenderer ||= cachedFrameRenderer !== null;
        }

        for (let frame = 0; frame < totalFrames; frame++) {
          if (cancelVideoRef.current || encoderError) {
            if (encoderError)
              console.error('Video export aborted due to encoder error:', encoderError);
            break;
          }

          const targetTimeSec = frame / fps;
          const frameTimeSec = globalTimeOffsetSec + targetTimeSec;
          flushSync(() => {
            onChange({ currentTimeSec: targetTimeSec, exportTimeSec: frameTimeSec });
          });

          // Synchronize any mockup video decoders to exact target timestamp
          if (activeVideoDecoders.size > 0) {
            await Promise.all(
              Array.from(activeVideoDecoders.values()).map(({ video, drawFrame }) => {
                return new Promise<void>((resolve) => {
                  const vidDuration = video.duration || durationSec;
                  const vidTarget = targetTimeSec % vidDuration;

                  if (Math.abs(video.currentTime - vidTarget) < 0.03) {
                    drawFrame();
                    return resolve();
                  }

                  let timeoutId = 0;
                  let finished = false;
                  const finish = () => {
                    if (finished) return;
                    finished = true;
                    video.removeEventListener('seeked', onSeeked);
                    window.clearTimeout(timeoutId);
                    drawFrame();
                    resolve();
                  };
                  const onSeeked = () => finish();
                  video.addEventListener('seeked', onSeeked, { once: true });
                  video.currentTime = vidTarget;
                  timeoutId = window.setTimeout(finish, 80);
                });
              })
            );
          }

          try {
            const fastFrameRendered = cachedFrameRenderer?.render(ctx) ?? false;
            if (!fastFrameRendered) {
              const renderedCanvas = await toCanvas(canvasRef.current, {
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
              });

              ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
              ctx.drawImage(renderedCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
              renderedCanvas.width = 0;
              renderedCanvas.height = 0;
            }

            // Compute exact continuous timestamp in microseconds for video output
            const frameTimeSec = globalTimeOffsetSec + targetTimeSec;
            const timestampMicros = Math.round(frameTimeSec * 1_000_000);
            const isKeyFrame = frame === 0 || frame % (fps * 2) === 0;

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
          }

          completedFramesCount++;
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

        globalTimeOffsetSec += durationSec;
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

      if (encodedChunksCount === 0) {
        throw new Error('No video frames were encoded by the browser.');
      }

      if (muxer) {
        muxer.finalize();
        const { buffer } = muxer.target;
        const blob = new Blob([buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = isMultiStage
          ? `shotage-stages-animation-${Date.now()}.${extension}`
          : `shotage-animation-${Date.now()}.${extension}`;
        link.href = url;
        link.click();

        // Revoke the blob URL after download triggers to release the video buffer from RAM
        setTimeout(() => URL.revokeObjectURL(url), 2000);
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
      cachedFrameRenderer?.dispose();
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
      }
      // Complete memory purge
      if (exportCanvas) {
        exportCanvas.width = 0;
        exportCanvas.height = 0;
        exportCanvas = null;
      }
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

      const res = await fetch('/api/share', {
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
                disabled={imageActionsDisabled}
                onClick={() =>
                  imageDownloadInsufficient
                    ? setCreditDialogOpen(true)
                    : handleExport(state.exportFormat, false)
                }
                className={`w-full py-3 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                  imageActionsDisabled
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
                disabled={imageActionsDisabled}
                onClick={() =>
                  imageCopyInsufficient ? setCreditDialogOpen(true) : handleExport('png', true)
                }
                className={`w-full py-2.5 bg-neutral-800 text-slate-200 font-semibold text-xs rounded-xl border border-neutral-700 transition-all flex items-center justify-center gap-2 ${
                  imageActionsDisabled
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

            {videoDurationInvalid && (
              <div
                role="alert"
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[11px] leading-5 text-amber-200"
              >
                Paid video exports must be between 1 and 30 seconds. Shorten the animation or export
                fewer stages.
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
