// src/components/ViewManager.tsx
import { MainDashboard } from "./dashboard/MainDashboard";
import { TutorialList } from "./learning/tutorials/TutorialList";
import { BestPractices } from "./learning/tutorials/BestPractices";
import { ProgressPage } from "./dashboard/ProgressPage";
import { QuizComponent } from "./learning/quiz/QuizComponent";
import { videoTutorials, generalQuiz } from "../config/tutorials";

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
    addTutorialScore: (score: {
      tutorialId: string;
      score: number;
      totalPoints: number;
      completedAt: string;
      answers: Record<string, string | string[]>;
    }) => void;
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
    const { tutorialScores, addTutorialScore } = tutorialProgress;

    if (showQuiz || selectedTutorial) {
      let quizData;

      if (selectedTutorial === "general") {
        quizData = generalQuiz;
      } else {
        quizData = videoTutorials.find(t => t.id === selectedTutorial);
      }

      if (!quizData || !quizData.quiz || !Array.isArray(quizData.quiz)) {
        console.error("Quiz data not found or not in correct format", { selectedTutorial, quizData });
        return (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Quiz Not Available</h2>
            <p className="text-blue-600">Sorry, we couldn't load the quiz at this time.</p>
          </div>
        );
      }

      return (
        <QuizComponent
          tutorialId={quizData.id}
          tutorialTitle={quizData.title}
          questions={quizData.quiz}
          onComplete={(score, totalPoints, answers) => {
            // Create a complete score object
            const scoreRecord = {
              tutorialId: quizData.id,
              score,
              totalPoints,
              completedAt: new Date().toISOString(),
              answers
            };

            // Update progress tracking
            addTutorialScore(scoreRecord);

            // Handle the quiz completion in quizManagement
            handleQuizComplete(quizData.id, score, totalPoints, answers);
          }}
          onFinish={resetQuiz}
        />
      );
    }

    // Otherwise show the tutorial list
    return (
      <TutorialList
        tutorials={videoTutorials}
        tutorialScores={tutorialScores}
        onSelectTutorial={(id) => setSelectedTutorial(id)}
        onStartQuiz={() => {
          setShowQuiz(true);
          setSelectedTutorial("general");
        }}
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