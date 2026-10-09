import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  RectangleEdgeHandles,
  SelectionCornerHandles,
  TransformModeButton,
} from '../SelectionTransformControls';

describe('selection transform controls', () => {
  it.each(['resize', 'rotate'] as const)('routes all four corners to %s', (mode) => {
    const html = renderToStaticMarkup(<SelectionCornerHandles mode={mode} />);
    expect(html.match(new RegExp(`data-action="${mode}"`, 'g'))).toHaveLength(4);
    expect(html).not.toContain(`data-action="${mode === 'resize' ? 'rotate' : 'resize'}"`);
  });
  it('routes group corners to group rotation and exposes the current mode', () => {
    const html = renderToStaticMarkup(<SelectionCornerHandles group mode="rotate" />);
    expect(html.match(/data-group-action="rotate"/g)).toHaveLength(4);
    const button = renderToStaticMarkup(<TransformModeButton mode="rotate" onToggle={() => {}} />);
    expect(button).toContain('switch to Resize');
    expect(button).toContain('aria-pressed="true"');
  });
  it('adds exactly four independent rectangle edge handles', () => {
    expect(
      renderToStaticMarkup(<RectangleEdgeHandles />).match(/data-action="resize"/g)
    ).toHaveLength(4);
  });
});
