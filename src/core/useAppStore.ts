import { create } from 'zustand';
import type {
  ExperimentRunSummary,
  LabId,
  LearningProgress,
  UserPreferences,
} from '../types/learning';
import { storageRepository } from './storage/LocalRepository';

interface AppState {
  preferences: UserPreferences;
  progress: LearningProgress;
  recentExperiments: ExperimentRunSummary[];
  isSearchOpen: boolean;
  isSettingsOpen: boolean;
  isAboutOpen: boolean;

  hydrate: () => Promise<void>;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  markLessonCompleted: (slug: string) => void;
  markLabCompleted: (labId: LabId) => void;
  recordLastVisited: (route: string, label: string) => void;
  addExperimentRun: (run: ExperimentRunSummary) => Promise<void>;
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
}

function applyDocumentPreferences(prefs: UserPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('reduce-motion', prefs.reducedMotion);
  root.classList.toggle('high-contrast', prefs.highContrast);
  root.style.fontSize = prefs.fontScale === 'large' ? '18px' : '16px';
}

export const useAppStore = create<AppState>((set, get) => ({
  preferences: storageRepository.getPreferences(),
  progress: storageRepository.getProgress(),
  recentExperiments: [],
  isSearchOpen: false,
  isSettingsOpen: false,
  isAboutOpen: false,

  hydrate: async () => {
    const prefs = storageRepository.getPreferences();
    const progress = storageRepository.getProgress();
    applyDocumentPreferences(prefs);
    const recentExperiments = await storageRepository.listRecentExperiments(5);
    set({ preferences: prefs, progress, recentExperiments });
  },

  updatePreferences: (patch) => {
    const next = { ...get().preferences, ...patch };
    storageRepository.savePreferences(next);
    applyDocumentPreferences(next);
    set({ preferences: next });
  },

  markLessonCompleted: (slug) => {
    const current = get().progress;
    if (current.completedLessons.includes(slug)) return;
    const next: LearningProgress = {
      ...current,
      completedLessons: [...current.completedLessons, slug],
    };
    storageRepository.saveProgress(next);
    set({ progress: next });
  },

  markLabCompleted: (labId) => {
    const current = get().progress;
    if (current.completedLabs.includes(labId)) return;
    const next: LearningProgress = {
      ...current,
      completedLabs: [...current.completedLabs, labId],
    };
    storageRepository.saveProgress(next);
    set({ progress: next });
  },

  recordLastVisited: (route, label) => {
    const current = get().progress;
    const next: LearningProgress = {
      ...current,
      lastVisitedRoute: route,
      lastVisitedLabel: label,
    };
    storageRepository.saveProgress(next);
    set({ progress: next });
  },

  addExperimentRun: async (run) => {
    await storageRepository.saveExperimentRun(run);
    const recentExperiments = await storageRepository.listRecentExperiments(5);
    set({ recentExperiments });
  },

  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setAboutOpen: (open) => set({ isAboutOpen: open }),
}));
