import type { StudioState } from '../types/studio';

export type SharedDesignLoadFailure = 'sign_in' | 'unavailable' | 'service_error';

export function classifySharedDesignLoadFailure(status: number): SharedDesignLoadFailure {
  if (status === 401) return 'sign_in';
  if (status === 403 || status === 404) return 'unavailable';
  return 'service_error';
}

/**
 * The root of a shared payload contains the stage that was active when it was
 * saved. Older payloads did not always synchronize that stage back into the
 * stages array first, so root values are only Stage 1 values when index 0 was
 * active. Otherwise stages[0] is the authoritative initial layout.
 */
export function hydrateSharedStudioState(parsed: Partial<StudioState>): Partial<StudioState> {
  const initialStage =
    Array.isArray(parsed.stages) && parsed.stages.length > 0 ? parsed.stages[0] : {};
  const rootIsInitialStage = (parsed.activeStageIndex ?? 0) === 0;
  const hydratedStage = rootIsInitialStage
    ? { ...initialStage, ...parsed }
    : { ...parsed, ...initialStage };

  return {
    ...hydratedStage,
    stages: parsed.stages,
    activeStageIndex: 0,
    currentTimeSec: 0,
    isPlaying: false,
  };
}
