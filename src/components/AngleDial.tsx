import { useRef } from 'react';

interface AngleDialProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function AngleDial({ label, value, min = -180, max = 180, disabled = false, onChange }: AngleDialProps) {
  const drag = useRef<{ pointerId: number; angle: number; value: number } | null>(null);
  const clamp = (angle: number) => Math.max(min, Math.min(max, Math.round(angle)));
  const pointerAngle = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return Math.atan2(event.clientX - rect.left - rect.width / 2,
      -(event.clientY - rect.top - rect.height / 2)) * 180 / Math.PI;
  };
  const radians = value * Math.PI / 180;
  const x = 32 + 26 * Math.sin(radians);
  const y = 32 - 26 * Math.cos(radians);

  return (
    <div className="min-w-0 flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-slate-300">{label}</span>
      <svg
        viewBox="0 0 64 64"
        role="slider"
        aria-label={`${label} angle`}
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
        aria-valuetext={`${value} degrees`} aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        className={`w-full max-w-16 rounded-full touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-pink ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.focus();
          const angle = pointerAngle(event);
          const next = clamp(angle);
          drag.current = { pointerId: event.pointerId, angle, value: next };
          event.currentTarget.setPointerCapture(event.pointerId);
          onChange(next);
        }}
        onPointerMove={(event) => {
          const active = drag.current;
          if (disabled || !active || active.pointerId !== event.pointerId) return;
          const angle = pointerAngle(event);
          const delta = ((angle - active.angle + 540) % 360) - 180;
          active.value = Math.max(min, Math.min(max, active.value + delta));
          active.angle = angle;
          onChange(clamp(active.value));
        }}
        onPointerUp={(event) => {
          drag.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => { drag.current = null; }}
        onLostPointerCapture={() => { drag.current = null; }}
        onDoubleClick={() => { if (!disabled) onChange(clamp(0)); }}
        onKeyDown={(event) => {
          if (disabled) return;
          const step = event.shiftKey ? 10 : 1;
          const next = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? value + step
            : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? value - step
            : event.key === 'Home' ? 0 : event.key === 'End' ? max : undefined;
          if (next === undefined) return;
          event.preventDefault();
          event.stopPropagation();
          onChange(clamp(next));
        }}
      >
        <circle cx="32" cy="32" r="26" className="fill-neutral-950 stroke-neutral-700" strokeWidth="4" />
        {value !== 0 && <path d={`M 32 6 A 26 26 0 ${Math.abs(value) > 180 ? 1 : 0} ${value >= 0 ? 1 : 0} ${x} ${y}`}
          fill="none" stroke={disabled ? '#737373' : '#ffafcc'} strokeWidth="4" strokeLinecap="round" />}
        <circle cx={x} cy={y} r="3" fill={disabled ? '#737373' : '#ffafcc'} />
        <text x="32" y="35" textAnchor="middle" className="fill-slate-200 text-[10px] font-mono">{Math.round(value)}°</text>
      </svg>
      <div className="flex items-center justify-center gap-0.5 text-[10px] text-slate-400">
        <input type="number" aria-label={`${label} degrees`} min={min} max={max} step={1}
          value={value} disabled={disabled}
          onChange={(event) => { if (event.target.value !== '' && Number.isFinite(event.target.valueAsNumber)) onChange(clamp(event.target.valueAsNumber)); }}
          className="w-10 min-w-0 rounded border border-neutral-800 bg-neutral-950 px-1 py-0.5 text-center font-mono text-slate-200 disabled:text-neutral-500 focus:outline-none focus:border-pastel-pink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <span>°</span>
      </div>
    </div>
  );
}
