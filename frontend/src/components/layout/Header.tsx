import React from 'react';
import { Brain, BookOpen, Award } from 'lucide-react';
import { UserProgress } from '../../types';

interface HeaderProps {
  currentView: 'dashboard' | 'tutorials' | 'progress';
  setCurrentView: (view: 'dashboard' | 'tutorials' | 'progress') => void;
  progress?: UserProgress | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  progress,
}) => {
  // Navigation items
  const navItems = [
    {
      key: 'dashboard',
      label: 'Learning Path',
      icon: <Brain size={20} />,
    },
    {
      key: 'tutorials',
      label: 'Tutorials',
      icon: <BookOpen size={20} />,
    },
    {
      key: 'progress',
      label: 'My Progress',
      icon: <Award size={20} />,
    }
  ];

  // Handle case where progress might be null or undefined initially
  const completedCount = progress?.completedCount ?? 0;

  return (
    <header className="sticky top-0 w-full bg-gradient-to-r from-blue-500 to-indigo-400 text-white shadow-sm z-40 border-b border-white/10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-sm">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white select-none">
              MedLearn AI
            </h2>
          </div>
          
          {/* Navigation */}
          <nav className="flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key as HeaderProps['currentView'])}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${
                    currentView === item.key
                    ? 'bg-white/20 backdrop-blur-sm shadow-sm text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                  focus:outline-none focus:ring-2 focus:ring-white/30`}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Progress Mini Display */}
          {progress && progress.completedCount > 0 && (
            <div className="hidden md:flex items-center gap-3 text-white/90 text-sm">
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm py-1 px-3 rounded-full">
                <BookOpen size={16} /> 
                <span>{progress.completedCount} completed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}; 