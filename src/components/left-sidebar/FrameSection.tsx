import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { ChevronDown, Check } from '@untitledui/icons';
import { FRAME_LABELS } from './utils';

export const FrameSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const [isFrameDropdownOpen, setIsFrameDropdownOpen] = useState(false);
  const frameDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (frameDropdownRef.current && !frameDropdownRef.current.contains(event.target as Node)) {
        setIsFrameDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm relative">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Frame Mockups</h3>
      </div>

      <div className="relative" ref={frameDropdownRef}>
        <button
          onClick={() => setIsFrameDropdownOpen(!isFrameDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-slate-200 transition-all cursor-pointer shadow-inner group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-[#a2d2ff] bg-[#a2d2ff]/10 px-2 py-0.5 rounded-md border border-[#a2d2ff]/30 text-[10px] tracking-wide uppercase">
              {state.frameType === 'frameless'
                ? 'Frameless'
                : state.frameType.startsWith('instagram')
                  ? 'Instagram'
                  : state.frameType.startsWith('polaroid')
                    ? 'Polaroid'
                    : state.frameType.startsWith('safari') || state.frameType === 'chrome-dark'
                      ? 'Browser'
                      : 'Device'}
            </span>
            <span className="text-slate-300 font-medium truncate">
              {FRAME_LABELS[state.frameType] || state.frameType.replace('-', ' ')}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 shrink-0 ml-2 ${
              isFrameDropdownOpen ? 'rotate-180 text-pastel-pink' : ''
            }`}
          />
        </button>

        {isFrameDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-2xl space-y-3 max-h-[320px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                Frameless
              </label>
              <button
                onClick={() => {
                  onChange({ frameType: 'frameless', borderRadius: 16 });
                  setIsFrameDropdownOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                  state.frameType === 'frameless'
                    ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                <span>No Frame (Raw Screenshot)</span>
                {state.frameType === 'frameless' && <Check className="w-3 h-3 text-[#a2d2ff]" />}
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Browser Windows
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'safari-light', label: 'Safari Light', file: 'safari-light' },
                  { id: 'safari-dark', label: 'Safari Dark', file: 'safari-dark' },
                  { id: 'chrome-dark', label: 'Chrome Dark', file: 'chrome-dark' },
                ].map((item) => {
                  const isSelected = state.frameType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChange({
                          frameType: item.id as any,
                          borderRadius: 0,
                        });
                        setIsFrameDropdownOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-full aspect-square rounded-xl border p-1.5 flex items-center justify-center transition-all bg-neutral-950 overflow-hidden relative ${
                          isSelected
                            ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] bg-neutral-800/80 shadow-md scale-102'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/80 hover:scale-102'
                        }`}
                      >
                        <img
                          src={`/frame/frame-${item.file}.png`}
                          alt={`${item.label} preview`}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                      <span
                        className={`text-[10px] transition-colors text-center truncate w-full ${
                          isSelected
                            ? 'text-[#a2d2ff] font-bold'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Real Devices
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'iphone', label: 'iPhone 15', file: 'iphone-15', ext: 'png' },
                  { id: 'iphone14pro', label: 'iPhone 14 Pro', file: 'iphone-14-pro', ext: 'png' },
                  { id: 'iphone16', label: 'iPhone 16', file: 'iphone-16', ext: 'png' },
                  {
                    id: 'iphone16-floating',
                    label: 'iPhone 16 Floating',
                    file: 'iphone-16-pro-max-floating',
                    ext: 'webp',
                  },
                  {
                    id: 'iphone17-dual-side',
                    label: 'iPhone 17 Pro Dual side',
                    file: 'iphone-17-dual-side',
                    ext: 'webp',
                  },
                  { id: 'samsung-s21', label: 'Samsung S21', file: 'samsung-s21', ext: 'png' },
                  {
                    id: 'macbookair13',
                    label: 'MacBook Air 13"',
                    file: 'macbook-air-13',
                    ext: 'png',
                  },
                ].map((item) => {
                  const isSelected = state.frameType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChange({
                          frameType: item.id as any,
                          borderRadius: 0,
                          shadow: 'none',
                          ...((item.id === 'iphone16' ||
                            item.id === 'iphone16-floating' ||
                            item.id === 'iphone17-dual-side') &&
                          (state.iphoneStatusBar || 'none') === 'none'
                            ? { iphoneStatusBar: 'light' }
                            : {}),
                        });
                        setIsFrameDropdownOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-full aspect-square rounded-xl border p-1.5 flex items-center justify-center transition-all bg-neutral-950 overflow-hidden relative ${
                          isSelected
                            ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] bg-neutral-800/80 shadow-md scale-102'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/80 hover:scale-102'
                        }`}
                      >
                        <img
                          src={`/frame/frame-${item.file}.${item.ext || 'png'}`}
                          alt={`${item.label} preview`}
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                      <span
                        className={`text-[10px] transition-colors text-center truncate w-full ${
                          isSelected
                            ? 'text-[#a2d2ff] font-bold'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Polaroid
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'polaroid', label: 'Polaroid', isDark: false },
                  { id: 'polaroid-dark', label: 'Polaroid Dark', isDark: true },
                ].map((item) => {
                  const isSelected = state.frameType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChange({
                          frameType: item.id as any,
                          borderRadius: 0,
                        });
                        setIsFrameDropdownOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-full aspect-square rounded-xl border p-2 flex flex-col items-center justify-between transition-all overflow-hidden relative ${
                          item.isDark
                            ? 'bg-neutral-950 border-neutral-800'
                            : 'bg-slate-100 border-slate-300'
                        } ${
                          isSelected
                            ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                            : 'hover:scale-102'
                        }`}
                      >
                        {/* Polaroid Inner Photo Box */}
                        <div
                          className={`w-full h-[65%] rounded-md border ${
                            item.isDark
                              ? 'bg-neutral-900 border-neutral-700'
                              : 'bg-slate-200 border-slate-300'
                          }`}
                        />
                        {/* Polaroid Bottom Border Accent */}
                        <div className="w-8 h-1 rounded-full bg-slate-400/40" />
                      </div>
                      <span
                        className={`text-[10px] transition-colors text-center truncate w-full ${
                          isSelected
                            ? 'text-[#a2d2ff] font-bold'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Instagram
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'instagram', label: 'Instagram Light', isDark: false },
                  { id: 'instagram-dark', label: 'Instagram Dark', isDark: true },
                ].map((item) => {
                  const isSelected = state.frameType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChange({
                          frameType: item.id as any,
                          borderRadius: 0,
                        });
                        setIsFrameDropdownOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`w-full aspect-square rounded-xl border p-2 flex flex-col justify-between transition-all overflow-hidden relative ${
                          item.isDark
                            ? 'bg-neutral-950 border-neutral-800'
                            : 'bg-slate-100 border-slate-300'
                        } ${
                          isSelected
                            ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                            : 'hover:scale-102'
                        }`}
                      >
                        {/* Header Skeleton */}
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              item.isDark ? 'bg-neutral-800' : 'bg-slate-300'
                            }`}
                          />
                          <div
                            className={`w-8 h-1 rounded-full ${
                              item.isDark ? 'bg-neutral-800' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        {/* Image Box */}
                        <div
                          className={`w-full h-[50%] rounded border ${
                            item.isDark
                              ? 'bg-neutral-900 border-neutral-800'
                              : 'bg-slate-200 border-slate-300'
                          }`}
                        />
                        {/* Bottom Actions Skeleton */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isDark ? 'bg-neutral-700' : 'bg-slate-400'
                              }`}
                            />
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isDark ? 'bg-neutral-700' : 'bg-slate-400'
                              }`}
                            />
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isDark ? 'bg-neutral-700' : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isDark ? 'bg-neutral-700' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-[10px] transition-colors text-center truncate w-full ${
                          isSelected
                            ? 'text-[#a2d2ff] font-bold'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* option to show system status bar for Samsung S21 */}
      {state.frameType === 'samsung-s21' && (
        <div className="pt-2 space-y-2 border-t border-neutral-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            System Status & Navigation Bar
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            {[
              { id: 'none', label: 'Hidden' },
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ samsungStatusBar: item.id as any })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
                  (state.samsungStatusBar || 'none') === item.id
                    ? 'bg-[#a2d2ff]/20 border border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* option to show system status bar for iPhone */}
      {(state.frameType === 'iphone' ||
        state.frameType === 'iphone14pro' ||
        state.frameType === 'iphone16' ||
        state.frameType === 'iphone16-floating' ||
        state.frameType === 'iphone17-dual-side') && (
        <div className="pt-2 space-y-2 border-t border-neutral-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            System Status Bar
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            {[
              { id: 'none', label: 'Hidden' },
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ iphoneStatusBar: item.id as any })}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
                  (state.iphoneStatusBar || 'none') === item.id
                    ? 'bg-[#a2d2ff]/20 border border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(state.frameType.startsWith('safari') || state.frameType === 'chrome-dark') && (
        <div className="pt-1 space-y-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {state.layoutCount === 2 ? 'Browser Address URL (Slot 1)' : 'Browser Address URL'}
            </label>
            <input
              type="text"
              value={state.urlText}
              onChange={(e) => onChange({ urlText: e.target.value })}
              placeholder="shotage.app/preview"
              className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pastel-pink"
            />
          </div>

          {state.layoutCount === 2 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Browser Address URL (Slot 2)
              </label>
              <input
                type="text"
                value={state.secondUrlText}
                onChange={(e) => onChange({ secondUrlText: e.target.value })}
                placeholder="shotage.app/demo"
                className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pastel-pink"
              />
            </div>
          )}
        </div>
      )}

      {state.frameType === 'frameless' && (
        <div className="pt-1 space-y-2.5">
          <div className="flex justify-between text-xs items-center">
            <span className="font-medium text-slate-300">Corner Radius</span>
            <span className="font-mono text-slate-400 text-[11px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
              {state.borderRadius}px
            </span>
          </div>

          {/* 3 Box Illustration Presets focusing on Top-Right Corner (0px, 16px, 32px) */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 0, trRadius: 'rounded-tr-none' },
              { value: 16, trRadius: 'rounded-tr-md' },
              { value: 32, trRadius: 'rounded-tr-xl' },
            ].map((preset) => {
              const isSelected = state.borderRadius === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onChange({ borderRadius: preset.value })}
                  className={`h-11 rounded-xl border transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#a2d2ff]/15 border-[#a2d2ff] ring-1 ring-[#a2d2ff] shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60'
                  }`}
                  title={`${preset.value}px Corner Radius`}
                >
                  {/* Focus Box: Bottom and Left borders straight, Top-Right corner demonstrates radius */}
                  <div
                    className={`w-6 h-6 border-t-2 border-r-2 border-slate-700 transition-all relative ${preset.trRadius} ${
                      isSelected
                        ? 'border-t-[#a2d2ff] border-r-[#a2d2ff] bg-[#a2d2ff]/20'
                        : 'border-t-slate-300 border-r-slate-300 bg-slate-800/40'
                    }`}
                  >
                    {/* Inner accent dot emphasizing top-right corner curve */}
                    <div
                      className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full -translate-x-0.5 translate-y-0.5 ${
                        isSelected ? 'bg-[#a2d2ff]' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continuous Corner Radius Slider */}
          <input
            type="range"
            min="0"
            max="32"
            value={state.borderRadius}
            onChange={(e) => onChange({ borderRadius: Number(e.target.value) })}
            className="w-full bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      )}

      {/* Hide Mockup toggle */}
      <button
        type="button"
        onClick={() => onChange({ hideMockup: !state.hideMockup })}
        className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
          state.hideMockup
            ? 'bg-[#a2d2ff]/15 border-[#a2d2ff] ring-1 ring-[#a2d2ff]/50 shadow-sm'
            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              state.hideMockup ? 'text-[#a2d2ff]' : 'text-slate-300'
            }`}
          >
            Hide Mockup
          </span>
          <span
            className={`w-8 h-4 rounded-full relative transition-colors ${
              state.hideMockup ? 'bg-[#a2d2ff]' : 'bg-neutral-800'
            }`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                state.hideMockup ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-slate-400">
          Hides the mockup on the canvas so you can focus on editing text, icons, and elements. Both
          images stay hidden in 2-image layouts.
        </p>
      </button>
    </div>
  );
};
