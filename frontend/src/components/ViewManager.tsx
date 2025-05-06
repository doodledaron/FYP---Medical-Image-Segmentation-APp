import React from 'react';
import { useTutorialProgress } from '../hooks/useTutorialProgress';
import { QuizComponent } from './learning/quiz/QuizComponent';
import TutorialList from './learning/TutorialList';
import ProgressPage from './dashboard/ProgressPage.tsx';
import { MainDashboard } from './dashboard/MainDashboard';
import { useQuizManagement } from '../hooks/useQuizManagement';
import { useFileProcessing } from '../hooks/useFileProcessing';
import { useTutorialList } from '../hooks/useTutorialList';

// Props might need adjustment based on hook returns
interface ViewManagerProps {
  currentView: string; // Or your ViewType
}

export function ViewManager({ currentView }: ViewManagerProps) {
  const fileProcessing = useFileProcessing();
  const quizManagement = useQuizManagement(null);
  const tutorialProgress = useTutorialProgress();
  // Move useTutorialList hook call to the top level
  const { tutorials, loading: tutorialsLoading, error: tutorialsError } = useTutorialList();

  const renderTutorialView = () => {
    // Remove the hook call from here
    const { showQuiz, selectedTutorial, resetQuiz, setSelectedTutorial, setShowQuiz } = quizManagement;
    // Use progress data from the tutorialProgress hook
    const { progress, isLoading: progressLoading, error: progressError, submitQuizAnswers } = tutorialProgress;

    // Access tutorials, tutorialsLoading, tutorialsError directly from the outer scope
    if (tutorialsLoading || progressLoading) {
      return <p className="text-center p-6 text-blue-600">Loading data...</p>;
    }

    if (tutorialsError || progressError) {
      return (
        <div className="text-center p-6 text-red-600">
          <p>Failed to load data: {tutorialsError || progressError}</p>
        </div>
      );
    }

    // If a tutorial is selected, show the quiz
    if (showQuiz && selectedTutorial && tutorials) {
      const selectedTutorialData = tutorials.find(t => t.id === selectedTutorial);

      return (
        <QuizComponent
          tutorialId={selectedTutorial}
          tutorialTitle={selectedTutorialData?.title || ""}
          questions={selectedTutorialData?.questions || []}
          onComplete={(score, totalPoints, answers) => {
            submitQuizAnswers(Number(selectedTutorial), answers);
          }}
          onFinish={() => {
            resetQuiz();
          }}
        />
      );
    }

    // Show the tutorial list
    return (
      <TutorialList
        tutorials={tutorials || []}
        completedTutorialIds={(progress?.completed_tutorials || []).map(String)}
        onSelectTutorial={(id) => {
          setSelectedTutorial(id);
          setShowQuiz(true);
        }}
      />
    );
  };

  switch (currentView) {
    case 'tutorials':
      return renderTutorialView();

    case 'progress':
      return <ProgressPage />;

    default:
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