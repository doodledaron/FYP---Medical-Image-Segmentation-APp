// src/App.tsx
import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { ViewManager } from "./components/ViewManager";
import { useFileProcessing } from "./hooks/useFileProcessing";
import { useQuizManagement } from "./hooks/useQuizManagement";
import { useTutorialProgress } from "./hooks/useTutorialProgress";
import { InteractiveSegmentationTutorial } from "./components/learning/tutorials/SegmentationIntro";

type ViewType = "dashboard" | "tutorials" | "bestPractices" | "progress";

export default function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [showTutorial, setShowTutorial] = useState<boolean>(true);

  // Get tutorial progress hooks
  const tutorialProgress = useTutorialProgress();
  
  // Get other hooks
  const quizManagement = useQuizManagement();
  const fileProcessing = useFileProcessing();

  // Show onboarding tutorial for new users
  if (showTutorial) {
    return (
      <InteractiveSegmentationTutorial 
        onComplete={() => setShowTutorial(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        progress={tutorialProgress.progress} 
        tutorialScoresLength={tutorialProgress.tutorialScores.length} 
      />
      
      <div className="pl-64">
        <ViewManager 
          currentView={currentView} 
          fileProcessing={fileProcessing} 
          quizManagement={quizManagement} 
          tutorialProgress={tutorialProgress} 
        />
      </div>
    </div>
  );
}