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
