import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { UploadCloud01 } from '@untitledui/icons';

interface LeftSidebarProps {
  onImageUpload: (file: File) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onImageUpload }) => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      {/* 1. Image & Scaling Box */}
      <div className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 space-y-4">
        <div className="border-b border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Image & Scaling
          </h3>
        </div>

        {/* Upload Box */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Image Upload
          </label>
          <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all text-center">
            <UploadCloud01 className="w-5 h-5 text-brand-400 mb-1" />
            <span className="text-xs font-medium text-slate-200">Choose file or drop here</span>
            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP, SVG</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Zoom / Scale */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Zoom</span>
            <span className="font-mono text-slate-400">{state.zoom}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={state.zoom}
            onChange={(e) => onChange({ zoom: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Canvas Outer Padding */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Padding</span>
            <span className="font-mono text-slate-400">{state.padding}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            value={state.padding}
            onChange={(e) => onChange({ padding: Number(e.target.value) })}
            className="w-full accent-brand-500 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* 2. Aspect Ratio Box */}
      <div className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 space-y-3">
        <div className="border-b border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            Aspect Ratio
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['auto', '16:9', '1:1', '9:16', '4:3', '1.91:1'] as const).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onChange({ aspectRatio: ratio })}
              className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                state.aspectRatio === ratio
                  ? 'bg-brand-500/20 border-brand-500 text-brand-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Frame & Mockup Box */}
      <div className="border border-slate-800 rounded-xl bg-slate-950/40 p-4 space-y-4">
        <div className="border-b border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">
            {['iphone', 'macbook', 'tablet'].includes(state.frameType)
              ? 'Frame Mockups'
              : 'Frame Mockups & Shadow'}
          </h3>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Frame Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'frameless', label: 'Frameless' },
              { id: 'safari-dark', label: 'Safari Dark' },
              { id: 'safari-light', label: 'Safari Light' },
              { id: 'chrome-dark', label: 'Chrome Dark' },
              { id: 'macbook', label: 'MacBook Pro' },
              { id: 'iphone', label: 'iPhone' },
              { id: 'tablet', label: 'Tablet' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ frameType: item.id as any })}
                className={`py-1.5 px-2.5 text-xs font-medium rounded-lg border text-left transition-all ${
                  state.frameType === item.id
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* URL String for Browsers */}
        {(state.frameType.startsWith('safari') || state.frameType === 'chrome-dark') && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Browser Address URL
            </label>
            <input
              type="text"
              value={state.urlText}
              onChange={(e) => onChange({ urlText: e.target.value })}
              placeholder="shotage.app/preview"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>
        )}

        {/* Corner radius for frameless */}
        {state.frameType === 'frameless' && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Corner Radius</span>
              <span className="font-mono text-slate-400">{state.borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={state.borderRadius}
              onChange={(e) => onChange({ borderRadius: Number(e.target.value) })}
              className="w-full accent-brand-500 bg-slate-800 rounded-lg"
            />
          </div>
        )}

        {/* Shadow Elevation (Only for frameless and browser frames) */}
        {!['iphone', 'macbook', 'tablet'].includes(state.frameType) && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Shadow Elevation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['none', 'soft', 'medium', 'hard', 'floating'] as const).map((sh) => (
                <button
                  key={sh}
                  onClick={() => onChange({ shadow: sh })}
                  className={`py-1.5 text-xs capitalize rounded-lg border transition-all ${
                    state.shadow === sh
                      ? 'bg-brand-500/20 border-brand-500 text-brand-300 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  {sh}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
