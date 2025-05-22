import React, { useEffect, useState, useRef } from 'react';
import { useTutorialProgress, ChartData } from '../../hooks/useTutorialProgress';
import { Loader2, Award, Bookmark, BookOpen, BarChart2, PieChart, Target, CheckCircle, Clock, Star, TrendingUp, RefreshCw } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Mock data - Ideally, these would come from your API
const TOTAL_TUTORIALS = 5; // Total tutorials in the system (5 TNM quizzes)
const TOPIC_COLORS: Record<string, string> = {
  'tnm': 'rgba(34, 197, 94, 0.7)',
  'general': 'rgba(132, 204, 22, 0.7)',
};

// For chart background colors
const CHART_COLORS = {
  blue: 'rgba(59, 130, 246, 0.7)',
  purple: 'rgba(139, 92, 246, 0.7)',
  green: 'rgba(16, 185, 129, 0.7)',
  indigo: 'rgba(99, 102, 241, 0.7)',
  borderBlue: 'rgb(59, 130, 246)',
  borderPurple: 'rgb(139, 92, 246)',
  borderGreen: 'rgb(16, 185, 129)',
  borderIndigo: 'rgb(99, 102, 241)',
};

const ProgressPage: React.FC = () => {
  const { 
    progress, 
    isLoading, 
    error, 
    isResetting, 
    resetProgress, 
    fetchProgress,
    chartData,
    isLoadingChartData,
    chartError,
    fetchChartData
  } = useTutorialProgress();
  const [achievementStatus, setAchievementStatus] = useState<Record<string, boolean>>({});
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  // Calculate achievements based on progress
  useEffect(() => {
    if (progress) {
      setAchievementStatus({
        'firstCompletion': progress.completedCount > 0,
        'allCompletions': progress.completedCount >= TOTAL_TUTORIALS,
        'tnmExpert': (progress.completedByTopic?.['tnm'] || 0) >= 3,
        'fiftyPoints': progress.totalPoints >= 50,
        'hundredPoints': progress.totalPoints >= 100,
      });
    }
  }, [progress]);

  // Log the progress data whenever it changes
  useEffect(() => {
    console.log('Progress data in ProgressPage component:', progress);
  }, [progress]);

  const handleResetProgress = async () => {
    if (confirm("Are you sure you want to reset your progress? All completed tutorials and points will be lost.")) {
      const success = await resetProgress();
      if (success) {
        // Dispatch a custom event so other components can refresh
        window.dispatchEvent(new CustomEvent('progress-reset'));
        alert("Progress reset successfully!");
      }
    }
  };

  // Handle manual chart data refresh
  const handleRefreshChartData = async () => {
    await fetchChartData();
  };

  // Format dates for display in charts
  const formatChartDates = (dateStrings: string[]) => {
    return dateStrings.map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });
  };

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

  const completionPercentage = (progress.completedCount / TOTAL_TUTORIALS) * 100;
  
  // Get the highest completion topic
  let topTopic = { name: '', count: 0 };
  if (Object.keys(progress.completedByTopic).length > 0) {
    const entries = Object.entries(progress.completedByTopic);
    entries.sort((a, b) => b[1] - a[1]);
    topTopic = { name: entries[0][0], count: entries[0][1] };
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Your Learning Progress</h1>
          <p className="text-gray-600">Track your mastery of TNM staging concepts</p>
        </div>
        
        {/* Reset Progress Button (Development Only) */}
        <div className="text-right">
          <button
            onClick={handleResetProgress}
            disabled={isResetting || isLoading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isResetting ? "Resetting..." : "Reset Progress"}
          </button>
          <p className="text-xs text-gray-500 mt-1">For development purposes only</p>
        </div>
      </div>

      {progress.completedCount === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Progress has been reset</p>
          <p className="text-sm mt-1">All progress data has been cleared. Complete quizzes to start tracking your learning journey again.</p>
        </div>
      )}

      {/* Overall Progress Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
        <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2" /> Overall Progress
        </h2>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-blue-700 font-medium">TNM Staging Mastery</span>
            <span className="text-blue-700 font-medium">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-1000" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            You've completed {progress.completedCount} out of {TOTAL_TUTORIALS} TNM staging quizzes
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="rounded-full p-3 bg-blue-100 mr-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Tutorials Completed</p>
            <h3 className="text-2xl font-bold text-blue-700">{progress.completedCount}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="rounded-full p-3 bg-green-100 mr-4">
            <Star className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Points</p>
            <h3 className="text-2xl font-bold text-green-600">{progress.totalPoints}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="rounded-full p-3 bg-purple-100 mr-4">
            <BarChart2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Topics Explored</p>
            <h3 className="text-2xl font-bold text-purple-600">{Object.keys(progress.completedByTopic).length}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="rounded-full p-3 bg-indigo-100 mr-4">
            <PieChart className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Strongest Topic</p>
            <h3 className="text-2xl font-bold text-indigo-600 capitalize">
              {topTopic.name.replace('_', ' ') || 'None yet'}
            </h3>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" /> Your Learning Analytics
          </h2>
          
          <button 
            onClick={handleRefreshChartData} 
            disabled={isLoadingChartData}
            className="flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded"
          >
            {isLoadingChartData ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh Data
          </button>
        </div>
        
        {isLoadingChartData && !chartData ? (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="ml-2 text-gray-600">Loading chart data...</p>
          </div>
        ) : chartError ? (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center py-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <BarChart2 className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-500">Failed to load chart data</p>
            <p className="text-sm text-red-400 mt-1">{chartError}</p>
            <button 
              onClick={handleRefreshChartData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (progress?.completedCount === 0 || !chartData || (chartData.quiz_completions.every(val => val === 0) && chartData.points_earned.every(val => val === 0))) ? (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center py-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <BarChart2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No learning activity to display</p>
            <p className="text-sm text-gray-400 mt-1">Complete quizzes to generate learning analytics</p>
          </div>
        ) : (
          /* Learning Activity Charts */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Learning Activity Over Time</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: chartData ? formatChartDates(chartData.dates) : [],
                    datasets: [{
                      label: 'Tutorials Completed',
                      data: chartData ? chartData.quiz_completions : [],
                      fill: false,
                      backgroundColor: CHART_COLORS.blue,
                      borderColor: CHART_COLORS.borderBlue,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0 // Force whole numbers
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Points Earned Over Time</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: chartData ? formatChartDates(chartData.dates) : [],
                    datasets: [{
                      label: 'Points Earned',
                      data: chartData ? chartData.points_earned : [],
                      backgroundColor: CHART_COLORS.green,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0 // Force whole numbers
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Topic Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
          <PieChart className="w-5 h-5 mr-2" /> TNM Staging Mastery
        </h2>
        
        {progress.completedByTopic && 'tnm' in progress.completedByTopic ? (
          <div className="space-y-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: TOPIC_COLORS['tnm'] }}
                  ></div>
                  <span className="font-medium capitalize text-gray-700">
                    TNM Staging
                  </span>
                </div>
                <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                  {progress.completedByTopic['tnm']} completed
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full"
                  style={{ 
                    width: `${Math.min(100, (progress.completedByTopic['tnm'] / 5) * 100)}%`,
                    backgroundColor: TOPIC_COLORS['tnm']
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>Mastery Level</span>
                <span>5</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-medium text-gray-800 mb-2">TNM Staging Components</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    T - Primary Tumor
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                    N - Regional Lymph Nodes
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    M - Distant Metastasis
                  </li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-medium text-gray-800 mb-2">Covered Topics</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                    TNM Prefixes and Basic Concepts
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                    Subsolid Lesions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                    T-Staging, N-Staging, M-Staging
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Bookmark className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No TNM staging tutorials completed yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete quizzes to track your understanding of TNM concepts</p>
          </div>
        )}
      </div>

      {/* Recent Activity & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
            <Award className="w-5 h-5 mr-2" /> Your Achievements
          </h2>
          
          <div className="space-y-4">
            <div className={`flex items-center p-3 rounded-lg ${achievementStatus.firstCompletion ? 'bg-green-50 border border-green-100' : 'bg-gray-50 border border-gray-100'}`}>
              <div className={`rounded-full p-2 mr-3 ${achievementStatus.firstCompletion ? 'bg-green-100' : 'bg-gray-200'}`}>
                <CheckCircle className={`h-5 w-5 ${achievementStatus.firstCompletion ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className={`font-medium ${achievementStatus.firstCompletion ? 'text-green-800' : 'text-gray-500'}`}>First Steps</h3>
                <p className="text-sm text-gray-500">Complete your first tutorial</p>
              </div>
            </div>
            
            <div className={`flex items-center p-3 rounded-lg ${achievementStatus.allCompletions ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'}`}>
              <div className={`rounded-full p-2 mr-3 ${achievementStatus.allCompletions ? 'bg-purple-100' : 'bg-gray-200'}`}>
                <CheckCircle className={`h-5 w-5 ${achievementStatus.allCompletions ? 'text-purple-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className={`font-medium ${achievementStatus.allCompletions ? 'text-purple-800' : 'text-gray-500'}`}>Well-Rounded</h3>
                <p className="text-sm text-gray-500">Complete all tutorials</p>
              </div>
            </div>
            
            <div className={`flex items-center p-3 rounded-lg ${achievementStatus.tnmExpert ? 'bg-teal-50 border border-teal-100' : 'bg-gray-50 border border-gray-100'}`}>
              <div className={`rounded-full p-2 mr-3 ${achievementStatus.tnmExpert ? 'bg-teal-100' : 'bg-gray-200'}`}>
                <CheckCircle className={`h-5 w-5 ${achievementStatus.tnmExpert ? 'text-teal-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className={`font-medium ${achievementStatus.tnmExpert ? 'text-teal-800' : 'text-gray-500'}`}>TNM Expert</h3>
                <p className="text-sm text-gray-500">Complete 3 tutorials on TNM</p>
              </div>
            </div>
            
            <div className={`flex items-center p-3 rounded-lg ${achievementStatus.fiftyPoints ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
              <div className={`rounded-full p-2 mr-3 ${achievementStatus.fiftyPoints ? 'bg-blue-100' : 'bg-gray-200'}`}>
                <CheckCircle className={`h-5 w-5 ${achievementStatus.fiftyPoints ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className={`font-medium ${achievementStatus.fiftyPoints ? 'text-blue-800' : 'text-gray-500'}`}>Halfway There</h3>
                <p className="text-sm text-gray-500">Earn 50 total points</p>
              </div>
            </div>
            
            <div className={`flex items-center p-3 rounded-lg ${achievementStatus.hundredPoints ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100'}`}>
              <div className={`rounded-full p-2 mr-3 ${achievementStatus.hundredPoints ? 'bg-indigo-100' : 'bg-gray-200'}`}>
                <CheckCircle className={`h-5 w-5 ${achievementStatus.hundredPoints ? 'text-indigo-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className={`font-medium ${achievementStatus.hundredPoints ? 'text-indigo-800' : 'text-gray-500'}`}>Point Collector</h3>
                <p className="text-sm text-gray-500">Earn 100 total points</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Last Activity & Suggested Next Steps */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
              <Clock className="w-5 h-5 mr-2" /> Recent Activity
            </h2>
            
            {progress.completedCount === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">Progress has been reset</p>
                <p className="text-sm text-gray-400 mt-1">Complete a quiz to record new activity</p>
              </div>
            ) : progress.lastActivity ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-gray-700 mb-1">Last activity on:</p>
                <p className="text-lg font-semibold text-blue-700">
                  {new Date(progress.lastActivity).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
          
          <div className={`${progress.completedCount === 0 
            ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white rounded-xl shadow-md p-6`}>
            <h2 className="text-xl font-semibold mb-4">TNM Learning Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-blue-400 pb-2">
                <span>Quizzes completed:</span>
                <span className="font-bold">{progress.completedCount}/{TOTAL_TUTORIALS}</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-400 pb-2">
                <span>Quiz questions answered:</span>
                <span className="font-bold">{Math.floor(progress.totalPoints/10)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-400 pb-2">
                <span>Points earned:</span>
                <span className="font-bold">{progress.totalPoints}</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-400 pb-2">
                <span>Mastery level:</span>
                <span className="font-bold">{Math.round(completionPercentage)}%</span>
              </div>
            </div>
            
            <div className="mt-5 pt-5 border-t border-blue-400">
              <p className="font-medium flex items-center">
                <Star className="w-5 h-5 mr-2" />
                {progress.completedCount === 0 
                  ? "Start your TNM learning journey now!" 
                  : "Keep practicing to master TNM staging concepts!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;