import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { TiltSliderGroup, PositionSliderGroup } from './shared';

export const PerspectiveSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const reset3DPerspective = state.reset3DPerspective;

  const [activeTab, setActiveTab] = useState<'scaling' | 'tilt' | 'position'>('scaling');

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          3D Perspective & Canvas
        </h3>
      </div>

      {/* 3 Tabs Header: Scaling | Tilt | Position */}
      <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
        {(['scaling', 'tilt', 'position'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 text-[11px] font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#a2d2ff]/20 text-[#a2d2ff] border border-[#a2d2ff]/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Scaling & Canvas Padding */}
      {activeTab === 'scaling' && (
        <div className="space-y-3.5 pt-1">
          {/* Zoom Level */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">
                {state.layoutCount === 2 ? 'Zoom (Slot 1)' : 'Zoom Level'}
              </span>
              <span className="font-mono text-slate-400">{state.zoom}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="200"
              value={state.zoom}
              onChange={(e) => onChange({ zoom: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slot 2 Zoom Level */}
          {state.layoutCount === 2 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Zoom (Slot 2)</span>
                <span className="font-mono text-slate-400">{state.slot2Zoom}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={state.slot2Zoom}
                onChange={(e) => onChange({ slot2Zoom: Number(e.target.value) })}
                className="w-full bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Outer Canvas Padding */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Canvas Padding</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={state.padding}
              onChange={(e) => onChange({ padding: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 2: 3D Tilt & Rotation */}
      {activeTab === 'tilt' && (
        <div className="space-y-3.5 pt-1">
          {state.layoutCount === 2 ? (
            <>
              <TiltSliderGroup
                slotLabel="Slot 1"
                values={{
                  rotateX: state.rotateX,
                  rotateY: state.rotateY,
                  skewX: state.skewX,
                  skewY: state.skewY,
                  perspective: state.perspective,
                  rotation: state.slot1Rotate || 0,
                }}
                handlers={{
                  onRotateX: (v) => onChange({ rotateX: v }),
                  onRotateY: (v) => onChange({ rotateY: v }),
                  onSkewX: (v) => onChange({ skewX: v }),
                  onSkewY: (v) => onChange({ skewY: v }),
                  onPerspective: (v) => onChange({ perspective: v }),
                  onRotation: (v) => onChange({ slot1Rotate: v }),
                }}
              />
              <TiltSliderGroup
                slotLabel="Slot 2"
                defaultCollapsed
                values={{
                  rotateX: state.slot2RotateX ?? 0,
                  rotateY: state.slot2RotateY ?? 0,
                  skewX: state.slot2SkewX ?? 0,
                  skewY: state.slot2SkewY ?? 0,
                  perspective: state.slot2Perspective ?? 1000,
                  rotation: state.slot2Rotate || 0,
                }}
                handlers={{
                  onRotateX: (v) => onChange({ slot2RotateX: v }),
                  onRotateY: (v) => onChange({ slot2RotateY: v }),
                  onSkewX: (v) => onChange({ slot2SkewX: v }),
                  onSkewY: (v) => onChange({ slot2SkewY: v }),
                  onPerspective: (v) => onChange({ slot2Perspective: v }),
                  onRotation: (v) => onChange({ slot2Rotate: v }),
                }}
              />
            </>
          ) : (
            <TiltSliderGroup
              values={{
                rotateX: state.rotateX,
                rotateY: state.rotateY,
                skewX: state.skewX,
                skewY: state.skewY,
                perspective: state.perspective,
                rotation: state.slot1Rotate || 0,
              }}
              handlers={{
                onRotateX: (v) => onChange({ rotateX: v }),
                onRotateY: (v) => onChange({ rotateY: v }),
                onSkewX: (v) => onChange({ skewX: v }),
                onSkewY: (v) => onChange({ skewY: v }),
                onPerspective: (v) => onChange({ perspective: v }),
                onRotation: (v) => onChange({ slot1Rotate: v }),
              }}
            />
          )}

          {/* 3D Thickness & Edge Styling (Only for Frameless Images) */}
          {state.frameType === 'frameless' && (
            <div className="pt-2.5 border-t border-neutral-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  3D Thickness & Edge
                </span>
                <span className="text-[10px] font-mono text-pastel-pink font-semibold">
                  {state.slabThickness ?? 12}px
                </span>
              </div>

              {/* Thickness Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Depth Thickness</span>
                  <span className="font-mono text-slate-400">{state.slabThickness ?? 12}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={state.slabThickness ?? 12}
                  onChange={(e) => onChange({ slabThickness: Number(e.target.value) })}
                  className="w-full accent-pastel-pink bg-neutral-900 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              {/* Edge Color */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Edge Color
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: 'Dark Slate', hex: '#1e293b' },
                    { name: 'Charcoal', hex: '#0f172a' },
                    { name: 'Steel', hex: '#334155' },
                    { name: 'Silver / White', hex: '#ffffff' },
                    { name: 'Obsidian', hex: '#000000' },
                    { name: 'Pastel Pink', hex: '#ffafcc' },
                    { name: 'Pastel Blue', hex: '#a2d2ff' },
                    { name: 'Lavender', hex: '#cdb4db' },
                  ].map((item) => {
                    const isSelected = (state.slabColor || '#1e293b').toLowerCase() === item.hex.toLowerCase();
                    return (
                      <button
                        key={item.hex}
                        type="button"
                        title={item.name}
                        onClick={() => onChange({ slabColor: item.hex })}
                        style={{ backgroundColor: item.hex }}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white scale-110 shadow-md ring-2 ring-pastel-pink/60'
                            : 'border-slate-700/70 hover:scale-105'
                        }`}
                      />
                    );
                  })}
                  <div className="relative w-6 h-6 rounded-full border border-slate-700 overflow-hidden shrink-0 hover:scale-105 transition-transform">
                    <input
                      type="color"
                      value={state.slabColor || '#1e293b'}
                      onChange={(e) => onChange({ slabColor: e.target.value })}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      title="Custom Edge Color"
                    />
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: state.slabColor || '#1e293b' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Position Offset & Alignment */}
      {activeTab === 'position' && (
        <div className="space-y-3.5 pt-1">
          {state.layoutCount === 2 ? (
            <>
              <PositionSliderGroup
                slotLabel="Slot 1"
                values={{ offsetX: state.offsetX, offsetY: state.offsetY }}
                handlers={{
                  onOffsetX: (v) => onChange({ offsetX: v }),
                  onOffsetY: (v) => onChange({ offsetY: v }),
                  onDragStart: () => onChange({ isPositionDragging: true }),
                  onDragEnd: () => onChange({ isPositionDragging: false }),
                }}
              />
              <PositionSliderGroup
                slotLabel="Slot 2"
                defaultCollapsed
                values={{ offsetX: state.slot2OffsetX, offsetY: state.slot2OffsetY }}
                handlers={{
                  onOffsetX: (v) => onChange({ slot2OffsetX: v }),
                  onOffsetY: (v) => onChange({ slot2OffsetY: v }),
                  onDragStart: () => onChange({ isPositionDragging: true }),
                  onDragEnd: () => onChange({ isPositionDragging: false }),
                }}
              />
            </>
          ) : (
            <PositionSliderGroup
              values={{ offsetX: state.offsetX, offsetY: state.offsetY }}
              handlers={{
                onOffsetX: (v) => onChange({ offsetX: v }),
                onOffsetY: (v) => onChange({ offsetY: v }),
                onDragStart: () => onChange({ isPositionDragging: true }),
                onDragEnd: () => onChange({ isPositionDragging: false }),
              }}
            />
          )}
        </div>
      )}

      <button
        onClick={reset3DPerspective}
        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700 transition-all cursor-pointer"
      >
        Reset 3D & Position
      </button>
    </div>
  );
};
