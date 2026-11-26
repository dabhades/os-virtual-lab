export type LabId =
  | 'linux-terminal'
  | 'cpu-scheduling'
  | 'synchronization'
  | 'bankers-algorithm'
  | 'memory-allocation'
  | 'page-replacement'
  | 'disk-scheduling'
  | 'file-management';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface LabMetadata {
  id: LabId;
  number: string;
  title: string;
  shortTitle: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  topics: string[];
  has3D: boolean;
  route: string;
}

export interface LessonSummary {
  slug: string;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
}

export interface ExperimentRunSummary {
  id: string;
  labId: LabId;
  labTitle: string;
  algorithm: string;
  timestamp: string;
  summaryMetric: string;
  configSnapshot?: unknown;
}

export interface UserPreferences {
  prefer2DOnly: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  fontScale: 'normal' | 'large';
  showExplainerToasts: boolean;
}

export interface LearningProgress {
  completedLessons: string[];
  completedLabs: LabId[];
  quizScores: Record<string, number>;
  lastVisitedRoute: string | null;
  lastVisitedLabel: string | null;
}
