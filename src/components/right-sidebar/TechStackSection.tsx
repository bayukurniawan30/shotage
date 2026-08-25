import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { TechStackIcon, TECH_STACK_ITEMS, TechStackId } from '../TechStackIcons';
import { TechStackConfig, TechStackPosition } from '../../types/studio';

export const TechStackSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const config: TechStackConfig = state.techStackConfig || {
    enabled: false,
    selectedIcons: ['react', 'nextjs', 'typescript', 'tailwindcss'],
    size: 28,
    gap: 12,
    style: 'row',
    position: 'bottom-left',
    badgeStyle: 'glass-dark',
    xOffset: 0,
    yOffset: 0,
  };

  const updateConfig = (updates: Partial<TechStackConfig>) => {
    onChange({
      techStackConfig: {
        ...config,
        ...updates,
      },
    });
  };

  const toggleIcon = (iconId: TechStackId) => {
    const current = config.selectedIcons || [];
    const updated = current.includes(iconId)
      ? current.filter((id) => id !== iconId)
      : [...current, iconId];
    updateConfig({ selectedIcons: updated });
  };

  const positionGrid: {
    id: TechStackPosition;
    label: string;
    dotPos: string;
  }[] = [
    { id: 'top-left', label: 'Top Left', dotPos: 'top-1 left-1' },
    { id: 'top-center', label: 'Top Center', dotPos: 'top-1 left-1/2 -translate-x-1/2' },
    { id: 'top-right', label: 'Top Right', dotPos: 'top-1 right-1' },
    { id: 'center-left', label: 'Mid Left', dotPos: 'top-1/2 left-1 -translate-y-1/2' },
    {
      id: 'center',
      label: 'Center',
      dotPos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    },
    { id: 'center-right', label: 'Mid Right', dotPos: 'top-1/2 right-1 -translate-y-1/2' },
    { id: 'bottom-left', label: 'Bottom Left', dotPos: 'bottom-1 left-1' },
    { id: 'bottom-center', label: 'Bottom Center', dotPos: 'bottom-1 left-1/2 -translate-x-1/2' },
    { id: 'bottom-right', label: 'Bottom Right', dotPos: 'bottom-1 right-1' },
  ];

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <TechStackIcon id="react" size={16} />
            <TechStackIcon id="typescript" size={16} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Tech Stack
          </h3>
        </div>
        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
            config.enabled ? 'bg-pastel-blue' : 'bg-slate-800'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
              config.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Tech Stack Icons Selector */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 items-center">
              <span className="font-semibold text-slate-300">Select Tech Stack Logos</span>
              <span className="text-[10px] font-mono text-pastel-blue">
                {config.selectedIcons?.length || 0} selected
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-2 bg-neutral-950 rounded-xl border border-neutral-800 no-scrollbar">
              {TECH_STACK_ITEMS.map((item) => {
                const isSelected = config.selectedIcons?.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => toggleIcon(item.id)}
                    className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-white shadow-xs scale-105'
                        : 'bg-neutral-900/60 border-neutral-800/80 text-slate-500 hover:border-neutral-700 hover:text-slate-300'
                    }`}
                  >
                    <TechStackIcon id={item.id} size={22} />
                    <span className="text-[9px] font-medium mt-1 truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layout Style: Row vs Column */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Layout Direction
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => updateConfig({ style: 'row' })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  config.style === 'row'
                    ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Horizontal Row
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ style: 'column' })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  config.style === 'column'
                    ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Vertical Column
              </button>
            </div>
          </div>

          {/* 9 Grid Position Preset Options */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 items-center">
              <span className="font-semibold text-slate-300">Preset Position</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {config.position}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {positionGrid.map((pos) => {
                const isSelected = config.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => updateConfig({ position: pos.id })}
                    className={`h-11 rounded-lg border transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#a2d2ff]/15 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs ring-1 ring-[#a2d2ff]'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                    }`}
                    title={pos.label}
                  >
                    {/* Outer Canvas Representation Box */}
                    <div
                      className={`w-8 h-6 rounded border relative transition-colors ${
                        isSelected
                          ? 'border-[#a2d2ff] bg-[#a2d2ff]/10'
                          : 'border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      {/* Inner Location Box Indicator */}
                      <div
                        className={`absolute w-1.5 h-1 rounded-xs transition-colors ${pos.dotPos} ${
                          isSelected ? 'bg-[#a2d2ff]' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badge & Card Background Style */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Badge & Background Style
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
              {[
                { id: 'plain', label: 'Default' },
                { id: 'glass-dark', label: 'Dark Glass' },
                { id: 'glass-light', label: 'Light Glass' },
                { id: 'badge-dark', label: 'Dark Badge' },
                { id: 'badge-light', label: 'Light Badge' },
              ].map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => updateConfig({ badgeStyle: bg.id as any })}
                  className={`py-1.5 text-[10px] font-medium rounded-lg transition-all text-center cursor-pointer ${
                    config.badgeStyle === bg.id
                      ? 'bg-[#a2d2ff]/20 border border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-800/50'
                  }`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size & Gap Sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Logo Size</span>
                <span className="font-mono text-slate-400">{config.size || 28}px</span>
              </div>
              <input
                type="range"
                min={16}
                max={64}
                value={config.size || 28}
                onChange={(e) => updateConfig({ size: Number(e.target.value) })}
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Gap</span>
                <span className="font-mono text-slate-400">{config.gap || 12}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={36}
                value={config.gap || 12}
                onChange={(e) => updateConfig({ gap: Number(e.target.value) })}
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>
          </div>

          {/* Fine Position Offset (X & Y) */}
          <div className="space-y-2 pt-1 border-t border-neutral-800/60">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Offset X</span>
                <span className="font-mono text-slate-400">{config.xOffset || 0}px</span>
              </div>
              <input
                type="range"
                min={-200}
                max={200}
                value={config.xOffset || 0}
                onChange={(e) => updateConfig({ xOffset: Number(e.target.value) })}
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Offset Y</span>
                <span className="font-mono text-slate-400">{config.yOffset || 0}px</span>
              </div>
              <input
                type="range"
                min={-200}
                max={200}
                value={config.yOffset || 0}
                onChange={(e) => updateConfig({ yOffset: Number(e.target.value) })}
                className="w-full accent-pastel-blue bg-neutral-900 rounded-lg cursor-pointer h-1.5"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
