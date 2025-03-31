import React, { useState } from 'react';
import { Calendar, Trophy, Target, Brain, ArrowUp, ArrowDown, Activity, BookOpen } from 'lucide-react';

interface ActivityDay {
  date: string;
  count: number;
  type: 'quiz' | 'practice' | 'tutorial';
}

interface Score {
  date: string;
  score: number;
  category: string;
}

// Mock data - In real app, fetch from backend
const mockActivityData: ActivityDay[] = Array.from({ length: 365 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  return {
    date: date.toISOString().split('T')[0],
    count: Math.floor(Math.random() * 5),
    type: ['quiz', 'practice', 'tutorial'][Math.floor(Math.random() * 3)] as ActivityDay['type']
  };
});

const mockScores: Score[] = [
  { date: '2024-01-15', score: 95, category: 'Image Acquisition' },
  { date: '2024-01-14', score: 88, category: 'Pre-processing' },
  { date: '2024-01-13', score: 75, category: 'Segmentation Process' },
  { date: '2024-01-12', score: 92, category: 'Technical Parameters' },
  { date: '2024-01-11', score: 85, category: 'Best Practices' },
];

export const UserProgress: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('year');

  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-gray-800';
    if (count === 1) return 'bg-blue-900';
    if (count === 2) return 'bg-blue-700';
    if (count === 3) return 'bg-blue-500';
    return 'bg-blue-300';
  };

  const getActivityData = () => {
    const now = new Date();
    const periods = {
      week: 7,
      month: 30,
      year: 365
    };
    return mockActivityData.slice(0, periods[selectedPeriod]);
  };

  const topScores = mockScores.sort((a, b) => b.score - a.score).slice(0, 3);
  const lowScores = mockScores.sort((a, b) => a.score - b.score).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">Learning Progress</h1>
        <p className="text-blue-600">Track your journey in medical image segmentation</p>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-blue-900">Activity Overview</h2>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-53 gap-1">
          {getActivityData().map((day, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${getActivityColor(day.count)} hover:ring-2 hover:ring-blue-200 cursor-pointer transition-all`}
              title={`${day.date}: ${day.count} activities`}
            />
          ))}
        </div>
        
        <div className="flex items-center justify-end mt-4 gap-2 text-sm text-blue-600">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Top Scores */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-blue-900">Top Performances</h2>
          </div>
          <div className="space-y-4">
            {topScores.map((score, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-blue-900">{score.category}</h3>
                  <p className="text-sm text-blue-600">{score.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-bold text-green-600">{score.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-blue-900">Areas for Improvement</h2>
          </div>
          <div className="space-y-4">
            {lowScores.map((score, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-transparent rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-blue-900">{score.category}</h3>
                  <p className="text-sm text-blue-600">{score.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-red-500" />
                  <span className="text-lg font-bold text-red-600">{score.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-8 h-8" />
          <h2 className="text-2xl font-semibold">AI Learning Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <Activity className="w-6 h-6 mb-4" />
            <h3 className="font-medium mb-2">Focus Areas</h3>
            <p className="text-sm opacity-90">
              Concentrate on pre-processing techniques and segmentation workflows to improve accuracy.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <BookOpen className="w-6 h-6 mb-4" />
            <h3 className="font-medium mb-2">Learning Path</h3>
            <p className="text-sm opacity-90">
              Review technical parameters and best practices modules to strengthen fundamentals.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors">
            <Target className="w-6 h-6 mb-4" />
            <h3 className="font-medium mb-2">Next Goals</h3>
            <p className="text-sm opacity-90">
              Complete advanced segmentation tutorials and practice with complex case studies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};