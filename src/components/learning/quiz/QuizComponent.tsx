// src/components/learning/quiz/QuizComponent.tsx
import React, { useState } from 'react';
import { CheckSquare, Type, ListChecks, AlertCircle, ChevronRight } from 'lucide-react';
import { QuizQuestion as QuizQuestionType } from '../../../types';
import { QuizSummary } from './QuizSummary';

interface QuizComponentProps {
  tutorialId: string;
  tutorialTitle: string;
  questions: QuizQuestionType[];
  onComplete: (score: number, totalPoints: number, answers: Record<string, string | string[]>) => void;
  onFinish: () => void; // New prop for final navigation
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  tutorialId,
  tutorialTitle,
  questions = [],
  onComplete,
  onFinish,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  // If there are no questions, show an empty state
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <ListChecks className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-blue-900 mb-2">No Quiz Available</h2>
        <p className="text-blue-600">This tutorial doesn't have any quiz questions yet.</p>
      </div>
    );
  }

  const handleAnswer = (answer: string | string[]) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
  };

  const calculateScore = () => {
    let calculatedScore = 0;
    let calculatedTotalPoints = 0;

    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      calculatedTotalPoints += question.points;

      if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
        const isCorrect = question.correctAnswer.length === answer.length &&
          question.correctAnswer.every(a => answer.includes(a));
        if (isCorrect) calculatedScore += question.points;
      } else if (!Array.isArray(question.correctAnswer) && !Array.isArray(answer)) {
        if (answer.toLowerCase() === question.correctAnswer.toLowerCase()) {
          calculatedScore += question.points;
        }
      }
    });

    return { score: calculatedScore, totalPoints: calculatedTotalPoints };
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const { score: calculatedScore, totalPoints: calculatedTotalPoints } = calculateScore();
      setScore(calculatedScore);
      setTotalPoints(calculatedTotalPoints);
      setShowSummary(true);

      // Call onComplete with calculated results to update progress
      onComplete(calculatedScore, calculatedTotalPoints, answers);
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
        onComplete={onFinish} // Just pass the onFinish function directly
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
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${currentAnswer === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-100 hover:border-blue-300'
                  }`}
              >
                <span className="text-blue-900">{option}</span>
              </button>
            ))}
          </div>
        );

      case 'free-text':
        return (
          <div className="space-y-4">
            <textarea
              value={currentAnswer as string || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full p-4 rounded-lg border-2 border-blue-100 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 min-h-[120px]"
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
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-blue-100 hover:border-blue-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-blue-300'
                      }`}>
                      {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-blue-900">{option}</span>
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {questions[currentQuestion]?.type === 'multiple-choice' && <ListChecks className="w-6 h-6 text-blue-600" />}
          {questions[currentQuestion]?.type === 'free-text' && <Type className="w-6 h-6 text-blue-600" />}
          {questions[currentQuestion]?.type === 'multiple-select' && <CheckSquare className="w-6 h-6 text-blue-600" />}
          <h2 className="text-2xl font-bold text-blue-900">{tutorialTitle} Quiz</h2>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className="text-blue-600 mt-2">Question {currentQuestion + 1} of {questions.length}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-2 mb-6">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <p className="text-lg text-blue-900">{questions[currentQuestion]?.question}</p>
        </div>

        {renderQuestionContent()}

        <div className="flex justify-between items-center mt-8">
          <p className="text-blue-600">Points: {questions[currentQuestion]?.points}</p>
          <button
            onClick={handleNext}
            disabled={!answers[questions[currentQuestion]?.id]}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentQuestion === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};