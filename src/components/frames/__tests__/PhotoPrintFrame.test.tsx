import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { PhotoPrintFrame, DEFAULT_PHOTO_PRINT } from '../PhotoPrintFrame';

describe('Photo Print frame', () => {
  it('renders clean paper without a caption by default', () => {
    const html = renderToStaticMarkup(<PhotoPrintFrame><img src="sample.png" /></PhotoPrintFrame>);
    expect(html).toContain('padding:12px');
    expect(html).not.toContain('Quiet mornings');
  });
  it('renders escaped caption/date and custom paper settings', () => {
    const html = renderToStaticMarkup(<PhotoPrintFrame settings={{ ...DEFAULT_PHOTO_PRINT, variant: 'gallery', borderWidth: 28, caption: '<Title>', date: 'OCT 2026', paperColor: '#ffafcc' }}>image</PhotoPrintFrame>);
    expect(html).toContain('&lt;Title&gt;');
    expect(html).toContain('OCT 2026');
    expect(html).toContain('padding:28px');
    expect(html).toContain('#ffafcc');
  });
});
