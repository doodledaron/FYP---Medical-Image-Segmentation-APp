import React from 'react';
import { Video, ListChecks, Play, Award } from 'lucide-react';
import { Tutorial, TutorialScore } from '../../../types';

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
    <div className="max-w-6xl mx-auto py-12 px-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-8">Learning Resources</h2>

      {/* Section Title */}
      <div className="flex items-center gap-3 mb-6">
        <ListChecks className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-blue-900">Practice Quiz</h3>
      </div>

      {/* Grid for Practice + Tutorials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Practice Quiz Card */}
        <div
          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
          onClick={onStartQuiz}
        >
          <img
            src="https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.shutterstock.com%2Fsearch%2Ftrivia-quiz&psig=AOvVaw1AJcqNQcBu_nfyN9Lsm_vB&ust=1746182729167000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCIil_tuLgo0DFQAAAAAdAAAAABAE"
            alt="Practice Quiz"
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Practice Quiz</h3>
            <p className="text-blue-600 text-sm mb-4">
              Test your knowledge across multiple TNM topics.
            </p>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600">10:00</span>
            </div>
          </div>
        </div>

        {/* Video Tutorial Cards */}
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
                <p className="text-blue-600 text-sm mb-4">{tutorial.description}</p>
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
  );
};
