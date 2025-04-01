// src/components/dashboard/ProgressPage.tsx
import React from 'react';
import { Progress } from '../../types';
import { Award, BookOpen, Target } from 'lucide-react';

interface ProgressPageProps {
  progress: Progress;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ progress }) => {
  // Calculate overall statistics
  const totalQuizzesTaken = progress.scores.length;
  const averageScore = progress.scores.length > 0
    ? Math.round(
        (progress.scores.reduce((acc, score) => acc + (score.score / score.totalPoints) * 100, 0) / 
        progress.scores.length)
      )
    : 0;
  const completionRate = progress.completedTutorials.length > 0
    ? Math.round((progress.scores.length / progress.completedTutorials.length) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <Award className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold">My Learning Progress</h1>
      </div>
      
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Completed Tutorials</p>
              <p className="text-3xl font-bold text-blue-600">{progress.completedTutorials.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Average Score</p>
              <p className="text-3xl font-bold text-green-600">{averageScore}%</p>
            </div>
            <Target className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Points</p>
              <p className="text-3xl font-bold text-purple-600">{progress.totalPoints}</p>
            </div>
            <Award className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Recent Quiz Results */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Recent Quiz Results</h2>
        {progress.scores.length > 0 ? (
          <div className="space-y-4">
            {[...progress.scores]
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .slice(0, 5)
              .map((score) => (
                <div key={`${score.tutorialId}-${score.completedAt}`} 
                     className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Tutorial {score.tutorialId}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(score.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {Math.round((score.score / score.totalPoints) * 100)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {score.score}/{score.totalPoints} points
                    </p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No quizzes completed yet. Start learning to track your progress!
          </p>
        )}
      </div>
    </div>
  );
};