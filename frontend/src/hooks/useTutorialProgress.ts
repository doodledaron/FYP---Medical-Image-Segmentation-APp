import { useState, useEffect, useCallback } from 'react';
import { fetchUserProgress, submitQuiz } from '../api/learning';
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
      const progressData = await fetchUserProgress();
      setProgress(progressData);
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
  
  // Function to fetch chart data based on actual user activity
  const fetchChartData = useCallback(async () => {
    setIsLoadingChartData(true);
    setChartError(null);
    try {
      // Get quiz completion history from localStorage
      const quizHistory = localStorage.getItem('quizHistory');
      const completions = quizHistory ? JSON.parse(quizHistory) : [];
      
      // Generate chart data for the last 7 days
      const chartData: ChartData = {
        dates: [],
        quiz_completions: [],
        points_earned: []
      };
      
      // Create array of last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        chartData.dates.push(dateStr);
        
        // Count completions and points for this date
        const dayCompletions = completions.filter((completion: any) => 
          completion.completedAt?.split('T')[0] === dateStr
        );
        
        // For quiz completions, only count first-time completions to avoid inflating numbers
        const firstTimeCompletions = dayCompletions.filter((completion: any) => 
          completion.isFirstCompletion !== false
        );
        
        chartData.quiz_completions.push(firstTimeCompletions.length);
        
        // For points, sum all attempts (including retakes) to show total learning effort
        chartData.points_earned.push(
          dayCompletions.reduce((total: number, completion: any) => total + (completion.score || 0), 0)
        );
      }
      
      setChartData(chartData);
      return chartData;
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
      // Clear local storage progress data and quiz history
      localStorage.removeItem('userProgress');
      localStorage.removeItem('quizHistory');
      
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
        // Use the new frontend-only submit quiz function
        const quizResult = await submitQuiz({
          tutorial_id: tutorialId,
          answers: answers
        });
        
        // Small delay to ensure local storage updates are complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch updated progress after quiz submission
        await fetchProgress();
        
        // Also fetch updated chart data
        await fetchChartData();
        
        // Return the result in the expected format
        const response: QuizSubmissionResponse = {
          message: 'Quiz submitted successfully',
          score: quizResult.score,
          total_points: quizResult.total_points
        };
        
        return response;
      } catch (err: any) {
        console.error("Failed to submit quiz:", err);
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