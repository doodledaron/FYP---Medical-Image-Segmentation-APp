// useQuizManagement.ts
import { useEffect, useState, useCallback } from 'react';
import { Tutorial } from '../types'; // This should match your backend tutorial structure
import { fetchTutorialDetail } from '../api/learning';
import { useTutorialProgress } from './useTutorialProgress';

export function useQuizManagement() {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetProgress, isResetting } = useTutorialProgress();

  const [showQuiz, setShowQuiz] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [currentTutorialId, setCurrentTutorialId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotalPoints, setQuizTotalPoints] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!currentTutorialId) {
      setTutorial(null);
      return;
    }
    setLoading(true);
    setError(null);
    setTutorial(null);
    fetchTutorialDetail(currentTutorialId)
      .then(setTutorial)
      .catch((err) => setError(err.message ?? 'Failed to load tutorial'))
      .finally(() => setLoading(false));
  }, [currentTutorialId, refreshTrigger]);

  // Start or reset quiz
  const startQuiz = (id: string) => {
    setCurrentTutorialId(id);
    setShowQuiz(true);
    setShowSummary(false);
    setQuizAnswers({});
    setQuizScore(0);
    setQuizTotalPoints(0);
  };

  // Set summary mode
  const showQuizSummary = () => {
    setShowSummary(true);
  };

  // Save quiz results locally and show summary
  const saveQuizResults = (score: number, totalPoints: number, answers: Record<string, string | string[]>) => {
    setQuizAnswers(answers);
    setQuizScore(score);
    setQuizTotalPoints(totalPoints);
    showQuizSummary();
  };

  // Reset quiz state
  const resetQuiz = () => {
    setShowQuiz(false);
    setShowSummary(false);
    setCurrentTutorialId(null);
    setTutorial(null);
    setError(null);
    setQuizAnswers({});
    setQuizScore(0);
    setQuizTotalPoints(0);
  };

  // Reset all progress and refresh tutorial data
  const resetAllProgress = useCallback(async () => {
    const success = await resetProgress();
    if (success) {
      resetQuiz();
      // Trigger a refresh by updating the refreshTrigger state
      setRefreshTrigger(prev => prev + 1);
      return true;
    }
    return false;
  }, [resetProgress]);

  // Function to manually trigger a refresh
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    showQuiz,
    showSummary,
    showQuizSummary,
    tutorial,
    loading,
    error,
    selectedTutorial: currentTutorialId,
    quizAnswers,
    quizScore,
    quizTotalPoints,
    saveQuizResults,
    startQuiz,
    resetQuiz,
    resetAllProgress,
    isResetting,
    refreshData,
    refreshTrigger,
  };
}
