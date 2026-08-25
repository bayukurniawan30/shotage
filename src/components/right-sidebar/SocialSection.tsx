import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Plus, Copy01, Trash01 } from '@untitledui/icons';
import { SocialIcon } from '../SocialIcons';
import { SocialPlatformSelect, FontSelect } from './shared';

export const SocialSection: React.FC = () => {
  const state = useStudioStore();

  const socialLayers = state.textLayers.filter((l) => l.socialPlatform !== undefined);
  const selectedLayer = state.textLayers.find(
    (l) => l.id === state.selectedTextLayerId && l.socialPlatform !== undefined
  );

  const presetColors = [
    '#ffffff',
    '#000000',
    '#ffafcc',
    '#a2d2ff',
    '#cdb4db',
    '#fef08a',
    '#4ade80',
    '#f87171',
    '#38bdf8',
  ];

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SocialIcon platform="instagram" size={16} color="#a2d2ff" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Social Media
          </h3>
        </div>
        <button
          onClick={() => state.addSocialLayer('instagram', '@username')}
          className="px-2.5 py-1 bg-pastel-blue/20 hover:bg-pastel-blue/30 text-pastel-blue border border-pastel-blue/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Social</span>
        </button>
      </div>

      {/* Social Layers List */}
      {socialLayers.length === 0 ? (
        <div className="text-center py-6 px-3 bg-neutral-950/80 rounded-xl border border-dashed border-neutral-800 space-y-1.5">
          <p className="text-xs font-medium text-slate-400">No social media handles added</p>
          <p className="text-[11px] text-slate-500">
            Click "+ Add Social" to overlay Instagram, Twitter, TikTok, or YouTube handles.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Social Layers ({socialLayers.length}):
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {socialLayers.map((layer) => {
              const isSelected = layer.id === state.selectedTextLayerId;
              return (
                <div
                  key={layer.id}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-neutral-900 border-pastel-blue text-white shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800/80 text-slate-400 hover:bg-neutral-800/60 hover:text-slate-200'
                  }`}
                  onClick={() => state.selectTextLayer(layer.id)}
                >
                  <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                    <SocialIcon
                      platform={layer.socialPlatform || 'instagram'}
                      size={14}
                      color={'#cbd5e1'}
                    />
                    <span className="font-semibold truncate">{layer.text}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title="Duplicate"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.duplicateTextLayer(layer.id);
                      }}
                      className="p-1 hover:bg-neutral-800 text-slate-400 hover:text-white rounded transition-colors"
                    >
                      <Copy01 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.removeTextLayer(layer.id);
                      }}
                      className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash01 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Social Layer Settings */}
      {selectedLayer && (
        <div className="pt-3 border-t border-neutral-800/80 space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-pastel-blue uppercase tracking-wider">
              Edit Social Layer
            </span>
            <button
              onClick={() => state.selectTextLayer(null)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Deselect
            </button>
          </div>

          {/* Platform Select with Icons */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Social Platform Icon
            </label>
            <SocialPlatformSelect
              value={selectedLayer.socialPlatform || 'instagram'}
              onChange={(platform) =>
                state.updateTextLayer(selectedLayer.id, { socialPlatform: platform })
              }
            />
          </div>

          {/* Social Style Variant */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Badge & Card Style
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              {[
                { id: 'default', label: 'Default' },
                { id: 'badge-dark', label: 'Dark Badge' },
                { id: 'badge-light', label: 'Light Badge' },
                { id: 'glass-dark', label: 'Glass Dark' },
                { id: 'glass-light', label: 'Glass Light' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    const updates: any = { socialStyle: st.id };
                    if (st.id === 'badge-light' || st.id === 'glass-light') {
                      updates.color = '#0f172a';
                      updates.iconColor = '#0f172a';
                    } else if (st.id === 'badge-dark' || st.id === 'glass-dark') {
                      updates.color = '#ffffff';
                      updates.iconColor = '#ffffff';
                    }
                    state.updateTextLayer(selectedLayer.id, updates);
                  }}
                  className={`py-1.5 text-[10px] font-medium rounded-lg transition-all text-center cursor-pointer ${
                    (selectedLayer.socialStyle || 'default') === st.id
                      ? 'bg-[#a2d2ff]/20 border border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800/50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Handle / Account Text */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Account Handle / Username
            </label>
            <input
              type="text"
              value={selectedLayer.text}
              onChange={(e) => state.updateTextLayer(selectedLayer.id, { text: e.target.value })}
              placeholder="@username"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-pastel-blue transition-colors font-mono"
            />
          </div>

          {/* Icon Color & Text Color */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs items-center">
              <span className="font-semibold text-slate-300">Icon Color</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-full border border-neutral-700 shadow-inner"
                  style={{ backgroundColor: selectedLayer.iconColor || selectedLayer.color }}
                />
                <input
                  type="color"
                  value={selectedLayer.iconColor || selectedLayer.color}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { iconColor: e.target.value })
                  }
                  className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                />
              </div>
            </div>

            <div className="flex justify-between text-xs items-center">
              <span className="font-semibold text-slate-300">Text Color</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-full border border-neutral-700 shadow-inner"
                  style={{ backgroundColor: selectedLayer.color }}
                />
                <input
                  type="color"
                  value={selectedLayer.color}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { color: e.target.value })
                  }
                  className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    state.updateTextLayer(selectedLayer.id, {
                      color: c,
                      iconColor: c,
                    })
                  }
                  className="w-5 h-5 rounded-full border border-neutral-700 shrink-0 transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Size & Font Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Icon Size</span>
                <span className="font-mono text-slate-400">
                  {selectedLayer.iconSize || Math.round(selectedLayer.fontSize * 1.1)}px
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={selectedLayer.iconSize || Math.round(selectedLayer.fontSize * 1.1)}
                onChange={(e) =>
                  state.updateTextLayer(selectedLayer.id, {
                    iconSize: Number(e.target.value),
                  })
                }
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Font Size</span>
                <span className="font-mono text-slate-400">{selectedLayer.fontSize}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                value={selectedLayer.fontSize}
                onChange={(e) =>
                  state.updateTextLayer(selectedLayer.id, {
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Font Family
            </label>
            <FontSelect
              value={selectedLayer.fontFamily}
              onChange={(fontName) =>
                state.updateTextLayer(selectedLayer.id, { fontFamily: fontName })
              }
            />
          </div>

          {/* X & Y Position */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Position X (Horizontal)</span>
                <span className="font-mono text-slate-400">{selectedLayer.x}px</span>
              </div>
              <input
                type="range"
                min={-400}
                max={400}
                value={selectedLayer.x}
                onChange={(e) =>
                  state.updateTextLayer(selectedLayer.id, { x: Number(e.target.value) })
                }
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Position Y (Vertical)</span>
                <span className="font-mono text-slate-400">{selectedLayer.y}px</span>
              </div>
              <input
                type="range"
                min={-400}
                max={400}
                value={selectedLayer.y}
                onChange={(e) =>
                  state.updateTextLayer(selectedLayer.id, { y: Number(e.target.value) })
                }
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
