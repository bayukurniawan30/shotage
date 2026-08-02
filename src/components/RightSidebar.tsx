import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  ChevronDown,
  Check,
  Brush03,
  Stars02,
  RefreshCw01,
  Plus,
  Trash01,
  Copy01,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type01,
} from '@untitledui/icons';
import { extractDominantColors, generateGradientVariations } from '../utils/colorExtractor';
import { WAVE_PRESETS } from '../utils/wavePresets';
import { MESH_PRESETS } from '../utils/meshPresets';
import { CONFETTI_PRESETS, generateRandomConfettiPreset } from '../utils/confettiPresets';
import { RADIANT_PRESETS } from '../utils/radiantPresets';
import { WaveBackground } from './WaveBackground';
import { MeshBackground } from './MeshBackground';
import { ConfettiBackground } from './ConfettiBackground';
import { RadiantBackground } from './RadiantBackground';

export const GOOGLE_FONTS = [
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'Roboto', family: 'Roboto, sans-serif' },
  { name: 'Poppins', family: 'Poppins, sans-serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Lora', family: 'Lora, serif' },
  { name: 'Oswald', family: 'Oswald, sans-serif' },
  { name: 'Outfit', family: 'Outfit, sans-serif' },
  { name: 'Pacifico', family: 'Pacifico, cursive' },
  { name: 'Fira Code', family: "'Fira Code', monospace" },
];

