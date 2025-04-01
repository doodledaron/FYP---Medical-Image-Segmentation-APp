import { useState, useMemo, useEffect } from "react";
import { TutorialScore, Progress } from "../types";
import { loadProgress, saveProgress } from "../utils/progressStorage";

export function useTutorialProgress() {
  // Load scores from localStorage on initialization
  const [tutorialScores, setTutorialScores] = useState<TutorialScore[]>(() => loadProgress());
  
  // Save scores to localStorage whenever they change
  useEffect(() => {
    if (tutorialScores.length > 0) {
      saveProgress(tutorialScores);
    }
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

  // Add a new score to the tutorial scores with better validation
  const addTutorialScore = (score: TutorialScore) => {
    if (!score || !score.tutorialId) {
      console.error("Invalid score data", score);
      return;
    }
    
    // Check if this tutorial was already completed
    const existingIndex = tutorialScores.findIndex(
      s => s.tutorialId === score.tutorialId
    );
    
    if (existingIndex >= 0) {
      // Replace existing score with new functional state update
      setTutorialScores(prev => {
        const updated = [...prev];
        updated[existingIndex] = score;
        return updated;
      });
    } else {
      // Add new score using functional state update
      setTutorialScores(prev => [...prev, score]);
    }
  };

  return { 
    tutorialScores, 
    progress, 
    addTutorialScore 
  };
}