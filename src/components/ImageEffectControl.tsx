import React from 'react';
import { IMAGE_EFFECT_PRESETS, imageEffectFilter, type ImageEffect } from '../utils/imageEffects';
import { StepperSlider } from './StepperSlider';
export function ImageEffectControl({
  value,
  onChange,
  imageSrc,
  label = 'Image Effects',
}: {
  value?: ImageEffect;
  onChange: (effect: ImageEffect) => void;
  imageSrc?: string | null;
  label?: string;
}) {
  const preset = value?.preset ?? 'original';
  return (
    <div className="space-y-3 border-t border-neutral-800 pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onChange({ preset: 'original', intensity: 100 })}
          className="text-[11px] text-pastel-pink cursor-pointer"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {IMAGE_EFFECT_PRESETS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={name === preset}
            onClick={() => onChange({ preset: name, intensity: value?.intensity ?? 100 })}
            className={`min-w-0 rounded-lg border p-1 text-[10px] capitalize cursor-pointer ${preset === name ? 'border-pastel-pink bg-pastel-pink/10 text-pastel-pink' : 'border-neutral-800 bg-neutral-900 text-slate-300 hover:border-neutral-600'}`}
          >
            <div className="h-9 rounded overflow-hidden mb-1">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: imageEffectFilter({ preset: name, intensity: 100 }) }}
                />
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-br from-pastel-pink via-pastel-blue to-emerald-400"
                  style={{ filter: imageEffectFilter({ preset: name, intensity: 100 }) }}
                />
              )}
            </div>
            {name}
          </button>
        ))}
      </div>
      <div>
        <span className="block text-xs text-slate-300 mb-1">Intensity</span>
        <StepperSlider
          variant="compact"
          label={`${label} intensity`}
          unit="%"
          min={0}
          max={100}
          step={1}
          disabled={preset === 'original'}
          value={value?.intensity ?? 100}
          onChange={(intensity) => onChange({ preset, intensity })}
        />
      </div>
    </div>
  );
}
