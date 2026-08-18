import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStudioStore } from '../store/useStudioStore';
import { UploadCloud01, ChevronDown, Check, XClose, Share01 } from '@untitledui/icons';
import { SocialIcon } from './SocialIcons';
import { LINEAR_SWATCH_PRESETS } from '../utils/linearSwatchPresets';
import { DocumentsIllustration } from './shared-assets/illustrations';
import { TEMPLATE_PRESETS } from '../utils/templatePresets';

const FRAME_LABELS: Record<string, string> = {
  frameless: 'No Frame',
  'safari-light': 'Safari Light',
  'safari-dark': 'Safari Dark',
  'chrome-dark': 'Chrome Dark',
  iphone: 'iPhone 15',
  iphone14pro: 'iPhone 14 Pro',
  iphone16: 'iPhone 16',
  'samsung-s21': 'Samsung S21',
  macbookair13: 'MacBook Air 13"',
  macbook: 'MacBook Pro',
  tablet: 'Tablet',
  polaroid: 'Polaroid',
  'polaroid-dark': 'Polaroid Dark',
  instagram: 'Instagram Light',
  'instagram-dark': 'Instagram Dark',
};

interface LeftSidebarProps {
  onImageUpload: (file: File) => void;
  mobileSection?: 'image' | 'aspect' | 'frame' | 'style' | 'shadow';
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onImageUpload, mobileSection }) => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
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
    if (['auto', '16:9', '1:1', '9:16', '4:3', '3:2', '3:4', '5:4', '4:5'].includes(aspectRatio))
      return 'General';
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
        return 'Landscape (16:9)';
      case '1:1':
        return 'Square (1:1)';
      case '9:16':
        return 'Vertical (9:16)';
      case '4:3':
        return 'Standard (4:3)';
      case '3:2':
        return 'Classic (3:2)';
      case '3:4':
        return 'Portrait (3:4)';
      case '5:4':
        return 'Frame (5:4)';
      case '4:5':
        return 'Social (4:5)';
      default:
        return 'Original Ratio';
    }
  };

  const getRecommendedZoomForAspect = (aspectRatio: string, customW?: number, customH?: number) => {
    let ratioNum = 16 / 9;
    if (aspectRatio === '1:1' || aspectRatio === 'ig-post') ratioNum = 1;
    else if (aspectRatio === '9:16' || aspectRatio === 'ig-story') ratioNum = 9 / 16;
    else if (aspectRatio === '4:3') ratioNum = 4 / 3;
    else if (aspectRatio === '3:2') ratioNum = 3 / 2;
    else if (aspectRatio === '3:4') ratioNum = 3 / 4;
    else if (aspectRatio === '5:4') ratioNum = 5 / 4;
    else if (aspectRatio === '4:5' || aspectRatio === 'ig-portrait') ratioNum = 4 / 5;
    else if (aspectRatio === 'custom' && customW && customH) ratioNum = customW / customH;

    // Tall vertical ratios (like 9:16 or 4:5) need smaller zoom so placeholder fits within frame
    if (ratioNum < 0.6) return 60;
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
      {/* Big Template Button */}
      <div>
        <button
          type="button"
          onClick={() => setIsTemplateModalOpen(true)}
          className="w-full group relative flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-pastel-pink/15 via-purple-500/10 to-blue-500/15 border border-pastel-pink/30 hover:border-pastel-pink/60 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
        >
          <div className="flex items-center">
            <DocumentsIllustration size="sm" className="scale-[0.6]" />
            <div className="text-left">
              <div className="text-sm font-bold text-slate-100 group-hover:text-pastel-pink transition-colors">
                Browse Templates
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Presets for Product, Social Media, Desktop & Mobile
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Template Menu Modal */}
      {isTemplateModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
              {/* Header */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <DocumentsIllustration size="sm" className="scale-75 sm:scale-100 origin-left" />
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider">
                      Template Showcase
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Pick a pre-designed layout for your showcase
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition-all cursor-pointer"
                >
                  <XClose className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Categories Content */}
              <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Product Category */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-xs font-bold text-pastel-pink uppercase tracking-wider">
                      Product
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {TEMPLATE_PRESETS.filter((t) => t.category === 'product').length} Presets
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto p-2 sm:p-3 scrollbar-thin scrollbar-thumb-neutral-800">
                    {TEMPLATE_PRESETS.filter((t) => t.category === 'product').map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          onChange(tmpl.state);
                          setIsTemplateModalOpen(false);
                        }}
                        className="group shrink-0 w-44 sm:w-52 bg-neutral-950 border border-neutral-800 hover:border-pastel-pink/50 rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        {/* Box Placeholder for Image */}
                        <div className="w-full h-24 sm:h-28 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mb-2 sm:mb-2.5 group-hover:border-pastel-pink/30 transition-all overflow-hidden">
                          {tmpl.thumbnail ? (
                            <img
                              src={tmpl.thumbnail}
                              alt={tmpl.title}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-pastel-pink transition-colors">
                          {tmpl.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {tmpl.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Media Category */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-xs font-bold text-pastel-pinkLight uppercase tracking-wider">
                      Social Media
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {TEMPLATE_PRESETS.filter((t) => t.category === 'social').length} Presets
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto p-2 sm:p-3 scrollbar-thin scrollbar-thumb-neutral-800">
                    {TEMPLATE_PRESETS.filter((t) => t.category === 'social').map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          onChange(tmpl.state);
                          setIsTemplateModalOpen(false);
                        }}
                        className="group shrink-0 w-44 sm:w-52 bg-neutral-950 border border-neutral-800 hover:border-pastel-pinkLight/50 rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        {/* Box Placeholder for Image */}
                        <div className="w-full h-24 sm:h-28 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mb-2 sm:mb-2.5 group-hover:border-pastel-pinkLight/30 transition-all overflow-hidden">
                          {tmpl.thumbnail ? (
                            <img
                              src={tmpl.thumbnail}
                              alt={tmpl.title}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-pastel-pinkLight transition-colors">
                          {tmpl.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {tmpl.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Category */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-xs font-bold text-[#a2d2ff] uppercase tracking-wider">
                      Desktop
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {TEMPLATE_PRESETS.filter((t) => t.category === 'desktop').length} Presets
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto p-2 sm:p-3 scrollbar-thin scrollbar-thumb-neutral-800">
                    {TEMPLATE_PRESETS.filter((t) => t.category === 'desktop').map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          onChange(tmpl.state);
                          setIsTemplateModalOpen(false);
                        }}
                        className="group shrink-0 w-44 sm:w-52 bg-neutral-950 border border-neutral-800 hover:border-[#a2d2ff]/50 rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        {/* Box Placeholder for Image */}
                        <div className="w-full h-24 sm:h-28 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mb-2 sm:mb-2.5 group-hover:border-[#a2d2ff]/30 transition-all overflow-hidden">
                          {tmpl.thumbnail ? (
                            <img
                              src={tmpl.thumbnail}
                              alt={tmpl.title}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-[#a2d2ff] transition-colors">
                          {tmpl.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {tmpl.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile Category */}
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-xs font-bold text-pastel-purple uppercase tracking-wider">
                      Mobile
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {TEMPLATE_PRESETS.filter((t) => t.category === 'mobile').length} Presets
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto p-2 sm:p-3 scrollbar-thin scrollbar-thumb-neutral-800">
                    {TEMPLATE_PRESETS.filter((t) => t.category === 'mobile').map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          onChange(tmpl.state);
                          setIsTemplateModalOpen(false);
                        }}
                        className="group shrink-0 w-44 sm:w-52 bg-neutral-950 border border-neutral-800 hover:border-pastel-purple/50 rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        {/* Box Placeholder for Image */}
                        <div className="w-full h-24 sm:h-28 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center mb-2 sm:mb-2.5 group-hover:border-pastel-purple/30 transition-all overflow-hidden">
                          {tmpl.thumbnail ? (
                            <img
                              src={tmpl.thumbnail}
                              alt={tmpl.title}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-pastel-purple transition-colors">
                          {tmpl.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {tmpl.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Shared Design Info (when loaded via ?s=...) */}
      {(state.sharedDesignName || state.sharedDesignPublisher) && (
        <div className="p-2.5 bg-neutral-900/50 border border-neutral-800/90 rounded-xl space-y-1 shadow-inner">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Shared Design</span>
          </div>
          {state.sharedDesignName && (
            <h4
              className="text-xs font-semibold text-slate-200 leading-tight truncate"
              title={state.sharedDesignName}
            >
              {state.sharedDesignName}
            </h4>
          )}
          {state.sharedDesignPublisher && (
            <p
              className="text-[11px] text-slate-400 leading-tight truncate flex items-center gap-1"
              title={state.sharedDesignPublisher}
            >
              <span className="text-slate-500 font-normal">By</span>
              <span className="font-medium text-slate-300">{state.sharedDesignPublisher}</span>
            </p>
          )}
        </div>
      )}

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
                onClick={() => {
                  const isPortraitRatio = [
                    '9:16',
                    '3:4',
                    '4:5',
                    'ig-story',
                    'ig-portrait',
                  ].includes(state.aspectRatio);
                  const newPreset = count === 2 && isPortraitRatio ? 'stacked' : state.layoutPreset;
                  onChange({ layoutCount: count as 1 | 2, layoutPreset: newPreset });
                }}
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
        {state.imageSrc && (
          <div className="mb-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={state.imageSrc}
                alt="Slot 1 Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {state.imageName || 'Slot 1 Image'}
              </p>
              <p className="text-[10px] text-pastel-pink font-medium">Uploaded & Active</p>
            </div>
          </div>
        )}
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
          {state.secondImageSrc && (
            <div className="mb-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={state.secondImageSrc}
                  alt="Slot 2 Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {state.secondImageName || 'Slot 2 Image'}
                </p>
                <p className="text-[10px] text-[#a2d2ff] font-medium">Uploaded & Active</p>
              </div>
            </div>
          )}
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
                      const src = ev.target.result as string;
                      const img = new Image();
                      img.onload = () => {
                        useStudioStore
                          .getState()
                          .setSecondImage(src, file.name, img.naturalWidth, img.naturalHeight);
                      };
                      img.onerror = () => useStudioStore.getState().setSecondImage(src, file.name);
                      img.src = src;
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
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                General
              </label>
              <div className="grid grid-cols-3 gap-3 items-end">
                {[
                  { id: 'auto', label: 'Auto', ratio: 'Auto', aspectClass: 'aspect-square' },
                  { id: '1:1', label: 'Square', ratio: '1:1', aspectClass: 'aspect-square' },
                  { id: '4:3', label: 'Standard', ratio: '4:3', aspectClass: 'aspect-[4/3]' },
                  { id: '3:2', label: 'Classic', ratio: '3:2', aspectClass: 'aspect-[3/2]' },
                  { id: '5:4', label: 'Frame', ratio: '5:4', aspectClass: 'aspect-[5/4]' },
                  { id: '16:9', label: 'Landscape', ratio: '16:9', aspectClass: 'aspect-[16/9]' },
                  { id: '9:16', label: 'Vertical', ratio: '9:16', aspectClass: 'aspect-[9/16]' },
                  { id: '3:4', label: 'Portrait', ratio: '3:4', aspectClass: 'aspect-[3/4]' },
                  { id: '4:5', label: 'Social', ratio: '4:5', aspectClass: 'aspect-[4/5]' },
                ].map((item) => {
                  const isSelected = state.aspectRatio === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center justify-end gap-1.5 h-full"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const recZoom = getRecommendedZoomForAspect(item.id);
                          const isPortraitRatio = [
                            '9:16',
                            '3:4',
                            '4:5',
                            'ig-story',
                            'ig-portrait',
                          ].includes(item.id);
                          const newPreset =
                            state.layoutCount === 2 && isPortraitRatio
                              ? 'stacked'
                              : state.layoutPreset;
                          onChange({
                            aspectRatio: item.id as any,
                            zoom: recZoom,
                            slot2Zoom: recZoom,
                            layoutPreset: newPreset,
                          });
                          setIsAspectDropdownOpen(false);
                        }}
                        className={`w-full ${item.aspectClass} p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                            : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-semibold font-mono tracking-tight">
                          {item.ratio}
                        </span>
                      </button>
                      <span className="text-[11px] font-medium text-slate-400 text-center">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                Instagram
              </label>
              <div className="grid grid-cols-3 gap-3 items-end">
                {[
                  { id: 'ig-post', label: 'Post', ratio: '1:1', aspectClass: 'aspect-square' },
                  {
                    id: 'ig-portrait',
                    label: 'Portrait',
                    ratio: '4:5',
                    aspectClass: 'aspect-[4/5]',
                  },
                  { id: 'ig-story', label: 'Story', ratio: '9:16', aspectClass: 'aspect-[9/16]' },
                ].map((item) => {
                  const isSelected = state.aspectRatio === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center justify-end gap-1.5 h-full"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const recZoom = getRecommendedZoomForAspect(item.id);
                          const isPortraitRatio = [
                            '9:16',
                            '3:4',
                            '4:5',
                            'ig-story',
                            'ig-portrait',
                          ].includes(item.id);
                          const newPreset =
                            state.layoutCount === 2 && isPortraitRatio
                              ? 'stacked'
                              : state.layoutPreset;
                          onChange({
                            aspectRatio: item.id as any,
                            zoom: recZoom,
                            slot2Zoom: recZoom,
                            layoutPreset: newPreset,
                          });
                          setIsAspectDropdownOpen(false);
                        }}
                        className={`w-full ${item.aspectClass} p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                            : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                        }`}
                      >
                        <SocialIcon
                          platform="instagram"
                          size={18}
                          color={isSelected ? '#a2d2ff' : 'currentColor'}
                        />
                        <span className="text-[10px] font-semibold tracking-tight">
                          {item.ratio}
                        </span>
                      </button>
                      <span className="text-[11px] font-medium text-slate-400">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                YouTube
              </label>
              <div className="grid grid-cols-3 gap-3 items-end">
                {[
                  { id: 'yt-banner', label: 'Banner', ratio: '16:9' },
                  { id: 'yt-thumbnail', label: 'Thumbnail', ratio: '16:9' },
                  { id: 'yt-video', label: 'Video', ratio: '16:9' },
                ].map((item) => {
                  const isSelected = state.aspectRatio === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-center justify-end gap-1.5 h-full"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const recZoom = getRecommendedZoomForAspect(item.id);
                          onChange({
                            aspectRatio: item.id as any,
                            zoom: recZoom,
                            slot2Zoom: recZoom,
                          });
                          setIsAspectDropdownOpen(false);
                        }}
                        className={`w-full aspect-[16/9] px-2 py-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                            : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/80 hover:text-white'
                        }`}
                      >
                        <SocialIcon
                          platform="youtube"
                          size={18}
                          color={isSelected ? '#a2d2ff' : 'currentColor'}
                        />
                        <span className="text-[10px] font-semibold tracking-tight">
                          {item.ratio}
                        </span>
                      </button>
                      <span className="text-[11px] font-medium text-slate-400 text-center">
                        {item.label}
                      </span>
                    </div>
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
                  { id: 'iphone', label: 'iPhone 15', file: 'iphone-15' },
                  { id: 'iphone14pro', label: 'iPhone 14 Pro', file: 'iphone-14-pro' },
                  { id: 'iphone16', label: 'iPhone 16', file: 'iphone-16' },
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
                          shadow: 'none',
                          ...(item.id === 'iphone16' && (state.iphoneStatusBar || 'none') === 'none'
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
        state.frameType === 'iphone16') && (
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

  const getMiniCanvasBgStyle = (): React.CSSProperties => {
    const bgType = state.backgroundType || 'gradient';

    if (bgType === 'solid') {
      return { backgroundColor: state.backgroundColor || '#0f172a' };
    }
    if (bgType === 'gradient') {
      const angle = state.gradient?.angle ?? 135;
      const c1 = state.gradient?.color1 || '#ffafcc';
      const c2 = state.gradient?.color2 || '#a2d2ff';
      return { backgroundImage: `linear-gradient(${angle}deg, ${c1}, ${c2})` };
    }
    if (bgType === 'linearSwatches') {
      const preset =
        LINEAR_SWATCH_PRESETS.find((p) => p.id === state.linearSwatchesPreset) ||
        LINEAR_SWATCH_PRESETS[0];
      return { background: preset.css };
    }

    // Default to pastel pink for all non-solid/gradient background types (mesh, wave, confetti, radiant, image, transparent)
    return { backgroundColor: '#ffafcc' };
  };

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
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-0 flex items-end justify-start transition-all overflow-hidden relative ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 hover:scale-102'
                }`}
                style={getMiniCanvasBgStyle()}
              >
                {/* Masked Top-Right Corner Style Illustration Preview Diagrams */}
                {st.id === 'default' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md">
                    <div className="w-full h-full rounded-lg bg-slate-800 border border-slate-700/50" />
                  </div>
                )}

                {st.id === 'glass-light' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-white/40 backdrop-blur-xs border border-white/70 shadow-lg">
                    <div className="w-full h-full rounded-lg bg-slate-900/90 border border-slate-700/60" />
                  </div>
                )}

                {st.id === 'glass-dark' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-black/60 backdrop-blur-xs border border-white/25 shadow-xl">
                    <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-700/60" />
                  </div>
                )}

                {st.id === 'inset-light' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-slate-200/95 border border-slate-300 shadow-inner">
                    <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-800" />
                  </div>
                )}

                {st.id === 'inset-dark' && (
                  <div className="absolute top-5 -left-3 w-14 h-14 p-1 rounded-xl bg-slate-900/95 border border-slate-800 shadow-inner">
                    <div className="w-full h-full rounded-lg bg-slate-950 border border-slate-800" />
                  </div>
                )}

                {st.id === 'card' && (
                  <div className="absolute top-5 -left-3 w-14 h-14">
                    {/* Tilted background card */}
                    <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                    {/* Foreground main card */}
                    <div className="relative z-10 w-full h-full rounded-xl bg-slate-900 border border-slate-700 shadow-md" />
                  </div>
                )}
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
          const getShadowPreviewClass = () => {
            switch (sh) {
              case 'soft':
                return 'shadow-md shadow-black/60';
              case 'medium':
                return 'shadow-lg shadow-black/80';
              case 'hard':
                return 'shadow-2xl shadow-black/95';
              case 'floating':
                return 'shadow-[0_25px_40px_-5px_rgba(0,0,0,0.95)] -translate-y-1';
              case 'none':
              default:
                return 'shadow-none';
            }
          };

          return (
            <button
              key={sh}
              onClick={() => onChange({ shadow: sh })}
              className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
            >
              <div
                className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-0 transition-all overflow-hidden relative ${
                  isSelected
                    ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                    : 'border-neutral-800 hover:border-neutral-700 hover:scale-102'
                }`}
                style={getMiniCanvasBgStyle()}
              >
                {/* Masked Bottom-Left Corner Screenshot Box with Elevation Shadow */}
                <div
                  className={`absolute -top-3 -right-3 w-14 h-14 rounded-xl bg-slate-900 transition-all ${getShadowPreviewClass()}`}
                >
                  <div className="w-full h-full rounded-lg bg-white" />
                </div>
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

  const renderShadowOverlaySection = () => {
    const overlays = [
      { id: 'none', label: 'None' },
      { id: 'shadow-overlay-1', label: 'Overlay 1' },
      { id: 'shadow-overlay-2', label: 'Overlay 2' },
      { id: 'shadow-overlay-3', label: 'Overlay 3' },
      { id: 'shadow-overlay-4', label: 'Overlay 4' },
      { id: 'shadow-overlay-5', label: 'Overlay 5' },
      { id: 'shadow-overlay-6', label: 'Overlay 6' },
    ] as const;

    return (
      <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
        <div className="border-b border-neutral-800/80 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Shadow Overlay
          </h3>
        </div>
        <div className="flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto p-1 no-scrollbar scroll-smooth">
          {overlays.map((item) => {
            const isSelected = (state.shadowOverlay || 'none') === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange({ shadowOverlay: item.id as any })}
                className="flex flex-col items-center gap-1 cursor-pointer group shrink-0 w-20 md:w-auto"
              >
                <div
                  className={`w-16 h-16 md:w-full md:aspect-square rounded-xl border p-0 transition-all overflow-hidden relative ${
                    isSelected
                      ? 'border-[#a2d2ff] ring-2 ring-[#a2d2ff] shadow-md scale-102'
                      : 'border-neutral-800 hover:border-neutral-700 hover:scale-102'
                  }`}
                  style={getMiniCanvasBgStyle()}
                >
                  {item.id !== 'none' && (
                    <img
                      src={`/overlay/${item.id}.png`}
                      alt={item.label}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] md:text-[11px] text-center capitalize transition-colors truncate w-full ${
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

        {state.shadowOverlay && state.shadowOverlay !== 'none' && (
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            {/* Opacity Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Opacity</span>
                <span className="font-mono text-slate-400">
                  {state.shadowOverlayOpacity ?? 85}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={state.shadowOverlayOpacity ?? 85}
                onChange={(e) => onChange({ shadowOverlayOpacity: Number(e.target.value) })}
                className="w-full bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Layering Depth */}
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">
                Layering Depth
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ shadowOverlayPosition: 'behind' })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    (state.shadowOverlayPosition || 'above') === 'behind'
                      ? 'bg-pastel-pink/20 text-[#ffafcc] border-[#ffafcc] shadow-sm'
                      : 'bg-neutral-900 text-slate-400 border-neutral-800 hover:border-neutral-700 hover:text-slate-200'
                  }`}
                >
                  Behind Mockup
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ shadowOverlayPosition: 'above' })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    (state.shadowOverlayPosition || 'above') === 'above'
                      ? 'bg-pastel-pink/20 text-[#ffafcc] border-[#ffafcc] shadow-sm'
                      : 'bg-neutral-900 text-slate-400 border-neutral-800 hover:border-neutral-700 hover:text-slate-200'
                  }`}
                >
                  Above Mockup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (mobileSection) {
    if (mobileSection === 'image') return renderImageSection();
    if (mobileSection === 'aspect') return renderAspectSection();
    if (mobileSection === 'frame') return renderFrameSection();
    if (mobileSection === 'style') return renderStyleSection();
    if (mobileSection === 'shadow') {
      const isDeviceFrame = [
        'iphone',
        'iphone14pro',
        'macbook',
        'macbookair13',
        'samsung-s21',
        'tablet',
      ].includes(state.frameType);
      return (
        <>
          {!isDeviceFrame && renderShadowSection()}
          {renderShadowOverlaySection()}
        </>
      );
    }
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
      {renderShadowOverlaySection()}
    </div>
  );
};
