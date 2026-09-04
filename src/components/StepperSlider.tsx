import React, { useRef, useEffect, useCallback } from 'react';

export interface StepperSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  className?: string;
  accentColor?: string; // Hex or CSS color, defaults to '#a2d2ff'
  disabled?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
}

export const StepperSlider: React.FC<StepperSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = '',
  accentColor = '#a2d2ff',
  disabled = false,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
}) => {
  const valueRef = useRef(value);
  valueRef.current = value;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const stepChange = useCallback(
    (delta: number) => {
      const current = valueRef.current;
      const next = Math.min(max, Math.max(min, Math.round((current + delta) * 100) / 100));
      if (next !== current) {
        onChange(next);
      }
      if (next <= min && delta < 0) {
        clearTimers();
      } else if (next >= max && delta > 0) {
        clearTimers();
      }
    },
    [min, max, onChange, clearTimers]
  );

  const startHold = (delta: number) => {
    if (disabled) return;
    clearTimers();
    // Step once immediately on press
    stepChange(delta);

    // After 300ms initial press delay, continuously repeat every 45ms
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        stepChange(delta);
      }, 45);
    }, 300);
  };

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Minus Button */}
      <button
        type="button"
        disabled={disabled || value <= min}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          onPointerDown?.(e);
          startHold(-step);
        }}
        onPointerUp={(e) => {
          clearTimers();
          onPointerUp?.(e);
        }}
        onPointerLeave={(e) => {
          clearTimers();
          onPointerUp?.(e);
        }}
        onPointerCancel={(e) => {
          clearTimers();
          onPointerCancel?.(e);
        }}
        className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border transition-all ${
          disabled || value <= min
            ? 'opacity-30 border-neutral-800 bg-neutral-950/40 text-slate-500 cursor-not-allowed'
            : 'border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 hover:border-neutral-700 text-slate-300 hover:text-white active:scale-95 cursor-pointer shadow-xs'
        }`}
        title={`Decrease by ${step}`}
        aria-label="Decrease value"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Slider Track and Thumb */}
      <div className="relative flex-1 flex items-center h-7 group">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={{
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percentage}%, #262626 ${percentage}%, #262626 100%)`,
          }}
          className="w-full h-1.5 appearance-none rounded-full cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-95 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-neutral-900 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-125"
        />
      </div>

      {/* Plus Button */}
      <button
        type="button"
        disabled={disabled || value >= max}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          onPointerDown?.(e);
          startHold(step);
        }}
        onPointerUp={(e) => {
          clearTimers();
          onPointerUp?.(e);
        }}
        onPointerLeave={(e) => {
          clearTimers();
          onPointerUp?.(e);
        }}
        onPointerCancel={(e) => {
          clearTimers();
          onPointerCancel?.(e);
        }}
        className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center border transition-all ${
          disabled || value >= max
            ? 'opacity-30 border-neutral-800 bg-neutral-950/40 text-slate-500 cursor-not-allowed'
            : 'border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 hover:border-neutral-700 text-slate-300 hover:text-white active:scale-95 cursor-pointer shadow-xs'
        }`}
        title={`Increase by ${step}`}
        aria-label="Increase value"
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};
