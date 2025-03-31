import { useState, useMemo } from "react";
import { TutorialScore, Progress } from "../../types";


export function useTutorialProgress() {
  const [tutorialScores, setTutorialScores] = useState<TutorialScore[]>([]);
  const [showTutorialSummary, setShowTutorialSummary] = useState<boolean>(false);
  const [currentTutorialScore, setCurrentTutorialScore] = useState<TutorialScore | null>(null);

  const progress: Progress = useMemo(() => {
    const completedTutorials = new Set(tutorialScores.map(score => score.tutorialId));
    const totalPoints = tutorialScores.reduce((acc, score) => acc + score.totalPoints, 0);

    return {
      completedTutorials: Array.from(completedTutorials),
      scores: tutorialScores,
      totalPoints,
    };
  }, [tutorialScores]);

  const handleSummaryComplete = () => {
    if (currentTutorialScore) {
      setTutorialScores(prev => [...prev, currentTutorialScore]);
    }
    setShowTutorialSummary(false);
    setCurrentTutorialScore(null);
  };

  return { tutorialScores, setTutorialScores, showTutorialSummary, setShowTutorialSummary, currentTutorialScore, setCurrentTutorialScore, handleSummaryComplete, progress };
}
