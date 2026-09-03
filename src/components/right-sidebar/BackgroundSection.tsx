import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { ChevronDown, Check, Stars02, RefreshCw01 } from '@untitledui/icons';
import { extractDominantColors, generateGradientVariations } from '../../utils/colorExtractor';
import { WAVE_PRESETS } from '../../utils/wavePresets';
import { MESH_PRESETS } from '../../utils/meshPresets';
import { CONFETTI_PRESETS, generateRandomConfettiPreset } from '../../utils/confettiPresets';
import { RADIANT_PRESETS } from '../../utils/radiantPresets';
import { SHADESHIFTER_PRESETS } from '../../utils/shadeshifterPresets';
import { SPECTRAL_PRESETS } from '../../utils/spectralPresets';
import { LINEAR_SWATCH_PRESETS } from '../../utils/linearSwatchPresets';
import { GRADIENT_PRESETS } from '../../utils/gradientPresets';
import { PATTERN_PRESETS } from '../../utils/patternPresets';
import { WaveBackground } from '../WaveBackground';
import { MeshBackground } from '../MeshBackground';
import { ConfettiBackground } from '../ConfettiBackground';
import { RadiantBackground } from '../RadiantBackground';
import { ShadeshifterBackground } from '../ShadeshifterBackground';
import { SpectralBackground } from '../SpectralBackground';
import {
  ANIMATED_GRADIENT_PRESETS,
  ANIMATED_MESH_PRESETS,
  AnimatedGradientBackground,
  AnimatedMeshBackground,
} from '../AnimatedBackgrounds';
import { Toggle } from '../Toggle';
import { BackgroundStyleSelect, MiniFocalPad } from './shared';

