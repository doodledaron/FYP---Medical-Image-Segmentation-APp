// useQuizManagement.ts
import { useEffect, useState } from 'react';
import { Tutorial } from '../types'; // This should match your backend tutorial structure
import { fetchTutorialDetail } from '../api/learning'; // <-- Corrected import name

export function useQuizManagement(initialSelectedTutorial: string | null) { // Renamed prop for clarity
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  const [currentTutorialId, setCurrentTutorialId] = useState<string | null>(initialSelectedTutorial); // Initialize with prop, and this will be the ID to fetch
  
  const [quizResults, setQuizResults] = useState<{
    score: number;
    totalPoints: number;
    answers: Record<string, string | string[]>;
  } | null>(null);

  // 🔁 Fetch tutorial when currentTutorialId changes
  useEffect(() => {
    if (!currentTutorialId) {
      setTutorial(null); // Clear tutorial data if no ID is selected
      return;
    }

    setLoading(true);
    setError(null);
    setTutorial(null); // reset old data first

    fetchTutorialDetail(currentTutorialId) // Use the internal state currentTutorialId for fetching
      .then(setTutorial)
      .catch((err) => setError(err.message ?? 'Failed to load tutorial'))
      .finally(() => setLoading(false));
  }, [currentTutorialId]); // Depend on the internal state currentTutorialId

  // ✅ Handle quiz completion
  const handleQuizComplete = (
    tutorialId: string,
    score: number,
    totalPoints: number,
    answers: Record<string, string | string[]>
  ) => {
    if (!tutorialId || typeof score !== 'number' || typeof totalPoints !== 'number') {
      console.error('Invalid quiz data', { tutorialId, score, totalPoints });
      return;
    }

    setQuizResults({ score, totalPoints, answers });
    setShowQuizSummary(true);
  };

  // 🔁 Reset to initial state
  const resetQuiz = () => {
    setShowQuiz(false);
    setShowQuizSummary(false);
    setCurrentTutorialId(null); // Reset the internal ID
    setQuizResults(null);
    setTutorial(null);
    setError(null);
  };

  return {
    showQuiz,
    setShowQuiz,
    showQuizSummary,
    selectedTutorial: currentTutorialId, // Expose the internal ID state
    setSelectedTutorial: setCurrentTutorialId, // This setter now correctly triggers the useEffect
    quizResults,
    handleQuizComplete,
    resetQuiz,
    tutorial,
    loading,
    error,
  };
}
