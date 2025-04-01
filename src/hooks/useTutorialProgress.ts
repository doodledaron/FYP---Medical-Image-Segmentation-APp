// src/hooks/useTutorialProgress.ts
import { useState, useMemo, useEffect } from "react";
import { TutorialScore, Progress } from "../types";
import { loadProgress, saveProgress } from "../utils/progressStorage";

export function useTutorialProgress() {
  // Load scores from localStorage on initialization
  const [tutorialScores, setTutorialScores] = useState<TutorialScore[]>(loadProgress());
  
  // Save scores to localStorage whenever they change
  useEffect(() => {
    saveProgress(tutorialScores);
  }, [tutorialScores]);
  
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
    // Check if this tutorial was already completed
    const existingIndex = tutorialScores.findIndex(
      s => s.tutorialId === score.tutorialId
    );
    
    if (existingIndex >= 0) {
      // Replace existing score
      setTutorialScores(prev => [
        ...prev.slice(0, existingIndex),
        score,
        ...prev.slice(existingIndex + 1)
      ]);
    } else {
      // Add new score
      setTutorialScores(prev => [...prev, score]);
    }
  };

  return { 
    tutorialScores, 
    progress, 
    addTutorialScore 
  };
}