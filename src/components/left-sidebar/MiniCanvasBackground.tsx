import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { LINEAR_SWATCH_PRESETS } from '../../utils/linearSwatchPresets';
import { MeshBackground } from '../MeshBackground';
import { WaveBackground } from '../WaveBackground';
import { ShadeshifterBackground } from '../ShadeshifterBackground';
import { SpectralBackground } from '../SpectralBackground';
import { RadiantBackground } from '../RadiantBackground';
import { AnimatedGradientBackground, AnimatedMeshBackground } from '../AnimatedBackgrounds';
import { ConfettiBackground } from '../ConfettiBackground';
import { FlowBackground } from '../FlowBackground';
import { MistBackground } from '../MistBackground';

export const MiniCanvasBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const state = useStudioStore();
  const bgType = state.backgroundType || 'gradient';

  let content: React.ReactNode = null;

  if (bgType === 'animatedGradient') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatedGradientBackground
          presetId={state.animatedGradientPreset || 'anim-grad-1'}
          isStatic
        />
      </div>
    );
  } else if (bgType === 'animatedMesh') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatedMeshBackground
          presetId={state.animatedMeshPreset || 'anim-mesh-1'}
          isStatic
        />
      </div>
    );
  } else if (bgType === 'mesh') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MeshBackground presetId={state.meshPreset || 'mesh-1'} />
      </div>
    );
  } else if (bgType === 'flow') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FlowBackground
          colors={state.flowColors || ['#EAF4FC', '#1E50A2', '#F09199', '#895B8A']}
          speed={0}
          isMini
        />
      </div>
    );
  } else if (bgType === 'mist') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MistBackground
          stops={state.mistStops}
          ranges={state.mistRanges}
          horizon={state.mistHorizon}
          peaks={state.mistPeaks}
          sharp={state.mistSharp}
          haze={state.mistHaze}
          seed={state.mistSeed}
          isMini
        />
      </div>
    );
  } else if (bgType === 'wave') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <WaveBackground presetId={state.wavePreset || 'wave-1'} />
      </div>
    );
  } else if (bgType === 'shadeshifter') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ShadeshifterBackground
          presetId={state.shadeshifterPreset || 'shadeshifter-1'}
          blur={25}
          grainOpacity={0}
        />
      </div>
    );
  } else if (bgType === 'spectral') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <SpectralBackground presetId={state.spectralPreset || 'spectral-1'} blur={20} />
      </div>
    );
  } else if (bgType === 'radiant') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <RadiantBackground presetId={state.radiantPreset || 'radiant-1'} />
      </div>
    );
  } else if (bgType === 'confetti') {
    content = (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ConfettiBackground
          presetId={state.confettiPreset || 'confetti-1'}
          customPreset={state.customConfettiObj}
          isMini
        />
      </div>
    );
  } else if (bgType === 'gradient') {
    const angle = state.gradient?.angle ?? 135;
    const c1 = state.gradient?.color1 || '#ffafcc';
    const c2 = state.gradient?.color2 || '#a2d2ff';
    content = (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(${angle}deg, ${c1}, ${c2})` }}
      />
    );
  } else if (bgType === 'linearSwatches') {
    const preset =
      LINEAR_SWATCH_PRESETS.find((p) => p.id === state.linearSwatchesPreset) ||
      LINEAR_SWATCH_PRESETS[0];
    content = (
      <div className="absolute inset-0 pointer-events-none" style={{ background: preset.css }} />
    );
  } else if (bgType === 'solid') {
    content = (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: state.backgroundColor || '#0f172a' }}
      />
    );
  } else if (bgType === 'image' && state.bgImageUrl) {
    content = (
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${state.bgImageUrl})` }}
      />
    );
  } else if (bgType === 'transparent') {
    content = (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #1e1e24 25%, transparent 25%), linear-gradient(-45deg, #1e1e24 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e1e24 75%), linear-gradient(-45deg, transparent 75%, #1e1e24 75%)`,
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }}
      />
    );
  } else {
    content = <div className="absolute inset-0 bg-neutral-900 pointer-events-none" />;
  }

  return <div className={`absolute inset-0 pointer-events-none ${className}`}>{content}</div>;
};
