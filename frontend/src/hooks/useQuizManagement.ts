// useQuizManagement.ts
import { useEffect, useState } from 'react';
import { Tutorial } from '../types'; // This should match your backend tutorial structure
import { fetchTutorialDetail } from '../api/learning'; // <-- Corrected import name

export function useQuizManagement(selectedTutorial: string | null) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<string | null>(null);
  
  const [quizResults, setQuizResults] = useState<{
    score: number;
    totalPoints: number;
    answers: Record<string, string | string[]>;
  } | null>(null);

  // 🔁 Fetch tutorial when selectedTutorial changes
  useEffect(() => {
    if (!selectedTutorial) return;

    setLoading(true);
    setError(null);
    setTutorial(null); // reset old data first

    fetchTutorialDetail(selectedTutorial) // <-- Corrected function call
      .then(setTutorial)
      .catch((err) => setError(err.message ?? 'Failed to load tutorial'))
      .finally(() => setLoading(false));
  }, [selectedTutorial]);

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
    setCurrentTutorial(null);
    setQuizResults(null);
    setTutorial(null);
    setError(null);
  };

  return {
    showQuiz,
    setShowQuiz,
    showQuizSummary,
    selectedTutorial: currentTutorial, // or just currentTutorial if you want
    setSelectedTutorial: setCurrentTutorial, // <-- add this line
    quizResults,
    handleQuizComplete,
    resetQuiz,
    tutorial,
    loading,
    error,
  };
}
