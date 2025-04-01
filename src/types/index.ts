// src/types/index.ts
import { ReactNode } from "react";

/**
 * Quiz Question interface with support for different question types
 */
export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'free-text' | 'multiple-select'; // Make sure this matches the values in your data
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

/**
 * Tutorial interface with metadata and quiz questions
 */
export interface Tutorial {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  studyNotes: string[];
  quiz: QuizQuestion[];
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
 * User's overall learning progress
 */
export interface Progress {
  completedTutorials: string[];
  scores: TutorialScore[];
  totalPoints: number;
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
  error?: string;
  // Add more segmentation-specific properties as needed
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