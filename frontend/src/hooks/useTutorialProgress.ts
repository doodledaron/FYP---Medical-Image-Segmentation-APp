import { useState, useEffect, useCallback } from 'react';
// Import the configured Axios instance
import axiosInstance from '../api/axiosConfig'; // Corrected path

// Define the structure of the progress data coming from the backend
interface UserProgressData {
  completed_tutorials: number[];
  total_points: number;
  completed_count: number;
  completed_by_topic: { [key: string]: number };
  last_activity: string | null; // Adjust type if needed
}

// Define the structure for quiz answers submission
interface QuizSubmission {
  answers: { [key: string]: any }; // Or a more specific type based on your answer format
}

// Define the structure for the quiz submission response (optional but good practice)
interface QuizSubmissionResponse {
  message: string;
  score: number;
  total_points: number;
  // Add other relevant fields from your backend response if needed
}


export const useTutorialProgress = () => {
  const [progress, setProgress] = useState<UserProgressData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the imported axiosInstance - relative URL is now based on baseURL
      const response = await axiosInstance.get<UserProgressData>('/learning/progress/');
      setProgress(response.data);
    } catch (err: any) {
      console.error("Failed to fetch progress:", err);
      // Use err.message directly if using the response interceptor that standardizes errors
      setError(err.message || 'Failed to load progress data.');
      setProgress(null); // Clear progress on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]); // Fetch progress on initial mount

  const submitQuizAnswers = useCallback(async (tutorialId: number, answers: QuizSubmission['answers']): Promise<QuizSubmissionResponse> => {
    try {
      // Use the correct endpoint and payload structure
      const response = await axiosInstance.post<QuizSubmissionResponse>(
        '/learning/submit-quiz/',
        { tutorial_id: tutorialId, answers }
      );
      await fetchProgress();
      return response.data;
    } catch (err: any) {
      console.error("Failed to submit quiz:", err);
      throw new Error(err.message || 'Failed to submit quiz.');
    }
  }, [fetchProgress]);

  // Calculate derived values (optional, backend already provides some)
  // const completedTutorials = progress?.completed_tutorials || [];
  // const totalPoints = progress?.total_points || 0;
  // const completedCount = progress?.completed_count || 0;
  // const completedByTopic = progress?.completed_by_topic || {};

  return {
    progress, // The raw progress data from backend
    isLoading,
    error,
    fetchProgress, // Expose function to allow manual refresh
    submitQuizAnswers, // Expose function to submit quiz answers
    // You can still return derived values if needed, but prefer backend's calculation
    // completedTutorials,
    // totalPoints,
    // completedCount,
    // completedByTopic,
  };
};