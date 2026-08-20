export const isVideoFile = (file: File): boolean => {
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/mov'];
  if (videoTypes.includes(file.type.toLowerCase())) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'mov', 'ogg'].includes(ext || '');
};

export const isValidMediaFile = (file: File): boolean => {
  const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  if (validImageTypes.includes(file.type.toLowerCase()) || isVideoFile(file)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'mp4', 'webm', 'mov', 'ogg'].includes(ext || '');
};

export const MAX_VIDEO_DURATION_SEC = 20;
export const MAX_VIDEO_DIMENSION_PX = 1920;

export const validateAndLoadVideo = (
  file: File,
  onSuccess: (data: { src: string; name: string; width: number; height: number; duration: number }) => void,
  onError?: (errorMessage: string) => void
) => {
  const src = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';

  video.onloadedmetadata = () => {
    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;
    const duration = video.duration || 10;

    // Check duration limit (max 20 seconds)
    if (duration > MAX_VIDEO_DURATION_SEC + 0.5) {
      URL.revokeObjectURL(src);
      const msg = `Video duration is ${Math.round(duration)}s. Maximum allowed video duration is ${MAX_VIDEO_DURATION_SEC} seconds.`;
      if (onError) onError(msg);
      else alert(msg);
      return;
    }

    // Check resolution limit (max Full HD 1080p, max dimension 1920)
    if (Math.max(width, height) > MAX_VIDEO_DIMENSION_PX) {
      URL.revokeObjectURL(src);
      const msg = `Video resolution (${width}x${height}) exceeds Full HD (1080p). Please upload a video up to 1920x1080.`;
      if (onError) onError(msg);
      else alert(msg);
      return;
    }

    onSuccess({
      src,
      name: file.name,
      width,
      height,
      duration: Math.min(MAX_VIDEO_DURATION_SEC, Math.round(duration)),
    });

    // Notify UI to display beta notice modal (if not dismissed)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shotage:open-video-beta-modal'));
    }
  };

  video.onerror = () => {
    URL.revokeObjectURL(src);
    const msg = 'Failed to read video metadata. Please ensure the video file is valid.';
    if (onError) onError(msg);
    else alert(msg);
  };

  video.src = src;
};
