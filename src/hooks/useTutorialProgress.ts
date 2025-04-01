import { useState, useMemo } from "react";
import { TutorialScore, Progress } from "../types";

export function useTutorialProgress() {
  const [tutorialScores, setTutorialScores] = useState<TutorialScore[]>([]);
  
  // Calculate derived state from tutorialScores
  const progress: Progress = useMemo(() => {
    const completedTutorials = new Set(tutorialScores.map(score => score.tutorialId));
    const totalPoints = tutorialScores.reduce((acc, score) => acc + score.score, 0);

    return {
      completedTutorials: Array.from(completedTutorials),
      scores: tutorialScores,
      totalPoints,
    };
  }, [tutorialScores]);

  // Add a new score to the tutorial scores
  const addTutorialScore = (score: TutorialScore) => {
    setTutorialScores(prev => [...prev, score]);
  };

  return { 
    tutorialScores, 
    progress, 
    addTutorialScore 
  };
}