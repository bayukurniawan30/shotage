import { AngleDial } from './AngleDial';
import { isDesktopApp } from '../platform/runtime';

interface RotationControlsProps {
  rotation: number;
  pitch?: number;
  yaw?: number;
  onChange: (updates: { rotation?: number; pitch?: number; yaw?: number }) => void;
}

export function RotationControls({ rotation, pitch, yaw, onChange }: RotationControlsProps) {
  const webOnly = isDesktopApp();
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <AngleDial label="Rotation" value={rotation} onChange={(rotation) => onChange({ rotation })} />
        {pitch !== undefined && <AngleDial label="Pitch" value={pitch} min={-30} max={30} disabled={webOnly}
          onChange={(pitch) => onChange({ pitch })} />}
        {yaw !== undefined && <AngleDial label="Yaw" value={yaw} min={-30} max={30} disabled={webOnly}
          onChange={(yaw) => onChange({ yaw })} />}
      </div>
      {webOnly && (pitch !== undefined || yaw !== undefined) && (
        <p className="mt-2 text-[10px] text-amber-300">Pitch & Yaw · Web only</p>
      )}
    </div>
  );
}
