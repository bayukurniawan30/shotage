import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('coolshapes-react', () => ({ Coolshape: () => null }));

import { useStudioStore } from './useStudioStore';

let originalTime = 0;
let originalPlaying = false;
let originalBackgroundColor = '';

beforeEach(() => {
  const state = useStudioStore.getState();
  originalTime = state.currentTimeSec;
  originalPlaying = state.isPlaying;
  originalBackgroundColor = state.backgroundColor;
  useStudioStore.temporal.getState().clear();
});

afterEach(() => {
  const history = useStudioStore.temporal.getState();
  history.pause();
  useStudioStore.setState({
    currentTimeSec: originalTime,
    isPlaying: originalPlaying,
    backgroundColor: originalBackgroundColor,
  });
  history.clear();
  history.resume();
});

describe('studio history performance', () => {
  it('does not create undo entries for animation clock updates', () => {
    useStudioStore.setState({ currentTimeSec: originalTime + 0.25, isPlaying: true });

    expect(useStudioStore.temporal.getState().pastStates).toHaveLength(0);
  });

  it('still records durable editor changes', () => {
    useStudioStore.getState().updateState({ backgroundColor: '#123456' });

    expect(useStudioStore.temporal.getState().pastStates).toHaveLength(1);
  });
});

describe('layer groups', () => {
  it('groups selected mixed layer types and keeps a persistent parent transform', () => {
    useStudioStore.setState({
      textLayers: [
        {
          id: 'group-text',
          text: 'Grouped',
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: '700',
          fontStyle: 'normal',
          color: '#ffffff',
          textAlign: 'center',
          x: -50,
          y: 0,
          shadow: false,
          opacity: 100,
          rotation: 0,
          position: 'above',
        },
      ],
      shapeLayers: [
        {
          id: 'group-shape',
          shapeType: 'rectangle',
          color: '#ffffff',
          width: 100,
          height: 80,
          x: 60,
          y: 0,
          rotation: 0,
          opacity: 100,
          position: 'above',
        },
      ],
      phosphorIconLayers: [],
      canvasElements: [],
      layerGroups: [],
      selectedTextLayerId: 'group-text',
      selectedTextLayerIds: ['group-text'],
      selectedShapeId: 'group-shape',
      selectedShapeIds: ['group-shape'],
      selectedPhosphorIconLayerId: null,
      selectedPhosphorIconLayerIds: [],
      selectedElementId: null,
      selectedElementIds: [],
      selectedLayerGroupId: null,
      layerOrder: [
        { type: 'text', id: 'group-text' },
        { type: 'shape', id: 'group-shape' },
      ],
    });

    const groupId = useStudioStore.getState().groupSelectedLayers();
    expect(groupId).toBeTruthy();
    const groupedState = useStudioStore.getState();
    expect(groupedState.layerGroups).toHaveLength(1);
    expect(groupedState.layerGroups[0].members).toEqual([
      { type: 'text', id: 'group-text' },
      { type: 'shape', id: 'group-shape' },
    ]);
    expect(groupedState.selectedLayerGroupId).toBe(groupId);

    groupedState.updateLayerGroup(groupId!, { x: 120, y: 40, scale: 1.5, rotation: 25 });
    expect(useStudioStore.getState().layerGroups[0]).toMatchObject({
      x: 120,
      y: 40,
      scale: 1.5,
      rotation: 25,
    });

    useStudioStore.getState().ungroupLayerGroup(groupId!);
    expect(useStudioStore.getState().layerGroups).toHaveLength(0);
    expect(useStudioStore.getState().textLayers[0].fontSize).toBe(48);
    expect(useStudioStore.getState().shapeLayers[0].width).toBe(150);
  });

  it('rejects groups that cross the mockup boundary', () => {
    useStudioStore.setState({
      textLayers: [
        {
          id: 'above-text',
          text: 'Above',
          fontFamily: 'Inter',
          fontSize: 24,
          fontWeight: '700',
          fontStyle: 'normal',
          color: '#ffffff',
          textAlign: 'center',
          x: 0,
          y: 0,
          shadow: false,
          opacity: 100,
          rotation: 0,
          position: 'above',
        },
      ],
      shapeLayers: [
        {
          id: 'behind-shape',
          shapeType: 'circle',
          color: '#ffffff',
          width: 80,
          height: 80,
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 100,
          position: 'underneath',
        },
      ],
      layerGroups: [],
      selectedTextLayerId: 'above-text',
      selectedTextLayerIds: ['above-text'],
      selectedShapeId: 'behind-shape',
      selectedShapeIds: ['behind-shape'],
      selectedLayerGroupId: null,
    });

    expect(useStudioStore.getState().groupSelectedLayers()).toBeNull();
    expect(useStudioStore.getState().layerGroups).toHaveLength(0);
  });

  it('uses the union of every member outer edge for the group bounds', () => {
    useStudioStore.setState({
      textLayers: [],
      phosphorIconLayers: [],
      canvasElements: [],
      shapeLayers: [
        {
          id: 'circle-member',
          shapeType: 'circle',
          color: '#ffffff',
          width: 134.4,
          height: 134.4,
          x: -194,
          y: -103,
          rotation: 0,
          opacity: 100,
          position: 'above',
        },
        {
          id: 'custom-member',
          shapeType: 'custom-path',
          color: '#ffffff',
          width: 142.24,
          height: 162.4,
          x: -253.12,
          y: -132.44,
          rotation: 0,
          opacity: 100,
          position: 'above',
        },
      ],
      layerGroups: [],
      selectedTextLayerId: null,
      selectedTextLayerIds: [],
      selectedPhosphorIconLayerId: null,
      selectedPhosphorIconLayerIds: [],
      selectedElementId: null,
      selectedElementIds: [],
      selectedShapeId: 'custom-member',
      selectedShapeIds: ['circle-member', 'custom-member'],
      selectedLayerGroupId: null,
      layerOrder: [
        { type: 'shape', id: 'custom-member' },
        { type: 'shape', id: 'circle-member' },
      ],
    });

    const groupId = useStudioStore.getState().groupSelectedLayers();
    const group = useStudioStore.getState().layerGroups[0];

    expect(groupId).toBeTruthy();
    expect(group.originX).toBeCloseTo(-225.52, 2);
    expect(group.x).toBeCloseTo(-225.52, 2);
    expect(group.width).toBeCloseTo(197.44, 2);
    expect(group.originY).toBeCloseTo(-124.72, 2);
    expect(group.height).toBeCloseTo(177.84, 2);
  });
});
