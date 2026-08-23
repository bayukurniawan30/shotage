import React, { useRef, useEffect, useCallback } from 'react';

// Registry of active in-memory video decoders for frame-accurate export synchronization
export const activeVideoDecoders = new Map<
  number,
  {
    video: HTMLVideoElement;
    drawFrame: () => void;
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
  currentTimeSec?: number;
}

export const VideoCanvasScreen: React.FC<VideoCanvasScreenProps> = ({
  src,
  slotIndex,
  className = '',
  style = {},
  isPlaying = false,
  currentTimeSec = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const rvfcIdRef = useRef<number | null>(null);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

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
      }
    }
  }, []);

  // Initialize and manage detached in-memory video decoder
  useEffect(() => {
    const video = document.createElement('video');
    video.src = src;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    videoRef.current = video;
    activeVideoDecoders.set(slotIndex, { video, drawFrame });

    const handleLoadedData = () => drawFrame();
    const handleSeeked = () => drawFrame();
    const handleTimeUpdate = () => drawFrame();

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);

    let isSubscribed = true;

    const onFrame = () => {
      if (!isSubscribed) return;
      drawFrame();

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

    video.play().catch(() => {});

    return () => {
      isSubscribed = false;
      activeVideoDecoders.delete(slotIndex);
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
  }, [src, slotIndex, drawFrame]);

  // Synchronize playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, [isPlaying, currentTimeSec, drawFrame]);

  return (
    <canvas
      ref={canvasRef}
      data-slot-canvas={slotIndex}
      className={`w-full h-full object-cover block ${className}`}
      style={style}
    />
  );
};
