import { useState, useEffect, useCallback } from 'react';
// Import the configured Axios instance
import axiosInstance from '../api/axiosConfig'; // Corrected path

import { UserProgress, QuizSubmission, QuizSubmissionResponse } from '../types'; // Import all from your types file

// Define the chart data interface
export interface ChartData {
  dates: string[];
  quiz_completions: number[];
  points_earned: number[];
}

export const useTutorialProgress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  
  // Add state for chart data
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoadingChartData, setIsLoadingChartData] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/learning/progress/');
      
      // Map snake_case from backend to camelCase for frontend
      const formattedProgress: UserProgress = {
        completedTutorials: response.data.completed_tutorials || [],
        totalPoints: response.data.total_points || 0,
        completedCount: response.data.completed_count || 0,
        completedByTopic: response.data.completed_by_topic || {},
        lastActivity: response.data.last_activity
      };
      
      setProgress(formattedProgress);
    } catch (err: any) {
      console.error("Failed to fetch progress:", err);
      setError(err.message || 'Failed to load progress data.');
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);
  
  // Function to fetch chart data
  const fetchChartData = useCallback(async () => {
    setIsLoadingChartData(true);
    setChartError(null);
    try {
      const response = await axiosInstance.get('/learning/chart-data/');
      setChartData(response.data);
      return response.data;
    } catch (err: any) {
      console.error("Failed to fetch chart data:", err);
      setChartError(err.message || 'Failed to load chart data.');
      setChartData(null);
      return null;
    } finally {
      setIsLoadingChartData(false);
    }
  }, []);
  
  // Fetch chart data on initial load
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const resetProgress = useCallback(async (): Promise<boolean> => {
    setIsResetting(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/learning/reset-progress/');
      
      // Refetch the progress to update the UI
      await fetchProgress();
      
      // Also refetch chart data
      await fetchChartData();
      
      // Return success
      return true;
    } catch (err: any) {
      console.error("Failed to reset progress:", err);
      setError(err.message || 'Failed to reset progress.');
      return false;
    } finally {
      setIsResetting(false);
    }
  }, [fetchProgress, fetchChartData]);

  const submitQuizAnswers = useCallback(
    async (tutorialId: string, answers: QuizSubmission['answers']): Promise<QuizSubmissionResponse> => {
      try {
        // Make sure we're sending the right data format
        const payload = {
          tutorial_id: tutorialId,
          answers: answers
        };
        
        const response = await axiosInstance.post<QuizSubmissionResponse>(
          '/learning/submit-quiz/',
          payload
        );
        
        // Small delay to ensure database updates are complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch updated progress after quiz submission
        await fetchProgress();
        
        // Also fetch updated chart data
        await fetchChartData();
        
        return response.data;
      } catch (err: any) {
        console.error("Failed to submit quiz:", err);
        if (err.response) {
          console.error("Response data:", err.response.data);
          console.error("Response status:", err.response.status);
        }
        throw new Error(err.message || 'Failed to submit quiz.');
      }
    },
    [fetchProgress, fetchChartData]
  );

  return {
    progress,
    isLoading,
    error,
    isResetting,
    chartData,
    isLoadingChartData,
    chartError,
    fetchProgress,
    fetchChartData,
    resetProgress,
    submitQuizAnswers,
  };
};