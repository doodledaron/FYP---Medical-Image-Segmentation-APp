// src/components/learning/quiz/QuizSummary.tsx
import React from 'react';
import { CheckCircle, XCircle, HelpCircle, Award, ArrowRight, BookOpen } from 'lucide-react';
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
  const getCorrectness = (question: QuizQuestion, userAnswer: string | string[] | undefined): 'correct' | 'incorrect' | 'unanswered' => {
    // Handle unanswered questions
    if (userAnswer === undefined || (Array.isArray(userAnswer) && userAnswer.length === 0) || userAnswer === '') {
      return 'unanswered';
    }

    if (question.correctAnswer == null) {
      console.warn(`Question ${question.id} missing correctAnswer in summary.`);
      return 'incorrect';
    }

    if (Array.isArray(question.correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        const sortedCorrect = [...question.correctAnswer].sort();
        const sortedUser = [...userAnswer].sort();
        return sortedCorrect.length === sortedUser.length && sortedCorrect.every((val, index) => val === sortedUser[index])
          ? 'correct'
          : 'incorrect';
      }
      return 'incorrect';
    } else {
      if (typeof userAnswer === 'string' && typeof question.correctAnswer === 'string') {
        return userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
          ? 'correct'
          : 'incorrect';
      }
      return 'incorrect';
    }
  };

  // Calculate percentage score
  const percentageScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  
  // Determine performance level
  const getPerformanceLevel = () => {
    if (percentageScore >= 90) return { text: 'Excellent!', color: 'text-green-600' };
    if (percentageScore >= 75) return { text: 'Great Job!', color: 'text-blue-600' };
    if (percentageScore >= 60) return { text: 'Good Work!', color: 'text-indigo-600' };
    if (percentageScore >= 40) return { text: 'Keep Practicing', color: 'text-amber-600' };
    return { text: 'Need Improvement', color: 'text-red-600' };
  };
  
  const performance = getPerformanceLevel();
  
  // Count correct, incorrect, and unanswered questions
  const stats = questions.reduce((acc, question) => {
    const correctness = getCorrectness(question, answers[question.id]);
    acc[correctness]++;
    return acc;
  }, { correct: 0, incorrect: 0, unanswered: 0 });

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
      {/* Enhanced Header with Gradient */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 mb-2">
          {title} - Quiz Results
        </h2>
        <p className="text-blue-600">Review your performance and learn from your answers</p>
      </div>
      
      {/* Enhanced Score Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8 text-center border border-blue-100 shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="bg-white p-4 rounded-full shadow-md">
            <Award className={`w-12 h-12 ${percentageScore >= 60 ? 'text-blue-600' : 'text-amber-500'}`} />
          </div>
        </div>
        <p className="text-xl text-blue-800 mb-1">Your Score:</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <p className="text-5xl font-bold text-blue-700">
            {score}
          </p>
          <p className="text-2xl text-blue-400 font-medium">
            / {totalPoints}
          </p>
        </div>
        <p className={`text-2xl font-bold ${performance.color} mb-2`}>
          {percentageScore}% - {performance.text}
        </p>
        
        {/* Score Breakdown */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{stats.correct} Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{stats.incorrect} Incorrect</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{stats.unanswered} Unanswered</span>
          </div>
        </div>
      </div>

      {/* Question Review Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-blue-900">Review Your Answers:</h3>
        </div>
        
        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer = answers[question.id];
            const correctness = getCorrectness(question, userAnswer);
            
            // Determine background color based on correctness
            const bgColor = 
              correctness === 'correct' ? 'bg-green-50 border-green-200' : 
              correctness === 'incorrect' ? 'bg-red-50 border-red-200' : 
              'bg-gray-50 border-gray-200';

            return (
              <div key={question.id} className={`border-2 rounded-xl p-6 ${bgColor} transition-all hover:shadow-md`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-white rounded-full h-7 w-7 flex items-center justify-center border border-blue-200 shadow-sm mt-1">
                      <span className="text-blue-700 font-medium text-sm">{index + 1}</span>
                    </div>
                    <p className="text-lg font-medium text-blue-900">
                      {question.question}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {correctness === 'correct' && (
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                    {correctness === 'incorrect' && (
                      <div className="bg-red-100 p-2 rounded-full">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                    )}
                    {correctness === 'unanswered' && (
                      <div className="bg-gray-100 p-2 rounded-full">
                        <HelpCircle className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pl-10">
                  <div className={`p-3 rounded-lg ${
                    correctness === 'correct' ? 'bg-green-100' : 
                    correctness === 'incorrect' ? 'bg-white' : 'bg-white'
                  }`}>
                    <p className={`font-medium ${
                      correctness === 'correct' ? 'text-green-700' : 
                      correctness === 'incorrect' ? 'text-red-700' : 
                      'text-gray-600'
                    }`}>
                      Your Answer: {Array.isArray(userAnswer) ? userAnswer.join(', ') : (userAnswer || 'Not answered')}
                    </p>
                  </div>
                  
                  {correctness !== 'correct' && (
                    <div className="p-3 rounded-lg bg-blue-100">
                      <p className="font-medium text-blue-700">
                        Correct Answer: {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                      </p>
                    </div>
                  )}
                  
                  {question.explanation && correctness !== 'correct' && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-amber-800 italic">
                        <span className="font-medium not-italic">Explanation:</span> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Button */}
      <div className="mt-10 text-center">
        <button
          onClick={onComplete}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mx-auto"
        >
          <span className="font-semibold text-lg">Continue Learning</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};