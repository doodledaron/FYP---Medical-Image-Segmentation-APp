import React, { useState } from 'react';
import { Brain, CheckCircle2, XCircle, RefreshCcw, Award, BookOpen, Target, Lightbulb, ArrowRight } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "What is the recommended slice thickness for CT scans in lung imaging?",
    options: ["0.5-1.0mm", "1.0-1.5mm", "2.0-2.5mm", "3.0-3.5mm"],
    correctAnswer: 1,
    category: "Image Acquisition"
  },
  {
    id: 2,
    question: "Which pre-processing step is NOT typically required for lung image segmentation?",
    options: ["Noise reduction", "Intensity normalization", "Color correction", "Artifact removal"],
    correctAnswer: 2,
    category: "Pre-processing"
  },
  {
    id: 3,
    question: "What is the minimum recommended resolution for lung CT images?",
    options: ["256x256", "384x384", "512x512", "1024x1024"],
    correctAnswer: 2,
    category: "Technical Parameters"
  },
  {
    id: 4,
    question: "Which anatomical structure should be segmented first in the lung segmentation process?",
    options: ["Vessels", "Airways", "Fissures", "Nodules"],
    correctAnswer: 1,
    category: "Segmentation Process"
  },
  {
    id: 5,
    question: "What is the recommended approach for efficient segmentation?",
    options: [
      "Manual segmentation only",
      "Automated tools first, then manual refinement",
      "Manual refinement first, then automated tools",
      "Automated tools only"
    ],
    correctAnswer: 1,
    category: "Best Practices"
  }
];

const generateAdvice = (incorrectCategories: string[]): {
  summary: string;
  recommendations: Array<{ category: string; advice: string }>;
} => {
  if (incorrectCategories.length === 0) {
    return {
      summary: "Outstanding performance! You've mastered the fundamentals of lung image segmentation.",
      recommendations: [{
        category: "Next Steps",
        advice: "Consider exploring advanced techniques and staying updated with the latest research in medical imaging."
      }]
    };
  }

  const categoryAdvice = {
    "Image Acquisition": {
      advice: "Review CT scanning protocols, focusing on slice thickness optimization and proper breath-hold techniques for optimal image quality."
    },
    "Pre-processing": {
      advice: "Strengthen your understanding of noise reduction algorithms and artifact removal methods for improved image preparation."
    },
    "Technical Parameters": {
      advice: "Focus on technical specifications including resolution standards, bit depth requirements, and their impact on segmentation quality."
    },
    "Segmentation Process": {
      advice: "Practice the step-by-step segmentation workflow, particularly the sequence of operations and their significance in the process."
    },
    "Best Practices": {
      advice: "Review efficiency guidelines and quality assurance protocols to enhance your overall segmentation workflow."
    }
  };

  const uniqueCategories = Array.from(new Set(incorrectCategories));
  const recommendations = uniqueCategories.map(category => ({
    category,
    advice: categoryAdvice[category as keyof typeof categoryAdvice].advice
  }));

  return {
    summary: "Based on your quiz performance, we've identified specific areas for improvement. Focus on these recommendations to enhance your skills:",
    recommendations
  };
};

export const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [incorrectCategories, setIncorrectCategories] = useState<string[]>([]);

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (optionIndex !== questions[currentQuestion].correctAnswer) {
      setIncorrectCategories([...incorrectCategories, questions[currentQuestion].category]);
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setIncorrectCategories([]);
  };

  if (showResults) {
    const score = answers.reduce((acc, answer, index) => 
      answer === questions[index].correctAnswer ? acc + 1 : acc, 0
    );
    const percentage = (score / questions.length) * 100;
    const advice = generateAdvice(incorrectCategories);

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
          {/* Score Section */}
          <div className="text-center mb-8">
            <Award className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Quiz Complete!</h2>
            <div className="inline-block bg-blue-50 rounded-full px-6 py-2">
              <p className="text-lg text-blue-600">
                Score: <span className="font-bold">{score}</span> out of {questions.length} ({percentage}%)
              </p>
            </div>
          </div>

          {/* Questions Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {questions.map((q, index) => (
              <div 
                key={q.id} 
                className={`p-4 rounded-xl border ${
                  answers[index] === q.correctAnswer 
                    ? 'border-green-100 bg-green-50' 
                    : 'border-red-100 bg-red-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {answers[index] === q.correctAnswer ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <p className="text-blue-900 font-medium mb-2">{q.question}</p>
                    <div className="text-sm space-y-1">
                      <p className={answers[index] === q.correctAnswer ? 'text-green-600' : 'text-red-600'}>
                        Your answer: {q.options[answers[index]]}
                      </p>
                      {answers[index] !== q.correctAnswer && (
                        <p className="text-green-600">
                          Correct: {q.options[q.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Advice Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-900">Learning Path Recommendations</h3>
            </div>
            
            <p className="text-blue-800 mb-6">{advice.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {advice.recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">{rec.category}</h4>
                  </div>
                  <p className="text-blue-700 text-sm">{rec.advice}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={resetQuiz}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '#/best-practices'}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Review Materials
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-blue-900">
              Lung Segmentation Quiz
            </h2>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-blue-600 mt-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-blue-900">
            {questions[currentQuestion].question}
          </h3>
          <div className="space-y-3">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full p-4 text-left rounded-lg border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              >
                <span className="text-blue-900">{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};