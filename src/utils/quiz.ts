import { QuizQuestion } from '../types';

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