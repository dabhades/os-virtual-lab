import type {
  ExperimentRunSummary,
  LearningProgress,
  UserPreferences,
} from '../../types/learning';
import type { StorageRepository } from './StorageRepository';

const PREFS_KEY = 'kernellab.preferences.v1';
const PROGRESS_KEY = 'kernellab.progress.v1';
const EXPERIMENTS_FALLBACK_KEY = 'kernellab.experiments.v1';

const IDB_NAME = 'KernelLabDB';
const IDB_VERSION = 1;
const IDB_STORE = 'experiments';

export const DEFAULT_PREFERENCES: UserPreferences = {
  prefer2DOnly: false,
  reducedMotion: false,
  highContrast: false,
  fontScale: 'normal',
  showExplainerToasts: true,
};

export const DEFAULT_PROGRESS: LearningProgress = {
  completedLessons: [],
  completedLabs: [],
  quizScores: {},
  lastVisitedRoute: null,
  lastVisitedLabel: null,
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(fallback)) {
      return (Array.isArray(parsed) ? parsed : fallback) as T;
    }
    return { ...fallback, ...(parsed as Partial<T>) };
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

function openExperimentsDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          const store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export class LocalRepository implements StorageRepository {
  getPreferences(): UserPreferences {
    return safeReadJson<UserPreferences>(PREFS_KEY, DEFAULT_PREFERENCES);
  }

  savePreferences(prefs: UserPreferences): void {
    safeWriteJson(PREFS_KEY, prefs);
  }

  getProgress(): LearningProgress {
    return safeReadJson<LearningProgress>(PROGRESS_KEY, DEFAULT_PROGRESS);
  }

  saveProgress(progress: LearningProgress): void {
    safeWriteJson(PROGRESS_KEY, progress);
  }

  async listRecentExperiments(limit = 10): Promise<ExperimentRunSummary[]> {
    const db = await openExperimentsDb();
    if (!db) {
      const list = safeReadJson<ExperimentRunSummary[]>(
        EXPERIMENTS_FALLBACK_KEY,
        []
      );
      return Array.isArray(list) ? list.slice(0, limit) : [];
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result as ExperimentRunSummary[]) ?? [];
          items.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          resolve(items.slice(0, limit));
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async saveExperimentRun(run: ExperimentRunSummary): Promise<void> {
    const db = await openExperimentsDb();
    if (!db) {
      const existing = safeReadJson<ExperimentRunSummary[]>(
        EXPERIMENTS_FALLBACK_KEY,
        []
      );
      const next = [run, ...(Array.isArray(existing) ? existing : [])].slice(
        0,
        25
      );
      safeWriteJson(EXPERIMENTS_FALLBACK_KEY, next);
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(run);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async getExperimentRun(id: string): Promise<ExperimentRunSummary | null> {
    const db = await openExperimentsDb();
    if (!db) {
      const existing = safeReadJson<ExperimentRunSummary[]>(
        EXPERIMENTS_FALLBACK_KEY,
        []
      );
      return Array.isArray(existing)
        ? existing.find((item) => item.id === id) ?? null
        : null;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(id);
        req.onsuccess = () =>
          resolve((req.result as ExperimentRunSummary | undefined) ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async clearHistory(): Promise<void> {
    try {
      window.localStorage.removeItem(EXPERIMENTS_FALLBACK_KEY);
    } catch {
      // ignore
    }
    const db = await openExperimentsDb();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export const storageRepository: StorageRepository = new LocalRepository();
