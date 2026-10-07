import { describe, it, expect, vi } from 'vitest';
vi.mock('coolshapes-react', () => ({ Coolshape: () => null }));
import { useStudioStore } from './useStudioStore';

describe('replace text with outline', () => {
  it('replaces atomically, preserves layer order and supports undo', () => {
    const original = useStudioStore.getState();
    const id = original.addTextLayer('BOO');
    const text = useStudioStore.getState().textLayers.find((l) => l.id === id)!;
    const shape = {
      id: 'outline-test',
      shapeType: 'custom-path' as const,
      width: 100,
      height: 50,
      x: text.x,
      y: text.y,
      rotation: 0,
      opacity: 100,
      color: '#fff',
      position: 'above' as const,
      pathData: 'M0 0L100 0L100 50Z',
    };
    useStudioStore.temporal.getState().clear();
    expect(useStudioStore.getState().replaceTextWithOutline(id, text, shape)).toBe(true);
    expect(useStudioStore.getState().textLayers.some((l) => l.id === id)).toBe(false);
    expect(useStudioStore.getState().layerOrder).toContainEqual({ type: 'shape', id: shape.id });
    useStudioStore.temporal.getState().undo();
    expect(useStudioStore.getState().textLayers).toContainEqual(text);
    expect(useStudioStore.getState().shapeLayers.some((l) => l.id === shape.id)).toBe(false);
    useStudioStore.setState(original);
    useStudioStore.temporal.getState().clear();
  });
});
