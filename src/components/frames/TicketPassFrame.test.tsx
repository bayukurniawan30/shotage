import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TICKET_PASS, TicketPassFrame, ticketMediaStyle } from './TicketPassFrame';

describe('TicketPassFrame', () => {
  it.each(['event', 'digital'] as const)('crops media independently in the %s frame', (variant) => {
    const html = renderToStaticMarkup(
      <TicketPassFrame
        settings={{
          ...DEFAULT_TICKET_PASS,
          variant,
          imageZoom: 150,
          imageOffsetX: 20,
          imageOffsetY: -15,
        }}
      >
        <span>Media</span>
      </TicketPassFrame>
    );
    expect(html).toContain('data-ticket-image-crop="true"');
    expect(html).not.toContain('translate(20%, -15%)');
    expect(ticketMediaStyle({ ...DEFAULT_TICKET_PASS, variant, imageZoom: 150, imageOffsetX: 20, imageOffsetY: -15 })).toEqual({ objectPosition: '40% 57.5%', transform: 'scale(1.5)', transformOrigin: 'center' });
    expect(html).toContain('overflow:hidden;border-radius:6px;position:relative');
  });
  it('maps offset extremes to the full original image edges', () => {
    expect(ticketMediaStyle()).toMatchObject({ objectPosition: '50% 50%', transform: 'scale(1)' });
    expect(ticketMediaStyle({ ...DEFAULT_TICKET_PASS, imageOffsetY: 100 })).toMatchObject({ objectPosition: '50% 0%' });
    expect(ticketMediaStyle({ ...DEFAULT_TICKET_PASS, imageOffsetY: -100 })).toMatchObject({ objectPosition: '50% 100%' });
  });
  it('renders landscape geometry, media, and decorative barcode by default', () => {
    const html = renderToStaticMarkup(
      <TicketPassFrame>
        <img src="https://example.com/photo.png" alt="Photo" />
      </TicketPassFrame>
    );
    expect(html).toContain('width:620px;height:360px');
    expect(html).toContain('ADMIT ONE');
    expect(html).toContain('https://example.com/photo.png');
    expect(html).toContain('Decorative barcode, not scannable');
    expect(html).toContain('clipPath');
    expect(html).toContain('clip-rule="evenodd"');
  });
  it('renders portrait geometry and escapes custom text', () => {
    const html = renderToStaticMarkup(
      <TicketPassFrame
        settings={{
          ...DEFAULT_TICKET_PASS,
          variant: 'digital',
          title: '<Title>',
          paperColor: '#171719',
          textColor: '#ffffff',
        }}
      >
        <span>Media</span>
      </TicketPassFrame>
    );
    expect(html).toContain('width:320px;height:430px');
    expect(html).toContain('&lt;Title&gt;');
    expect(html).toContain('Media');
    expect(html).toContain('border-top:2px dashed #ffffff55');
  });
});
