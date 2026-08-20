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
    setIsExporting(true);
    setExportingType('image');

    // Ensure all web fonts are loaded and DOM has reflowed after deselecting text layers
    if ('fonts' in document) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const options = {
        pixelRatio: state.exportScale,
        quality: 0.95,
        cacheBust: true,
        ...(state.backgroundType === 'transparent' ? { backgroundColor: 'transparent' } : {}),
      };

      const totalStages = state.stages?.length || 1;

      if (exportScope === 'all' && totalStages > 1 && !isCopy) {
        const initialStageIndex = state.activeStageIndex;

        for (let i = 0; i < totalStages; i++) {
          state.selectStage(i);
          setExportProgress(Math.round(((i + 1) / totalStages) * 100));
          await new Promise((resolve) => setTimeout(resolve, 150));
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
          await new Promise((resolve) => setTimeout(resolve, 300));
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

    let exportCanvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let videoEncoder: VideoEncoder | null = null;
    let muxer: any = null;
    let cachedFontEmbedCSS = '';

    try {
      state.selectTextLayer(null);
      const durationSec = state.durationSec || 10;
      const fps = 30; // 30 FPS for crisp frame delivery
      const totalFrames = Math.floor(durationSec * fps);

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
          for (const item of webmCandidates) {
            const cfg: VideoEncoderConfig = {
              codec: item.codec,
              width,
              height,
              bitrate: targetBitrate,
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
          supportedConfig = {
            codec: 'vp8',
            width: Math.min(1920, width),
            height: Math.min(1080, height),
            bitrate: 8_000_000,
          };
          webmMuxerCodec = 'V_VP8';
        }
      }

      exportCanvas = document.createElement('canvas');
      exportCanvas.width = supportedConfig.width;
      exportCanvas.height = supportedConfig.height;
      ctx = exportCanvas.getContext('2d');

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

      // Pre-compute font embed CSS ONCE to prevent html-to-image from downloading/converting fonts on every frame (300x)
      try {
        cachedFontEmbedCSS = await getFontEmbedCSS(canvasRef.current);
      } catch (err) {
        console.warn('Could not pre-cache font embed CSS:', err);
      }

      const framePixelRatio = exportCanvas.width / (canvasRef.current.offsetWidth || exportCanvas.width);

      // Frame-by-Frame High Speed Pipeline using direct canvas capture
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
            filter: (node) => (node as HTMLElement).tagName !== 'VIDEO',
          });

          // Draw directly to even-dimension exportCanvas
          ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
          ctx.drawImage(renderedCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

          // Compute exact timestamp in microseconds for video output
          const timestampMicros = Math.round((frame / fps) * 1_000_000);
          const videoFrame = new VideoFrame(exportCanvas, { timestamp: timestampMicros });
          videoEncoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
          videoFrame.close();

          // CRITICAL MEMORY RELEASE:
          // Immediately zero-out intermediate frame canvas dimensions to reclaim GPU/RAM bitmap memory
          renderedCanvas.width = 0;
          renderedCanvas.height = 0;
        } catch (e) {
          console.error('Frame render failed at frame', frame, e);
        }

        setExportProgress(Math.round((frame / totalFrames) * 100));

        // Yield to browser event loop every 8 frames so browser GC can reclaim memory
        if (frame % 8 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
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
        link.download = `shotage-animation-${Date.now()}.${extension}`;
        link.href = url;
        link.click();

        // Revoke the blob URL after download triggers to release the video buffer from RAM
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }

      // Trigger 3D Success State
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

    try {
      const storeState = useStudioStore.getState();
      const {
        imageSrc,
        secondImageSrc,
        isPreviewMode,
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

      // Generate optimized thumbnail image (max 350px, < 200KB)
      let thumbnailDataUrl: string | null = null;
      if (canvasRef.current) {
        try {
          storeState.selectTextLayer(null);
          await new Promise((resolve) => setTimeout(resolve, 50));
          if ('fonts' in document) await document.fonts.ready;

          const rawCanvas = await toCanvas(canvasRef.current, {
            pixelRatio: 1,
            cacheBust: true,
            ...(storeState.backgroundType === 'transparent'
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

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shareName.trim(),
          publisher: sharePublisher.trim(),
          identifier: identifier,
          json_string: JSON.stringify(rest),
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
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
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
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <XClose className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs Header: Image vs Video vs Share */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'image'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image01 className="w-3.5 h-3.5" />
            <span>Image Export</span>
          </button>
          {state.isAnimationMode && (
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film01 className="w-3.5 h-3.5" />
              <span>Video Animation</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                File Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => onChange({ exportFormat: fmt })}
                    className={`py-2 text-xs font-mono uppercase rounded-xl border transition-all ${
                      state.exportFormat === fmt
                        ? 'bg-pastel-purple/30 border-pastel-pink text-pastel-pinkLight font-bold shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pixel Density Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onChange({ exportScale: scale })}
                    className={`py-2 text-xs font-mono rounded-xl border transition-all ${
                      state.exportScale === scale
                        ? 'bg-pastel-purple/30 border-pastel-pink text-pastel-pinkLight font-bold shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Export Target
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportScope('current')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      exportScope === 'current'
                        ? 'bg-pastel-purple/30 border-pastel-pink text-pastel-pinkLight font-bold shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    Current Stage ({state.activeStageIndex + 1})
                  </button>
                  <button
                    onClick={() => setExportScope('all')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      exportScope === 'all'
                        ? 'bg-pastel-purple/30 border-pastel-pink text-pastel-pinkLight font-bold shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
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
                className={`w-full py-2.5 bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 ${
                  isExporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-slate-700 cursor-pointer'
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Video Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVideoFormat('mp4')}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                    videoFormat === 'mp4'
                      ? 'bg-pastel-purple/30 border-pastel-pink text-pastel-pinkLight font-bold shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  MP4 (H.264) — Universal
                </button>
                <button
                  onClick={() => setVideoFormat('webm')}
                  className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${
                    videoFormat === 'webm'
                      ? 'bg-pastel-purple/30 border-pastel-pink text-pastel-pinkLight font-bold shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  WebM (VP9) — Web
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Resolution Scale
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onChange({ exportScale: scale })}
                    className={`py-2 text-xs font-mono rounded-xl border transition-all ${
                      state.exportScale === scale
                        ? 'bg-pastel-purple/30 border-pastel-pink text-pastel-pinkLight font-bold shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    {scale}x Density
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 w-full" style={{ perspective: '1000px' }}>
              <div
                className="relative w-full h-11"
                style={{
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform:
                    isExporting && exportingType === 'video' ? 'rotateX(-90deg)' : 'rotateX(0deg)',
                }}
              >
                {/* 1. FRONT FACE: Idle or Success State */}
                <button
                  disabled={isExporting}
                  onClick={handleExportVideo}
                  className={`absolute inset-0 w-full h-full rounded-xl transition-all flex items-center justify-center gap-2 font-extrabold text-xs shadow-lg ${
                    isSuccess
                      ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 font-black'
                      : 'bg-gradient-to-r from-pastel-pink to-[#a2d2ff] text-slate-950 hover:brightness-110 cursor-pointer'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateX(0deg) translateZ(22px)',
                  }}
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                      <span>Export Complete!</span>
                    </>
                  ) : (
                    <>
                      <Film01 className="w-4 h-4 text-slate-950" />
                      <span>Record & Export {videoFormat.toUpperCase()} Video</span>
                    </>
                  )}
                </button>

                {/* 2. BOTTOM/PROGRESS FACE: 3D Side-Down Progress Track */}
                <div
                  className="absolute inset-0 w-full h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-1.5 group relative"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateX(90deg) translateZ(22px)',
                  }}
                >
                  {/* Clean 3D Progress Track */}
                  <div className="relative flex-1 h-full bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800/80 flex items-center">
                    {/* Glowing Progress Fill Bar */}
                    <div
                      className="h-full bg-gradient-to-r from-pastel-pink via-[#bde0fe] to-[#a2d2ff] transition-all duration-150 ease-out shadow-[0_0_15px_#a2d2ff]"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>

                  {/* Percentage Indicator Badge & Hover Cancel/Stop Button */}
                  <div className="flex items-center gap-1.5 pl-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelVideoRef.current = true;
                      }}
                      className="hidden group-hover:flex px-2 py-0.5 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg transition-all items-center gap-1 cursor-pointer shadow-sm"
                      title="Cancel Video Export"
                    >
                      <XClose className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Stop</span>
                    </button>
                    <span className="font-mono text-xs font-bold text-pastel-pink group-hover:text-rose-300 px-1 transition-colors">
                      {exportProgress}%
                    </span>
                  </div>
                </div>
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
            </div>
          </>
        )}

        {/* Tab 3: Share */}
        {activeTab === 'share' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Design Name
                </label>
                <input
                  type="text"
                  value={shareName}
                  onChange={(e) => setShareName(e.target.value)}
                  placeholder="e.g. Product Showoff"
                  disabled={isSharing}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pastel-pink disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Publisher
                </label>
                <input
                  type="text"
                  value={sharePublisher}
                  onChange={(e) => setSharePublisher(e.target.value)}
                  placeholder="e.g. Studio Name"
                  disabled={isSharing}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pastel-pink disabled:opacity-50"
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Share URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-[11px] font-mono text-pastel-pink focus:outline-none focus:border-pastel-pink truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyShareUrl}
                      title="Copy share URL"
                      className={`shrink-0 w-9 h-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                        isShareCopied
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600'
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
          <div className="pt-3 border-t border-slate-800/80">
            <a
              href={sponsoredProject.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 rounded-xl transition-all shadow-inner"
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
