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
  const { tutorials, loading: tutorialsLoading, error: tutorialsError } = useTutorialList();

  const renderTutorialView = () => {
    const { showQuiz, selectedTutorial, resetQuiz, setSelectedTutorial, setShowQuiz } = quizManagement;
    const { progress, isLoading: progressLoading, error: progressError, submitQuizAnswers } = tutorialProgress;

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

    if (showQuiz && selectedTutorial) { // selectedTutorial is the ID
      const { tutorial: detailedTutorialData, loading: quizLoading, error: quizError } = quizManagement;

      if (quizLoading) {
        return <p className="text-center p-6 text-blue-600">Loading quiz content...</p>;
      }

      if (quizError) {
        return (
          <div className="text-center p-6 text-red-600">
            <p>Failed to load quiz: {quizError}</p>
          </div>
        );
      }

      if (!detailedTutorialData) {
        return <p className="text-center p-6 text-gray-600">Tutorial details not available for quiz.</p>;
      }

      return (
        <QuizComponent
          tutorialId={selectedTutorial} // This is the ID string
          tutorialTitle={detailedTutorialData.title || ""}
          questions={detailedTutorialData.questions || []} // Use questions from detailedTutorialData
          onComplete={(score, totalPoints, answers) => {
            // Ensure submitQuizAnswers can handle a string ID if necessary,
            // or parse selectedTutorial to number if API strictly requires number.
            // Currently, Tutorial.id is string, submitQuizAnswers expects number.
            const tutorialIdAsNumber = parseInt(selectedTutorial, 10);
            if (!isNaN(tutorialIdAsNumber)) {
              submitQuizAnswers(tutorialIdAsNumber, answers);
            } else {
              console.error("Failed to parse tutorialId to number:", selectedTutorial);
              // Optionally, handle this error more gracefully in the UI
            }
          }}
          onFinish={() => {
            resetQuiz();
          }}
        />
      );
    }

    return (
      <TutorialList
        tutorials={tutorials || []}
        completedTutorialIds={(progress?.completed_tutorials || []).map(String)}
        onSelectTutorial={(id) => {
          setSelectedTutorial(id); // This triggers fetchTutorialDetail in useQuizManagement
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