// src/components/learning/quiz/QuizComponent.tsx
import React, { useState, useEffect } from 'react';
import { CheckSquare, Type, ListChecks, AlertCircle, ChevronRight, Award, ArrowLeft } from 'lucide-react';
import { QuizQuestion as QuizQuestionType, QuizSubmissionResponse } from '../../../types';
import { QuizSummary } from './QuizSummary';

interface QuizComponentProps {
  tutorialId: string | number;
  tutorialTitle: string;
  questions: QuizQuestionType[];
  showSummary?: boolean;
  answers?: Record<string, string | string[]>;
  initialScore?: number;
  initialTotalPoints?: number;
  onComplete: (score: number, totalPoints: number, answers: Record<string, string | string[]>) => void;
  onFinish: () => void;
  onSubmitToBackend?: (answers: Record<string, string | string[]>) => Promise<QuizSubmissionResponse | undefined>;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  tutorialId,
  tutorialTitle,
  questions,
  showSummary = false,
  answers: externalAnswers,
  initialScore = 0,
  initialTotalPoints = 0,
  onComplete,
  onFinish,
  onSubmitToBackend,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(externalAnswers || {});
  const [score, setScore] = useState(initialScore);
  const [totalPoints, setTotalPoints] = useState(initialTotalPoints);

