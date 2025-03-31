import React from 'react';
import { Video, ListChecks, Play, Award } from 'lucide-react';
import { Tutorial, TutorialScore } from '../../types';

interface TutorialListProps {
  tutorials: Tutorial[];
  tutorialScores: TutorialScore[];
  onSelectTutorial: (id: string) => void;
  onStartQuiz: () => void;
}

export const TutorialList: React.FC<TutorialListProps> = ({
  tutorials,
  tutorialScores,
  onSelectTutorial,
  onStartQuiz
}) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-8">Learning Resources</h2>
      
      {/* Practice Quiz Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ListChecks className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-blue-900">Practice Quiz</h3>
          </div>
          <button
            onClick={onStartQuiz}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Quiz
          </button>
        </div>
        <p className="text-blue-600 mb-4">
          Test your knowledge with our comprehensive practice quiz covering all aspects of medical image segmentation.
        </p>
      </div>

      {/* Video Tutorials Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Video className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-blue-900">Video Tutorials</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial) => {
            const tutorialScore = tutorialScores.find(score => score.tutorialId === tutorial.id);
            return (
              <div
                key={tutorial.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => onSelectTutorial(tutorial.id)}
              >
                <img
                  src={tutorial.thumbnail}
                  alt={tutorial.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">{tutorial.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600">{tutorial.duration}</span>
                    </div>
                    {tutorialScore && (
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-yellow-600 font-medium">
                          {Math.round((tutorialScore.score / tutorialScore.totalPoints) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};