import React, { useState, useRef, useEffect } from 'react';
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
  Heart,
} from '@untitledui/icons';
import * as WebMMuxer from 'webm-muxer';
import * as Mp4Muxer from 'mp4-muxer';
import { activeVideoDecoders } from './VideoCanvasScreen';
import { PROJECTS } from './ProjectSpotlight';
import { optimizeStudioStateForExport } from '../utils/imageOptimizer';
import { compressGzipString } from '../utils/gzipCompression';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, canvasRef }) => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const [isExporting, setIsExporting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [exportingType, setExportingType] = useState<'image' | 'video' | null>(null);
  const [videoFormat, setVideoFormat] = useState<'mp4' | 'webm'>('mp4');
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'share'>(
    state.isAnimationMode ? 'video' : 'image'
  );
  const [exportProgress, setExportProgress] = useState(0);
  const [supportCountdown, setSupportCountdown] = useState(0);
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [shareName, setShareName] = useState('');
  const [sharePublisher, setSharePublisher] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sponsoredProject] = useState(() => PROJECTS[Math.floor(Math.random() * PROJECTS.length)]);
  const [shareUrl, setShareUrl] = useState('');
  const [shareError, setShareError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isShareCopied, setIsShareCopied] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const cancelVideoRef = useRef(false);

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!isOpen) return;
    setShareUrl('');
    setShareError('');
    setIsSharing(false);
    setTurnstileToken('');
    setIsShareCopied(false);
  }, [isOpen]);

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
    let timer: any;
    if (supportCountdown > 0) {
      timer = setInterval(() => {
        setSupportCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [supportCountdown]);

  useEffect(() => {
    if (isOpen) {
      setSupportCountdown(0);
      setIsExporting(false);
      setExportingType(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExport = async (format: 'png' | 'jpeg' | 'webp', isCopy = false) => {
    if (!canvasRef.current) return;
    state.selectTextLayer(null);
    state.selectShapeLayer(null);
    state.selectPhosphorIconLayer(null);
    state.selectCanvasElement(null);
    setIsExporting(true);
    setExportingType('image');

    // Suppress CSS transitions during export so layers and stages snap to exact coordinates instantly
    if (canvasRef.current) {
      canvasRef.current.classList.add('exporting-no-transitions');
    }

    // Ensure all web fonts are loaded and DOM has reflowed after deselecting layers
    if ('fonts' in document) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    try {
      const options = {
        pixelRatio: state.exportScale,
        quality: 0.95,
        cacheBust: true,
        filter: (node: HTMLElement) => {
          if (node && node.classList) {
            if (
              node.classList.contains('delete-handle') ||
              node.classList.contains('rotate-handle') ||
              node.classList.contains('resize-handle')
            ) {
              return false;
            }
          }
          return true;
        },
        ...(state.backgroundType === 'transparent' ? { backgroundColor: 'transparent' } : {}),
      };

      const totalStages = state.stages?.length || 1;

      if (exportScope === 'all' && totalStages > 1 && !isCopy) {
        const initialStageIndex = state.activeStageIndex;

        for (let i = 0; i < totalStages; i++) {
          state.selectStage(i);
          setExportProgress(Math.round(((i + 1) / totalStages) * 100));

          // Wait for React DOM flush and browser layout computation
          await new Promise((resolve) => setTimeout(resolve, 80));
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          if ('fonts' in document) await document.fonts.ready;

          let dataUrl: string;
          if (format === 'webp') {
            const blob = await toBlob(canvasRef.current, { ...options, type: 'image/webp' });
            if (!blob) throw new Error('Failed to generate WebP blob');
            dataUrl = URL.createObjectURL(blob);
          } else if (format === 'jpeg') {
            dataUrl = await toJpeg(canvasRef.current, options);
          } else {
            dataUrl = await toPng(canvasRef.current, options);
          }

          const link = document.createElement('a');
          link.download = `shotage-stage-${i + 1}-${Date.now()}.${format}`;
          link.href = dataUrl;
          link.click();
          if (format === 'webp') {
            setTimeout(() => URL.revokeObjectURL(dataUrl), 2000);
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        state.selectStage(initialStageIndex);
        setSupportCountdown(10);
      } else {
        if (isCopy) {
          const blob = await toBlob(canvasRef.current, options);
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
            alert('Copied high-res image to clipboard!');
          }
        } else {
          let dataUrl: string;
          if (format === 'webp') {
            const blob = await toBlob(canvasRef.current, { ...options, type: 'image/webp' });
            if (!blob) throw new Error('Failed to generate WebP blob');
            dataUrl = URL.createObjectURL(blob);
          } else if (format === 'jpeg') {
            dataUrl = await toJpeg(canvasRef.current, options);
          } else {
            dataUrl = await toPng(canvasRef.current, options);
          }

          const link = document.createElement('a');
          link.download = `shotage-${Date.now()}.${format}`;
          link.href = dataUrl;
          link.click();
          if (format === 'webp') {
            setTimeout(() => URL.revokeObjectURL(dataUrl), 2000);
          }
          setSupportCountdown(10);
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export canvas image. Please try again.');
    } finally {
      if (canvasRef.current) {
        canvasRef.current.classList.remove('exporting-no-transitions');
      }
      setIsExporting(false);
      setExportingType(null);
    }
  };

  // High-Quality WebCodecs 60FPS Video Export (Exact Duration & Zero Lag)
  const handleExportVideo = async () => {
    if (!canvasRef.current) return;
    cancelVideoRef.current = false;
    setIsExporting(true);
    setExportingType('video');
    setExportProgress(0);

    // Suppress CSS transitions during video export
    if (canvasRef.current) {
      canvasRef.current.classList.add('exporting-no-transitions');
    }

    let exportCanvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let videoEncoder: VideoEncoder | null = null;
    let muxer: any = null;
    let cachedFontEmbedCSS = '';
    const initialStageIndex = state.activeStageIndex;

    try {
      state.selectTextLayer(null);
      state.selectShapeLayer(null);
      state.selectPhosphorIconLayer(null);
      state.selectCanvasElement(null);

      const totalStages = state.stages?.length || 1;
      const isMultiStage = exportScope === 'all' && totalStages > 1;
      const stagesToRecord = isMultiStage
        ? Array.from({ length: totalStages }, (_, i) => i)
        : [state.activeStageIndex];

      const fps = 30; // 30 FPS for crisp frame delivery

      // Calculate total duration across all stages to record
      let grandTotalFrames = 0;
      for (const idx of stagesToRecord) {
        const stageDuration =
          (state.stages && state.stages[idx]?.durationSec) || state.durationSec || 10;
        grandTotalFrames += Math.floor(stageDuration * fps);
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
            error: () => { failed = true; },
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
            testEnc.flush().then(() => {
              try { testEnc.close(); } catch {}
              resolve(!failed);
            }).catch(() => {
              try { testEnc.close(); } catch {}
              resolve(false);
            });
          } catch {
            try { testEnc.close(); } catch {}
            resolve(false);
          }
        });

        if (!alphaWorks) {
          console.warn('Browser does not support VP9 alpha encoding – falling back to opaque video.');
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

      // Sequentially record each stage into the single video stream
      for (let sIdx = 0; sIdx < stagesToRecord.length; sIdx++) {
        const stageIndex = stagesToRecord[sIdx];

        if (isMultiStage) {
          state.selectStage(stageIndex);
          await new Promise((resolve) => setTimeout(resolve, 80));
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          if ('fonts' in document) await document.fonts.ready;
        }

        try {
          cachedFontEmbedCSS = await getFontEmbedCSS(canvasRef.current);
        } catch (err) {
          console.warn('Could not pre-cache font embed CSS:', err);
        }

        const durationSec = state.durationSec || 10;
        const totalFrames = Math.floor(durationSec * fps);
        const framePixelRatio = exportCanvas.width / (canvasRef.current.offsetWidth || exportCanvas.width);

        for (let frame = 0; frame <= totalFrames; frame++) {
          if (cancelVideoRef.current || encoderError) {
            if (encoderError) console.error('Video export aborted due to encoder error:', encoderError);
            break;
          }

          const targetTimeSec = (frame / totalFrames) * durationSec;
          onChange({ currentTimeSec: targetTimeSec });

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

                  const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    drawFrame();
                    resolve();
                  };
                  video.addEventListener('seeked', onSeeked, { once: true });
                  video.currentTime = vidTarget;
                  setTimeout(() => {
                    drawFrame();
                    resolve();
                  }, 80);
                });
              })
            );
          }

          try {
            const renderedCanvas = await toCanvas(canvasRef.current, {
              pixelRatio: framePixelRatio,
              cacheBust: false,
              fontEmbedCSS: cachedFontEmbedCSS,
              ...(isTransparentExport ? { backgroundColor: 'transparent' } : {}),
              filter: (node) => (node as HTMLElement).tagName !== 'VIDEO',
            });

            // Draw directly to even-dimension exportCanvas
            ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
            ctx.drawImage(renderedCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

            // Compute exact continuous timestamp in microseconds for video output
            const frameTimeSec = globalTimeOffsetSec + targetTimeSec;
            const timestampMicros = Math.round(frameTimeSec * 1_000_000);
            const isKeyFrame = frame === 0 || (frame % (fps * 2) === 0);

            const videoFrame = new VideoFrame(exportCanvas, {
              timestamp: timestampMicros,
              alpha: isTransparentExport ? 'keep' : 'discard',
            });
            videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
            videoFrame.close();

            // CRITICAL MEMORY RELEASE:
            renderedCanvas.width = 0;
            renderedCanvas.height = 0;
          } catch (e) {
            console.error('Frame render failed at frame', frame, e);
          }

          completedFramesCount++;
          setExportProgress(Math.min(99, Math.round((completedFramesCount / grandTotalFrames) * 100)));

          // Yield to browser event loop on every frame so user cancellation and UI clicks process immediately
          await new Promise((resolve) => setTimeout(resolve, 8));
          if (cancelVideoRef.current) break;
        }

        globalTimeOffsetSec += durationSec;
        if (cancelVideoRef.current) break;
      }

      if (isMultiStage) {
        state.selectStage(initialStageIndex);
      }

      if (cancelVideoRef.current) {
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
      }

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
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Failed to encode video: ${msg}`);
      setIsExporting(false);
      setExportingType(null);
      setExportProgress(0);
    } finally {
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
    }
  };

  // Share the current design to the community gallery via the server-side proxy
  const handleShare = async () => {
    setShareError('');
    setIsShareCopied(false);

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
      // 1. If multiple stages exist, switch to Stage 1 (index 0) so the store automatically
      // flushes the current active stage into the stages array and activates Stage 1 for thumbnail capture
      if (hasMultipleStages && initialStageIndex !== 0) {
        rawStore.selectStage(0);
        await new Promise((resolve) => setTimeout(resolve, 80));
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }

      // 2. Fetch the fully synchronized store state and optimize all images (root + all stages)
      const synchronizedState = useStudioStore.getState();
      const storeState = await optimizeStudioStateForExport(synchronizedState);

      // Keep imageSrc, secondImageSrc, bgImageUrl, stages, etc. intact in the serialized payload
      const {
        isPlaying,
        isPositionDragging,
        shareId,
        shareIdentifier,
        ...rest
      } = storeState;

      // Stable session identifier: generated once, reused so the share URL never changes
      const identifier =
        shareIdentifier ||
        (crypto.randomUUID && crypto.randomUUID()) ||
        `share-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // 3. Generate optimized thumbnail image (max 350px, < 200KB) strictly from Stage 1
      let thumbnailDataUrl: string | null = null;
      if (canvasRef.current) {
        try {
          rawStore.selectTextLayer(null);
          rawStore.selectShapeLayer(null);
          rawStore.selectPhosphorIconLayer(null);
          rawStore.selectCanvasElement(null);
          await new Promise((resolve) => setTimeout(resolve, 50));
          if ('fonts' in document) await document.fonts.ready;

          const stage0BackgroundType =
            (storeState.stages && storeState.stages[0]?.backgroundType) || storeState.backgroundType;

          const rawCanvas = await toCanvas(canvasRef.current, {
            pixelRatio: 1,
            cacheBust: true,
            ...(stage0BackgroundType === 'transparent'
              ? { backgroundColor: 'transparent' }
              : {}),
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
        }
      }

      const rawJson = JSON.stringify(rest);
      const compressedJson = await compressGzipString(rawJson);

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shareName.trim(),
          publisher: sharePublisher.trim(),
          identifier: identifier,
          json_string: compressedJson,
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
      onClick={onClose}
      className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 cursor-default text-slate-200"
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
                    ? 'Publish your design to the community'
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

            <div className="pt-2 space-y-2.5">
              {supportCountdown > 0 ? (
                <a
                  href="https://saweria.co/bayukurniawan30"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <Heart className="w-4 h-4 text-white fill-white" />
                  <span>Support Me ({supportCountdown}s)</span>
                </a>
              ) : (
                <button
                  disabled={isExporting}
                  onClick={() => handleExport(state.exportFormat, false)}
                  className={`w-full py-3 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                    isExporting
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
                  ) : (
                    `Download ${state.exportFormat.toUpperCase()} (${state.exportScale}x)`
                  )}
                </button>
              )}

              <button
                disabled={isExporting}
                onClick={() => handleExport('png', true)}
                className={`w-full py-2.5 bg-neutral-800 text-slate-200 font-semibold text-xs rounded-xl border border-neutral-700 transition-all flex items-center justify-center gap-2 ${
                  isExporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-neutral-750 hover:border-neutral-600 hover:text-white cursor-pointer'
                }`}
              >
                Copy PNG to Clipboard
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
                  disabled={isExporting}
                  onClick={handleExportVideo}
                  className={`w-full h-11 rounded-xl transition-all flex items-center justify-center gap-2 font-extrabold text-xs shadow-lg cursor-pointer ${
                    isSuccess
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 font-black'
                      : 'bg-gradient-to-r from-pastel-pink to-[#a2d2ff] text-slate-950 hover:brightness-110'
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
                        {exportScope === 'all' && (state.stages?.length || 1) > 1
                          ? `Record All Stages (${state.stages?.length}) into 1 ${videoFormat.toUpperCase()}`
                          : `Record & Export ${videoFormat.toUpperCase()} Video`}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

              {/* Support Me Link displayed while Video Export is running */}
              {isExporting && exportingType === 'video' && (
                <a
                  href="https://saweria.co/bayukurniawan30"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full py-2.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <Heart className="w-4 h-4 text-white fill-white" />
                  <span>Support Me</span>
                </a>
              )}
          </>
        )}

        {/* Tab 3: Share */}
        {activeTab === 'share' && (
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

            {shareUrl ? (
              <div className="pt-1 space-y-2.5">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-3 py-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-300 font-semibold">
                    Design shared successfully!
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
                  Sharing will publish your design to the community gallery. Your Name and Publisher
                  appear on the shared design.
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
    </div>
  );
};
