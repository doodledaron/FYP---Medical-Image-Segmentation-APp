// src/components/layout/Sidebar.tsx
import React from 'react';
import { Brain, BookOpen, GraduationCap, Award } from 'lucide-react';
import { Progress } from '../../types';

interface SidebarProps {
  currentView: 'dashboard' | 'tutorials' | 'bestPractices' | 'progress';
  setCurrentView: (view: 'dashboard' | 'tutorials' | 'bestPractices' | 'progress') => void;
  progress: Progress;
  tutorialScoresLength: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  progress,
  tutorialScoresLength
}) => {
  // Calculate average score
  const averageScore = progress.scores.length > 0
    ? Math.round(
        (progress.scores.reduce((acc, score) => acc + (score.score / score.totalPoints) * 100, 0) / 
        progress.scores.length)
      )
    : 0;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-blue-900 text-white overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="h-8 w-8" />
          <h2 className="text-xl font-bold">MedLearn AI</h2>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'dashboard' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <Brain size={20} />
            <span>Learning Path</span>
          </button>

          <button
            onClick={() => setCurrentView('tutorials')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'tutorials' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <BookOpen size={20} />
            <span>Tutorials</span>
          </button>

          <button
            onClick={() => setCurrentView('progress')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'progress' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <Award size={20} />
            <span>My Progress</span>
          </button>

          <button
            onClick={() => setCurrentView('bestPractices')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'bestPractices' ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-800/50'
            }`}
          >
            <GraduationCap size={20} />
            <span>Best Practices</span>
          </button>
        </nav>
        
        {progress.scores.length > 0 && (
          <div className="mt-8 pt-8 border-t border-blue-800">
            <h3 className="text-sm font-medium text-blue-200 mb-4">Learning Progress</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-blue-300 mb-1">
                  <span>Tutorials Completed</span>
                  <span>{progress.completedTutorials.length}</span>
                </div>
                <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-blue-400 rounded-full"
                    style={{ width: `${Math.min((progress.completedTutorials.length / tutorialScoresLength) * 100, 100)}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs text-blue-300 mb-1">
                  <span>Average Score</span>
                  <span>{averageScore}%</span>
                </div>
                <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-green-400 rounded-full"
                    style={{ width: `${averageScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};