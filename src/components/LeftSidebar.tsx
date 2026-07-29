import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { UploadCloud01, ChevronDown, Check } from '@untitledui/icons';

interface LeftSidebarProps {
  onImageUpload: (file: File) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onImageUpload }) => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const [isAspectDropdownOpen, setIsAspectDropdownOpen] = useState(false);
  const [isFrameDropdownOpen, setIsFrameDropdownOpen] = useState(false);
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

  const getFrameCategory = (type: string) => {
    if (type === 'frameless') return 'Frameless';
    if (type.startsWith('safari') || type.startsWith('chrome')) return 'Browser';
    return 'Device';
  };

  const getFrameLabel = (type: string) => {
    switch (type) {
      case 'frameless':
        return 'Frameless';
      case 'safari-dark':
        return 'Safari Dark';
      case 'safari-light':
        return 'Safari Light';
      case 'chrome-dark':
        return 'Chrome Dark';
      case 'macbookair13':
        return 'MacBook Air 13"';
      case 'iphone':
        return 'iPhone 15';
      case 'iphone14pro':
        return 'iPhone 14 Pro';
      case 'samsung-s21':
        return 'Samsung S21';
      default:
        return type;
    }
  };

  const getAspectRatioCategory = (ratio: string) => {
    if (ratio.startsWith('ig-')) return 'Instagram';
    if (ratio.startsWith('yt-')) return 'YouTube';
    return 'General';
  };

  const getAspectRatioLabel = (ratio: string) => {
    switch (ratio) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      {/* 1. Image & Scaling Box */}
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
        <div className="border-b border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Image & Layout
          </h3>
        </div>

        {/* Layout & Media Count Selector */}
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

        {/* 2-Image Layout Presets */}
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

        {/* Upload Box */}
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

        {/* Second Image Upload (Slot 2) */}
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

      {/* 2. Aspect Ratio Box */}
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm relative">
        <div className="border-b border-neutral-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Aspect Ratio
          </h3>
        </div>

        {/* Dropdown Select Trigger */}
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

          {/* Dropdown Popover */}
          {isAspectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-2xl space-y-3 max-h-[320px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
              {/* Group A: General */}
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
                          onChange({ aspectRatio: ratio });
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

              {/* Group B: Instagram */}
              <div className="pt-2 border-t border-slate-800/60">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  <svg
                    className="w-3.5 h-3.5 fill-current text-[#ffafcc]"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
                  </svg>
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
                          onChange({ aspectRatio: item.id as any });
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

              {/* Group C: YouTube */}
              <div className="pt-2 border-t border-neutral-800/80">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  <svg
                    className="w-3.5 h-3.5 fill-current text-red-500"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
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
                          onChange({ aspectRatio: item.id as any });
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

      {/* 3. Frame Mockups Box */}
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm relative">
        <div className="border-b border-neutral-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Frame Mockups
          </h3>
        </div>

        {/* Dropdown Select Trigger */}
        <div className="relative" ref={frameDropdownRef}>
          <button
            onClick={() => setIsFrameDropdownOpen(!isFrameDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs text-slate-200 transition-all cursor-pointer shadow-inner group"
          >
            <div className="flex items-center gap-2 truncate">
              {state.frameType !== 'frameless' ? (
                <div className="w-6 h-6 rounded-md bg-neutral-950 border border-neutral-800 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                  <img
                    src={
                      state.frameType === 'iphone'
                        ? '/frame/frame-iphone-15.png'
                        : state.frameType === 'iphone14pro'
                          ? '/frame/frame-iphone-14-pro.png'
                          : state.frameType === 'macbookair13'
                            ? '/frame/frame-macbook-air-13.png'
                            : state.frameType === 'samsung-s21'
                              ? '/frame/frame-samsung-s21.png'
                              : `/frame/frame-${state.frameType}.png`
                    }
                    alt="Frame preview thumbnail"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
              <span className="font-semibold text-[#a2d2ff] bg-[#a2d2ff]/10 px-2 py-0.5 rounded-md border border-[#a2d2ff]/30 text-[10px] tracking-wide uppercase">
                {getFrameCategory(state.frameType)}
              </span>
              <span className="text-slate-300 font-medium truncate">
                {getFrameLabel(state.frameType)}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 shrink-0 ml-2 ${
                isFrameDropdownOpen ? 'rotate-180 text-pastel-pink' : ''
              }`}
            />
          </button>

          {/* Dropdown Popover */}
          {isFrameDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-2xl space-y-3 max-h-[320px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
              {/* Group A: Frameless */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  Frameless
                </label>
                <button
                  onClick={() => {
                    onChange({
                      frameType: 'frameless',
                      borderRadius: state.borderRadius || 16,
                    });
                    setIsFrameDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    state.frameType === 'frameless'
                      ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                  }`}
                >
                  <span>Frameless</span>
                  {state.frameType === 'frameless' && <Check className="w-3 h-3 text-[#a2d2ff]" />}
                </button>
              </div>

              {/* Group B: Browser */}
              <div className="pt-2 border-t border-neutral-800/80">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Browser
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'safari-dark', label: 'Safari Dark', file: 'safari-dark' },
                    { id: 'safari-light', label: 'Safari Light', file: 'safari-light' },
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
                          className={`w-full aspect-square rounded-xl border p-1 flex items-center justify-center transition-all bg-neutral-950 overflow-hidden relative ${
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

              {/* Group C: Device */}
              <div className="pt-2 border-t border-neutral-800/80">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Device
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
            </div>
          )}
        </div>

        {/* URL String for Browsers */}
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

        {/* Corner radius for frameless */}
        {state.frameType === 'frameless' && (
          <div className="pt-1">
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
              className="w-full bg-slate-800 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 3.5. Frameless Style Section (Only when Frameless is selected) */}
      {state.frameType === 'frameless' && (
        <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
          <div className="border-b border-neutral-800/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Style</h3>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
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
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <div
                    className={`w-full aspect-square rounded-xl border p-1.5 flex items-center justify-center transition-all bg-neutral-950 overflow-hidden relative ${
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
                    className={`text-[11px] text-center capitalize transition-colors ${
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
      )}

      {/* 4. Shadow Elevation Box (Only for frameless and browser frames) */}
      {!['iphone', 'iphone14pro', 'macbook', 'macbookair13', 'samsung-s21', 'tablet'].includes(
        state.frameType
      ) && (
        <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
          <div className="border-b border-neutral-800/80 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Shadow Elevation
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {(['none', 'soft', 'medium', 'hard', 'floating'] as const).map((sh) => {
              const isSelected = state.shadow === sh;
              return (
                <button
                  key={sh}
                  onClick={() => onChange({ shadow: sh })}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group"
                >
                  <div
                    className={`w-full aspect-square rounded-xl border p-1.5 flex items-center justify-center transition-all bg-neutral-950 overflow-hidden relative ${
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
                    className={`text-[11px] capitalize transition-colors ${
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
      )}
    </div>
  );
};
