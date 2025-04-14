// src/components/dashboard/ProgressPage.tsx
import React from 'react';
import { Progress } from '../../types';
import { Award, BookOpen, Target, CheckCircle } from 'lucide-react';

interface ProgressPageProps {
  progress: Progress;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({ progress }) => {
  // Calculate overall statistics
  const completedTutorials = progress.completedTutorials.length;
  const completedQuizzes = progress.scores.length;
  
  // Calculate average score (only from completed quizzes)
  const averageScore = progress.scores.length > 0
    ? Math.round(
        (progress.scores.reduce((acc, score) => acc + (score.score / score.totalPoints) * 100, 0) / 
        progress.scores.length)
      )
    : 0;
  
  // Calculate completion rate
  const completionRate = completedTutorials > 0
    ? Math.round((completedQuizzes / completedTutorials) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <Award className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold">My Learning Progress</h1>
      </div>
      
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-gray-500 text-sm">Completed Tutorials</p>
              <p className="text-3xl font-bold text-blue-600">{completedTutorials}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-200" />
          </div>
          <p className="text-xs text-blue-500">Learning materials you've viewed</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-gray-500 text-sm">Completed Quizzes</p>
              <p className="text-3xl font-bold text-purple-600">{completedQuizzes}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-200" />
          </div>
          <p className="text-xs text-purple-500">Assessments you've finished</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-gray-500 text-sm">Average Score</p>
              <p className="text-3xl font-bold text-green-600">{averageScore}%</p>
            </div>
            <Target className="w-8 h-8 text-green-200" />
          </div>
          <p className="text-xs text-green-500">Your quiz performance</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-gray-500 text-sm">Total Points</p>
              <p className="text-3xl font-bold text-amber-600">{progress.totalPoints}</p>
            </div>
            <Award className="w-8 h-8 text-amber-200" />
          </div>
          <p className="text-xs text-amber-500">Combined score from all quizzes</p>
        </div>
      </div>
      
      {/* Progress Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Learning Journey</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-blue-800">Tutorial Completion</span>
              <span className="text-blue-600">{completedTutorials} tutorials</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-3 bg-blue-500 rounded-full"
                style={{ width: `${Math.min(completedTutorials * 10, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on available tutorials</p>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-blue-800">Quiz Completion</span>
              <span className="text-purple-600">{completionRate}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-3 bg-purple-500 rounded-full"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Percentage of tutorials with completed quizzes</p>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-blue-800">Average Performance</span>
              <span className="text-green-600">{averageScore}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-3 bg-green-500 rounded-full"
                style={{ width: `${averageScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Your average quiz score</p>
          </div>
        </div>
      </div>

      {/* Recent Quiz Results */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Quiz Results</h2>
        {progress.scores.length > 0 ? (
          <div className="space-y-4">
            {[...progress.scores]
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .slice(0, 5)
              .map((score) => (
                <div key={`${score.tutorialId}-${score.completedAt}`} 
                     className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-blue-800">{score.tutorialId.startsWith('tutorial') ? 
                      `Tutorial ${score.tutorialId.replace('tutorial', '')}` : 
                      `${score.tutorialId.charAt(0).toUpperCase() + score.tutorialId.slice(1)} Quiz`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(score.completedAt).toLocaleDateString()} at {new Date(score.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              No quizzes completed yet
            </p>
            <p className="text-sm text-blue-500">
              Start learning and complete quizzes to track your progress!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};