export const BackgroundSection: React.FC = () => {
  const state = useStudioStore();
  const onChange = state.updateState;

  const [showAllGradients, setShowAllGradients] = useState(false);
  const [showAllShadeshifter, setShowAllShadeshifter] = useState(false);
  const [showAllSpectral, setShowAllSpectral] = useState(false);
  const [showAllAnimatedGradients, setShowAllAnimatedGradients] = useState(false);
  const [showAllAnimatedMeshes, setShowAllAnimatedMeshes] = useState(false);
  const [showAllWaves, setShowAllWaves] = useState(false);
  const [showAllMeshes, setShowAllMeshes] = useState(false);
  const [showAllConfetti, setShowAllConfetti] = useState(false);
  const [showAllRadiant, setShowAllRadiant] = useState(false);
  const [showAllLinearSwatches, setShowAllLinearSwatches] = useState(false);
  const [showAllPatterns, setShowAllPatterns] = useState(false);
  const [autoGradients, setAutoGradients] = useState<{ name: string; c1: string; c2: string }[]>([]);

  // Automatically extract primary image colors when imageSrc changes
  useEffect(() => {
    if (!state.imageSrc || state.mediaType === 'video') {
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
  }, [state.imageSrc, state.mediaType]);

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Background Style
        </h3>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Style Type
        </label>
        <BackgroundStyleSelect
          value={state.backgroundType}
          onChange={(type) => {
            if (type === 'shadeshifter' && (state.bgGrain === undefined || state.bgGrain === 0)) {
              onChange({ backgroundType: type, bgGrain: 35 });
            } else {
              onChange({ backgroundType: type });
            }
          }}
        />
      </div>

      {state.backgroundType === 'animatedGradient' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Animated Gradient Presets ({ANIMATED_GRADIENT_PRESETS.length})
            </span>
            {showAllAnimatedGradients && (
              <button
                type="button"
                onClick={() => setShowAllAnimatedGradients(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2 ${
              showAllAnimatedGradients ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllAnimatedGradients
              ? ANIMATED_GRADIENT_PRESETS.slice(0, 3)
              : ANIMATED_GRADIENT_PRESETS
            ).map((preset) => {
              const isSelected = (state.animatedGradientPreset || 'anim-grad-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ animatedGradientPreset: preset.id })}
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <AnimatedGradientBackground presetId={preset.id} isStatic />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllAnimatedGradients && ANIMATED_GRADIENT_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllAnimatedGradients(true)}
                  title={`Show all ${ANIMATED_GRADIENT_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <AnimatedGradientBackground presetId={ANIMATED_GRADIENT_PRESETS[3].id} isStatic />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{ANIMATED_GRADIENT_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'animatedMesh' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Animated Mesh Presets ({ANIMATED_MESH_PRESETS.length})
            </span>
            {showAllAnimatedMeshes && (
              <button
                type="button"
                onClick={() => setShowAllAnimatedMeshes(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllAnimatedMeshes ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllAnimatedMeshes
              ? ANIMATED_MESH_PRESETS.slice(0, 3)
              : ANIMATED_MESH_PRESETS
            ).map((preset) => {
              const isSelected = (state.animatedMeshPreset || 'anim-mesh-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ animatedMeshPreset: preset.id })}
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <AnimatedMeshBackground presetId={preset.id} isStatic />
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllAnimatedMeshes && ANIMATED_MESH_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllAnimatedMeshes(true)}
                  title={`Show all ${ANIMATED_MESH_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <AnimatedMeshBackground presetId={ANIMATED_MESH_PRESETS[3].id} isStatic />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{ANIMATED_MESH_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'shadeshifter' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Shadeshifter Styles ({SHADESHIFTER_PRESETS.length})
            </span>
            {showAllShadeshifter && (
              <button
                type="button"
                onClick={() => setShowAllShadeshifter(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllShadeshifter ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllShadeshifter ? SHADESHIFTER_PRESETS.slice(0, 3) : SHADESHIFTER_PRESETS).map(
              (preset) => {
                const isSelected = (state.shadeshifterPreset || 'shadeshifter-1') === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => onChange({ shadeshifterPreset: preset.id })}
                    className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                        : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    title={preset.name}
                  >
                    <ShadeshifterBackground
                      presetId={preset.id}
                      grainOpacity={state.bgGrain ?? 35}
                      blur={state.shadeshifterBlur ?? 40}
                    />
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                        <Check className="w-3 h-3 text-pastel-pink" />
                      </div>
                    )}
                  </button>
                );
              }
            )}

            {!showAllShadeshifter && SHADESHIFTER_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllShadeshifter(true)}
                  title={`Show all ${SHADESHIFTER_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <ShadeshifterBackground
                    presetId={SHADESHIFTER_PRESETS[3].id}
                    grainOpacity={state.bgGrain ?? 35}
                    blur={state.shadeshifterBlur ?? 40}
                  />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{SHADESHIFTER_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Mesh Blur Depth Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Mesh Blur Depth</span>
              <span className="font-mono text-slate-400">{state.shadeshifterBlur ?? 40}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={state.shadeshifterBlur ?? 40}
              onChange={(e) => onChange({ shadeshifterBlur: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {state.backgroundType === 'spectral' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Spectral Styles ({SPECTRAL_PRESETS.length})
            </span>
            {showAllSpectral && (
              <button
                type="button"
                onClick={() => setShowAllSpectral(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllSpectral ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllSpectral ? SPECTRAL_PRESETS.slice(0, 3) : SPECTRAL_PRESETS).map((preset) => {
              const isSelected = (state.spectralPreset || 'spectral-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() =>
                    onChange({
                      spectralPreset: preset.id,
                      spectralAngle: preset.angle ?? 135,
                      spectralBlur: preset.blur ?? 45,
                    })
                  }
                  className={`h-10 rounded-xl border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  title={`${preset.name} (${preset.theme === 'dark' ? 'Dark' : 'Light'})`}
                >
                  <SpectralBackground
                    presetId={preset.id}
                    blur={state.spectralBlur}
                    angle={state.spectralAngle}
                  />

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm relative z-10">
                      <Check className="w-3 h-3 text-pastel-pink" />
                    </div>
                  )}
                </button>
              );
            })}

            {!showAllSpectral && SPECTRAL_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllSpectral(true)}
                  title={`Show all ${SPECTRAL_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <SpectralBackground
                    presetId={SPECTRAL_PRESETS[3].id}
                    blur={state.spectralBlur}
                    angle={state.spectralAngle}
                  />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{SPECTRAL_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Spectrum Angle Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Spectrum Angle</span>
              <span className="font-mono text-slate-400">{state.spectralAngle ?? 135}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={state.spectralAngle ?? 135}
              onChange={(e) => onChange({ spectralAngle: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Prism Blur Depth Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Prism Blur Depth</span>
              <span className="font-mono text-slate-400">{state.spectralBlur ?? 45}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={state.spectralBlur ?? 45}
              onChange={(e) => onChange({ spectralBlur: Number(e.target.value) })}
              className="w-full bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {state.backgroundType === 'radiant' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Radiant Styles ({RADIANT_PRESETS.length})
            </span>
            {showAllRadiant && (
              <button
                type="button"
                onClick={() => setShowAllRadiant(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllRadiant ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllRadiant ? RADIANT_PRESETS.slice(0, 3) : RADIANT_PRESETS).map((radiant) => {
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

            {!showAllRadiant && RADIANT_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllRadiant(true)}
                  title={`Show all ${RADIANT_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <RadiantBackground presetId={RADIANT_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{RADIANT_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
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
            {showAllConfetti && (
              <button
                type="button"
                onClick={() => setShowAllConfetti(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllConfetti ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllConfetti ? CONFETTI_PRESETS.slice(0, 3) : CONFETTI_PRESETS).map(
              (confetti) => {
                const isSelected =
                  !state.customConfettiObj &&
                  (state.confettiPreset || 'confetti-1') === confetti.id;

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
              }
            )}

            {!showAllConfetti && CONFETTI_PRESETS.length > 3 && (
              <div className="relative h-10">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllConfetti(true)}
                  title={`Show all ${CONFETTI_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <ConfettiBackground presetId={CONFETTI_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{CONFETTI_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'mesh' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Mesh Styles ({MESH_PRESETS.length})
            </span>
            {showAllMeshes && (
              <button
                type="button"
                onClick={() => setShowAllMeshes(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllMeshes ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllMeshes ? MESH_PRESETS.slice(0, 3) : MESH_PRESETS).map((mesh) => {
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

            {!showAllMeshes && MESH_PRESETS.length > 3 && (
              <div className="relative h-9">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllMeshes(true)}
                  title={`Show all ${MESH_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <MeshBackground presetId={MESH_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{MESH_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {state.backgroundType === 'wave' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Wave Styles ({WAVE_PRESETS.length})
            </span>
            {showAllWaves && (
              <button
                type="button"
                onClick={() => setShowAllWaves(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllWaves ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllWaves ? WAVE_PRESETS.slice(0, 3) : WAVE_PRESETS).map((wave) => {
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

            {!showAllWaves && WAVE_PRESETS.length > 3 && (
              <div className="relative h-9">
                <div className="absolute inset-0 rounded-xl bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllWaves(true)}
                  title={`Show all ${WAVE_PRESETS.length} presets`}
                  className="relative z-10 w-full h-full rounded-xl border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                >
                  <WaveBackground presetId={WAVE_PRESETS[3].id} />
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white z-10">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{WAVE_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
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
              Gradient Palettes ({GRADIENT_PRESETS.length})
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
            className={`grid grid-cols-4 gap-2.5 ${
              showAllGradients ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllGradients ? GRADIENT_PRESETS.slice(0, 3) : GRADIENT_PRESETS).map((preset) => {
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

      {state.backgroundType === 'linearSwatches' && (
        <div className="space-y-3 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              Linear Swatches ({LINEAR_SWATCH_PRESETS.length})
            </span>
            {showAllLinearSwatches && (
              <button
                type="button"
                onClick={() => setShowAllLinearSwatches(false)}
                className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Collapse presets"
              >
                <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`grid grid-cols-4 gap-2.5 ${
              showAllLinearSwatches ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
            }`}
          >
            {(!showAllLinearSwatches
              ? LINEAR_SWATCH_PRESETS.slice(0, 3)
              : LINEAR_SWATCH_PRESETS
            ).map((preset) => {
              const isSelected = (state.linearSwatchesPreset || 'ls-1') === preset.id;

              return (
                <button
                  key={preset.id}
                  onClick={() => onChange({ linearSwatchesPreset: preset.id })}
                  className={`h-8 rounded-lg border shadow-sm transition-all flex items-center justify-center cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                      : 'border-slate-700/80 hover:scale-105 opacity-90 hover:opacity-100'
                  }`}
                  style={{ background: preset.css }}
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

            {!showAllLinearSwatches && LINEAR_SWATCH_PRESETS.length > 3 && (
              <div className="relative h-8">
                <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                <button
                  type="button"
                  onClick={() => setShowAllLinearSwatches(true)}
                  title={`Show all ${LINEAR_SWATCH_PRESETS.length} swatches`}
                  className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                  style={{ background: LINEAR_SWATCH_PRESETS[3].css }}
                >
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                    <span className="text-[10px] font-bold tracking-tight">
                      +{LINEAR_SWATCH_PRESETS.length - 3}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                </button>
              </div>
            )}
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
        </div>
      )}

      {/* Global Background Adjustments (Grain & Blur) */}
      <div className="pt-3 border-t border-slate-800/60 space-y-3">
        {/* Grain Effect Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Grain Effect</span>
            <span className="font-mono text-slate-400">{state.bgGrain || 0}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={state.bgGrain || 0}
            onChange={(e) => onChange({ bgGrain: Number(e.target.value) })}
            className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
          />
        </div>

        {/* Background Blur Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-slate-300">Background Blur</span>
            <span className="font-mono text-slate-400">{state.bgBlur || 0}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={state.bgBlur || 0}
            onChange={(e) => onChange({ bgBlur: Number(e.target.value) })}
            className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
          />
        </div>

        {/* Lens Blur (Depth of Field) Controls */}
        <div className="pt-3 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <Toggle
              isSelected={state.lensBlurEnabled}
              onChange={(checked) => onChange({ lensBlurEnabled: checked })}
              label="LENS BLUR (DEPTH OF FIELD)"
              size="sm"
            />
          </div>

          {state.lensBlurEnabled && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* 2D Mini Pad for Focal Point */}
              <MiniFocalPad
                focalX={state.lensBlurFocalX ?? 50}
                focalY={state.lensBlurFocalY ?? 50}
                onChange={(x, y) => onChange({ lensBlurFocalX: x, lensBlurFocalY: y })}
              />

              {/* Quick Focal Position Presets */}
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Target Presets:</span>
                <div className="flex items-center gap-1">
                  {[
                    { label: 'TL', x: 25, y: 25 },
                    { label: 'TR', x: 75, y: 25 },
                    { label: 'Center', x: 50, y: 50 },
                    { label: 'BL', x: 25, y: 75 },
                    { label: 'BR', x: 75, y: 75 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onChange({ lensBlurFocalX: p.x, lensBlurFocalY: p.y })}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-900 border border-neutral-800 hover:border-pastel-pink/50 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lens Blur Amount Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Blur Intensity</span>
                  <span className="font-mono text-slate-400">{state.lensBlurAmount || 0}px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={state.lensBlurAmount || 24}
                  onChange={(e) => onChange({ lensBlurAmount: Number(e.target.value) })}
                  className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
                />
              </div>

              {/* Focus Clear Radius Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Focal Sharp Area</span>
                  <span className="font-mono text-slate-400">{state.lensBlurRadius || 20}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={state.lensBlurRadius || 20}
                  onChange={(e) => onChange({ lensBlurRadius: Number(e.target.value) })}
                  className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pattern Overlay Add-on Controls */}
        <div className="pt-3 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <Toggle
              isSelected={state.bgPatternEnabled}
              onChange={(checked) => onChange({ bgPatternEnabled: checked })}
              label="PATTERN OVERLAY"
              size="sm"
            />
          </div>

          {state.bgPatternEnabled && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Pattern Presets Grid with Box Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                    Pattern Styles ({PATTERN_PRESETS.length})
                  </span>
                  {showAllPatterns && (
                    <button
                      type="button"
                      onClick={() => setShowAllPatterns(false)}
                      className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Collapse patterns"
                    >
                      <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
                    </button>
                  )}
                </div>

                <div
                  className={`grid grid-cols-4 gap-2.5 ${
                    showAllPatterns ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
                  }`}
                >
                  {(!showAllPatterns ? PATTERN_PRESETS.slice(0, 3) : PATTERN_PRESETS).map(
                    (pattern) => {
                      const isSelected = (state.bgPatternPreset || 'pattern-1') === pattern.id;

                      return (
                        <button
                          key={pattern.id}
                          type="button"
                          onClick={() => onChange({ bgPatternPreset: pattern.id })}
                          className={`h-8 rounded-lg border shadow-sm transition-all flex items-center justify-center cursor-pointer relative bg-slate-900 overflow-hidden ${
                            isSelected
                              ? 'border-white ring-2 ring-pastel-pink scale-105 shadow-md shadow-pastel-pink/30'
                              : 'border-slate-700/80 hover:border-slate-500 hover:scale-105 opacity-90 hover:opacity-100'
                          }`}
                          style={{
                            backgroundImage: pattern.getSvgUrl(state.bgPatternColor || '#9C92AC'),
                            backgroundRepeat: 'repeat',
                          }}
                          title={pattern.name}
                        >
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white shadow-sm">
                              <Check className="w-3 h-3 text-pastel-pink" />
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}

                  {!showAllPatterns && PATTERN_PRESETS.length > 3 && (
                    <div className="relative h-8">
                      {/* Tilted background card */}
                      <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                      {/* Foreground main card */}
                      <button
                        type="button"
                        onClick={() => setShowAllPatterns(true)}
                        title={`Show all ${PATTERN_PRESETS.length} patterns`}
                        className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden bg-slate-900"
                        style={{
                          backgroundImage: PATTERN_PRESETS[3].getSvgUrl(
                            state.bgPatternColor || '#9C92AC'
                          ),
                          backgroundRepeat: 'repeat',
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                          <span className="text-[10px] font-bold tracking-tight">
                            +{PATTERN_PRESETS.length - 3}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Color Picker */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-300">Pattern Color</span>
                  <span className="font-mono text-xs text-slate-300 uppercase">
                    {state.bgPatternColor || '#9C92AC'}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner group hover:border-slate-600 transition-colors">
                  <label
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-700 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative"
                    style={{ backgroundColor: state.bgPatternColor || '#9C92AC' }}
                    title="Choose pattern color"
                  >
                    <input
                      type="color"
                      value={state.bgPatternColor || '#9C92AC'}
                      onChange={(e) => onChange({ bgPatternColor: e.target.value })}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <div className="flex-1 flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                    <span className="text-slate-500">#</span>
                    <input
                      type="text"
                      value={(state.bgPatternColor || '#9C92AC').replace('#', '')}
                      onChange={(e) => {
                        const hex = e.target.value.trim();
                        onChange({ bgPatternColor: `#${hex}` });
                      }}
                      className="w-full bg-transparent text-slate-200 focus:outline-none uppercase font-mono"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Pattern Color Quick Swatches */}
                <div className="grid grid-cols-7 gap-1.5 mt-2">
                  {[
                    '#9C92AC',
                    '#FFFFFF',
                    '#94A3B8',
                    '#F472B6',
                    '#38BDF8',
                    '#F59E0B',
                    '#0F172A',
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onChange({ bgPatternColor: color })}
                      className={`h-6 rounded-md border transition-all cursor-pointer ${
                        (state.bgPatternColor || '#9C92AC').toLowerCase() === color.toLowerCase()
                          ? 'border-pastel-pink ring-2 ring-pastel-pink/30 scale-105'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Pattern Opacity Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-300">Pattern Opacity</span>
                  <span className="font-mono text-slate-400">{state.bgPatternOpacity ?? 40}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={state.bgPatternOpacity ?? 40}
                  onChange={(e) => onChange({ bgPatternOpacity: Number(e.target.value) })}
                  className="w-full bg-slate-800 rounded-lg accent-pastel-pink cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
