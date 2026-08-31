import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStudioStore } from '../../store/useStudioStore';
import {
  UploadCloud01,
  XClose,
  Columns01,
  Copy02,
  Copy03,
  Divider,
} from '@untitledui/icons';
import { DocumentsIllustration } from '../shared-assets/illustrations';
import { TEMPLATE_PRESETS } from '../../utils/templatePresets';
import { isVideoFile, isValidMediaFile, validateAndLoadVideo } from '../../utils/videoUpload';

interface ImageUploadSectionProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ onImageUpload }) => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
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
          Layout Count (Single or 2 Images)
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
                  onChange({
                    layoutCount: count as 1 | 2,
                    layoutPreset: newPreset,
                    ...(count === 2 && state.mediaType === 'video' ? { mediaType: 'image' } : {}),
                  });
                }}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                {count === 1 ? 'Single Image/Video' : '2 Images'}
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
              { id: 'side-by-side', label: 'Side by Side', icon: Columns01 },
              { id: 'overlap-right', label: 'Overlap Right', icon: Copy02 },
              { id: 'overlap-left', label: 'Overlap Left', icon: Copy03 },
              { id: 'stacked', label: 'Stacked', icon: Divider },
            ].map((preset) => {
              const isSelected = state.layoutPreset === preset.id;
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ layoutPreset: preset.id as any })}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          {state.layoutCount === 2 ? 'Primary Image Upload (Slot 1)' : 'Single Image/Video Upload'}
        </label>
        {state.imageSrc && (
          <div className="mb-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative">
              {state.mediaType === 'video' && state.layoutCount === 1 ? (
                <video
                  src={state.imageSrc}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={state.imageSrc}
                  alt="Slot 1 Preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}
              {state.mediaType === 'video' && state.layoutCount === 1 && (
                <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-pastel-pink text-slate-950 font-extrabold text-[8px] rounded uppercase shadow-xs">
                  MP4
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {state.imageName ||
                  (state.mediaType === 'video' && state.layoutCount === 1
                    ? 'Slot 1 Video'
                    : 'Slot 1 Image')}
              </p>
              <p className="text-[10px] text-pastel-pink font-medium">
                {state.mediaType === 'video' && state.layoutCount === 1
                  ? 'Video Active'
                  : 'Uploaded & Active'}
              </p>
            </div>
          </div>
        )}
        <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all text-center">
          <UploadCloud01 className="w-5 h-5 text-pastel-pink mb-1" />
          <span className="text-xs font-semibold text-slate-200">
            {state.imageSrc
              ? state.layoutCount === 2
                ? 'Replace Slot 1 Image'
                : 'Replace Image / Video'
              : state.layoutCount === 2
                ? 'Upload Slot 1 Image'
                : 'Upload Image or Video'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            {state.layoutCount === 2
              ? 'PNG, JPG, WebP supported'
              : 'PNG, JPG, WebP, MP4, WebM (Max 50MB)'}
          </span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {state.layoutCount === 2 && (
        <div className="pt-2 border-t border-neutral-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Secondary Image Upload (Slot 2)
          </label>
          {state.secondImageSrc && (
            <div className="mb-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 relative">
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
            <span className="text-xs font-semibold text-slate-200">
              {state.secondImageSrc ? 'Replace Slot 2 Image' : 'Upload Slot 2 Image'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP supported</span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (!isValidMediaFile(file)) {
                    alert('Invalid file format. Please upload an image or video.');
                    return;
                  }

                  if (isVideoFile(file)) {
                    validateAndLoadVideo(
                      file,
                      ({ src, name, width, height, duration }) => {
                        useStudioStore
                          .getState()
                          .setSecondImage(src, name, width, height, 'video');
                        onChange({ videoDuration: duration });
                      },
                      (errorMsg) => {
                        alert(errorMsg);
                      }
                    );
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) {
                      const src = event.target.result as string;
                      const img = new Image();
                      img.onload = () => {
                        useStudioStore
                          .getState()
                          .setSecondImage(
                            src,
                            file.name,
                            img.naturalWidth,
                            img.naturalHeight,
                            'image'
                          );
                      };
                      img.onerror = () =>
                        useStudioStore
                          .getState()
                          .setSecondImage(src, file.name, null, null, 'image');
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

      {/* Image Fit Setting */}
      <div className="pt-2 border-t border-neutral-800/80">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Image Fit
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'cover', label: 'Cover', desc: 'Crop & Fill' },
            { id: 'contain', label: 'Contain', desc: 'Fit (No Crop)' },
            { id: 'fill', label: 'Fill', desc: 'Stretch' },
          ].map((fit) => {
            const isSelected = (state.imageFit || 'cover') === fit.id;
            return (
              <button
                key={fit.id}
                type="button"
                onClick={() => onChange({ imageFit: fit.id as any })}
                className={`py-2 px-1 text-xs rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                    : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                }`}
                title={fit.desc}
              >
                <span className="font-semibold">{fit.label}</span>
                <span className="text-[9px] opacity-70 font-normal">{fit.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
