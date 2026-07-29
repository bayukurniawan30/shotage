import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import { Download01, XClose, LinkExternal01 } from '@untitledui/icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, canvasRef }) => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async (format: 'png' | 'jpeg' | 'webp', isCopy = false) => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      const options = {
        pixelRatio: state.exportScale,
        quality: 0.95,
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
              <h3 className="text-sm font-bold text-slate-100">Export High-Res Graphics</h3>
              <p className="text-xs text-slate-400">Select file format and scale multiplier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XClose className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection */}
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

        {/* Pixel Scale Selection */}
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

        {/* Action Buttons */}
        <div className="pt-3 space-y-2.5">
          <button
            disabled={isExporting}
            onClick={() => handleExport(state.exportFormat, false)}
            className="w-full py-3 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] cursor-pointer"
            style={{
              backgroundImage: 'linear-gradient(135deg, #cdb4db, #ffafcc, #a2d2ff)',
            }}
          >
            {isExporting
              ? 'Generating Image...'
              : `Download ${state.exportFormat.toUpperCase()} (${state.exportScale}x)`}
          </button>

          <button
            disabled={isExporting}
            onClick={() => handleExport('png', true)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            Copy PNG to Clipboard
          </button>
        </div>

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
