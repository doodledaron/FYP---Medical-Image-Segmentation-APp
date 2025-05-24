// src/App.tsx
import { useState } from "react";
import { ViewManager } from "./components/ViewManager";
import { useFileProcessing } from "./hooks/useFileProcessing";
import { useQuizManagement } from "./hooks/useQuizManagement";
import { useTutorialProgress } from "./hooks/useTutorialProgress";

type ViewType = "dashboard" | "tutorials" | "progress";

export default function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  // Get hooks
  const tutorialProgress = useTutorialProgress();
  const quizManagement = useQuizManagement();
  const fileProcessing = useFileProcessing();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50">
      <ViewManager
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
    </div>
  );
}