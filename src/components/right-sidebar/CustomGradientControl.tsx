import React from 'react';
import type { StudioState } from '../../types/studio';
import { customGradientCss, DEFAULT_CUSTOM_GRADIENT } from '../../utils/customGradient';
import { StepperSlider } from '../StepperSlider';

type Gradient = NonNullable<StudioState['customGradient']>;

export function CustomGradientControl({
  value = DEFAULT_CUSTOM_GRADIENT,
  onChange,
}: {
  value?: Gradient;
  onChange: (value: Gradient) => void;
}) {
  const updateStop = (index: number, change: Partial<Gradient['stops'][number]>) => {
    onChange({
      ...value,
      stops: value.stops.map((stop, i) => (i === index ? { ...stop, ...change } : stop)),
    });
  };
  const setPosition = (index: number, position: number) => {
    const min = value.stops[index - 1]?.position ?? 0;
    const max = value.stops[index + 1]?.position ?? 100;
    updateStop(index, { position: Math.max(min, Math.min(max, Math.round(position))) });
  };
  return (
    <div className="space-y-4 border-t border-neutral-800 pt-4">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>Color stops</span>
        <div className="flex gap-1">
          {[2, 3].map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={value.stops.length === count}
              className={`rounded-lg px-3 py-1 border cursor-pointer ${value.stops.length === count ? 'border-pastel-pink text-pastel-pink bg-pastel-pink/10' : 'border-neutral-700 bg-neutral-900'}`}
              onClick={() =>
                value.stops.length !== count &&
                onChange({
                  ...value,
                  stops:
                    count === 2
                      ? [value.stops[0], value.stops[value.stops.length - 1]]
                      : [
                          value.stops[0],
                          {
                            color: '#cdb4db',
                            position: Math.round(
                              (value.stops[0].position +
                                value.stops[value.stops.length - 1].position) /
                                2
                            ),
                          },
                          value.stops[value.stops.length - 1],
                        ],
                })
              }
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      <div className="px-2 pb-3">
        <div
          className="relative h-10 rounded-lg border border-neutral-700"
          style={{ backgroundImage: customGradientCss(value, 90) }}
        >
          {value.stops.map((stop, index) => (
            <button
              key={index}
              type="button"
              role="slider"
              aria-label={`Color stop ${index + 1} position`}
              aria-valuemin={value.stops[index - 1]?.position ?? 0}
              aria-valuemax={value.stops[index + 1]?.position ?? 100}
              aria-valuenow={stop.position}
              className="absolute top-7 h-6 w-4 -translate-x-1/2 rounded border-2 border-white shadow-md cursor-ew-resize touch-none focus:ring-2 focus:ring-pastel-pink"
              style={{ left: `${stop.position}%`, backgroundColor: stop.color, zIndex: index + 1 }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
                const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
                setPosition(index, ((event.clientX - bounds.left) / bounds.width) * 100);
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                  event.preventDefault();
                  setPosition(index, stop.position + (event.key === 'ArrowRight' ? 1 : -1));
                }
              }}
            />
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-400">Drag the stops to adjust the color blend.</p>
      <div className={`grid gap-2 ${value.stops.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {value.stops.map((stop, index) => (
          <label key={index} className="text-[11px] text-slate-400 space-y-1 block">
            <span>
              {index === 0 ? 'Left' : index === value.stops.length - 1 ? 'Right' : 'Center'} ·{' '}
              {stop.position}%
            </span>
            <input
              type="color"
              aria-label={`Color stop ${index + 1} color`}
              value={stop.color}
              onChange={(event) => updateStop(index, { color: event.target.value })}
              className="block w-full h-8 rounded border border-neutral-700 bg-neutral-900 cursor-pointer"
            />
          </label>
        ))}
      </div>
      <StepperSlider
        variant="compact"
        label="Angle"
        min={0}
        max={360}
        step={1}
        unit="°"
        value={value.angle}
        onChange={(angle) => onChange({ ...value, angle })}
        accentColor="#ffafcc"
      />
    </div>
  );
}
