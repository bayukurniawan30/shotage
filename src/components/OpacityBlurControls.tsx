import { StepperSlider } from './StepperSlider';

interface OpacityBlurControlsProps {
  opacity: number;
  blur: number;
  opacityMin?: number;
  onOpacityChange: (value: number) => void;
  onBlurChange: (value: number) => void;
  disabled?: boolean;
}

export function OpacityBlurControls({
  opacity,
  blur,
  opacityMin = 0,
  onOpacityChange,
  onBlurChange,
  disabled = false,
}: OpacityBlurControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="min-w-0">
        <span className="mb-1 block text-[10px] font-medium text-slate-300">Opacity</span>
        <StepperSlider variant="compact" label="Opacity" unit="%" min={opacityMin} max={100}
          value={opacity} onChange={onOpacityChange} disabled={disabled} />
      </div>
      <div className="min-w-0">
        <span className="mb-1 block text-[10px] font-medium text-slate-300">Blur</span>
        <StepperSlider variant="compact" label="Blur" unit="px" min={0} max={40}
          value={blur} onChange={onBlurChange} disabled={disabled} />
      </div>
    </div>
  );
}
