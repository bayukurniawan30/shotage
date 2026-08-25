import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  Type01,
  Plus,
  Copy01,
  Trash01,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import { FontSelect } from './shared';
import {
  GRADIENT_PRESETS,
  parseColorAndAlpha,
  formatColorWithAlpha,
} from '../../utils/gradientPresets';

export const TextSection: React.FC = () => {
  const state = useStudioStore();
  const [showAllGradients, setShowAllGradients] = useState(false);
  const [activeOption, setActiveOption] = useState<'size' | 'position' | 'rotation' | 'skew' | 'opacity'>('size');

  const plainTextLayers = state.textLayers.filter((l) => l.socialPlatform === undefined);
  const selectedLayer = state.textLayers.find(
    (l) => l.id === state.selectedTextLayerId && l.socialPlatform === undefined
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
          <Type01 className="w-4 h-4 text-pastel-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Text Layers
          </h3>
        </div>
        <button
          onClick={() => state.addTextLayer()}
          className="px-2.5 py-1 bg-pastel-blue/20 hover:bg-pastel-blue/30 text-pastel-blue border border-pastel-blue/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Text</span>
        </button>
      </div>

      {/* Text Layers List */}
      {plainTextLayers.length === 0 ? (
        <div className="text-center py-6 px-3 bg-neutral-950/80 rounded-xl border border-dashed border-neutral-800 space-y-1.5">
          <p className="text-xs font-medium text-slate-400">No text layers added yet</p>
          <p className="text-[11px] text-slate-500">
            Click "+ Add Text" to overlay headlines, captions, or badges.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Layers ({plainTextLayers.length}):
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {plainTextLayers.map((layer, index) => {
              const isSelected = layer.id === state.selectedTextLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => state.selectTextLayer(layer.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pastel-blue/15 border-pastel-blue text-white shadow-xs'
                      : 'bg-neutral-950/80 border-neutral-800 text-slate-300 hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-[10px] text-slate-500 font-semibold shrink-0">
                      #{index + 1}
                    </span>
                    <span
                      className="truncate font-medium"
                      style={{ fontFamily: layer.fontFamily }}
                    >
                      {layer.text || 'Empty Text'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        state.duplicateTextLayer(layer.id);
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                      title="Duplicate Layer"
                    >
                      <Copy01 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        state.removeTextLayer(layer.id);
                      }}
                      className="p-1 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded transition-colors"
                      title="Delete Layer"
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

      {/* Selected Layer Inspector */}
      {selectedLayer && (
        <div className="pt-3 border-t border-neutral-800/80 space-y-3.5 animate-in fade-in duration-150">
          {/* Text Content Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Text Content
            </label>
            <textarea
              rows={2}
              value={selectedLayer.text}
              onChange={(e) => state.updateTextLayer(selectedLayer.id, { text: e.target.value })}
              placeholder="Enter text..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-pastel-blue transition-colors resize-none"
            />
          </div>

          {/* Font Family Selector (10 Google Fonts) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Font Family (Google Fonts)
            </label>
            <FontSelect
              value={selectedLayer.fontFamily}
              onChange={(fontName) =>
                state.updateTextLayer(selectedLayer.id, { fontFamily: fontName })
              }
            />
          </div>

          {/* Typography Controls: Font Weight, Alignment & Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Font Weight
              </label>
              <select
                value={selectedLayer.fontWeight}
                onChange={(e) =>
                  state.updateTextLayer(selectedLayer.id, {
                    fontWeight: e.target.value as any,
                  })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="600">SemiBold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">ExtraBold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Style</label>
              <button
                type="button"
                onClick={() =>
                  state.updateTextLayer(selectedLayer.id, {
                    fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`w-full py-1.5 text-xs font-semibold italic rounded-lg border transition-all cursor-pointer ${
                  selectedLayer.fontStyle === 'italic'
                    ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Italic
              </button>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Alignment
            </label>
            <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              {(
                [
                  { id: 'left', icon: AlignLeft },
                  { id: 'center', icon: AlignCenter },
                  { id: 'right', icon: AlignRight },
                ] as const
              ).map((align) => {
                const Icon = align.icon;
                const isSelected = selectedLayer.textAlign === align.id;
                return (
                  <button
                    key={align.id}
                    type="button"
                    onClick={() =>
                      state.updateTextLayer(selectedLayer.id, { textAlign: align.id })
                    }
                    className={`py-1 flex items-center justify-center rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pastel-blue/20 text-pastel-blue'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Color Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Text Color
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => state.updateTextLayer(selectedLayer.id, { color: c })}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                    selectedLayer.color === c
                      ? 'border-white scale-110 shadow-md ring-2 ring-pastel-blue/50'
                      : 'border-slate-700/60 hover:scale-105'
                  }`}
                />
              ))}
              <input
                type="color"
                value={selectedLayer.color}
                onChange={(e) =>
                  state.updateTextLayer(selectedLayer.id, { color: e.target.value })
                }
                className="w-6 h-6 rounded-full border border-slate-700 bg-transparent cursor-pointer p-0"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Gradient Text */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-slate-300">
                Gradient Text
              </label>
              <button
                onClick={() =>
                  state.updateTextLayer(selectedLayer.id, {
                    gradient: selectedLayer.gradient
                      ? null
                      : { color1: '#ffafcc', color2: '#a2d2ff', angle: 135 },
                  })
                }
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  selectedLayer.gradient ? 'bg-pastel-blue' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    selectedLayer.gradient ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {selectedLayer.gradient && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Presets ({GRADIENT_PRESETS.length})
                  </span>
                  {showAllGradients && (
                    <button
                      type="button"
                      onClick={() => setShowAllGradients(false)}
                      className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Collapse presets"
                    >
                      <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
                    </button>
                  )}
                </div>

                <div
                  className={`grid grid-cols-4 gap-2 ${
                    showAllGradients ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
                  }`}
                >
                  {(!showAllGradients ? GRADIENT_PRESETS.slice(0, 3) : GRADIENT_PRESETS).map(
                    (g) => {
                      const isSelected =
                        selectedLayer.gradient?.color1.toLowerCase() === g.c1.toLowerCase() &&
                        selectedLayer.gradient?.color2.toLowerCase() === g.c2.toLowerCase();
                      return (
                        <button
                          key={g.name}
                          onClick={() =>
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color1: g.c1,
                                color2: g.c2,
                              },
                            })
                          }
                          title={g.name}
                          className={`h-8 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-white ring-2 ring-pastel-pink scale-105'
                              : 'border-slate-700/80 hover:scale-105'
                          }`}
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
                          }}
                        />
                      );
                    }
                  )}

                  {!showAllGradients && GRADIENT_PRESETS.length > 3 && (
                    <div className="relative h-8">
                      {/* Tilted background card matching LeftSidebar card style */}
                      <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                      {/* Foreground main card */}
                      <button
                        type="button"
                        onClick={() => setShowAllGradients(true)}
                        title={`Show all ${GRADIENT_PRESETS.length} gradients`}
                        className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${GRADIENT_PRESETS[3].c1}, ${GRADIENT_PRESETS[3].c2})`,
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                          <span className="text-[10px] font-bold tracking-tight">
                            +{GRADIENT_PRESETS.length - 3}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Color 1 */}
                  <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">Color 1</span>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseColorAndAlpha(selectedLayer.gradient!.color1);
                          state.updateTextLayer(selectedLayer.id, {
                            gradient: {
                              ...selectedLayer.gradient!,
                              color1:
                                parsed.alpha === 0
                                  ? formatColorWithAlpha(parsed.hex, 100)
                                  : 'transparent',
                            },
                          });
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          parseColorAndAlpha(selectedLayer.gradient.color1).alpha === 0
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle transparent"
                      >
                        {parseColorAndAlpha(selectedLayer.gradient.color1).alpha === 0
                          ? 'Transparent'
                          : 'Make Clear'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: selectedLayer.gradient.color1 }}
                        />
                        <input
                          type="color"
                          value={parseColorAndAlpha(selectedLayer.gradient.color1).hex}
                          onChange={(e) => {
                            const currentAlpha = parseColorAndAlpha(
                              selectedLayer.gradient!.color1
                            ).alpha;
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color1: formatColorWithAlpha(
                                  e.target.value,
                                  currentAlpha === 0 ? 100 : currentAlpha
                                ),
                              },
                            });
                          }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={selectedLayer.gradient.color1}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            gradient: {
                              ...selectedLayer.gradient!,
                              color1: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                        <span>Opacity</span>
                        <span className="font-mono font-medium">
                          {parseColorAndAlpha(selectedLayer.gradient.color1).alpha}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={parseColorAndAlpha(selectedLayer.gradient.color1).alpha}
                        onChange={(e) => {
                          const hex = parseColorAndAlpha(selectedLayer.gradient!.color1).hex;
                          state.updateTextLayer(selectedLayer.id, {
                            gradient: {
                              ...selectedLayer.gradient!,
                              color1: formatColorWithAlpha(hex, Number(e.target.value)),
                            },
                          });
                        }}
                        className="w-full accent-pastel-pink bg-neutral-800 rounded-lg cursor-pointer h-1"
                      />
                    </div>
                  </div>

                  {/* Color 2 */}
                  <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">Color 2</span>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseColorAndAlpha(selectedLayer.gradient!.color2);
                          state.updateTextLayer(selectedLayer.id, {
                            gradient: {
                              ...selectedLayer.gradient!,
                              color2:
                                parsed.alpha === 0
                                  ? formatColorWithAlpha(parsed.hex, 100)
                                  : 'transparent',
                            },
                          });
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          parseColorAndAlpha(selectedLayer.gradient.color2).alpha === 0
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle transparent"
                      >
                        {parseColorAndAlpha(selectedLayer.gradient.color2).alpha === 0
                          ? 'Transparent'
                          : 'Make Clear'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: selectedLayer.gradient.color2 }}
                        />
                        <input
                          type="color"
                          value={parseColorAndAlpha(selectedLayer.gradient.color2).hex}
                          onChange={(e) => {
                            const currentAlpha = parseColorAndAlpha(
                              selectedLayer.gradient!.color2
                            ).alpha;
                            state.updateTextLayer(selectedLayer.id, {
                              gradient: {
                                ...selectedLayer.gradient!,
                                color2: formatColorWithAlpha(
                                  e.target.value,
                                  currentAlpha === 0 ? 100 : currentAlpha
                                ),
                              },
                            });
                          }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={selectedLayer.gradient.color2}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            gradient: {
                              ...selectedLayer.gradient!,
                              color2: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                        <span>Opacity</span>
                        <span className="font-mono font-medium">
                          {parseColorAndAlpha(selectedLayer.gradient.color2).alpha}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={parseColorAndAlpha(selectedLayer.gradient.color2).alpha}
                        onChange={(e) => {
                          const hex = parseColorAndAlpha(selectedLayer.gradient!.color2).hex;
                          state.updateTextLayer(selectedLayer.id, {
                            gradient: {
                              ...selectedLayer.gradient!,
                              color2: formatColorWithAlpha(hex, Number(e.target.value)),
                            },
                          });
                        }}
                        className="w-full accent-pastel-pink bg-neutral-800 rounded-lg cursor-pointer h-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Angle</span>
                    <span className="font-mono text-slate-400">
                      {selectedLayer.gradient.angle}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedLayer.gradient.angle}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, {
                        gradient: {
                          ...selectedLayer.gradient!,
                          angle: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image Fill (Clipping Text) */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-semibold text-slate-300">
              Image Fill (Clip Text)
            </label>

            {selectedLayer.bgImage ? (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg border border-slate-700 overflow-hidden shrink-0">
                  <img
                    src={selectedLayer.bgImage}
                    alt="Text fill"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-mono text-slate-500">Image fill applied</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <label className="flex-1 flex items-center justify-center py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-pastel-pink rounded-lg text-[10px] font-semibold text-slate-300 cursor-pointer transition-colors">
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              state.updateTextLayer(selectedLayer.id, {
                                bgImage: ev.target.result as string,
                                shadow: false,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <button
                      onClick={() => state.updateTextLayer(selectedLayer.id, { bgImage: null })}
                      className="py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-red-400 hover:text-red-400 rounded-lg text-[10px] font-semibold text-slate-400 cursor-pointer transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center p-2.5 border-2 border-dashed border-neutral-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-neutral-950/80 hover:bg-neutral-800/80 transition-all text-center">
                <span className="text-xs font-medium text-slate-300">
                  Upload image to clip into text
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        state.updateTextLayer(selectedLayer.id, {
                          bgImage: ev.target.result as string,
                          shadow: false,
                        });
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}

            {selectedLayer.bgImage && (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Zoom</span>
                    <span className="font-mono text-slate-400">
                      {selectedLayer.bgImageZoom ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="400"
                    value={selectedLayer.bgImageZoom ?? 100}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, {
                        bgImageZoom: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Offset X</span>
                      <span className="font-mono text-slate-400">
                        {selectedLayer.bgImageOffsetX || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={selectedLayer.bgImageOffsetX || 0}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          bgImageOffsetX: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Offset Y</span>
                      <span className="font-mono text-slate-400">
                        {selectedLayer.bgImageOffsetY || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={selectedLayer.bgImageOffsetY || 0}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          bgImageOffsetY: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text Transform & Adjustment Circle Buttons */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Transform & Adjustments
              </span>
              <span className="text-[10px] text-pastel-pink font-semibold capitalize">
                {activeOption === 'size'
                  ? 'Size & Stretch'
                  : activeOption === 'rotation'
                    ? 'Rotation & 3D'
                    : activeOption}
              </span>
            </div>

            {/* Circle Buttons Row with Tooltips */}
            <div className="flex items-center gap-1.5 py-1 flex-wrap">
              {[
                {
                  id: 'size',
                  label: 'Size & Stretch',
                  tooltip: 'Font Size & Stretch Scale',
                  icon: (
                    <PhosphorIcons.TextAaIcon
                      weight={activeOption === 'size' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'position',
                  label: 'Position',
                  tooltip: 'Position (X / Y)',
                  icon: (
                    <PhosphorIcons.ArrowsOutCardinalIcon
                      weight={activeOption === 'position' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'rotation',
                  label: 'Rotation & 3D Tilt',
                  tooltip: 'Rotation, Pitch & Yaw',
                  icon: (
                    <PhosphorIcons.ArrowsClockwiseIcon
                      weight={activeOption === 'rotation' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'skew',
                  label: 'Skew',
                  tooltip: 'Skew Distortion (X / Y)',
                  icon: (
                    <PhosphorIcons.ParallelogramIcon
                      weight={activeOption === 'skew' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'opacity',
                  label: 'Opacity',
                  tooltip: 'Layer Opacity',
                  icon: (
                    <PhosphorIcons.SunDimIcon
                      weight={activeOption === 'opacity' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
              ].map((btn) => {
                const isActive = activeOption === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setActiveOption(btn.id as any)}
                    title={btn.tooltip}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? 'animate-border shadow-md shadow-pink-300/30 scale-105 text-pastel-pink'
                        : 'bg-neutral-900 text-slate-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {btn.icon}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Slider Container with smooth transition */}
            <div className="pt-1 space-y-3 animate-in fade-in duration-150">
              {/* Option: Size & Stretch */}
              {activeOption === 'size' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Font Size</span>
                      <span className="font-mono text-slate-400">{selectedLayer.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="500"
                      value={selectedLayer.fontSize}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          fontSize: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Stretch X</span>
                        <span className="font-mono text-slate-400">
                          {(selectedLayer.scaleX ?? 1).toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="8.0"
                        step="0.05"
                        value={selectedLayer.scaleX ?? 1}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            scaleX: Number(e.target.value),
                          })
                        }
                        className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Stretch Y</span>
                        <span className="font-mono text-slate-400">
                          {(selectedLayer.scaleY ?? 1).toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="8.0"
                        step="0.05"
                        value={selectedLayer.scaleY ?? 1}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            scaleY: Number(e.target.value),
                          })
                        }
                        className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Option: Position */}
              {activeOption === 'position' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position X</span>
                      <span className="font-mono text-slate-400">{selectedLayer.x}px</span>
                    </div>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={selectedLayer.x}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, { x: Number(e.target.value) })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position Y</span>
                      <span className="font-mono text-slate-400">{selectedLayer.y}px</span>
                    </div>
                    <input
                      type="range"
                      min="-300"
                      max="300"
                      value={selectedLayer.y}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, { y: Number(e.target.value) })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Option: Rotation & 3D Tilt */}
              {activeOption === 'rotation' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Rotation</span>
                      <span className="font-mono text-slate-400">
                        {selectedLayer.rotation ?? 0}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedLayer.rotation ?? 0}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          rotation: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
                        <span className="font-mono text-slate-400">
                          {selectedLayer.pitch ?? 0}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={selectedLayer.pitch ?? 0}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            pitch: Number(e.target.value),
                          })
                        }
                        className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
                        <span className="font-mono text-slate-400">
                          {selectedLayer.yaw ?? 0}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={selectedLayer.yaw ?? 0}
                        onChange={(e) =>
                          state.updateTextLayer(selectedLayer.id, {
                            yaw: Number(e.target.value),
                          })
                        }
                        className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Option: Skew */}
              {activeOption === 'skew' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Skew X</span>
                      <span className="font-mono text-slate-400">
                        {selectedLayer.skewX ?? 0}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={selectedLayer.skewX ?? 0}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          skewX: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Skew Y</span>
                      <span className="font-mono text-slate-400">
                        {selectedLayer.skewY ?? 0}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={selectedLayer.skewY ?? 0}
                      onChange={(e) =>
                        state.updateTextLayer(selectedLayer.id, {
                          skewY: Number(e.target.value),
                        })
                      }
                      className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Option: Opacity */}
              {activeOption === 'opacity' && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Opacity</span>
                    <span className="font-mono text-slate-400">
                      {selectedLayer.opacity ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedLayer.opacity ?? 100}
                    onChange={(e) =>
                      state.updateTextLayer(selectedLayer.id, { opacity: Number(e.target.value) })
                    }
                    className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Layer Depth Position (Above vs Behind Mockup) */}
          <div className="space-y-1.5 pt-1 border-t border-neutral-800/60">
            <label className="block text-[11px] font-semibold text-slate-300">
              Layer Layering Depth
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => state.updateTextLayer(selectedLayer.id, { position: 'above' })}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  (selectedLayer.position || 'above') === 'above'
                    ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Above Mockup
              </button>
              <button
                type="button"
                onClick={() =>
                  state.updateTextLayer(selectedLayer.id, { position: 'underneath' })
                }
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  selectedLayer.position === 'underneath'
                    ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Behind Mockup
              </button>
            </div>
          </div>

          {/* Text Shadow Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
            <span
              className={`text-xs font-medium ${
                selectedLayer.bgImage ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              Drop Shadow
            </span>
            <button
              disabled={!!selectedLayer.bgImage}
              onClick={() =>
                state.updateTextLayer(selectedLayer.id, { shadow: !selectedLayer.shadow })
              }
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                selectedLayer.bgImage
                  ? 'bg-slate-800/50 cursor-not-allowed'
                  : selectedLayer.shadow
                    ? 'bg-pastel-blue'
                    : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  selectedLayer.shadow ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
