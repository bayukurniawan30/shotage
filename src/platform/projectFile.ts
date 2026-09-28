import { DEFAULT_STUDIO_STATE, type StudioState } from '../types/studio';
import { getStageSnapshot } from '../store/useStudioStore';
import { createSavedSessionData, normalizeRestoredSession } from '../utils/sessionStore';

export const PROJECT_FORMAT = 'shotage-project';
export const PROJECT_FORMAT_VERSION = 1;
export const MAX_PROJECT_BYTES = 100 * 1024 * 1024;

export interface StudioProjectFile {
  format: typeof PROJECT_FORMAT;
  formatVersion: number;
  createdAt: string;
  updatedAt: string;
  appVersion: string;
  studioState: Partial<StudioState>;
}

export function createProjectFile(state: StudioState, createdAt?: string): StudioProjectFile {
  const snapshot = createSavedSessionData(state).data;
  const stages = Array.isArray(snapshot.stages) ? [...snapshot.stages] : [];
  if (stages.length > 0 && state.activeStageIndex >= 0 && state.activeStageIndex < stages.length) {
    stages[state.activeStageIndex] = getStageSnapshot(state);
    snapshot.stages = stages;
  }
  const now = new Date().toISOString();
  return {
    format: PROJECT_FORMAT,
    formatVersion: PROJECT_FORMAT_VERSION,
    createdAt: createdAt || now,
    updatedAt: now,
    appVersion: '1.0.0',
    studioState: snapshot,
  };
}

export function parseProjectFile(raw: string): StudioProjectFile {
  if (new TextEncoder().encode(raw).length > MAX_PROJECT_BYTES) {
    throw new Error('This project is too large to open (maximum 100 MB).');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('This is not a valid Shotage project file.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('This file does not contain a Shotage design.');
  }

  const candidate = parsed as Record<string, unknown>;
  const isEnvelope = candidate.format === PROJECT_FORMAT;
  if (candidate.format && !isEnvelope) {
    throw new Error('This file uses an unsupported project format.');
  }
  if (isEnvelope && candidate.formatVersion !== PROJECT_FORMAT_VERSION) {
    throw new Error('This project was made with an unsupported Shotage format version.');
  }
  const data = isEnvelope ? candidate.studioState : candidate;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('This file has no valid Studio design state.');
  }
  const state = data as Partial<StudioState>;
  if (
    typeof state.frameType !== 'string' ||
    !Array.isArray(state.stages) ||
    !Number.isInteger(state.activeStageIndex) ||
    !Array.isArray(state.textLayers) ||
    !Array.isArray(state.shapeLayers)
  ) {
    throw new Error('This design is missing required Studio fields.');
  }

  const normalized = normalizeRestoredSession(state);
  return {
    format: PROJECT_FORMAT,
    formatVersion: PROJECT_FORMAT_VERSION,
    createdAt:
      isEnvelope && typeof candidate.createdAt === 'string'
        ? candidate.createdAt
        : new Date().toISOString(),
    updatedAt:
      isEnvelope && typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date().toISOString(),
    appVersion:
      isEnvelope && typeof candidate.appVersion === 'string' ? candidate.appVersion : 'legacy',
    studioState: { ...DEFAULT_STUDIO_STATE, ...normalized },
  };
}
