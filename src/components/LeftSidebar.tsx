import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { UploadCloud01, ChevronDown, Check } from '@untitledui/icons';

interface LeftSidebarProps {
  onImageUpload: (file: File) => void;
  mobileSection?: 'image' | 'aspect' | 'frame' | 'style' | 'shadow';
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onImageUpload, mobileSection }) => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const [isAspectDropdownOpen, setIsAspectDropdownOpen] = useState(false);
  const [isFrameDropdownOpen, setIsFrameDropdownOpen] = useState(false);
  const [customWidthInput, setCustomWidthInput] = useState<string>(
    String(state.customWidth || 1280)
  );
  const [customHeightInput, setCustomHeightInput] = useState<string>(
    String(state.customHeight || 720)
  );
  const [customDimensionError, setCustomDimensionError] = useState<string | null>(null);
  const aspectDropdownRef = useRef<HTMLDivElement>(null);
  const frameDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aspectDropdownRef.current && !aspectDropdownRef.current.contains(event.target as Node)) {
        setIsAspectDropdownOpen(false);
      }
      if (frameDropdownRef.current && !frameDropdownRef.current.contains(event.target as Node)) {
        setIsFrameDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAspectRatioCategory = (aspectRatio: string) => {
    if (aspectRatio === 'custom') return 'Custom';
    if (['auto', '16:9', '1:1', '9:16', '4:3', '1.91:1'].includes(aspectRatio)) return 'General';
    if (aspectRatio.startsWith('ig-')) return 'Instagram';
    if (aspectRatio.startsWith('yt-')) return 'YouTube';
    return 'Custom';
  };

  const getAspectRatioLabel = (aspectRatio: string) => {
    switch (aspectRatio) {
      case 'custom':
        return `Custom (${state.customWidth}x${state.customHeight}px)`;
      case 'auto':
        return 'Auto Fit';
      case 'ig-post':
        return 'Instagram Post (1:1)';
      case 'ig-portrait':
        return 'Instagram Portrait (4:5)';
      case 'ig-story':
        return 'Instagram Story (9:16)';
      case 'yt-banner':
        return 'YouTube Banner (16:9)';
      case 'yt-thumbnail':
        return 'YouTube Thumbnail (16:9)';
      case 'yt-video':
        return 'YouTube Video (16:9)';
      case '16:9':
        return 'Widescreen (16:9)';
      case '1:1':
        return 'Square (1:1)';
      case '9:16':
        return 'Vertical (9:16)';
      case '4:3':
        return 'Standard (4:3)';
      case '1.91:1':
        return 'Landscape (1.91:1)';
      default:
        return 'Original Ratio';
    }
  };

  const getRecommendedZoomForAspect = (aspectRatio: string, customW?: number, customH?: number) => {
    let ratioNum = 16 / 9;
    if (aspectRatio === '1:1' || aspectRatio === 'ig-post') ratioNum = 1;
    else if (aspectRatio === '9:16' || aspectRatio === 'ig-story') ratioNum = 9 / 16;
    else if (aspectRatio === '4:3') ratioNum = 4 / 3;
    else if (aspectRatio === '1.91:1') ratioNum = 1.91;
    else if (aspectRatio === 'ig-portrait') ratioNum = 4 / 5;
    else if (aspectRatio === 'custom' && customW && customH) ratioNum = customW / customH;

    // Tall vertical ratios (like 9:16 or 4:5) need smaller zoom so placeholder fits within frame
    if (ratioNum < 0.7) return 50;
    if (ratioNum < 0.95) return 60;
    if (ratioNum <= 1.1) return 70;
    if (ratioNum > 1.6) return 80;
    return 80;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const renderImageSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-slate-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Image & Layout
        </h3>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Layout Count (1 or 2 Images)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((count) => {
            const isSelected = state.layoutCount === count;
            return (
              <button
                key={count}
                onClick={() => onChange({ layoutCount: count as 1 | 2 })}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                {count === 1 ? 'Single Image' : '2 Images'}
              </button>
            );
          })}
        </div>
      </div>

      {state.layoutCount === 2 && (
        <div className="pt-2 border-t border-neutral-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Layout Presets
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'side-by-side', label: 'Side by Side' },
              { id: 'overlap-right', label: 'Overlap Right' },
              { id: 'overlap-left', label: 'Overlap Left' },
              { id: 'stacked', label: 'Stacked' },
            ].map((preset) => {
              const isSelected = state.layoutPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ layoutPreset: preset.id as any })}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Primary Image Upload (Slot 1)
        </label>
        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all text-center">
          <UploadCloud01 className="w-5 h-5 text-pastel-pink mb-1" />
          <span className="text-xs font-medium text-slate-200">
            {state.imageSrc ? 'Replace Slot 1 Image' : 'Choose file or drop here'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP, SVG</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {state.layoutCount === 2 && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Secondary Image Upload (Slot 2)
          </label>
          <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all text-center">
            <UploadCloud01 className="w-5 h-5 text-[#a2d2ff] mb-1" />
            <span className="text-xs font-medium text-slate-200">
              {state.secondImageSrc ? 'Replace Slot 2 Image' : 'Choose Slot 2 image'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP, SVG</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (ev.target?.result) {
                      useStudioStore
                        .getState()
                        .setSecondImage(ev.target.result as string, file.name);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );

  const renderAspectSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm relative">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Aspect Ratio</h3>
      </div>

      <div className="relative" ref={aspectDropdownRef}>
        <button
          onClick={() => setIsAspectDropdownOpen(!isAspectDropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-slate-200 transition-all cursor-pointer shadow-inner group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-[#a2d2ff] bg-[#a2d2ff]/10 px-2 py-0.5 rounded-md border border-[#a2d2ff]/30 text-[10px] tracking-wide uppercase">
              {getAspectRatioCategory(state.aspectRatio)}
            </span>
            <span className="text-slate-300 font-medium truncate">
              {getAspectRatioLabel(state.aspectRatio)}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 shrink-0 ml-2 ${
              isAspectDropdownOpen ? 'rotate-180 text-pastel-pink' : ''
            }`}
          />
        </button>

        {isAspectDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-2xl space-y-3 max-h-[360px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
            {/* Custom Pixel Dimensions Input */}
            <div className="pb-2 border-b border-neutral-800/80 space-y-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Custom Dimensions (Px)
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 mb-0.5 px-0.5">Width</span>
                  <input
                    type="number"
                    min="160"
                    placeholder="1280"
                    value={customWidthInput}
                    onChange={(e) => {
                      setCustomWidthInput(e.target.value);
                      setCustomDimensionError(null);
                    }}
                    className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 focus:border-pastel-pink rounded-lg text-xs font-mono text-slate-200 outline-none"
                  />
                </div>
                <span className="text-slate-500 font-bold text-xs pt-3">×</span>
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 mb-0.5 px-0.5">Height</span>
                  <input
                    type="number"
                    min="160"
                    placeholder="720"
                    value={customHeightInput}
                    onChange={(e) => {
                      setCustomHeightInput(e.target.value);
                      setCustomDimensionError(null);
                    }}
                    className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 focus:border-pastel-pink rounded-lg text-xs font-mono text-slate-200 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const w = parseInt(customWidthInput, 10);
                    const h = parseInt(customHeightInput, 10);
                    if (isNaN(w) || isNaN(h) || w < 160 || h < 160) {
                      setCustomDimensionError('Min size 160 × 160 px');
                      return;
                    }
                    setCustomDimensionError(null);
                    const recZoom = getRecommendedZoomForAspect('custom', w, h);
                    onChange({
                      aspectRatio: 'custom',
                      customWidth: w,
                      customHeight: h,
                      zoom: recZoom,
                      slot2Zoom: recZoom,
                    });
                    setIsAspectDropdownOpen(false);
                  }}
                  className="mt-3.5 px-3 py-1 bg-pastel-pink hover:bg-pastel-pinkLight text-slate-950 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
              {customDimensionError && (
                <span className="block text-[10px] font-semibold text-rose-400 px-1 animate-in fade-in">
                  {customDimensionError}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                General
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['auto', '16:9', '1:1', '9:16', '4:3', '1.91:1'] as const).map((ratio) => {
                  const isSelected = state.aspectRatio === ratio;
                  return (
                    <button
                      key={ratio}
                      onClick={() => {
                        const recZoom = getRecommendedZoomForAspect(ratio);
                        onChange({
                          aspectRatio: ratio,
                          zoom: recZoom,
                          slot2Zoom: recZoom,
                        });
                        setIsAspectDropdownOpen(false);
                      }}
                      className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                      }`}
                    >
                      <span>{ratio}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#a2d2ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                Instagram
              </label>
              <div className="space-y-1">
                {[
                  { id: 'ig-post', label: 'Post (1:1)' },
                  { id: 'ig-portrait', label: 'Portrait (4:5)' },
                  { id: 'ig-story', label: 'Story (9:16)' },
                ].map((item) => {
                  const isSelected = state.aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const recZoom = getRecommendedZoomForAspect(item.id);
                        onChange({
                          aspectRatio: item.id as any,
                          zoom: recZoom,
                          slot2Zoom: recZoom,
                        });
                        setIsAspectDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#a2d2ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                YouTube
              </label>
              <div className="space-y-1">
                {[
                  { id: 'yt-banner', label: 'Banner (16:9)' },
                  { id: 'yt-thumbnail', label: 'Thumbnail (16:9)' },
                  { id: 'yt-video', label: 'Video (16:9)' },
                ].map((item) => {
                  const isSelected = state.aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const recZoom = getRecommendedZoomForAspect(item.id);
                        onChange({
                          aspectRatio: item.id as any,
                          zoom: recZoom,
                          slot2Zoom: recZoom,
                        });
                        setIsAspectDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                          : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#a2d2ff]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFrameSection = () => (
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
                : state.frameType.startsWith('polaroid')
                  ? 'Polaroid'
                  : state.frameType.startsWith('safari') || state.frameType === 'chrome-dark'
                    ? 'Browser'
                    : 'Device'}
            </span>
            <span className="text-slate-300 font-medium truncate capitalize">
              {state.frameType.replace('-', ' ')}
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
                  { id: 'iphone', label: 'iPhone 15', file: 'iphone-15' },
                  { id: 'iphone14pro', label: 'iPhone 14 Pro', file: 'iphone-14-pro' },
                  { id: 'samsung-s21', label: 'Samsung S21', file: 'samsung-s21' },
                  { id: 'macbookair13', label: 'MacBook Air 13"', file: 'macbook-air-13' },
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
          </div>
        )}
      </div>

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
            <span className="font-mono text-slate-400 text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
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
    </div>
  );

  const renderStyleSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Style</h3>
      </div>
      <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto p-1 no-scrollbar scroll-smooth">
        {[
          { id: 'default', label: 'Default' },
          { id: 'glass-light', label: 'Glass Light' },
          { id: 'glass-dark', label: 'Glass Dark' },
          { id: 'inset-light', label: 'Inset Light' },
          { id: 'inset-dark', label: 'Inset Dark' },
          { id: 'card', label: 'Card' },
        ].map((st) => {
          const isSelected = (state.framelessStyle || 'default') === st.id;
          return (
            <button
              key={st.id}
              onClick={() => onChange({ framelessStyle: st.id as any })}
              className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
            >
              <div
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-1 flex items-center justify-center transition-all bg-neutral-950 overflow-hidden relative ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] bg-neutral-800/80 shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/80 hover:scale-102'
                }`}
              >
                <img
                  src={`/style/style-${st.id}.png`}
                  alt={`${st.label} style preview`}
                  className="w-full h-full rounded-lg object-contain pointer-events-none"
                />
              </div>
              <span
                className={`text-[10px] md:text-[11px] text-center capitalize transition-colors truncate w-full ${
                  isSelected
                    ? 'text-[#a2d2ff] font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {st.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderShadowSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Shadow Elevation
        </h3>
      </div>
      <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto p-1 no-scrollbar scroll-smooth">
        {(['none', 'soft', 'medium', 'hard', 'floating'] as const).map((sh) => {
          const isSelected = state.shadow === sh;
          return (
            <button
              key={sh}
              onClick={() => onChange({ shadow: sh })}
              className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
            >
              <div
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-1 flex items-center justify-center transition-all bg-neutral-950 overflow-hidden relative ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] bg-neutral-800/80 shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/80 hover:scale-102'
                }`}
              >
                <img
                  src={`/shadow/shadow-${sh}.png`}
                  alt={`${sh} shadow preview`}
                  className="w-full h-full rounded-lg object-contain pointer-events-none"
                />
              </div>
              <span
                className={`text-[10px] md:text-[11px] text-center capitalize transition-colors truncate w-full ${
                  isSelected
                    ? 'text-[#a2d2ff] font-bold'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {sh}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (mobileSection) {
    if (mobileSection === 'image') return renderImageSection();
    if (mobileSection === 'aspect') return renderAspectSection();
    if (mobileSection === 'frame') return renderFrameSection();
    if (mobileSection === 'style') return renderStyleSection();
    if (mobileSection === 'shadow') return renderShadowSection();
    return null;
  }

  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      {renderImageSection()}
      {renderAspectSection()}
      {renderFrameSection()}
      {state.frameType === 'frameless' && renderStyleSection()}
      {!['iphone', 'iphone14pro', 'macbook', 'macbookair13', 'samsung-s21', 'tablet'].includes(
        state.frameType
      ) && renderShadowSection()}
    </div>
  );
};