interface RightSidebarProps {
  mobileSection?: 'perspective' | 'watermark' | 'background' | 'text';
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ mobileSection }) => {
  const state = useStudioStore();
  const onChange = state.updateState;
  const reset3DPerspective = state.reset3DPerspective;
  const [showAllGradients, setShowAllGradients] = useState(false);
  const [showAllWaves, setShowAllWaves] = useState(false);
  const [showAllMeshes, setShowAllMeshes] = useState(false);
  const [showAllConfetti, setShowAllConfetti] = useState(false);
  const [showAllRadiant, setShowAllRadiant] = useState(false);
  const [activeTab, setActiveTab] = useState<'scaling' | 'tilt' | 'position'>('scaling');
  const [autoGradients, setAutoGradients] = useState<{ name: string; c1: string; c2: string }[]>(
    []
  );

  // Automatically extract primary image colors when imageSrc changes
  useEffect(() => {
    if (!state.imageSrc) {
      setAutoGradients([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const colors = extractDominantColors(img, 3);
      const variations = generateGradientVariations(colors);
      setAutoGradients(variations);
    };
    img.src = state.imageSrc;
  }, [state.imageSrc]);

  const gradientPresets = [
    { name: 'Pastel Sunset', c1: '#ffafcc', c2: '#ffc8dd' },
    { name: 'Pastel Sky', c1: '#a2d2ff', c2: '#bde0fe' },
    { name: 'Lavender Dream', c1: '#cdb4db', c2: '#ffc8dd' },
    { name: 'Cotton Candy', c1: '#cdb4db', c2: '#a2d2ff' },
    { name: 'Pastel Glow', c1: '#ffafcc', c2: '#bde0fe' },
    { name: 'Indigo Cyan', c1: '#4f46e5', c2: '#06b6d4' },
    { name: 'Sunset Amber', c1: '#f43f5e', c2: '#fbbf24' },
    { name: 'Emerald Teal', c1: '#059669', c2: '#34d399' },
    { name: 'Purple Pink', c1: '#a855f7', c2: '#ec4899' },
    { name: 'Dark Slate', c1: '#1e293b', c2: '#0f172a' },
    { name: 'Ocean Blue', c1: '#2563eb', c2: '#38bdf8' },
    { name: 'Rose Gold', c1: '#f43f5e', c2: '#fda4af' },
    { name: 'Midnight Violet', c1: '#3b0764', c2: '#7c3aed' },
    { name: 'Neon Lime', c1: '#15803d', c2: '#a3e635' },
    { name: 'Warm Flame', c1: '#c2410c', c2: '#f97316' },
    { name: 'Deep Space', c1: '#000000', c2: '#434343' },
    { name: 'Cosmic Purple', c1: '#654ea3', c2: '#eaafc8' },
    { name: 'Cherry Blossom', c1: '#ffb3d9', c2: '#ff66b2' },
    { name: 'Northern Lights', c1: '#00c6ff', c2: '#0072ff' },
    { name: 'Solar Burst', c1: '#ff512f', c2: '#dd2476' },
    { name: 'Lush Forest', c1: '#134e5e', c2: '#71b280' },
    { name: 'Peachy Beach', c1: '#ffedd5', c2: '#f97316' },
    { name: 'Electric Violet', c1: '#4776e6', c2: '#8e54e9' },
    { name: 'Cyberpunk Red', c1: '#ff0055', c2: '#7a00ff' },
    { name: 'Cool Silver', c1: '#eef2f3', c2: '#8e9eab' },
    { name: 'Golden Glow', c1: '#ffe000', c2: '#799f0c' },
    { name: 'Deep Ocean', c1: '#1cb5e0', c2: '#000046' },
    { name: 'Amethyst', c1: '#9d50bb', c2: '#6e48aa' },
    { name: 'Vibrant Magenta', c1: '#ee0979', c2: '#ff6a00' },
    { name: 'Aqua Splash', c1: '#136a8a', c2: '#267871' },
    { name: 'Royal Velvet', c1: '#4e54c8', c2: '#8f94fb' },
    { name: 'Mint Fresh', c1: '#00b09b', c2: '#96c93d' },
    { name: 'Twilight Haze', c1: '#3a1c71', c2: '#d76d77' },
    { name: 'Coral Flare', c1: '#ff5e62', c2: '#ff9966' },
    { name: 'Soft Peach', c1: '#fcd5ce', c2: '#ffb5a7' },
    { name: 'Frozen Berry', c1: '#e0c3fc', c2: '#8ec5fc' },
    { name: 'Sublime Blue', c1: '#00c6fb', c2: '#005bea' },
    { name: 'Velvet Midnight', c1: '#200122', c2: '#6f0000' },
    { name: 'Neon Coral', c1: '#f857a6', c2: '#ff5858' },
    { name: 'Laguna Breeze', c1: '#43e97b', c2: '#38f9d7' },
    { name: 'Apricot Dream', c1: '#f6d365', c2: '#fda085' },
    { name: 'Mystic Indigo', c1: '#614385', c2: '#516395' },
    { name: 'Sunkissed Citrus', c1: '#f12711', c2: '#f5af19' },
    { name: 'Pastel Lilac', c1: '#e2d1f9', c2: '#d0bdf4' },
    { name: 'Deep Nebula', c1: '#020024', c2: '#090979' },
    { name: 'Emerald Isle', c1: '#0ba360', c2: '#3cba92' },
    { name: 'Candy Floss', c1: '#fbc2eb', c2: '#a6c1ee' },
    { name: 'Zenith Blue', c1: '#1a2a6c', c2: '#b21f1f' },
  ];

  const visibleGradients = showAllGradients ? gradientPresets : gradientPresets.slice(0, 4);
  const visibleWaves = showAllWaves ? WAVE_PRESETS : WAVE_PRESETS.slice(0, 4);
  const visibleMeshes = showAllMeshes ? MESH_PRESETS : MESH_PRESETS.slice(0, 4);
  const visibleConfetti = showAllConfetti ? CONFETTI_PRESETS : CONFETTI_PRESETS.slice(0, 4);
  const visibleRadiant = showAllRadiant ? RADIANT_PRESETS : RADIANT_PRESETS.slice(0, 4);

  const renderPerspectiveSection = () => (
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
              <span className="font-mono text-slate-400">{state.padding}px</span>
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
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
              <span className="font-mono text-slate-400">{state.rotateX}°</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={state.rotateX}
              onChange={(e) => onChange({ rotateX: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
              <span className="font-mono text-slate-400">{state.rotateY}°</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={state.rotateY}
              onChange={(e) => onChange({ rotateY: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slot 1 Rotation */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">
                {state.layoutCount === 2 ? 'Rotation (Slot 1)' : 'Rotation'}
              </span>
              <span className="font-mono text-slate-400">{state.slot1Rotate || 0}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={state.slot1Rotate || 0}
              onChange={(e) => onChange({ slot1Rotate: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slot 2 Rotation (Only if 2 images selected) */}
          {state.layoutCount === 2 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-300">Rotation (Slot 2)</span>
                <span className="font-mono text-slate-400">{state.slot2Rotate || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={state.slot2Rotate || 0}
                onChange={(e) => onChange({ slot2Rotate: Number(e.target.value) })}
                className="w-full bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Perspective Depth</span>
              <span className="font-mono text-slate-400">{state.perspective}px</span>
            </div>
            <input
              type="range"
              min="500"
              max="2000"
              step="50"
              value={state.perspective}
              onChange={(e) => onChange({ perspective: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Position Offset & Alignment */}
      {activeTab === 'position' && (
        <div className="space-y-3.5 pt-1">

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">
                {state.layoutCount === 2 ? 'Horizontal (Slot 1)' : 'Horizontal Offset'}
              </span>
              <span className="font-mono text-slate-400">{state.offsetX}px</span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              value={state.offsetX}
              onChange={(e) => onChange({ offsetX: Number(e.target.value) })}
              onPointerDown={() => onChange({ isPositionDragging: true })}
              onPointerUp={() => onChange({ isPositionDragging: false })}
              onPointerCancel={() => onChange({ isPositionDragging: false })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">
                {state.layoutCount === 2 ? 'Vertical (Slot 1)' : 'Vertical Offset'}
              </span>
              <span className="font-mono text-slate-400">{state.offsetY}px</span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              value={state.offsetY}
              onChange={(e) => onChange({ offsetY: Number(e.target.value) })}
              onPointerDown={() => onChange({ isPositionDragging: true })}
              onPointerUp={() => onChange({ isPositionDragging: false })}
              onPointerCancel={() => onChange({ isPositionDragging: false })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {state.layoutCount === 2 && (
            <div className="pt-2 border-t border-neutral-800/80 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Horizontal (Slot 2)</span>
                  <span className="font-mono text-slate-400">{state.slot2OffsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={state.slot2OffsetX}
                  onChange={(e) => onChange({ slot2OffsetX: Number(e.target.value) })}
                  onPointerDown={() => onChange({ isPositionDragging: true })}
                  onPointerUp={() => onChange({ isPositionDragging: false })}
                  onPointerCancel={() => onChange({ isPositionDragging: false })}
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Vertical (Slot 2)</span>
                  <span className="font-mono text-slate-400">{state.slot2OffsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={state.slot2OffsetY}
                  onChange={(e) => onChange({ slot2OffsetY: Number(e.target.value) })}
                  onPointerDown={() => onChange({ isPositionDragging: true })}
                  onPointerUp={() => onChange({ isPositionDragging: false })}
                  onPointerCancel={() => onChange({ isPositionDragging: false })}
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
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

  const renderBackgroundSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Background Style
        </h3>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {(
          [
            'gradient',
            'wave',
            'mesh',
            'radiant',
            'confetti',
            'solid',
            'transparent',
            'image',
          ] as const
        ).map((bg) => (
          <button
            key={bg}
            onClick={() => onChange({ backgroundType: bg })}
            className={`py-1.5 px-0.5 text-[10px] sm:text-[11px] font-medium capitalize rounded-lg border transition-all truncate text-center ${
              state.backgroundType === bg
                ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
            }`}
            title={bg === 'transparent' ? 'No BG' : bg}
          >
            {bg === 'transparent' ? 'No BG' : bg}
          </button>
        ))}
      </div>

      {state.backgroundType === 'radiant' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Radiant Styles ({RADIANT_PRESETS.length})
            </span>
            <button
              onClick={() => setShowAllRadiant(!showAllRadiant)}
              className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                  showAllRadiant ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {visibleRadiant.map((radiant) => {
              const isSelected = (state.radiantPreset || 'radiant-1') === radiant.id;

              return (
                <button
                  key={radiant.id}
                  onClick={() => onChange({ radiantPreset: radiant.id })}
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={radiant.name}
                >
                  <RadiantBackground presetId={radiant.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.backgroundType === 'confetti' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          {/* Randomize Confetti Generator Button */}
          <button
            onClick={() => {
              const randomPreset = generateRandomConfettiPreset();
              onChange({
                confettiPreset: randomPreset.id,
                customConfettiObj: randomPreset,
              });
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-pastel-pink/20 to-[#a2d2ff]/20 hover:from-pastel-pink/30 hover:to-[#a2d2ff]/30 border border-pastel-pink/40 hover:border-pastel-pink rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer group"
          >
            <RefreshCw01 className="w-3.5 h-3.5 text-pastel-pink group-hover:rotate-180 transition-transform duration-500" />
            <span>Randomize Confetti</span>
          </button>

          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Preset Styles ({CONFETTI_PRESETS.length})
            </span>
            <button
              onClick={() => setShowAllConfetti(!showAllConfetti)}
              className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                  showAllConfetti ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {visibleConfetti.map((confetti) => {
              const isSelected =
                !state.customConfettiObj && (state.confettiPreset || 'confetti-1') === confetti.id;

              return (
                <button
                  key={confetti.id}
                  onClick={() =>
                    onChange({
                      confettiPreset: confetti.id,
                      customConfettiObj: null,
                    })
                  }
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={confetti.name}
                >
                  <ConfettiBackground presetId={confetti.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.backgroundType === 'mesh' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Mesh Styles ({MESH_PRESETS.length})
            </span>
            <button
              onClick={() => setShowAllMeshes(!showAllMeshes)}
              className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                  showAllMeshes ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {visibleMeshes.map((mesh) => {
              const isSelected = (state.meshPreset || 'mesh-1') === mesh.id;

              return (
                <button
                  key={mesh.id}
                  onClick={() => onChange({ meshPreset: mesh.id })}
                  className={`h-9 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={mesh.name}
                >
                  <MeshBackground presetId={mesh.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.backgroundType === 'wave' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Wave Styles ({WAVE_PRESETS.length})
            </span>
            <button
              onClick={() => setShowAllWaves(!showAllWaves)}
              className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                  showAllWaves ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {visibleWaves.map((wave) => {
              const isSelected = (state.wavePreset || 'wave-1') === wave.id;

              return (
                <button
                  key={wave.id}
                  onClick={() => onChange({ wavePreset: wave.id })}
                  className={`h-9 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={wave.name}
                >
                  <WaveBackground presetId={wave.id} />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.backgroundType === 'gradient' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          {/* Dynamic Colors Extracted from Uploaded Image */}
          {autoGradients.length > 0 && (
            <div className="space-y-2 pb-2 border-b border-neutral-800/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                <Stars02 className="w-3.5 h-3.5 text-pastel-pink" />
                <span className="uppercase tracking-wider text-[11px]">Auto Color Match</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {autoGradients.map((preset) => {
                  const isSelected =
                    state.gradient.color1.toLowerCase() === preset.c1.toLowerCase() &&
                    state.gradient.color2.toLowerCase() === preset.c2.toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      onClick={() =>
                        onChange({
                          gradient: { ...state.gradient, color1: preset.c1, color2: preset.c2 },
                        })
                      }
                      className={`h-8 rounded-lg border shadow-sm transition-all flex items-center justify-center cursor-pointer relative ${
                        isSelected
                          ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                          : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`,
                      }}
                      title={`Extracted: ${preset.name}`}
                    >
                      {isSelected && (
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                          <Check className="w-2.5 h-2.5 text-pastel-pink" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Gradient Palettes ({gradientPresets.length})
            </span>
            <button
              onClick={() => setShowAllGradients(!showAllGradients)}
              className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transform transition-transform duration-200 ${
                  showAllGradients ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {visibleGradients.map((preset) => {
              const isSelected =
                state.gradient.color1.toLowerCase() === preset.c1.toLowerCase() &&
                state.gradient.color2.toLowerCase() === preset.c2.toLowerCase();

              return (
                <button
                  key={preset.name}
                  onClick={() =>
                    onChange({
                      gradient: { ...state.gradient, color1: preset.c1, color2: preset.c2 },
                    })
                  }
                  className={`h-8 rounded-lg border shadow-sm transition-all flex items-center justify-center cursor-pointer relative ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})`,
                  }}
                  title={preset.name}
                >
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Angle</span>
              <span className="font-mono text-slate-400">{state.gradient.angle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={state.gradient.angle}
              onChange={(e) =>
                onChange({ gradient: { ...state.gradient, angle: Number(e.target.value) } })
              }
              className="w-full bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      )}

      {state.backgroundType === 'solid' && (
        <div className="pt-2 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Solid Color
            </label>
            <span className="font-mono text-xs text-slate-300 uppercase">
              {state.backgroundColor}
            </span>
          </div>

          {/* Untitled UI Style Color Picker Input */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner group hover:border-slate-600 transition-colors">
            <label
              className="w-7 h-7 rounded-lg cursor-pointer border border-slate-700 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative"
              style={{ backgroundColor: state.backgroundColor }}
              title="Choose custom color"
            >
              <input
                type="color"
                value={state.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
            <div className="flex-1 flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
              <span className="text-slate-500">#</span>
              <input
                type="text"
                value={state.backgroundColor.replace('#', '')}
                onChange={(e) => {
                  const hex = e.target.value.trim();
                  onChange({ backgroundColor: `#${hex}` });
                }}
                className="w-full bg-transparent text-slate-200 focus:outline-none uppercase font-mono"
                maxLength={6}
              />
            </div>
          </div>

          {/* Untitled UI Preset Color Swatches */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Swatches
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {[
                '#cdb4db',
                '#ffc8dd',
                '#ffafcc',
                '#bde0fe',
                '#a2d2ff',
                '#0f172a',
                '#1e293b',
                '#334155',
                '#0284c7',
                '#7c3aed',
                '#db2777',
                '#059669',
              ].map((color) => {
                const isSelected = state.backgroundColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    onClick={() => onChange({ backgroundColor: color })}
                    className={`h-6 rounded-md border shadow-xs transition-all cursor-pointer flex items-center justify-center relative ${
                      isSelected
                        ? 'border-white ring-2 ring-pastel-pink scale-110'
                        : 'border-slate-700/70 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {state.backgroundType === 'image' && (
        <div className="pt-2 border-t border-slate-800/60 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Background Image (Upload or URL)
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-center p-2.5 border-2 border-dashed border-neutral-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-neutral-950/80 hover:bg-neutral-800/80 transition-all text-center">
                <span className="text-xs font-medium text-slate-300">
                  {state.bgImageUrl ? 'Change Background File' : 'Upload Background Image File'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          onChange({ bgImageUrl: ev.target.result as string });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={state.bgImageUrl || ''}
                  onChange={(e) => onChange({ bgImageUrl: e.target.value })}
                  placeholder="Or paste image URL (https://...)"
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pastel-pink transition-colors"
                />
                {state.bgImageUrl && (
                  <button
                    onClick={() => onChange({ bgImageUrl: null })}
                    className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors shrink-0"
                    title="Clear Image URL"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Background Blur</span>
              <span className="font-mono text-slate-400">{state.bgBlur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={state.bgBlur}
              onChange={(e) => onChange({ bgBlur: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderWatermarkSection = () => (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Watermark</h3>
      </div>

      {/* Watermark Variant Options */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Style Variant
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'none', label: 'None' },
            { id: 'default', label: 'Default' },
            { id: 'dark', label: 'Dark' },
            { id: 'glass', label: 'Glass' },
            { id: 'badge', label: 'Badge' },
            { id: 'dark-badge', label: 'Dark Badge' },
          ].map((wt) => {
            const isSelected = (state.watermarkType || 'none') === wt.id;
            return (
              <button
                key={wt.id}
                onClick={() => onChange({ watermarkType: wt.id as any })}
                className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-all truncate text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {wt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Position and Size options (Only shown if watermarkType !== 'none') */}
      {state.watermarkType !== 'none' && (
        <div className="space-y-3.5 pt-2 border-t border-neutral-800/80 animate-in fade-in duration-150">
          {/* Watermark Position */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Position
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'top-left', label: 'Top Left', dotPos: 'top-1 left-1' },
                {
                  id: 'top-center',
                  label: 'Top Center',
                  dotPos: 'top-1 left-1/2 -translate-x-1/2',
                },
                { id: 'top-right', label: 'Top Right', dotPos: 'top-1 right-1' },
                { id: 'bottom-left', label: 'Bottom Left', dotPos: 'bottom-1 left-1' },
                {
                  id: 'bottom-center',
                  label: 'Bottom Center',
                  dotPos: 'bottom-1 left-1/2 -translate-x-1/2',
                },
                { id: 'bottom-right', label: 'Bottom Right', dotPos: 'bottom-1 right-1' },
              ].map((pos) => {
                const isSelected = (state.watermarkPosition || 'bottom-right') === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => onChange({ watermarkPosition: pos.id as any })}
                    className={`h-11 rounded-lg border transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-pastel-pink/15 border-pastel-pink text-pastel-pink font-bold shadow-xs ring-1 ring-pastel-pink'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                    }`}
                    title={pos.label}
                  >
                    {/* Outer Canvas Representation Box */}
                    <div
                      className={`w-8 h-6 rounded border relative transition-colors ${
                        isSelected
                          ? 'border-pastel-pink bg-pastel-pink/10'
                          : 'border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      {/* Inner Watermark Location Box Indicator */}
                      <div
                        className={`absolute w-1.5 h-1 rounded-xs transition-colors ${pos.dotPos} ${
                          isSelected ? 'bg-pastel-pink' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Watermark Size */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Size
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'sm', label: 'Small' },
                { id: 'md', label: 'Medium' },
                { id: 'lg', label: 'Large' },
              ].map((sz) => {
                const isSelected = (state.watermarkSize || 'md') === sz.id;
                return (
                  <button
                    key={sz.id}
                    onClick={() => onChange({ watermarkSize: sz.id as any })}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#a2d2ff]/20 border-[#a2d2ff] text-[#a2d2ff] font-bold shadow-xs'
                        : 'bg-neutral-950/80 border-neutral-800 text-slate-400 hover:bg-neutral-800/80 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTextSection = () => {
    const selectedLayer = state.textLayers.find((l) => l.id === state.selectedTextLayerId);

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
        {state.textLayers.length === 0 ? (
          <div className="text-center py-6 px-3 bg-neutral-950/80 rounded-xl border border-dashed border-neutral-800 space-y-1.5">
            <p className="text-xs font-medium text-slate-400">No text layers added yet</p>
            <p className="text-[11px] text-slate-500">
              Click "+ Add Text" to overlay headlines, captions, or badges.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Layers ({state.textLayers.length}):
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {state.textLayers.map((layer, index) => {
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
              <select
                value={selectedLayer.fontFamily}
                onChange={(e) =>
                  state.updateTextLayer(selectedLayer.id, { fontFamily: e.target.value })
                }
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-pastel-blue font-bold outline-none cursor-pointer focus:border-pastel-blue transition-colors"
              >
                {GOOGLE_FONTS.map((font) => (
                  <option
                    key={font.name}
                    value={font.name}
                    className="bg-neutral-900 text-white font-normal"
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Size</span>
                  <span className="font-mono text-slate-400">{selectedLayer.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="200"
                  value={selectedLayer.fontSize}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { fontSize: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Weight
                </label>
                <select
                  value={selectedLayer.fontWeight}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, {
                      fontWeight: e.target.value as any,
                    })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="600">SemiBold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">ExtraBold (800)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>
            </div>

            {/* Alignment & Style Options */}
            <div className="grid grid-cols-2 gap-3">
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

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Style</label>
                <button
                  onClick={() =>
                    state.updateTextLayer(selectedLayer.id, {
                      fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  className={`w-full py-1 text-xs font-semibold italic rounded-lg border transition-all cursor-pointer ${
                    selectedLayer.fontStyle === 'italic'
                      ? 'bg-pastel-blue/20 border-pastel-blue text-pastel-blue'
                      : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Italic
                </button>
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

            {/* Position Offsets X / Y */}
            <div className="space-y-2 pt-1 border-t border-neutral-800/60">
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
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
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
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Opacity</span>
                  <span className="font-mono text-slate-400">{selectedLayer.opacity ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.opacity ?? 100}
                  onChange={(e) =>
                    state.updateTextLayer(selectedLayer.id, { opacity: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 rounded-lg cursor-pointer"
                />
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
                  onClick={() =>
                    state.updateTextLayer(selectedLayer.id, { position: 'above' })
                  }
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
              <span className="text-xs font-medium text-slate-300">Drop Shadow</span>
              <button
                onClick={() =>
                  state.updateTextLayer(selectedLayer.id, { shadow: !selectedLayer.shadow })
                }
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  selectedLayer.shadow ? 'bg-pastel-blue' : 'bg-slate-800'
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

  if (mobileSection) {
    if (mobileSection === 'perspective') return renderPerspectiveSection();
    if (mobileSection === 'text') return renderTextSection();
    if (mobileSection === 'watermark') return renderWatermarkSection();
    if (mobileSection === 'background') return renderBackgroundSection();
    return null;
  }

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full overflow-y-auto p-4 space-y-4 text-slate-200 shrink-0">
      {renderPerspectiveSection()}
      {renderTextSection()}
      {renderBackgroundSection()}
      {renderWatermarkSection()}
    </div>
  );
};
