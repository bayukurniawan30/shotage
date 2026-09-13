import React from 'react';
import { clampAnchor } from '../utils/anchorPoint';

interface AnchorPointControlProps {
  anchorX?: number;
  anchorY?: number;
  disabled?: boolean;
  label?: string;
  onChange: (anchorX: number, anchorY: number) => void;
}

const PRESETS = [0, 0.5, 1] as const;

export const AnchorPointControl: React.FC<AnchorPointControlProps> = ({
  anchorX = 0.5,
  anchorY = 0.5,
  disabled = false,
  label = 'Anchor point',
  onChange,
}) => {
  const x = clampAnchor(anchorX);
  const y = clampAnchor(anchorY);

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : ''}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400">{label}</span>
        <button
          type="button"
          onClick={() => onChange(0.5, 0.5)}
          className="text-[9px] font-semibold text-slate-500 transition-colors hover:text-pastel-blue cursor-pointer"
        >
          Reset
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="grid h-[58px] w-[58px] shrink-0 grid-cols-3 grid-rows-3 gap-1 rounded-lg border border-neutral-800 bg-neutral-950 p-2"
          role="group"
          aria-label={label}
        >
          {PRESETS.flatMap((presetY) =>
            PRESETS.map((presetX) => {
              const active = Math.abs(x - presetX) < 0.001 && Math.abs(y - presetY) < 0.001;
              return (
                <button
                  key={`${presetX}-${presetY}`}
                  type="button"
                  title={`${Math.round(presetX * 100)}%, ${Math.round(presetY * 100)}%`}
                  aria-label={`Set anchor to ${Math.round(presetX * 100)}%, ${Math.round(presetY * 100)}%`}
                  aria-pressed={active}
                  onClick={() => onChange(presetX, presetY)}
                  className={`m-auto h-2.5 w-2.5 rounded-full border transition-all cursor-pointer ${
                    active
                      ? 'scale-125 border-white bg-pastel-pink shadow-[0_0_7px_rgba(255,175,204,0.7)]'
                      : 'border-slate-600 bg-slate-800 hover:border-pastel-blue hover:bg-pastel-blue/70'
                  }`}
                />
              );
            })
          )}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          {([
            ['X', x],
            ['Y', y],
          ] as const).map(([axis, value]) => (
            <label key={axis} className="text-[9px] font-semibold text-slate-500">
              {axis}
              <div className="relative mt-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(value * 100)}
                  onChange={(event) => {
                    const next = clampAnchor(Number(event.target.value) / 100);
                    onChange(axis === 'X' ? next : x, axis === 'Y' ? next : y);
                  }}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-1.5 pl-2 pr-5 font-mono text-[10px] text-slate-200 focus:border-pastel-blue/60 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-600">%</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
