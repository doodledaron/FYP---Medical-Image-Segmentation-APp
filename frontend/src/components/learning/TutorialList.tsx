import React from 'react';
import { Tutorial } from '../../types'; // Adjust path as needed
import { CheckCircle2 } from 'lucide-react'; // Icon for completed

interface TutorialListProps {
  tutorials: Tutorial[];
  completedTutorialIds: string[];
  onSelectTutorial: (id: string) => void;
}

const TutorialList: React.FC<TutorialListProps> = ({
  tutorials,
  completedTutorialIds,
  onSelectTutorial,
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Tutorials & Quizzes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => {
          const isCompleted = completedTutorialIds.includes(tutorial.id);
          return (
            <div key={tutorial.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col">
              <img
                src={tutorial.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={tutorial.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex flex-col flex-grow">
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${
                  tutorial.topic === 'tnm' ? 'bg-blue-100 text-blue-800' :
                  tutorial.topic === 'image_segmentation' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tutorial.topic.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{tutorial.title}</h3>
                <p className="text-sm text-gray-600 mb-3 flex-grow">
                  {tutorial.description || 'No description available.'}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>{tutorial.duration}</span>
                  <span>{tutorial.tutorial_type === 'practice' ? 'Quiz' : 'Video'}</span>
                </div>
                {isCompleted && (
                  <div className="flex items-center text-green-600 text-sm mb-3">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span>Completed</span>
                  </div>
                )}
                <button
                  onClick={() => onSelectTutorial(tutorial.id)}
                  className={`w-full mt-auto px-4 py-2 rounded-md text-sm font-medium transition ${
                    isCompleted
                      ? 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCompleted ? 'Re-attempt Quiz' : 'Start Quiz'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialList;
