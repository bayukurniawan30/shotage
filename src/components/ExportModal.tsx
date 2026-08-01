import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { toPng, toJpeg, toBlob, toCanvas } from 'html-to-image';
import { Download01, XClose, LinkExternal01, Film01, Loading01, Check } from '@untitledui/icons';
import * as WebMMuxer from 'webm-muxer';
import * as Mp4Muxer from 'mp4-muxer';

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
  const [activeTab, setActiveTab] = useState<'image' | 'video'>(
    state.isAnimationMode ? 'video' : 'image'
  );
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  const handleExport = async (format: 'png' | 'jpeg' | 'webp', isCopy = false) => {
    if (!canvasRef.current) return;
    state.selectTextLayer(null);
    setIsExporting(true);
    setExportingType('image');

    try {
      const options = {
        pixelRatio: state.exportScale,
        quality: 0.95,
        cacheBust: true,
        skipFonts: true,
      };

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
      }
      onClose();
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
    setIsExporting(true);
    setExportingType('video');
    setExportProgress(0);

    try {
      state.selectTextLayer(null);
      const durationSec = state.durationSec || 10;
      const fps = 30; // 30 FPS for crisp frame delivery
      const totalFrames = Math.floor(durationSec * fps);

      const rect = canvasRef.current.getBoundingClientRect();
      const exportCanvas = document.createElement('canvas');
      const scale = Math.max(1, state.exportScale || 1.5);

      // Ensure even pixel dimensions required by video codecs
      exportCanvas.width = Math.floor((rect.width * scale) / 2) * 2;
      exportCanvas.height = Math.floor((rect.height * scale) / 2) * 2;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) throw new Error('Could not create canvas 2d context');

      // Check WebCodecs VideoEncoder support for requested videoFormat
      let wantMp4 = videoFormat === 'mp4';
      let supportedCodec = '';

      if (wantMp4 && 'VideoEncoder' in window) {
        for (const codecStr of ['avc1.42001E', 'avc1.4d401f', 'avc1.42E01E', 'avc1.640028']) {
          try {
            const support = await VideoEncoder.isConfigSupported({
              codec: codecStr,
              width: exportCanvas.width,
              height: exportCanvas.height,
              bitrate: 12_000_000,
            });
            if (support.supported) {
              supportedCodec = codecStr;
              break;
            }
          } catch (e) {
            // try next profile
          }
        }
      }

      let muxer: any;
      let encoderCodec = 'vp09.00.10.08';
      let extension = 'webm';
      let mimeType = 'video/webm';

      if (wantMp4) {
        extension = 'mp4';
        mimeType = 'video/mp4';
        encoderCodec = supportedCodec || 'avc1.42001E';
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
            codec: 'V_VP9',
            width: exportCanvas.width,
            height: exportCanvas.height,
          },
        });
      }

      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('VideoEncoder error:', e),
      });

      videoEncoder.configure({
        codec: encoderCodec,
        width: exportCanvas.width,
        height: exportCanvas.height,
        bitrate: 12_000_000,
      });

      // Pause live player during frame rendering
      onChange({ isPlaying: false, currentTimeSec: 0 });

      // Ensure all loaded web fonts are ready in browser cache before recording
      if ('fonts' in document) {
        await document.fonts.ready;
      }

      // Frame-by-Frame High Speed Pipeline using direct canvas capture
      for (let frame = 0; frame <= totalFrames; frame++) {
        const targetTimeSec = (frame / totalFrames) * durationSec;
        onChange({ currentTimeSec: targetTimeSec });

        try {
          const renderedCanvas = await toCanvas(canvasRef.current, {
            pixelRatio: scale,
            cacheBust: false,
            skipFonts: true,
          });

          // Draw directly to even-dimension exportCanvas
          ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
          ctx.drawImage(renderedCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

          // Compute exact timestamp in microseconds for video output
          const timestampMicros = Math.round((frame / fps) * 1_000_000);
          const videoFrame = new VideoFrame(exportCanvas, { timestamp: timestampMicros });
          videoEncoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
          videoFrame.close();
        } catch (e) {
          console.warn('Frame render skipped:', e);
        }

        setExportProgress(Math.round((frame / totalFrames) * 100));
      }

      await videoEncoder.flush();
      muxer.finalize();

      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `shotage-animation-${Date.now()}.${extension}`;
      link.href = url;
      link.click();

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
      alert('Failed to encode video animation. Please try again.');
      setIsExporting(false);
      setExportingType(null);
      setExportProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
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
                {activeTab === 'video' ? 'Export Video Animation' : 'Export High-Res Graphics'}
              </h3>
              <p className="text-xs text-slate-400">
                {activeTab === 'video'
                  ? 'Record 3D motion animation as video'
                  : 'Select file format and scale multiplier'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XClose className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs Header: Image vs Video */}
        {state.isAnimationMode && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Image Export
            </button>
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
          </div>
        )}

        {/* Tab 1: Image Export */}
        {(!state.isAnimationMode || activeTab === 'image') && (
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

            <div className="pt-2 space-y-2.5">
              <button
                disabled={isExporting}
                onClick={() => handleExport(state.exportFormat, false)}
                className={`w-full py-3 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isExporting ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.99] cursor-pointer'
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

              <button
                disabled={isExporting}
                onClick={() => handleExport('png', true)}
                className={`w-full py-2.5 bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 ${
                  isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700 cursor-pointer'
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
                    isExporting && exportingType === 'video'
                      ? 'rotateX(-90deg)'
                      : 'rotateX(0deg)',
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

                {/* 2. BOTTOM/PROGRESS FACE: 3D Side-Down Progress Track (Rotated 90deg down - NO TEXT) */}
                <div
                  className="absolute inset-0 w-full h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-between p-1.5"
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

                  {/* Percentage Indicator Badge */}
                  <span className="font-mono text-xs font-bold text-pastel-pink px-2.5 shrink-0">
                    {exportProgress}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sponsorer Box */}
        <div className="pt-3 border-t border-slate-800/80">
          <a
            href="https://morphic-cms.com/"
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
                src="https://morphic-cms.com/favicon.png"
                alt="Morphic CMS Logo"
                className="w-6 h-6 rounded-md shrink-0 object-contain"
              />
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-pastel-pink transition-colors leading-tight">
                  Morphic CMS
                </h4>
                <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                  Modern, Edge-Ready Headless CMS.
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
