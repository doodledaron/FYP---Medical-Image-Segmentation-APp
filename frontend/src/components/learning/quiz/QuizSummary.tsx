// src/components/learning/quiz/QuizSummary.tsx
import React from 'react';
import { Trophy, BarChart, Lightbulb, BookOpen, Target, Brain } from 'lucide-react';
import { QuizQuestion } from '../../../types';

interface QuizSummaryProps {
  title: string;
  questions: QuizQuestion[];
  answers: Record<string, string | string[]>;
  score: number;
  totalPoints: number;
  onComplete: () => void;
}

export const QuizSummary: React.FC<QuizSummaryProps> = ({
  title,
  questions,
  answers,
  score,
  totalPoints,
  onComplete,
}) => {
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

  const getRecommendations = () => {
    if (percentage >= 90) {
      return {
        icon: <Brain className="w-5 h-5 text-blue-600" />,
        title: 'Advanced Topics',
        content: 'Excellent work! You\'re ready to explore more advanced topics in medical image segmentation.'
      };
    } else if (percentage >= 70) {
      return {
        icon: <Target className="w-5 h-5 text-blue-600" />,
        title: 'Practice More',
        content: 'You\'re doing well! Try practicing with more complex cases to improve further.'
      };
    } else {
      return {
        icon: <BookOpen className="w-5 h-5 text-blue-600" />,
        title: 'Review Materials',
        content: 'Consider reviewing the tutorial content again, focusing on areas where you scored lower.'
      };
    }
  };

  const recommendation = getRecommendations();

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
      {/* Score Overview */}
      <div className="text-center mb-12">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-blue-900 mb-4">{title} Completed!</h2>
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
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            {recommendation.icon}
            <h4 className="font-semibold text-blue-900">{recommendation.title}</h4>
          </div>
          <p className="text-blue-700 text-sm">{recommendation.content}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
      <button
        onClick={onComplete}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Continue Learning
      </button>
    </div>
    </div>
  );
};