export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'free-text' | 'multiple-select';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

export interface Tutorial {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  studyNotes: string[];
  quiz: QuizQuestion[];
}

export interface TutorialScore {
  tutorialId: string;
  score: number;
  totalPoints: number;
  completedAt: string;
  answers: Record<string, string | string[]>;
}

export interface Progress {
  completedTutorials: string[];
  scores: TutorialScore[];
  totalPoints: number;
}

export type ViewType = 'main' | 'tutorials' | 'bestPractices' | 'progress';

export interface SegmentationResult {
  success: boolean;
  error?: string;
}