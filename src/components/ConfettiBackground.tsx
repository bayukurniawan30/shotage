import React from 'react';
import { CONFETTI_PRESETS } from '../utils/confettiPresets';

interface ConfettiBackgroundProps {
  presetId?: string;
  customPreset?: any;
  isMini?: boolean;
}

export const ConfettiBackground: React.FC<ConfettiBackgroundProps> = ({
  presetId = 'confetti-1',
  customPreset,
  isMini = false,
}) => {
  const preset = customPreset || CONFETTI_PRESETS.find((c) => c.id === presetId) || CONFETTI_PRESETS[0];

  const renderShape = (shape: (typeof preset.shapes)[0], index: number) => {
    const { type, x, y, size, color, rotation, opacity } = shape;
    // Scale particle size down for small previews so it looks delicate and proportional
    const effectiveSize = isMini ? Math.max(2.5, Math.round(size * 0.45 * 10) / 10) : size;
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: `${effectiveSize * 2}px`,
      height: `${effectiveSize * 2}px`,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      opacity: isMini ? Math.min(1, opacity + 0.15) : opacity,
      pointerEvents: 'none',
    };

    switch (type) {
      case 'rect':
        return (
          <div
            key={index}
            style={{
              ...style,
              backgroundColor: color,
              borderRadius: isMini ? '1px' : '4px',
            }}
          />
        );

      case 'triangle':
        return (
          <div
            key={index}
            style={{
              ...style,
              width: 0,
              height: 0,
              borderLeft: `${effectiveSize}px solid transparent`,
              borderRight: `${effectiveSize}px solid transparent`,
              borderBottom: `${effectiveSize * 2}px solid ${color}`,
            }}
          />
        );

      case 'star':
        return (
          <svg key={index} style={style} viewBox="0 0 24 24" fill={color}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );

      case 'circle':
      default:
        return (
          <div
            key={index}
            style={{
              ...style,
              backgroundColor: color,
              borderRadius: '9999px',
            }}
          />
        );
    }
  };

  const rawShapes = preset.shapes || [];
  // For mini preview cards: select a well-spaced subset (around 12-14 particles) so the tiny space isn't overwhelmed
  const shapesToRender = isMini
    ? rawShapes.filter((_: any, idx: number) => idx % 3 === 0).slice(0, 14)
    : rawShapes;

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ backgroundColor: preset.bgColor }}
    >
      {shapesToRender.map((shape: any, i: number) => renderShape(shape, i))}
    </div>
  );
};
