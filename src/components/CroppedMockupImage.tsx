import React, { useLayoutEffect, useRef, useState } from 'react';
import { cropGeometry, type ImageCrop } from '../utils/imageCrop';
export function CroppedMockupImage({
  src,
  name,
  width,
  height,
  crop,
  filter,
  showOverflow = false,
}: {
  src: string;
  name: string;
  width: number;
  height: number;
  crop: ImageCrop;
  filter?: string;
  /** Adjustment preview only; exported mockups remain clipped. */
  showOverflow?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current!;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const geometry = cropGeometry(width, height, size.width, size.height, crop);
  return (
    <div
      ref={ref}
      className={`relative w-full h-full ${showOverflow ? 'overflow-visible' : 'overflow-hidden'}`}
    >
      {showOverflow && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none"
          style={{ position: 'absolute', maxWidth: 'none', ...geometry, filter, opacity: 0.5 }}
        />
      )}
      <div className="absolute inset-0 overflow-hidden">
        <img
          data-export-mockup-image="true"
          src={src}
          alt={name || 'Screenshot'}
          draggable={false}
          style={{ position: 'absolute', maxWidth: 'none', ...geometry, filter }}
        />
      </div>
    </div>
  );
}
