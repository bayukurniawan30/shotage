import React, { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { isDesktopApp } from '../platform/runtime';

// Registry of active in-memory video decoders for frame-accurate export synchronization
export const activeVideoDecoders = new Map<
  HTMLCanvasElement,
  {
    canvas: HTMLCanvasElement;
    src: string;
    video: HTMLVideoElement;
    drawFrame: () => boolean;
    prepareCaptureFrame: () => Promise<void>;
  }
>();

// Explicitly stop, release memory, and clear all video decoder instances
export const purgeAllVideoDecoders = () => {
  activeVideoDecoders.forEach(({ video }) => {
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (e) {}
  });
  activeVideoDecoders.clear();
};

interface VideoCanvasScreenProps {
  src: string;
  slotIndex: number;
  className?: string;
  style?: React.CSSProperties;
  isPlaying?: boolean;
  isExporting?: boolean;
  currentTimeSec?: number;
}

export const VideoCanvasScreen: React.FC<VideoCanvasScreenProps> = ({
  src,
  slotIndex,
  className = '',
  style = {},
  isPlaying = false,
  isExporting = false,
  currentTimeSec = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportFrameRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rvfcIdRef = useRef<number | null>(null);
  const exportingRef = useRef(isExporting);

  useLayoutEffect(() => {
    exportingRef.current = isExporting;
    if (isExporting) videoRef.current?.pause();
  }, [isExporting]);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return false;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw > 0 && vh > 0) {
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }
      const ctx = canvas.getContext('2d', { alpha: true });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, vw, vh);
        ctx.drawImage(video, 0, 0, vw, vh);
        return true;
      }
    }
    return false;
  }, []);

  const prepareCaptureFrame = useCallback(async () => {
    const canvas = canvasRef.current;
    const image = exportFrameRef.current;
    if (!canvas || !image || !canvas.width || !canvas.height) {
      throw new Error('The uploaded video frame is not ready for desktop export.');
    }
    // WKWebView's foreignObject rasterizer intermittently drops a newly cloned
    // canvas. Give html-to-image a decoded, stable image for this export frame.
    image.src = canvas.toDataURL('image/png');
    await image.decode();
    if (!image.naturalWidth) {
      throw new Error('The uploaded video frame could not be decoded for desktop export.');
    }
  }, []);

  // Initialize and manage detached in-memory video decoder
  useEffect(() => {
    const video = document.createElement('video');
    video.autoplay = !exportingRef.current;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.src = src;

    videoRef.current = video;
    const canvas = canvasRef.current;
    if (canvas) activeVideoDecoders.set(canvas, { canvas, src, video, drawFrame, prepareCaptureFrame });

    // Export paints its own frame. Preview events must never overwrite it.
    const drawPreviewFrame = () => {
      if (!exportingRef.current) drawFrame();
    };
    const handleLoadedData = drawPreviewFrame;
    const handleSeeked = drawPreviewFrame;
    const handleTimeUpdate = drawPreviewFrame;

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);

    let isSubscribed = true;

    const onFrame = () => {
      if (!isSubscribed) return;
      drawPreviewFrame();

      if ('requestVideoFrameCallback' in video) {
        rvfcIdRef.current = (video as any).requestVideoFrameCallback(onFrame);
      } else {
        animFrameRef.current = requestAnimationFrame(onFrame);
      }
    };

    if ('requestVideoFrameCallback' in video) {
      rvfcIdRef.current = (video as any).requestVideoFrameCallback(onFrame);
    } else {
      animFrameRef.current = requestAnimationFrame(onFrame);
    }

    if (!exportingRef.current) video.play().catch(() => {});

    return () => {
      isSubscribed = false;
      if (canvas) activeVideoDecoders.delete(canvas);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (rvfcIdRef.current != null && 'cancelVideoFrameCallback' in video) {
        (video as any).cancelVideoFrameCallback(rvfcIdRef.current);
        rvfcIdRef.current = null;
      }
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      video.pause();
      video.src = '';
      videoRef.current = null;
    };
  }, [src, slotIndex, drawFrame, prepareCaptureFrame]);

  // Synchronize playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Export owns frame-accurate seeking. The preview effect must not race it.
    if (isExporting) {
      video.pause();
      return;
    }

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
      if (currentTimeSec !== undefined && video.duration) {
        const target = currentTimeSec % video.duration;
        if (Math.abs(video.currentTime - target) > 0.05) {
          video.currentTime = target;
        }
      }
      drawFrame();
    }
  }, [isPlaying, isExporting, currentTimeSec, drawFrame]);

  const useExportImage = isExporting && isDesktopApp();
  return (
    <>
      <canvas
        ref={canvasRef}
        data-slot-canvas={slotIndex}
        className={`w-full h-full block ${className}`}
        style={{ ...style, display: useExportImage ? 'none' : style.display }}
      />
      {useExportImage && (
        <img
          ref={exportFrameRef}
          data-export-video-frame="true"
          alt=""
          draggable={false}
          className={`w-full h-full block ${className}`}
          style={style}
        />
      )}
    </>
  );
};
