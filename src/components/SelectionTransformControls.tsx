import React from 'react';
import { ArrowClockwiseIcon, ArrowsOutSimpleIcon } from '@phosphor-icons/react';

export type TransformMode = 'resize' | 'rotate';

export function TransformModeButton({
  mode,
  onToggle,
  rotation = 0,
}: {
  mode: TransformMode;
  onToggle: () => void;
  rotation?: number;
}) {
  const Icon = mode === 'resize' ? ArrowsOutSimpleIcon : ArrowClockwiseIcon;
  const label = `${mode === 'resize' ? 'Resize' : 'Rotate'} mode — click to switch to ${mode === 'resize' ? 'Rotate' : 'Resize'}`;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={mode === 'rotate'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-neutral-300 bg-white text-slate-900 hover:scale-110 cursor-pointer transition-all"
    >
      <Icon
        className="w-3.5 h-3.5 pointer-events-none"
        style={{ transform: `rotate(${-rotation}deg)` }}
      />
    </button>
  );
}

export function SelectionCornerHandles({
  mode,
  group = false,
  style,
}: {
  mode: TransformMode;
  group?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <div
          key={corner}
          {...(group ? { 'data-group-action': mode } : { 'data-action': mode })}
          data-corner={corner}
          title={mode === 'rotate' ? 'Drag corner to rotate' : 'Drag corner to resize'}
          style={style}
          className={`absolute w-2.5 h-2.5 border border-neutral-400 shadow-sm hover:scale-125 transition-transform z-50 pointer-events-auto ${mode === 'rotate' ? 'rotate-handle rounded-full bg-white cursor-grab active:cursor-grabbing' : 'resize-handle bg-white'} ${
            corner === 'tl'
              ? '-top-[5px] -left-[5px]'
              : corner === 'tr'
                ? '-top-[5px] -right-[5px]'
                : corner === 'bl'
                  ? '-bottom-[5px] -left-[5px]'
                  : '-bottom-[5px] -right-[5px]'
          } ${mode === 'resize' ? (corner === 'tl' ? 'cursor-nw-resize' : corner === 'tr' ? 'cursor-ne-resize' : corner === 'bl' ? 'cursor-sw-resize' : 'cursor-se-resize') : ''}`}
        />
      ))}
    </>
  );
}

export function RectangleEdgeHandles() {
  return (
    <>
      {(['t', 'b', 'l', 'r'] as const).map((edge) => (
        <div
          key={edge}
          data-action="resize"
          data-corner={edge}
          title={`Drag ${{ t: 'top', b: 'bottom', l: 'left', r: 'right' }[edge]} edge to resize`}
          className={`resize-handle absolute bg-white border border-neutral-400 rounded-full shadow-sm z-50 pointer-events-auto ${
            edge === 't'
              ? '-top-[4px] left-1/2 -translate-x-1/2 w-4 h-1.5 cursor-ns-resize'
              : edge === 'b'
                ? '-bottom-[4px] left-1/2 -translate-x-1/2 w-4 h-1.5 cursor-ns-resize'
                : edge === 'l'
                  ? '-left-[4px] top-1/2 -translate-y-1/2 w-1.5 h-4 cursor-ew-resize'
                  : '-right-[4px] top-1/2 -translate-y-1/2 w-1.5 h-4 cursor-ew-resize'
          }`}
        />
      ))}
    </>
  );
}
