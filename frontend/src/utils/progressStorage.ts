import { TutorialScore } from '../types';

const STORAGE_KEY = 'medlearn-progress';

/**
 * Load progress data from localStorage with improved error handling
 */
export const loadProgress = (): TutorialScore[] => {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return [];
    
    const parsed = JSON.parse(savedData);
    // Validate that the data is an array
    if (!Array.isArray(parsed)) {
      console.error('Stored progress data is not an array');
      return [];
    }
    
    // Filter out invalid entries
    return parsed.filter(entry => 
      entry && 
      typeof entry === 'object' && 
      'tutorialId' in entry && 
      'score' in entry && 
      'totalPoints' in entry
    );
  } catch (error) {
    console.error('Error loading progress:', error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

/**
 * Save progress data to localStorage with validation
 */
export const saveProgress = (scores: TutorialScore[]): void => {
  if (!Array.isArray(scores)) {
    console.error('Cannot save invalid progress data');
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};