import React from 'react';
import { useTutorialProgress } from '../../hooks/useTutorialProgress';
import { Loader2 } from "lucide-react";

const ProgressPage: React.FC = () => {
  const { progress, isLoading, error } = useTutorialProgress();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">Loading Progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="border border-red-300 bg-red-50 p-4 rounded-md">
          <h2 className="font-semibold text-red-700">Error</h2>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-600">No progress data available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Learning Progress</h1>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-md p-4 bg-white shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tutorials Completed</h3>
          <p className="text-4xl font-bold text-blue-700">{progress.completed_count}</p>
        </div>
        <div className="border rounded-md p-4 bg-white shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Points Earned</h3>
          <p className="text-4xl font-bold text-green-600">{progress.total_points}</p>
          <p className="text-sm text-gray-500 mt-1">Points added on first completion</p>
        </div>
        <div className="border rounded-md p-4 bg-white shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Last Activity</h3>
          <p className="text-lg text-gray-800">
            {progress.last_activity
              ? new Date(progress.last_activity).toLocaleDateString()
              : 'No recent activity'}
          </p>
        </div>
      </div>

      {/* Progress by Topic */}
      <div className="border rounded-md p-4 bg-white shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Progress by Topic</h3>
        {Object.keys(progress.completed_by_topic).length > 0 ? (
          <ul className="space-y-2">
            {Object.entries(progress.completed_by_topic).map(([topic, count]) => (
              <li key={topic} className="flex justify-between items-center">
                <span className="font-medium capitalize text-gray-800">{topic.replace('_', ' ')}</span>
                <span className="text-sm text-gray-500">{count} completed</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No tutorials completed yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
