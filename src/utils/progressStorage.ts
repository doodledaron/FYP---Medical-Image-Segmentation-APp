// src/utils/progressStorage.ts
import { Progress, TutorialScore } from '../types';

const STORAGE_KEY = 'medlearn-progress';

// Default empty progress
const defaultProgress: Progress = {
  completedTutorials: [],
  scores: [],
  totalPoints: 0
};

/**
 * Load progress data from localStorage
 */
export const loadProgress = (): TutorialScore[] => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error('Error loading progress:', error);
    return [];
  }
};

/**
 * Save progress data to localStorage
 */
export const saveProgress = (scores: TutorialScore[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};