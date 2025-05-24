import React from 'react';
import { Brain} from 'lucide-react';
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
      label: 'Dashboard',
    },
    {
      key: 'tutorials',
      label: 'Tutorials',
    },
    {
      key: 'progress',
      label: 'Progress',
    }
  ];




  return (
    <header className="sticky top-0 w-full bg-white border-b border-gray-100 shadow-sm z-40">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="text-blue-500">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                MedLearn AI
              </h2>
            </div>
          </div>
          
          {/* Navigation Tabs - Left-aligned with padding */}
          <nav className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1 ml-8 mr-auto">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key as HeaderProps['currentView'])}
                className={`px-6 py-1.5 rounded-full font-medium text-sm transition-all duration-200
                  ${
                    currentView === item.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}; 