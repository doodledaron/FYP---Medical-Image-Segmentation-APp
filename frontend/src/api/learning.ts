import axiosInstance from './axiosConfig';
// Import PaginatedTutorialsResponse along with other types
import { Tutorial, UserProgress, QuizResult, QuizSubmission, PaginatedTutorialsResponse } from '../types';
import { toCamelCase } from '../utils/camelCase';
import { staticQuizData } from '../data/staticQuizzes';

const API_BASE_URL = '/learning';

export const fetchTutorials = async (): Promise<Tutorial[]> => {
  try {
    // Return static quiz data instead of making API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(staticQuizData), 300); // Simulate network delay
    });
  } catch (error) {
    console.error('Error fetching tutorials:', error);
    throw error;
  }
};

export const fetchTutorialDetail = async (id: string): Promise<Tutorial> => {
  try {
    // Find tutorial in static data instead of making API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const tutorial = staticQuizData.find(t => t.id === id);
        if (tutorial) {
          resolve(tutorial);
        } else {
          reject(new Error(`Tutorial with id ${id} not found`));
        }
      }, 300); // Simulate network delay
    });
  } catch (error) {
    console.error(`Error fetching tutorial ${id}:`, error);
    throw error;
  }
};

export const fetchUserProgress = async (): Promise<UserProgress> => {
  try {
    // Get user progress from local storage instead of API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const progressData = localStorage.getItem('userProgress');
        if (progressData) {
          resolve(JSON.parse(progressData));
        } else {
          // Return default progress structure
          const defaultProgress: UserProgress = {
            completedTutorials: [],
            totalPoints: 0,
            completedCount: 0,
            completedByTopic: {},
            lastActivity: null
          };
          resolve(defaultProgress);
        }
      }, 200); // Simulate network delay
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

export const submitQuiz = async (submission: QuizSubmission): Promise<QuizResult> => {
  try {
    // Save quiz result to local storage instead of API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const tutorial = staticQuizData.find(t => t.id === submission.tutorial_id);
        if (!tutorial) {
          throw new Error(`Tutorial with id ${submission.tutorial_id} not found`);
        }

        // Calculate score
        let score = 0;
        let totalPoints = 0;
        
        tutorial.questions.forEach(question => {
          totalPoints += question.points;
          const userAnswer = submission.answers[question.id];
          if (userAnswer === question.correctAnswer) {
            score += question.points;
          }
        });

        // Update user progress in local storage
        const existingProgress = localStorage.getItem('userProgress');
        const progress: UserProgress = existingProgress ? JSON.parse(existingProgress) : {
          completedTutorials: [],
          totalPoints: 0,
          completedCount: 0,
          completedByTopic: {},
          lastActivity: null
        };

        // Add tutorial to completed if not already there
        if (!progress.completedTutorials.includes(tutorial.id)) {
          progress.completedTutorials.push(tutorial.id);
          progress.completedCount += 1;
          progress.totalPoints += score;
          
          // Update topic completion count
          if (!progress.completedByTopic[tutorial.topic]) {
            progress.completedByTopic[tutorial.topic] = 0;
          }
          progress.completedByTopic[tutorial.topic] += 1;
        }
        
        progress.lastActivity = new Date().toISOString();
        localStorage.setItem('userProgress', JSON.stringify(progress));

        // Save quiz completion to history for chart data
        const completionDate = new Date().toISOString();
        const quizHistory = localStorage.getItem('quizHistory');
        const existingHistory = quizHistory ? JSON.parse(quizHistory) : [];
        
        // Always add quiz attempt to history (allows tracking of retakes)
        existingHistory.push({
          tutorialId: tutorial.id,
          tutorialTitle: tutorial.title,
          topic: tutorial.topic,
          score,
          totalPoints,
          completedAt: completionDate,
          answers: submission.answers,
          isFirstCompletion: !progress.completedTutorials.includes(tutorial.id)
        });
        localStorage.setItem('quizHistory', JSON.stringify(existingHistory));

        // Create quiz result
        const quizResult: QuizResult = {
          id: Date.now(), // Simple ID generation
          user: 1, // Dummy user ID
          tutorial: tutorial.id,
          tutorial_title: tutorial.title,
          tutorial_topic: tutorial.topic,
          score,
          total_points: totalPoints,
          answers: submission.answers,
          completed_at: completionDate
        };

        resolve(quizResult);
      }, 500); // Simulate network delay
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

