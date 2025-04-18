import { useState } from "react";

export function useQuizManagement() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizSummary, setShowQuizSummary] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<{ 
    score: number; 
    totalPoints: number; 
    answers: Record<string, string | string[]> 
  } | null>(null);
  
  const handleQuizComplete = (
    tutorialId: string, 
    score: number, 
    totalPoints: number, 
    answers: Record<string, string | string[]>
  ) => {
    // Validate inputs
    if (!tutorialId || typeof score !== 'number' || typeof totalPoints !== 'number') {
      console.error('Invalid quiz data', { tutorialId, score, totalPoints });
      return;
    }
    
    // Store the results
    setQuizResults({ score, totalPoints, answers });
    setShowQuizSummary(true);
  };

  const resetQuiz = () => {
    setShowQuiz(false);
    setShowQuizSummary(false);
    setSelectedTutorial(null);
    setQuizResults(null);
  };

  return { 
    showQuiz, 
    setShowQuiz, 
    showQuizSummary, 
    selectedTutorial, 
    setSelectedTutorial, 
    quizResults, 
    handleQuizComplete, 
    resetQuiz 
  };
}