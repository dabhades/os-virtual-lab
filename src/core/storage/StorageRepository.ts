import type {
  ExperimentRunSummary,
  LearningProgress,
  UserPreferences,
} from '../../types/learning';

/**
 * Persistence abstraction allowing MVP browser storage (localStorage + IndexedDB)
 * to be swapped or extended with cloud synchronization in v2.0 without touching UI/labs.
 */
export interface StorageRepository {
  getPreferences(): UserPreferences;
  savePreferences(prefs: UserPreferences): void;

  getProgress(): LearningProgress;
  saveProgress(progress: LearningProgress): void;

  listRecentExperiments(limit?: number): Promise<ExperimentRunSummary[]>;
  saveExperimentRun(run: ExperimentRunSummary): Promise<void>;
  getExperimentRun(id: string): Promise<ExperimentRunSummary | null>;
  clearHistory(): Promise<void>;
}
