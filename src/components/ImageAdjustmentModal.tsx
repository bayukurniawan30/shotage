import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useImageAdjustmentStore, type ImageAdjustment } from '../store/useImageAdjustmentStore';
import { useStudioStore } from '../store/useStudioStore';
import { cropGeometry, type ImageCrop } from '../utils/imageCrop';
import { CroppedMockupImage } from './CroppedMockupImage';
import { StepperSlider } from './StepperSlider';

function originalRatioLabel(width: number, height: number) {
  let divisor = width;
  let remainder = height;
  while (remainder) {
    [divisor, remainder] = [remainder, divisor % remainder];
  }
  return `${width / (divisor || 1)}:${height / (divisor || 1)}`;
}

export function ImageAdjustmentModal() {
  const request = useImageAdjustmentStore((s) => s.request);
  useEffect(() => () => useImageAdjustmentStore.getState().setRequest(null), []);
  return request ? <Adjustment key={`${request.slot}-${request.src}`} request={request} /> : null;
}
function Adjustment({ request }: { request: ImageAdjustment }) {
  const [crop, setCrop] = useState<ImageCrop>(request.initial);
  const [custom, setCustom] = useState({
    width: String(Math.round(request.initial.ratio * 1000)),
    height: '1000',
  });
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const close = () => useImageAdjustmentStore.getState().setRequest(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'Tab') {
        const items = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select'
          ) ?? []
        );
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const apply = () => {
    const s = useStudioStore.getState();
    if (
      s.activeStageIndex !== request.stage ||
      s.frameType !== request.frame ||
      s.isPreviewMode ||
      (request.slot === 2 && s.layoutCount !== 2)
    ) {
      setError('The active stage or frame changed. Close this dialog and adjust the image again.');
      return;
    }
    // One durable store update: the original source and its framing are committed together.
    useStudioStore.setState(
      request.slot === 1
        ? {
            imageSrc: request.src,
            imageName: request.name,
            imageWidth: request.width,
            imageHeight: request.height,
            mediaType: 'image',
            videoDuration: undefined,
            imageCrop: crop,
          }
        : {
            secondImageSrc: request.src,
            secondImageName: request.name,
            secondImageWidth: request.width,
            secondImageHeight: request.height,
            secondMediaType: 'image',
            secondVideoDuration: undefined,
            slot2ImageCrop: crop,
          }
    );
    close();
  };
  const reset = (ratio = request.fixedRatio ?? request.width / request.height) =>
    setCrop({ ratio, zoom: 1, x: 0, y: 0 });
  const finishPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(pointers.current.size > 0);
  };
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-adjust-title"
        className="w-full max-w-4xl max-h-[94dvh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl text-slate-200"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 p-4">
          <h2 id="image-adjust-title" className="font-semibold">
            Adjust Image · Slot {request.slot}
          </h2>
          <button
            type="button"
            aria-label="Close image adjustment"
            onClick={close}
            className="p-2 rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="grid md:grid-cols-[minmax(0,1fr)_250px] gap-5 p-4">
          <div className="flex items-center justify-center min-h-64 bg-neutral-950 rounded-xl p-10 overflow-hidden isolate">
            <div
              ref={preview}
              className="relative overflow-visible touch-none cursor-grab active:cursor-grabbing"
              style={{
                width: `min(100%, ${Math.min(420, 300 * crop.ratio)}px)`,
                aspectRatio: crop.ratio,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                setDragging(true);
              }}
              onPointerMove={(e) => {
                const previous = pointers.current.get(e.pointerId);
                if (!previous) return;
                const before = Array.from(pointers.current.values());
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                const after = Array.from(pointers.current.values());
                if (before.length === 2) {
                  const distance = (p: typeof before) =>
                    Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
                  const factor = distance(after) / Math.max(1, distance(before));
                  setCrop((c) => ({ ...c, zoom: Math.max(1, Math.min(4, c.zoom * factor)) }));
                  return;
                }
                const el = e.currentTarget;
                setCrop((c) => {
                  const g = cropGeometry(
                    request.width,
                    request.height,
                    el.clientWidth,
                    el.clientHeight,
                    c
                  );
                  return {
                    ...c,
                    x: Math.max(
                      -1,
                      Math.min(
                        1,
                        c.x +
                          (g.width > el.clientWidth
                            ? ((e.clientX - previous.x) * 2) / (g.width - el.clientWidth)
                            : 0)
                      )
                    ),
                    y: Math.max(
                      -1,
                      Math.min(
                        1,
                        c.y +
                          (g.height > el.clientHeight
                            ? ((e.clientY - previous.y) * 2) / (g.height - el.clientHeight)
                            : 0)
                      )
                    ),
                  };
                });
              }}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
            >
              <CroppedMockupImage
                src={request.src}
                name={request.name}
                width={request.width}
                height={request.height}
                crop={crop}
                showOverflow
              />
              <div className="absolute inset-0 pointer-events-none border border-white/80 shadow-[0_0_0_1px_#0006]" />
              {dragging && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, transparent 33%, #ffffff66 33%, #ffffff66 33.3%, transparent 33.3%, transparent 66%, #ffffff66 66%, #ffffff66 66.3%, transparent 66.3%),linear-gradient(to bottom, transparent 33%, #ffffff66 33%, #ffffff66 33.3%, transparent 33.3%, transparent 66%, #ffffff66 66%, #ffffff66 66.3%, transparent 66.3%)',
                  }}
                />
              )}
            </div>
          </div>
          <div className="space-y-4">
            {request.fixedRatio ? (
              <p className="text-xs text-pastel-blue">
                Fit to frame · the screen/image area's proportions stay fixed.
              </p>
            ) : (
              <>
                <label className="block text-xs text-slate-400">Crop preset</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    [
                      'Original',
                      request.width / request.height,
                      originalRatioLabel(request.width, request.height),
                    ],
                    ['Square', 1, '1:1'],
                    ['Landscape', 16 / 9, '16:9'],
                    ['Portrait', 4 / 5, '4:5'],
                    ['Vertical', 9 / 16, '9:16'],
                  ].map(([label, ratio, ratioLabel]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={Math.abs(crop.ratio - Number(ratio)) < 0.001}
                      onClick={() => reset(Number(ratio))}
                      className={`rounded-lg border px-2 py-2 text-xs cursor-pointer ${Math.abs(crop.ratio - Number(ratio)) < 0.001 ? 'border-pastel-pink text-pastel-pink bg-pastel-pink/10' : 'border-neutral-700'}`}
                    >
                      {label} <span className="opacity-70">({ratioLabel})</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Custom ratio · width × height
                  </label>
                  <div className="flex gap-2">
                    <input
                      aria-label="Custom crop width"
                      type="number"
                      min="1"
                      max="10000"
                      value={custom.width}
                      onChange={(e) => setCustom((c) => ({ ...c, width: e.target.value }))}
                      className="w-0 flex-1 min-w-0 rounded-lg bg-neutral-950 border border-neutral-700 p-2 text-sm"
                    />
                    <input
                      aria-label="Custom crop height"
                      type="number"
                      min="1"
                      max="10000"
                      value={custom.height}
                      onChange={(e) => setCustom((c) => ({ ...c, height: e.target.value }))}
                      className="w-0 flex-1 min-w-0 rounded-lg bg-neutral-950 border border-neutral-700 p-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const ratio = Number(custom.width) / Number(custom.height);
                        if (
                          !Number.isFinite(ratio) ||
                          Number(custom.width) <= 0 ||
                          Number(custom.height) <= 0 ||
                          ratio < 0.2 ||
                          ratio > 5
                        ) {
                          setError('Use a ratio between 1:5 and 5:1.');
                          return;
                        }
                        setError('');
                        reset(ratio);
                      }}
                      className="text-xs text-pastel-pink cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </>
            )}
            <div>
              <span className="block text-xs mb-2">Zoom · {Math.round(crop.zoom * 100)}%</span>
              <StepperSlider
                min={100}
                max={400}
                step={1}
                value={Math.round(crop.zoom * 100)}
                onChange={(zoom) => setCrop((c) => ({ ...c, zoom: zoom / 100 }))}
                accentColor="#ffafcc"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['x', 'y'] as const).map((axis) => (
                <div key={axis}>
                  <span className="block text-xs text-slate-400 mb-1">
                    Offset {axis.toUpperCase()}
                  </span>
                  <StepperSlider
                    variant="compact"
                    label={`Crop offset ${axis}`}
                    min={-100}
                    max={100}
                    value={Math.round(crop[axis] * 100)}
                    onChange={(v) => setCrop((c) => ({ ...c, [axis]: v / 100 }))}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Drag to reposition. Pinch or use Zoom to enlarge. The original image is preserved;
              crop dimensions do not change export resolution.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="text-xs text-pastel-pink cursor-pointer"
            >
              Reset framing
            </button>
            {error && (
              <p role="alert" className="text-xs text-rose-400">
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-neutral-800 p-4">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-neutral-700 px-5 py-2 text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="rounded-lg bg-pastel-pink text-neutral-950 px-5 py-2 text-sm font-semibold cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
