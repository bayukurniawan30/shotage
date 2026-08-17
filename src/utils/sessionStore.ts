import { StudioState } from '../types/studio';

const DB_NAME = 'shotage_session_db';
const DB_VERSION = 1;
const STORE_NAME = 'session_store';
const SESSION_KEY = 'active_session';
const LOCAL_STORAGE_KEY = 'shotage-session-v1';
const SESSION_VERSION = '1.1';

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

/**
 * Save complete studio session to IndexedDB (with full image support) and LocalStorage (metadata).
 */
export const saveSession = async (state: StudioState): Promise<void> => {
  if (state.isPlaying) return;

  const { isPlaying, isPositionDragging, ...rest } = state;
  const payload: SavedSessionData = {
    data: rest,
    _version: SESSION_VERSION,
    savedAt: Date.now(),
  };

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
      const { imageSrc, secondImageSrc, ...withoutImages } = rest;
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
      return result.data;
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
        return parsed.data;
      }
      // Legacy format support (where properties were at root)
      if (parsed && typeof parsed === 'object') {
        const { _version, savedAt, ...data } = parsed;
        return data;
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