  // Animation states
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);

  // Update internal state if external answers change
  useEffect(() => {
    if (externalAnswers && Object.keys(externalAnswers).length > 0) {
      console.log("Setting answers from external source:", externalAnswers);
      setAnswers(externalAnswers);
    }
  }, [externalAnswers]);

  // Update score and total points from props
  useEffect(() => {
    if (initialScore > 0 || initialTotalPoints > 0) {
      console.log("Setting score from props:", initialScore, initialTotalPoints);
      setScore(initialScore);
      setTotalPoints(initialTotalPoints);
    }
  }, [initialScore, initialTotalPoints]);

  // Add mount/unmount tracking
  useEffect(() => {
    console.log("QuizComponent MOUNTED with tutorialId:", tutorialId);
    return () => {
      console.log("QuizComponent UNMOUNTED with tutorialId:", tutorialId);
    };
  }, [tutorialId]);

  // If there are no questions, show an empty state
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-2xl w-full">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ListChecks className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-blue-900 mb-4">No Quiz Available</h2>
          <p className="text-blue-600 mb-6">This tutorial doesn't have any quiz questions yet.</p>
          <button 
            onClick={onFinish}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Return to Tutorial
          </button>
        </div>
      </div>
    );
  }

  const handleAnswer = (answer: string | string[]) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
  };

  const calculateScore = (updatedAnswers: Record<string, string | string[]>) => {
    let calculatedScore = 0;
    let calculatedTotalPoints = 0;

    Object.entries(updatedAnswers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (!question || question.points == null) {
        console.warn(`Skipping question ${questionId}: Not found or points missing.`);
        return;
      }

      calculatedTotalPoints += question.points;

      if (question.correctAnswer == null) {
        console.warn(`Question ${questionId} is missing correctAnswer. Skipping scoring for this question.`);
        return;
      }

      if (Array.isArray(question.correctAnswer)) {
        if (Array.isArray(answer)) {
          const sortedCorrectAnswer = [...question.correctAnswer].sort();
          const sortedAnswer = [...answer].sort();

          const isCorrect = sortedCorrectAnswer.length === sortedAnswer.length &&
            sortedCorrectAnswer.every((correct, index) => correct === sortedAnswer[index]);

          if (isCorrect) calculatedScore += question.points;
        } else {
          console.warn(`Type mismatch for question ${questionId}: correctAnswer is array, but answer is not.`);
        }
      } else {
        if (typeof answer === 'string' && typeof question.correctAnswer === 'string') {
          if (answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
            calculatedScore += question.points;
          }
        } else {
          console.warn(`Type mismatch or invalid answer for question ${questionId}: answer type='${typeof answer}', correctAnswer type='${typeof question.correctAnswer}'`);
        }
      }
    });

    return { score: calculatedScore, totalPoints: calculatedTotalPoints };
  };

  const handleNext = (answer: string | string[]) => {
    console.log("Quiz handleNext called", { currentQuestion, questionCount: questions.length });
    const updatedAnswers = {
      ...answers,
      [questions[currentQuestion].id]: answer,
    };

    setAnswers(updatedAnswers);

    if (currentQuestion < questions.length - 1) {
      setDirection('next');
      setAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setAnimating(false);
      }, 300);
    } else {
      const { score: calculatedScore, totalPoints: calculatedTotalPoints } = calculateScore(updatedAnswers);
      setScore(calculatedScore);
      setTotalPoints(calculatedTotalPoints);

      setAnimating(true);
      setTimeout(async () => {
        console.log("Submitting answers and showing summary");
        
        // First call onComplete to submit the quiz results locally
        onComplete(calculatedScore, calculatedTotalPoints, updatedAnswers);
        
        // Submit to backend if the handler is provided
        if (onSubmitToBackend) {
          try {
            const response = await onSubmitToBackend(updatedAnswers);
            console.log("Quiz successfully submitted to backend", response);
          } catch (error) {
            console.error("Failed to submit quiz to backend:", error);
          }
        }
        // Summary will be shown by parent via props
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setDirection('prev');
      setAnimating(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setAnimating(false);
      }, 300);
    }
  };

  if (showSummary) {
    return (
      <QuizSummary
        title={tutorialTitle}
        questions={questions}
        answers={answers}
        score={score}
        totalPoints={totalPoints}
        onComplete={onFinish}
      />
    );
  }

  const renderQuestionContent = () => {
    const question = questions[currentQuestion];
    const currentAnswer = answers[question.id] || (question.type === 'multiple-select' ? [] : '');

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 ${
                  currentAnswer === option
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md transform scale-[1.02]'
                    : 'border-blue-100 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <span className="text-blue-900 font-medium">{option}</span>
              </button>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-4">
            <button
              onClick={() => handleAnswer('true')}
              className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 ${
                currentAnswer === 'true'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md transform scale-[1.02]'
                  : 'border-blue-100 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <span className="text-blue-900 font-medium">True</span>
            </button>
            <button
              onClick={() => handleAnswer('false')}
              className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 ${
                currentAnswer === 'false'
                  ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md transform scale-[1.02]'
                  : 'border-blue-100 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <span className="text-blue-900 font-medium">False</span>
            </button>
          </div>
        );

      case 'free-text':
        return (
          <div className="space-y-4">
            <textarea
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full p-5 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 min-h-[180px] shadow-inner"
              placeholder="Type your answer here..."
            />
          </div>
        );

      case 'multiple-select':
        return (
          <div className="space-y-4">
            {question.options?.map((option, index) => {
              const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option);
              return (
                <button
                  key={index}
                  onClick={() => {
                    const newAnswer = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
                    if (isSelected) {
                      handleAnswer(newAnswer.filter(a => a !== option));
                    } else {
                      handleAnswer([...newAnswer, option]);
                    }
                  }}
                  className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md transform scale-[1.02]'
                      : 'border-blue-100 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-blue-300'
                    }`}>
                      {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-blue-900 font-medium">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  const getQuestionTypeIcon = () => {
    const type = questions[currentQuestion]?.type;
    if (type === 'multiple-choice') return <ListChecks className="w-7 h-7 text-blue-600" />;
    if (type === 'free-text') return <Type className="w-7 h-7 text-blue-600" />;
    if (type === 'multiple-select') return <CheckSquare className="w-7 h-7 text-blue-600" />;
    if (type === 'true-false') return <AlertCircle className="w-7 h-7 text-blue-600" />;
    return <AlertCircle className="w-7 h-7 text-blue-600" />;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className={`bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full transition-all duration-300 transform ${
        animating 
          ? direction === 'next' 
            ? 'opacity-0 translate-x-10' 
            : 'opacity-0 -translate-x-10'
          : 'opacity-100 translate-x-0'
      }`}>
        {/* Header with improved designss */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-3 rounded-xl">
              {getQuestionTypeIcon()}
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                {tutorialTitle} Quiz
              </h2>
              <p className="text-blue-600 mt-1">
                Demonstrate your understanding of the material
              </p>
            </div>
          </div>

          {/* Progress bar with animation */}
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-600 font-medium">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <div className="text-indigo-600 font-medium">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
              </div>
            </div>
            <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question content with improved spacing and visual hierarchy */}
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <p className="text-xl text-blue-900 font-medium leading-relaxed">
                {questions[currentQuestion]?.question}
              </p>
            </div>
          </div>

          {/* Answer options with animation */}
          <div className="py-4">
            {renderQuestionContent()}
          </div>

          {/* Navigation controls with improved layout */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-blue-100">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 rounded-lg px-4 py-2 text-blue-700 font-medium">
                Points: {questions[currentQuestion]?.points}
              </div>
              
              {currentQuestion > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
            </div>
            
            <button
              onClick={() => {
                const currentAnswer = answers[questions[currentQuestion]?.id] || 
                  (questions[currentQuestion]?.type === 'multiple-select' ? [] : '');
                handleNext(currentAnswer);
              }}
              disabled={!answers[questions[currentQuestion]?.id]}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl transition-all duration-300
                ${!answers[questions[currentQuestion]?.id]
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:translate-y-[-2px]'
                }
              `}
            >
              {currentQuestion === questions.length - 1 ? (
                <>
                  Complete Quiz
                  <Award className="w-5 h-5 ml-1" />
                </>
              ) : (
                <>
                  Next Question
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};