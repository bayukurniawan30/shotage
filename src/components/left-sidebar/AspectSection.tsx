import React, { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { ChevronDown } from '@untitledui/icons';
import { SocialIcon } from '../SocialIcons';
import {
  getAspectRatioCategory,
  getAspectRatioLabel,
  getRecommendedZoomForAspect,
} from './utils';

export const AspectSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const [isAspectDropdownOpen, setIsAspectDropdownOpen] = useState(false);
  const [customWidthInput, setCustomWidthInput] = useState<string>(
    String(state.customWidth || 1280)
  );
  const [customHeightInput, setCustomHeightInput] = useState<string>(
    String(state.customHeight || 720)
  );
  const [customDimensionError, setCustomDimensionError] = useState<string | null>(null);
  const aspectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aspectDropdownRef.current && !aspectDropdownRef.current.contains(event.target as Node)) {
        setIsAspectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
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
              {getAspectRatioLabel(state.aspectRatio, state.customWidth, state.customHeight)}
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
};
