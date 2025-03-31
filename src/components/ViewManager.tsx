import { MainDashboard } from "./dashboard/MainDashboard";
import { TutorialList } from "./tutorials/TutorialList";
import { BestPractices } from "./tutorials/BestPractices";
import { ProgressPage } from "./dashboard/ProgressPage";
import { QuizSummary } from "./quiz/QuizSummary";
import { TutorialQuiz } from "./quiz/TutorialQuiz";
import { videoTutorials } from "../config/tutorials";

interface ViewManagerProps {
  currentView: 'dashboard' | 'tutorials' | 'bestPractices' | 'progress';
  fileProcessing: any;
  quizManagement: any;
  tutorialProgress: any;
}

export function ViewManager({ 
  currentView,
  fileProcessing, 
  quizManagement, 
  tutorialProgress 
}: ViewManagerProps) {
  const { showQuiz, showQuizSummary, selectedTutorial, quizResults, resetQuiz, handleQuizComplete } = quizManagement;
  const { tutorialScores, progress } = tutorialProgress;
  const { file, loading, segmentationResult, show3D, setShow3D, handleFileSelect } = fileProcessing;

  if (currentView === "tutorials") {
    // Show quiz summary if available
    if (showQuizSummary && quizResults && selectedTutorial) {
      const tutorial = videoTutorials.find(t => t.id === selectedTutorial);
      return tutorial ? (
        <QuizSummary
          title={tutorial.title}
          questions={tutorial.quiz}
          answers={quizResults.answers}
          score={quizResults.score}
          totalPoints={quizResults.totalPoints}
          onComplete={resetQuiz}
        />
      ) : null;
    }
    
    // Show quiz if showQuiz is true or a tutorial is selected
    if (showQuiz || selectedTutorial) {
      const tutorial = videoTutorials.find(t => t.id === selectedTutorial || t.id === "general");
      return tutorial ? (
        <TutorialQuiz
          tutorialId={tutorial.id}
          tutorialTitle={tutorial.title}
          questions={tutorial.quiz}
          onComplete={(score, totalPoints, answers) => 
            handleQuizComplete(tutorial.id, score, totalPoints, answers)}
        />
      ) : null;
    }

    // Otherwise show the tutorial list
    return (
      <TutorialList
        tutorials={videoTutorials}
        tutorialScores={tutorialScores}
        onSelectTutorial={(id) => quizManagement.setSelectedTutorial(id)}
        onStartQuiz={() => quizManagement.setShowQuiz(true)}
      />
    );
  }

  if (currentView === "bestPractices") return <BestPractices />;
  if (currentView === "progress") return <ProgressPage progress={progress} />;

  return <MainDashboard 
    file={file} 
    loading={loading} 
    segmentationResult={segmentationResult} 
    show3D={show3D} 
    setShow3D={setShow3D} 
    handleFileSelect={handleFileSelect} 
  />;
}