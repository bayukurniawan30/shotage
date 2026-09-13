import React from 'react';
import * as PhosphorIcons from '@phosphor-icons/react';
import type { MotionPathConfig, MotionPathType } from '../types/animationTypes';
import { StepperSlider } from './StepperSlider';
import { Toggle } from './Toggle';

interface MotionPathControlProps {
  value?: MotionPathConfig;
  disabled?: boolean;
  keyframeCount: number;
  onChange: (value: MotionPathConfig | undefined) => void;
}

const PATH_OPTIONS: Array<{ type: MotionPathType; label: string; glyph: string }> = [
  { type: 'linear', label: 'Straight', glyph: '—' },
  { type: 'arc-up', label: 'Arc up', glyph: '⌒' },
  { type: 'arc-down', label: 'Arc down', glyph: '⌣' },
  { type: 's-curve', label: 'S-curve', glyph: '∿' },
];

export const MotionPathControl: React.FC<MotionPathControlProps> = ({
  value,
  disabled = false,
  keyframeCount,
  onChange,
}) => {
  const unavailable = disabled || keyframeCount < 2;
  const curvature = value?.curvature ?? 0.25;

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PhosphorIcons.PathIcon className="h-3.5 w-3.5 text-pastel-blue" />
          <span className="text-[10px] font-semibold text-slate-400">Motion path</span>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[9px] font-semibold text-slate-500 transition-colors hover:text-rose-300 cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      {keyframeCount < 2 && (
        <p className="mb-2 text-[9px] leading-relaxed text-slate-500">
          Add at least two position keyframes to create a path.
        </p>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        {PATH_OPTIONS.map((option) => {
          const active = value?.type === option.type;
          return (
            <button
              key={option.type}
              type="button"
              disabled={unavailable}
              onClick={() =>
                onChange({
                  type: option.type,
                  curvature,
                  autoOrient: value?.autoOrient ?? false,
                })
              }
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[10px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? 'border-pastel-blue/60 bg-pastel-blue/15 text-pastel-blue'
                  : 'border-neutral-800 bg-neutral-950 text-slate-400 hover:border-neutral-700 hover:text-slate-200'
              }`}
            >
              <span className="w-5 text-center text-base leading-none">{option.glyph}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      {value && value.type !== 'linear' && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-slate-400">
            <span>Bend</span>
            <span className="font-mono">{Math.round(curvature * 100)}%</span>
          </div>
          <StepperSlider
            min={5}
            max={100}
            step={1}
            value={Math.round(curvature * 100)}
            onChange={(next) => onChange({ ...value, curvature: next / 100 })}
            accentColor="#a2d2ff"
          />
        </div>
      )}

      {value && (
        <div className="mt-3 flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-2">
          <span className="text-[10px] font-semibold text-slate-300">Orient to path</span>
          <Toggle
            aria-label="Orient to path"
            isSelected={!!value.autoOrient}
            onChange={(checked) => onChange({ ...value, autoOrient: checked })}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};
