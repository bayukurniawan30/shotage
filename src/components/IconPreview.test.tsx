import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, afterEach } from 'vitest';
import { IconClipDefinition, IconConstructionGuides, iconPreviewClip } from './IconPreview';
import { useIconPreviewStore } from '../store/useIconPreviewStore';

afterEach(() =>
  useIconPreviewStore.setState({ shape: 'rounded', guides: true, construction: false })
);

describe('editor-only icon previews', () => {
  it('supports rounded, circle, and unmasked square previews', () => {
    expect(iconPreviewClip('rounded', 'test-clip')).toBe('url(#test-clip)');
    expect(iconPreviewClip('circle', 'test-clip')).toBe('circle(50% at 50% 50%)');
    expect(iconPreviewClip('square', 'test-clip')).toBe('none');
    expect(renderToStaticMarkup(<IconClipDefinition id="test-clip" />)).toContain(
      'clipPathUnits="objectBoundingBox"'
    );
  });
  it('keeps construction guides out of exports and hides duplicate centers while dragging', () => {
    const idle = renderToStaticMarkup(
      <IconConstructionGuides construction={false} dragging={false} />
    );
    const dragging = renderToStaticMarkup(<IconConstructionGuides construction={true} dragging />);
    expect(idle).toContain('selection-gizmo-container');
    expect(idle).toContain('M 500 0 V 1000 M 0 500 H 1000');
    expect(dragging).not.toContain('M 500 0 V 1000 M 0 500 H 1000');
    expect(dragging).toContain('<circle');
    expect(idle).not.toContain('<circle');
    expect(dragging).toContain('non-scaling-stroke');
  });
  it('stores preview preferences separately from design state', () => {
    useIconPreviewStore.getState().setShape('circle');
    useIconPreviewStore.getState().setGuides(false);
    expect(useIconPreviewStore.getState()).toMatchObject({ shape: 'circle', guides: false });
  });
});
