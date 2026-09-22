import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStudioEditorStore } from '../../store/useStudioStore';
import { ChevronDown, Check, Expand03, XClose } from '@untitledui/icons';
import { StepperSlider } from '../StepperSlider';
import { FRAME_LABELS } from './utils';
import { clampCodeSource, CODE_LANGUAGES } from '../../utils/codeHighlight';
import type { CodeLanguage, CodeTheme } from '../../types/studio';

interface CodeOptionSelectProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

const CodeOptionSelect = <T extends string>({
  value,
  options,
  onChange,
}: CodeOptionSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-left text-xs font-bold text-pastel-blue transition-colors hover:border-neutral-700"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className={`ml-1.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-pastel-pink' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-1 shadow-2xl backdrop-blur-md">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 font-bold text-pastel-blue'
                    : 'text-slate-200 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-pastel-blue" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const FrameSection: React.FC<{ alwaysExpanded?: boolean }> = ({
  alwaysExpanded = false,
}) => {
  const state = useStudioEditorStore();
  const onChange = state.updateState;

  const [isFrameDropdownOpen, setIsFrameDropdownOpen] = useState(false);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
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

  useEffect(() => {
    if (!isCodeEditorOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCodeEditorOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCodeEditorOpen]);

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 md:bg-neutral-950 p-4 space-y-3 shadow-sm relative">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Frame Mockups</h3>
      </div>

      <div className={alwaysExpanded ? '' : 'relative'} ref={frameDropdownRef}>
        {!alwaysExpanded && (
          <button
            onClick={() => setIsFrameDropdownOpen(!isFrameDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-slate-200 transition-all cursor-pointer shadow-inner group"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-[#a2d2ff] bg-[#a2d2ff]/10 px-2 py-0.5 rounded-md border border-[#a2d2ff]/30 text-[10px] tracking-wide uppercase">
                {state.frameType === 'frameless'
                  ? 'Frameless'
                  : state.frameType === 'code-window'
                    ? 'Code'
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
        )}

        {(alwaysExpanded || isFrameDropdownOpen) && (
          <div
            className={
              alwaysExpanded
                ? 'space-y-3'
                : 'absolute top-full left-0 right-0 mt-2 z-50 max-h-[320px] space-y-3 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150'
            }
          >
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
                Source Code
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['macos', 'windows'] as const).map((windowStyle) => {
                  const isSelected =
                    state.frameType === 'code-window' && state.codeWindowStyle === windowStyle;
                  const isMac = windowStyle === 'macos';

                  return (
                    <button
                      key={windowStyle}
                      onClick={() => {
                        onChange({
                          frameType: 'code-window',
                          codeWindowStyle: windowStyle,
                          layoutCount: 1,
                          shadow: 'none',
                          shinePreset: 'none',
                          enableShine: false,
                        });
                        setIsFrameDropdownOpen(false);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div
                        className={`relative flex w-full aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border bg-[#0d1117] p-1.5 transition-all ${
                          isSelected
                            ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                            : 'border-neutral-800 group-hover:border-neutral-700 group-hover:scale-102'
                        }`}
                      >
                        <div className="h-full w-full overflow-hidden rounded border border-neutral-700 bg-neutral-950 text-left font-mono text-[5px] leading-relaxed text-neutral-400">
                          <div className="flex h-4 items-center border-b border-neutral-800 px-1">
                            {isMac ? (
                              <div className="flex gap-1">
                                <span className="h-1 w-1 rounded-full bg-[#ff5f57]" />
                                <span className="h-1 w-1 rounded-full bg-[#febc2e]" />
                                <span className="h-1 w-1 rounded-full bg-[#28c840]" />
                              </div>
                            ) : (
                              <div className="ml-auto flex items-center gap-px text-[5px] leading-none text-neutral-500">
                                <span className="inline-flex h-2 w-2 items-center justify-center">
                                  —
                                </span>
                                <span className="inline-flex h-2 w-2 items-center justify-center">
                                  □
                                </span>
                                <span className="inline-flex h-2 w-2 items-center justify-center">
                                  ×
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="px-1 py-1">
                            <span className="text-purple-300">const</span>{' '}
                            <span className="text-blue-300">shot</span> ={' '}
                            <span className="text-emerald-300">true</span>;
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#a2d2ff]" />
                        )}
                      </div>
                      <span
                        className={`w-full truncate text-center text-[10px] transition-colors ${
                          isSelected
                            ? 'font-bold text-[#a2d2ff]'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {isMac ? 'macOS' : 'Windows'}
                      </span>
                    </button>
                  );
                })}
              </div>
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

      {state.frameType === 'code-window' && (
        <div className="space-y-3 border-t border-neutral-800/80 pt-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Source Code
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">
                  {state.codeSource.length.toLocaleString()} / 30,000
                </span>
                <button
                  type="button"
                  onClick={() => setIsCodeEditorOpen(true)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-neutral-800 hover:text-pastel-blue"
                  title="Open larger code editor"
                  aria-label="Open larger code editor"
                >
                  <Expand03 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={state.codeSource}
              onChange={(event) => onChange({ codeSource: clampCodeSource(event.target.value) })}
              spellCheck={false}
              wrap="off"
              rows={10}
              placeholder="Paste your code here…"
              className="w-full resize-y overflow-auto rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-pastel-pink"
            />
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              Saved with the design. Remove secrets before sharing publicly.
            </p>
          </div>

          <div className="grid grid-cols-2 items-start gap-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Language
              </label>
              <CodeOptionSelect
                value={state.codeLanguage}
                options={CODE_LANGUAGES.map((language) => ({
                  value: language.id,
                  label: language.label,
                }))}
                onChange={(language) => {
                  const extension = CODE_LANGUAGES.find((item) => item.id === language)?.extension;
                  const currentName = state.codeFilename || 'untitled.ts';
                  const filename = extension
                    ? `${currentName.replace(/\.[^.]+$/, '')}.${extension}`
                    : currentName;
                  onChange({ codeLanguage: language, codeFilename: filename });
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Filename
              </label>
              <input
                value={state.codeFilename}
                onChange={(event) => onChange({ codeFilename: event.target.value.slice(0, 80) })}
                maxLength={80}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 font-mono text-xs normal-case tracking-normal text-slate-200 outline-none focus:border-pastel-pink"
              />
            </div>
          </div>

          <div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Theme
              </label>
              <CodeOptionSelect
                value={state.codeTheme}
                options={[
                  { value: 'dark' as CodeTheme, label: 'Dark' },
                  { value: 'light' as CodeTheme, label: 'Light' },
                ]}
                onChange={(theme) => onChange({ codeTheme: theme })}
              />
            </div>
          </div>

          {[
            {
              label: 'Window Width',
              value: state.codeWindowWidth,
              min: 360,
              max: 1400,
              step: 10,
              key: 'codeWindowWidth' as const,
              unit: 'px',
            },
            {
              label: 'Window Height',
              value: state.codeWindowHeight,
              min: 100,
              max: 1000,
              step: 10,
              key: 'codeWindowHeight' as const,
              unit: 'px',
            },
            {
              label: 'Code Font Size',
              value: state.codeFontSize,
              min: 8,
              max: 32,
              step: 1,
              key: 'codeFontSize' as const,
              unit: 'px',
            },
          ].map((control) => (
            <div key={control.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{control.label}</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {control.value}
                  {control.unit}
                </span>
              </div>
              <StepperSlider
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                onChange={(value) => onChange({ [control.key]: value })}
                accentColor="#a2d2ff"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'codeLineNumbers' as const, label: 'Line Numbers' },
              { key: 'codeWordWrap' as const, label: 'Word Wrap' },
            ].map((setting) => {
              const enabled = state[setting.key];
              return (
                <button
                  key={setting.key}
                  type="button"
                  onClick={() => onChange({ [setting.key]: !enabled })}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
                    enabled
                      ? 'border-[#a2d2ff] bg-[#a2d2ff]/15 text-[#a2d2ff]'
                      : 'border-neutral-800 bg-neutral-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {setting.label}
                </button>
              );
            })}
          </div>
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

          {/* Continuous Corner Radius Slider with - / + continuous steppers */}
          <StepperSlider
            min={0}
            max={32}
            step={1}
            value={state.borderRadius}
            onChange={(val) => onChange({ borderRadius: val })}
            accentColor="#a2d2ff"
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

      {isCodeEditorOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="presentation"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setIsCodeEditorOpen(false);
            }}
          >
            <div
              className="flex h-[min(760px,calc(100vh-2rem))] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-950 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="code-editor-title"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                <div>
                  <h3 id="code-editor-title" className="text-sm font-bold text-slate-100">
                    Source Code
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Changes are saved to this design as you type.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCodeEditorOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  title="Close code editor"
                  aria-label="Close code editor"
                >
                  <XClose className="h-4 w-4" />
                </button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
                <textarea
                  autoFocus
                  value={state.codeSource}
                  onChange={(event) =>
                    onChange({ codeSource: clampCodeSource(event.target.value) })
                  }
                  spellCheck={false}
                  wrap="off"
                  placeholder="Paste your code here…"
                  className="min-h-0 flex-1 resize-none overflow-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-sm leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-pastel-pink"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-500">
                    Remove secrets before sharing publicly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCodeEditorOpen(false)}
                    className="rounded-lg bg-pastel-blue px-3 py-1.5 text-xs font-bold text-neutral-950 transition-colors hover:bg-[#c6e4ff]"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
