import React, { useEffect, useCallback, useState } from 'react';
import { useTutorialProgress } from '../hooks/useTutorialProgress';
import { QuizComponent } from './learning/quiz/QuizComponent';
import TutorialList from './learning/TutorialList';
import ProgressPage from './dashboard/ProgressPage.tsx';
import { MainDashboard } from './dashboard/MainDashboard';
import { useQuizManagement } from '../hooks/useQuizManagement';
import { useFileProcessing } from '../hooks/useFileProcessing';
import { useTutorialList } from '../hooks/useTutorialList';
import { Header } from './layout/Header';

interface ViewManagerProps {
  currentView: 'dashboard' | 'tutorials' | 'progress';
  setCurrentView: (view: 'dashboard' | 'tutorials' | 'progress') => void;
}

export function ViewManager({ currentView, setCurrentView }: ViewManagerProps) {
  const fileProcessing = useFileProcessing();
  const quizManagement = useQuizManagement();
  const tutorialProgress = useTutorialProgress();
  
  // Use quizManagement's refreshTrigger to refresh tutorials when progress is reset
  const { tutorials, loading: tutorialsLoading, error: tutorialsError } = useTutorialList(quizManagement.refreshTrigger);

  // Add a refresh key for ProgressPage
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  // Handle progress reset from ProgressPage
  useEffect(() => {
    const handleProgressReset = () => {
      quizManagement.refreshData();
      setProgressRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('progress-reset', handleProgressReset);
    
    return () => {
      window.removeEventListener('progress-reset', handleProgressReset);
    };
  }, [quizManagement]);

  const handleQuizComplete = useCallback((score: number, totalPoints: number, answers: Record<string, string | string[]>) => {
    const { selectedTutorial } = quizManagement;
    
    if (!selectedTutorial) {
      console.error("Missing tutorial ID in handleQuizComplete");
      return;
    }
    
    quizManagement.saveQuizResults(score, totalPoints, answers);
  }, [quizManagement]);

  const handleSubmitQuiz = useCallback(async (answers: Record<string, string | string[]>) => {
    if (!quizManagement.selectedTutorial) {
      console.error("Missing tutorial ID in handleSubmitQuiz");
      return;
    }
    
    try {
      const result = await tutorialProgress.submitQuizAnswers(quizManagement.selectedTutorial, answers);
      
      await tutorialProgress.fetchProgress();
      setProgressRefreshKey(k => k + 1);
      
      return result;
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      throw error;
    }
  }, [quizManagement.selectedTutorial, tutorialProgress]);

  const handleQuizFinish = useCallback(() => {
    quizManagement.resetQuiz();
  }, [quizManagement]);

  const handleRefreshTutorials = useCallback(() => {
    quizManagement.refreshData();
    tutorialProgress.fetchProgress();
  }, [quizManagement, tutorialProgress]);

  const renderTutorialView = () => {
    const { 
      showQuiz, 
      showSummary, 
      selectedTutorial, 
      resetQuiz, 
      startQuiz,
      quizAnswers,
      quizScore,
      quizTotalPoints,
      isResetting
    } = quizManagement;
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

    if (showQuiz && selectedTutorial) {
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
          tutorialId={selectedTutorial}
          tutorialTitle={detailedTutorialData.title || ""}
          questions={detailedTutorialData.questions || []}
          showSummary={showSummary}
          answers={quizAnswers}
          initialScore={quizScore}
          initialTotalPoints={quizTotalPoints}
          onComplete={handleQuizComplete}
          onFinish={handleQuizFinish}
          onSubmitToBackend={handleSubmitQuiz}
        />
      );
    }

    return (
      <TutorialList
        tutorials={tutorials || []}
        completedTutorialIds={(progress?.completedTutorials || []).map(String)}
        onSelectTutorial={(id) => startQuiz(id)}
        isResettingProgress={isResetting}
        onRefresh={handleRefreshTutorials}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        progress={tutorialProgress.progress}
      />
      
      <main className="flex-1 pt-4 pb-8 px-4 sm:px-6 lg:px-8">
        {currentView === 'tutorials' && renderTutorialView()}
        {currentView === 'progress' && <ProgressPage key={progressRefreshKey} />}
        {currentView === 'dashboard' && (
          <MainDashboard
            file={fileProcessing.file}
            loading={fileProcessing.loading}
            segmentationResult={fileProcessing.segmentationResult}
            show3D={fileProcessing.show3D}
            setShow3D={fileProcessing.setShow3D}
            handleFileSelect={fileProcessing.handleFileSelect}
            showSegmentationChoice={fileProcessing.showSegmentationChoice}
            handleSegmentationChoice={fileProcessing.handleSegmentationChoice}
            showManualSegmentation={fileProcessing.showManualSegmentation}
            completeManualSegmentation={fileProcessing.completeManualSegmentation}
          />
        )}
      </main>
    </div>
  );
}