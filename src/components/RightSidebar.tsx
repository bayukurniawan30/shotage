import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { toPng, toJpeg, toBlob } from 'html-to-image';

interface RightSidebarProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ canvasRef }) => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const reset3DPerspective = state.reset3DPerspective;
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'png' | 'jpeg' | 'webp', isCopy = false) => {
    if (!canvasRef.current) return;
    setIsExporting(true);

    try {
      const options = {
        pixelRatio: state.exportScale,
        quality: 0.95,
      };

      if (isCopy) {
        // Copy to Clipboard (using PNG blob)
        const blob = await toBlob(canvasRef.current, options);
        if (blob) {
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
          alert('Copied high-res image to clipboard!');
        }
      } else {
        let dataUrl: string;
        if (format === 'webp') {
          // WebP canvas export via toBlob
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
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export canvas image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const gradientPresets = [
    { name: 'Indigo Cyan', c1: '#4f46e5', c2: '#06b6d4' },
    { name: 'Sunset Amber', c1: '#f43f5e', c2: '#fbbf24' },
    { name: 'Emerald Teal', c1: '#059669', c2: '#34d399' },
    { name: 'Purple Pink', c1: '#a855f7', c2: '#ec4899' },
    { name: 'Dark Slate', c1: '#1e293b', c2: '#0f172a' },
  ];

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto p-5 space-y-6 text-slate-200">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">
          Tilt, Background & Export
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">3D Perspective & Output Settings</p>
      </div>

      {/* 3D Tilt Controls */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          3D Perspective Tilt
        </h3>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
            <span className="font-mono text-slate-400">{state.rotateX}°</span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            value={state.rotateX}
            onChange={(e) => onChange({ rotateX: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
            <span className="font-mono text-slate-400">{state.rotateY}°</span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            value={state.rotateY}
            onChange={(e) => onChange({ rotateY: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Perspective Depth</span>
            <span className="font-mono text-slate-400">{state.perspective}px</span>
          </div>
          <input
            type="range"
            min="500"
            max="2000"
            step="50"
            value={state.perspective}
            onChange={(e) => onChange({ perspective: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>

        <button
          onClick={reset3DPerspective}
          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700 transition-all"
        >
          Reset 3D Perspective
        </button>
      </div>

      {/* Background Options */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Background Style
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(['gradient', 'solid', 'transparent', 'image'] as const).map((bg) => (
            <button
              key={bg}
              onClick={() => onChange({ backgroundType: bg })}
              className={`py-1.5 text-[11px] font-medium capitalize rounded-lg border transition-all ${
                state.backgroundType === bg
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>

        {state.backgroundType === 'gradient' && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-5 gap-1.5">
              {gradientPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    onChange({
                      gradient: { ...state.gradient, color1: preset.c1, color2: preset.c2 },
                    })
                  }
                  className="h-7 rounded-md border border-slate-700 shadow-sm transition-transform hover:scale-105"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`,
                  }}
                  title={preset.name}
                />
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Angle</span>
                <span className="font-mono text-slate-400">{state.gradient.angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={state.gradient.angle}
                onChange={(e) =>
                  onChange({ gradient: { ...state.gradient, angle: Number(e.target.value) } })
                }
                className="w-full accent-brand-500 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        )}

        {state.backgroundType === 'solid' && (
          <input
            type="color"
            value={state.backgroundColor}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="w-full h-9 rounded-lg cursor-pointer bg-slate-950 border border-slate-700 p-1"
          />
        )}
      </div>

      {/* Export Options */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Export Options
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">File Format</label>
          <div className="grid grid-cols-3 gap-2">
            {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => onChange({ exportFormat: fmt })}
                className={`py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
                  state.exportFormat === fmt
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Pixel Scale</label>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => onChange({ exportScale: scale })}
                className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                  state.exportScale === scale
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {scale}x
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <button
            disabled={isExporting}
            onClick={() => handleExport(state.exportFormat, false)}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isExporting
              ? 'Generating Image...'
              : `Download ${state.exportFormat.toUpperCase()} (${state.exportScale}x)`}
          </button>

          <button
            disabled={isExporting}
            onClick={() => handleExport('png', true)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            Copy PNG to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};
