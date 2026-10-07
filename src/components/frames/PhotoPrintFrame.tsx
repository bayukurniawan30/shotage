import React from 'react';
import type { StudioState } from '../../types/studio';

export const DEFAULT_PHOTO_PRINT: NonNullable<StudioState['photoPrint']> = {
  variant: 'clean', paperColor: '#fffefa', borderWidth: 12,
  caption: 'Quiet mornings, somewhere new.', date: '',
};

export function PhotoPrintFrame({ settings, children }: { settings?: StudioState['photoPrint']; children: React.ReactNode }) {
  const options = { ...DEFAULT_PHOTO_PRINT, ...settings };
  return <div data-photo-print className="flex flex-col" style={{
    backgroundColor: options.paperColor,
    padding: Math.max(0, options.borderWidth),
    color: '#343230',
  }}>
    <div className="overflow-hidden">{children}</div>
    {options.variant !== 'clean' && (options.caption || options.date) && (
      <div className="flex items-start justify-between gap-4" style={{ paddingTop: options.variant === 'gallery' ? 20 : 14, paddingBottom: 4, fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.5 }}>
        <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', flex: 1, minWidth: 0 }}>{options.caption}</span>
        {options.date && <span style={{ opacity: .7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxWidth: '35%' }}>{options.date}</span>}
      </div>
    )}
  </div>;
}
