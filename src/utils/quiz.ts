// src/utils/quiz.ts
import { QuizQuestion } from '../types';

/**
 * Calculate the total score for a quiz based on answers
 * @param questions Array of quiz questions
 * @param answers User's answers for the quiz
 * @returns Total score
 */
export const calculateQuizScore = (
  questions: QuizQuestion[],
  answers: Record<string, string | string[]>
): number => {
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

/**
 * Check if an answer is correct
 * @param question Quiz question
 * @param answer User's answer
 * @returns boolean indicating if the answer is correct
 */
export const isAnswerCorrect = (
  question: QuizQuestion,
  answer: string | string[]
): boolean => {
  if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
    return question.correctAnswer.length === answer.length &&
      question.correctAnswer.every(a => answer.includes(a));
  }
  
  return !Array.isArray(question.correctAnswer) && !Array.isArray(answer) &&
    answer.toLowerCase() === question.correctAnswer.toLowerCase();
};

/**
 * Generate learning recommendations based on quiz performance
 * @param score Total score
 * @param totalPoints Maximum possible points
 * @returns Object with recommendation title and content
 */
export const generateRecommendation = (score: number, totalPoints: number) => {
  const percentage = Math.round((score / totalPoints) * 100);
  
  if (percentage >= 90) {
    return {
      title: 'Advanced Topics',
      content: 'Excellent work! You\'re ready to explore more advanced topics in medical image segmentation.'
    };
  } else if (percentage >= 70) {
    return {
      title: 'Practice More',
      content: 'You\'re doing well! Try practicing with more complex cases to improve further.'
    };
  } else {
    return {
      title: 'Review Materials',
      content: 'Consider reviewing the tutorial content again, focusing on areas where you scored lower.'
    };
  }
};