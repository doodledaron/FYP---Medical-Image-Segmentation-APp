// src/types/index.ts
import { ReactNode } from "react";

// NEW types ----------------------------------------------------------
export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'multiple-select' | 'free-text' | 'true-false';
  options?: string[];
  points: number;
  correctAnswer: string | string[];
  explanation?: string;
}

/** Single tutorial (practice or video) returned by DRF */
export interface Tutorial {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  tutorial_type: 'practice' | 'video';
  topic: string;
  description: string;
  questions: QuizQuestion[];       // <-- we only need this for quizzes
  created_at: string;
}


/**
 * Represents a user's score for a completed tutorial quiz
 */
export interface TutorialScore {
  tutorialId: string;
  score: number;
  totalPoints: number;
  completedAt: string;
  answers: Record<string, string | string[]>;
}

/**
 * User's overall learning progress (aligned with backend data)
 */
export interface UserProgress {
  completedTutorials: string[]; // Changed from string[] to number[]
  totalPoints: number;
  completedCount: number;
  completedByTopic: Record<string, number>;
  lastActivity: string | null; // Changed from string to string | null
  // Removed 'scores' as it's not provided by the hook
}

/**
 * Type for the main navigation views
 */
export type ViewType = 'dashboard' | 'tutorials' | 'bestPractices' | 'progress';

/**
 * Result of segmentation processing
 */
export interface SegmentationResult {
  success: boolean;
  originalFileUrl: string;    // Original NIFTI file URL
  tumorSegmentationUrl: string;   // Tumor segmentation mask URL
  lungSegmentationUrl: string;    // Lung segmentation mask URL
  resultUrl: string;          // Legacy property for backward compatibility (points to tumor segmentation)
  metrics: {
    tumorVolume: number;     // Tumor volume in cubic centimeters
    lungVolume: number;      // Lung volume in cubic centimeters
    lesionCount: number;     // Number of distinct lesions
    confidenceScore: number; // Model confidence score (0-1)
  };
  error?: string;           // Error message if success is false
}


/**
 * Props for file upload component
 */
export interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

/**
 * Props for 3D viewer component
 */
export interface Viewer3DProps {
  segmentationData?: any;
}

/**
 * Blog post data structure
 */
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  category: string;
  icon: ReactNode;
  content: string;
  image: string;
  author: string;
  date: string;
  tags: string[];
}

/**
 * Tutorial step for interactive tutorials
 */
export interface IntroStep {
  title: string;
  description: string;
  hint: string;
  action: string;
  demo?: boolean;
  icon: ReactNode;
}

/**
 * Props for alert component
 */
export interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for quiz component
 */
export interface QuizComponentProps {
  tutorialId: string;
  tutorialTitle: string;
  questions: QuizQuestion[];
  onComplete: (score: number, totalPoints: number, answers: Record<string, string | string[]>) => void;
  onFinish: () => void; 
}

/**
 * Props for quiz summary component
 */
export interface QuizSummaryProps {
  title: string;
  questions: QuizQuestion[];
  answers: Record<string, string | string[]>;
  score: number;
  totalPoints: number;
  onComplete: () => void;
}

export interface QuizResult {
  id: number; // Or string if UUID
  user: number; // User ID
  tutorial: string; // Tutorial ID
  tutorial_title: string;
  tutorial_topic: string;
  score: number;
  total_points: number;
  answers: Record<string, string | string[]>;
  completed_at: string;
}

export interface QuizSubmission {
  tutorial_id: string;
  answers: Record<string, string | string[]>; // Or match your answer format
}

// Add this new interface for the paginated tutorial response
export interface PaginatedTutorialsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tutorial[];
}

export interface QuizSubmissionResponse {
  message: string;
  score: number;
  total_points: number;
  // Add other relevant fields from your backend response if needed
}