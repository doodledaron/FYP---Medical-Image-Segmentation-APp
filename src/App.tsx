import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { ViewManager } from "./components/ViewManager";
import { useFileProcessing } from "./components/hooks/useFileProcessing";
import { useQuizManagement } from "./components/hooks/useQuizManagement";
import { useTutorialProgress } from "./components/hooks/useTutorialProgress";
import { InteractiveSegmentationTutorial } from "./components/tutorials/InteractiveSegmentationTutorial";

// Define the view type to match what Sidebar and ViewManager expect
type ViewType = "dashboard" | "tutorials" | "bestPractices" | "progress";

export default function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [showTutorial, setShowTutorial] = useState<boolean>(true);

  const fileProcessing = useFileProcessing();
  const quizManagement = useQuizManagement();
  const tutorialProgress = useTutorialProgress();

  if (showTutorial) {
    return <InteractiveSegmentationTutorial onComplete={() => setShowTutorial(false)} />;
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
