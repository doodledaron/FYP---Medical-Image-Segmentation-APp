//Video tutorial quizzes

import React, { useState } from 'react';
import { CheckSquare, Type, ListChecks, AlertCircle, ChevronRight, Award, BookOpen, Target, Lightbulb, ArrowRight, Brain, Trophy, BarChart } from 'lucide-react';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'free-text' | 'multiple-select';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
}

interface TutorialQuizProps {
  tutorialId: string;
  tutorialTitle: string;
  questions: QuizQuestion[];
  onComplete: (score: number, totalPoints: number, answers: Record<string, string | string[]>) => void;
}

export const TutorialQuiz: React.FC<TutorialQuizProps> = ({
  tutorialId,
  tutorialTitle,
  questions = [], // Provide default empty array
  onComplete,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // If there are no questions, show a message
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-blue-900 mb-2">No Quiz Available</h2>
          <p className="text-blue-600">This tutorial doesn't have any quiz questions yet.</p>
        </div>
      </div>
    );
  }

  const handleAnswer = (answer: string | string[]) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer });
  };

  const calculateScore = () => {
    let totalScore = 0;
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
        const isCorrect = question.correctAnswer.length === answer.length &&
          question.correctAnswer.every(a => answer.includes(a));
        if (isCorrect) totalScore += question.points;
      } else if (!Array.isArray(question.correctAnswer) && !Array.isArray(answer)) {
        if (answer.toLowerCase() === question.correctAnswer.toLowerCase()) {
          totalScore += question.points;
        }
      }
    });
    return totalScore;
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      const finalScore = calculateScore();
      setScore(finalScore);
      setIsComplete(true);
      setShowSummary(true);
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      onComplete(finalScore, totalPoints, answers);
    }
  };

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  currentAnswer === option
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
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-blue-100 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border-2 rounded ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-blue-300'
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

  // Render summary if quiz is complete
  if (isComplete || showSummary) {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / totalPoints) * 100);
    const correctAnswers = Object.entries(answers).filter(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (!question) return false;
      if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
        return question.correctAnswer.length === answer.length &&
          question.correctAnswer.every(a => answer.includes(a));
      }
      return !Array.isArray(question.correctAnswer) && !Array.isArray(answer) &&
        answer.toLowerCase() === question.correctAnswer.toLowerCase();
    }).length;

    return (
      <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
        {/* Score Overview */}
        <div className="text-center mb-12">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-blue-900 mb-4">{tutorialTitle} Completed!</h2>
          <div className="flex justify-center gap-8">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
              <div className="text-sm text-blue-500">Overall Score</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{correctAnswers}/{questions.length}</div>
              <div className="text-sm text-blue-500">Questions Correct</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{score}/{totalPoints}</div>
              <div className="text-sm text-blue-500">Points Earned</div>
            </div>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BarChart className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-blue-900">Performance Analysis</h3>
          </div>
          <div className="space-y-6">
            {questions.map((q, index) => {
              const userAnswer = answers[q.id];
              const isCorrect = Array.isArray(q.correctAnswer)
                ? Array.isArray(userAnswer) &&
                  q.correctAnswer.length === userAnswer.length &&
                  q.correctAnswer.every(a => userAnswer.includes(a))
                : userAnswer === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-lg ${
                    isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 mb-2">Question {index + 1}: {q.question}</p>
                      <div className="text-sm space-y-1">
                        <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                          Your answer: {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}
                        </p>
                        {!isCorrect && (
                          <p className="text-green-600">
                            Correct answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                          </p>
                        )}
                        <p className="text-blue-600 mt-2">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-blue-900">Learning Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {percentage < 70 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Review Materials</h4>
                </div>
                <p className="text-blue-700 text-sm">Consider reviewing the tutorial content again, focusing on areas where you scored lower.</p>
              </div>
            )}
            {percentage >= 70 && percentage < 90 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Practice More</h4>
                </div>
                <p className="text-blue-700 text-sm">You're doing well! Try practicing with more complex cases to improve further.</p>
              </div>
            )}
            {percentage >= 90 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Advanced Topics</h4>
                </div>
                <p className="text-blue-700 text-sm">Excellent work! You're ready to explore more advanced topics in medical image segmentation.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  // Render quiz questions if not complete
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

        {renderQuestion()}

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