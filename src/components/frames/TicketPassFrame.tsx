import React, { useId } from 'react';
import { DEFAULT_STUDIO_STATE, type StudioState } from '../../types/studio';

export const DEFAULT_TICKET_PASS = DEFAULT_STUDIO_STATE.ticketPass!;

export function ticketMediaStyle(settings?: StudioState['ticketPass']): React.CSSProperties {
  return {
    objectPosition: `${50 - (settings?.imageOffsetX ?? 0) / 2}% ${50 - (settings?.imageOffsetY ?? 0) / 2}%`,
    transform: `scale(${(settings?.imageZoom ?? 100) / 100})`,
    transformOrigin: 'center',
  };
}

export function TicketPassFrame({
  settings,
  children,
}: {
  settings?: StudioState['ticketPass'];
  children: React.ReactNode;
}) {
  const options = { ...DEFAULT_TICKET_PASS, ...settings };
  const digital = options.variant === 'digital';
  const clipId = `ticket-${useId().replace(/:/g, '')}`;
  // Fixed frame geometry keeps notches and perforations aligned across captures.
  const width = digital ? 320 : 620;
  const height = digital ? 430 : 360;
  const seam = digital ? 352 : 478;
  const cutouts = digital
    ? `M-10 ${seam} a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M${width - 10} ${seam} a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0`
    : `M${seam - 10} 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M${seam - 10} ${height} a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0`;
  return (
    <div data-ticket-pass style={{ width, height, position: 'relative' }}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" d={`M0 0 H${width} V${height} H0 Z ${cutouts}`} />
          </clipPath>
        </defs>
      </svg>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: digital ? 'column' : 'row',
          backgroundColor: options.paperColor,
          color: options.textColor,
          borderRadius: 18,
          overflow: 'hidden',
          clipPath: `url(#${clipId})`,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            width: digital ? width : seam,
            height: digital ? seam : height,
            padding: 24,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              overflowWrap: 'anywhere',
            }}
          >
            {options.subtitle}
          </div>
          <div
            style={{
              fontSize: digital ? 28 : 30,
              lineHeight: 1.1,
              fontWeight: 800,
              overflowWrap: 'anywhere',
              maxHeight: 100,
              overflow: 'hidden',
            }}
          >
            {options.title}
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              borderRadius: 6,
              position: 'relative',
            }}
          >
            <div
              data-ticket-image-crop="true"
              className="[&>*]:!min-w-0 [&>*]:!min-h-0 [&>*]:!w-full [&>*]:!h-full"
              style={{
                position: 'absolute',
                inset: 0,
              }}
            >
              {children}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, lineHeight: 1.5 }}>
            <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              <div style={{ opacity: 0.6, letterSpacing: 1 }}>DATE</div>
              {options.date}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              <div style={{ opacity: 0.6, letterSpacing: 1 }}>LOCATION</div>
              {options.location}
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderLeft: digital ? undefined : `2px dashed ${options.textColor}55`,
            borderTop: digital ? `2px dashed ${options.textColor}55` : undefined,
            padding: digital ? '14px 20px' : '24px 16px',
            display: 'flex',
            flexDirection: digital ? 'row' : 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1.5,
              textAlign: 'center',
              overflowWrap: 'anywhere',
            }}
          >
            {options.stubLabel}
          </div>
          <div
            aria-label="Decorative barcode, not scannable"
            style={{
              width: digital ? 100 : 74,
              height: digital ? 30 : 120,
              flexShrink: 0,
              backgroundImage: `repeating-linear-gradient(90deg, ${options.textColor} 0 2px, transparent 2px 5px, ${options.textColor} 5px 6px, transparent 6px 9px, ${options.textColor} 9px 13px, transparent 13px 16px)`,
            }}
          />
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 10,
              textAlign: 'center',
              overflowWrap: 'anywhere',
              minWidth: 0,
            }}
          >
            {options.serial}
          </div>
        </div>
      </div>
    </div>
  );
}
