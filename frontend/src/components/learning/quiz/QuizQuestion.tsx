import React from 'react';
import { CheckSquare, Type, ListChecks } from 'lucide-react';
import { QuizQuestion as QuizQuestionType } from '../../../types';

interface QuizQuestionProps {
  question: QuizQuestionType;
  currentAnswer: string | string[];
  onAnswer: (answer: string | string[]) => void;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  currentAnswer,
  onAnswer,
}) => {
  switch (question.type) {
    case 'multiple-choice':
      return (
        <div className="space-y-4">
          {question.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(option)}
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
            onChange={(e) => onAnswer(e.target.value)}
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
                    onAnswer(newAnswer.filter(a => a !== option));
                  } else {
                    onAnswer([...newAnswer, option]);
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

    case 'true-false':
      return (
        <div className="space-y-4">
          {question.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => onAnswer(option)}
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

    default:
      return <div>Unsupported question type: {question.type}</div>;
  }
};