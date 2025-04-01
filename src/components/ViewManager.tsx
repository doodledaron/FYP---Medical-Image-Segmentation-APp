// src/components/ViewManager.tsx
import { MainDashboard } from "./dashboard/MainDashboard";
import { TutorialList } from "./learning/tutorials/TutorialList";
import { BestPractices } from "./learning/tutorials/BestPractices";
import { ProgressPage } from "./dashboard/ProgressPage";
import { QuizComponent } from "./learning/quiz/QuizComponent";
import { videoTutorials } from "../config/tutorials";

interface ViewManagerProps {
  currentView: 'dashboard' | 'tutorials' | 'bestPractices' | 'progress';
  fileProcessing: {
    file: File | null;
    loading: boolean;
    segmentationResult: any;
    show3D: boolean;
    setShow3D: (show: boolean) => void;
    handleFileSelect: (file: File) => void;
  };
  quizManagement: {
    showQuiz: boolean;
    setShowQuiz: (show: boolean) => void;
    showQuizSummary: boolean;
    selectedTutorial: string | null;
    setSelectedTutorial: (id: string | null) => void;
    quizResults: { score: number; totalPoints: number; answers: Record<string, string | string[]> } | null;
    resetQuiz: () => void;
    handleQuizComplete: (tutorialId: string, score: number, totalPoints: number, answers: Record<string, string | string[]>) => void;
  };
  tutorialProgress: {
    tutorialScores: any[];
    progress: any;
  };
}

export function ViewManager({ 
  currentView,
  fileProcessing, 
  quizManagement, 
  tutorialProgress 
}: ViewManagerProps) {
  const renderTutorialView = () => {
    const { showQuiz, showQuizSummary, selectedTutorial, quizResults, resetQuiz, handleQuizComplete, setSelectedTutorial, setShowQuiz } = quizManagement;
    const { tutorialScores } = tutorialProgress;

    // Show quiz if showQuiz is true or a tutorial is selected
    if (showQuiz || selectedTutorial) {
      const tutorial = videoTutorials.find(t => t.id === selectedTutorial || t.id === "general");
      
      if (!tutorial) return null;
      
      return (
        <QuizComponent
          tutorialId={tutorial.id}
          tutorialTitle={tutorial.title}
          questions={tutorial.quiz}
          onComplete={(score, totalPoints, answers) => 
            handleQuizComplete(tutorial.id, score, totalPoints, answers)}
        />
      );
    }

    // Otherwise show the tutorial list
    return (
      <TutorialList
        tutorials={videoTutorials}
        tutorialScores={tutorialScores}
        onSelectTutorial={(id) => setSelectedTutorial(id)}
        onStartQuiz={() => setShowQuiz(true)}
      />
    );
  };

  // Render the appropriate view based on the currentView state
  switch (currentView) {
    case 'tutorials':
      return renderTutorialView();
      
    case 'bestPractices':
      return <BestPractices />;
      
    case 'progress':
      return <ProgressPage progress={tutorialProgress.progress} />;
      
    default: // dashboard
      return (
        <MainDashboard 
          file={fileProcessing.file} 
          loading={fileProcessing.loading} 
          segmentationResult={fileProcessing.segmentationResult} 
          show3D={fileProcessing.show3D} 
          setShow3D={fileProcessing.setShow3D} 
          handleFileSelect={fileProcessing.handleFileSelect} 
        />
      );
  }
}