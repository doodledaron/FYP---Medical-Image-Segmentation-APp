// src/App.tsx
import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { ViewManager } from "./components/ViewManager";
import { useFileProcessing } from "./hooks/useFileProcessing";
import { useQuizManagement } from "./hooks/useQuizManagement";
import { useTutorialProgress } from "./hooks/useTutorialProgress";

type ViewType = "dashboard" | "tutorials" | "progress";

export default function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  // Get tutorial progress hooks
  const tutorialProgress = useTutorialProgress();

  // Get other hooks
  // Pass null as the initial selected tutorial
  const quizManagement = useQuizManagement(null);
  const fileProcessing = useFileProcessing();


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        // Ensure progress is not null before passing, or handle null in Sidebar
        progress={tutorialProgress.progress ?? undefined}
        // Removed tutorialScoresLength prop
      />

      <div className="pl-64">
        <ViewManager
          currentView={currentView}
        />
      </div>
    </div>
  );
}