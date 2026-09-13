import type { AnimationEasingType } from '../types/animationTypes';
import type { StageTransition, StageTransitionType, StudioState } from '../types/studio';

const DB_NAME = 'shotage_session_db';
const DB_VERSION = 1;
const STORE_NAME = 'session_store';
const SESSION_KEY = 'active_session';
const LOCAL_STORAGE_KEY = 'shotage-session-v1';
const SESSION_VERSION = '1.2';
const DEFAULT_TRANSITION: StageTransition = {
  type: 'none',
  durationSec: 0.6,
  easing: 'ease-in-out',
};
const TRANSITION_TYPES = new Set<StageTransitionType>([
  'none',
  'crossfade',
  'slide-left',
  'slide-right',
  'zoom-fade',
]);
const TRANSITION_EASINGS = new Set<AnimationEasingType>([
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'spring',
]);

const normalizeTransition = (value: unknown): StageTransition => {
  const transition = value as Partial<StageTransition> | null | undefined;
  return {
    type:
      transition?.type && TRANSITION_TYPES.has(transition.type)
        ? transition.type
        : DEFAULT_TRANSITION.type,
    durationSec: Math.max(
      0.1,
      Math.min(1.5, Number(transition?.durationSec) || DEFAULT_TRANSITION.durationSec)
    ),
    easing:
      transition?.easing && TRANSITION_EASINGS.has(transition.easing)
        ? transition.easing
        : DEFAULT_TRANSITION.easing,
  };
};

export const normalizeRestoredSession = (data: Partial<StudioState>): Partial<StudioState> => {
  if (!Array.isArray(data.stages) || data.stages.length === 0) {
    return { ...data, transitionOut: normalizeTransition(data.transitionOut) };
  }

  const activeStageIndex = Math.max(
    0,
    Math.min(data.stages.length - 1, Number(data.activeStageIndex) || 0)
  );
  const stages = data.stages.map((stage, index) => ({
    ...stage,
    transitionOut: normalizeTransition(
      stage.transitionOut || (index === activeStageIndex ? data.transitionOut : undefined)
    ),
  }));

  return {
    ...data,
    stages,
    activeStageIndex,
    transitionOut: stages[activeStageIndex].transitionOut,
  };
};

// Open / initialize IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export interface SavedSessionData {
  data: Partial<StudioState>;
  _version: string;
  savedAt: number;
}

const NON_PERSISTENT_KEYS = new Set([
  'isPlaying',
  'isPositionDragging',
  'isExporting',
  'exportTimeSec',
  'isPreviewMode',
]);

/** Strip Zustand actions and transient runtime flags before IndexedDB structured cloning. */
export const createSavedSessionData = (
  state: StudioState,
  savedAt = Date.now()
): SavedSessionData => {
  const data = Object.fromEntries(
    Object.entries(state).filter(
      ([key, value]) => typeof value !== 'function' && !NON_PERSISTENT_KEYS.has(key)
    )
  ) as Partial<StudioState>;
  return { data, _version: SESSION_VERSION, savedAt };
};

/**
 * Save complete studio session to IndexedDB (with full image support) and LocalStorage (metadata).
 */
export const saveSession = async (state: StudioState): Promise<void> => {
  if (state.isPlaying) return;
  const payload = createSavedSessionData(state);

  // 1. Try IndexedDB (supports large base64 image data)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(payload, SESSION_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB failed or disabled in strict mode
  }

  // 2. Also mirror to LocalStorage (strip large images if needed to avoid quota errors)
  try {
    // Try saving full payload first
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // If quota exceeded, strip images for localStorage fallback
      const { imageSrc, secondImageSrc, ...withoutImages } = payload.data;
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          data: withoutImages,
          _version: SESSION_VERSION,
          savedAt: Date.now(),
        })
      );
    }
  } catch {
    // LocalStorage unavailable
  }
};

/**
 * Load saved session from IndexedDB, falling back to LocalStorage.
 */
export const loadSavedSession = async (): Promise<Partial<StudioState> | null> => {
  // 1. Try IndexedDB first (contains full images and stages)
  try {
    const db = await openDB();
    const result = await new Promise<SavedSessionData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SESSION_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (result?.data && typeof result.data === 'object') {
      return normalizeRestoredSession(result.data);
    }
  } catch {
    // Fall back to LocalStorage
  }

  // 2. Fall back to LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.data && typeof parsed.data === 'object') {
        return normalizeRestoredSession(parsed.data);
      }
      // Legacy format support (where properties were at root)
      if (parsed && typeof parsed === 'object') {
        const { _version, savedAt, ...data } = parsed;
        return normalizeRestoredSession(data);
      }
    }
  } catch {
    // Invalid data
  }

  return null;
};

/**
 * Clear the saved session from both IndexedDB and LocalStorage.
 */
export const clearSavedSession = async (): Promise<void> => {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(SESSION_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // Ignore
  }
};
