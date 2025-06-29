// // src/components/layout/Sidebar.tsx
// import React from 'react';
// import { Brain, BookOpen, Award } from 'lucide-react';
// import { UserProgress } from '../../types'; // Use the updated type

// interface SidebarProps {
//   currentView: 'dashboard' | 'tutorials' | 'progress';
//   setCurrentView: (view: 'dashboard' | 'tutorials' | 'progress') => void;
//   progress?: UserProgress; // Make progress optional or handle null case
//   // Removed tutorialScoresLength
// }

// export const Sidebar: React.FC<SidebarProps> = ({
//   currentView,
//   setCurrentView,
//   progress,
//   // Removed tutorialScoresLength
// }) => {
//   // Remove average score calculation as 'scores' is not available
//   // const averageScore = progress?.scores?.length > 0 ...

//   // Sidebar navigation items (Best Practices removed)
//   const navItems = [
//     {
//       key: 'dashboard',
//       label: 'Learning Path',
//       icon: <Brain size={22} />,
//     },
//     {
//       key: 'tutorials',
//       label: 'Tutorials',
//       icon: <BookOpen size={22} />,
//     },
//     {
//       key: 'progress',
//       label: 'My Progress',
//       icon: <Award size={22} />,
//     }
//   ];

//   // Handle case where progress might be null or undefined initially
//   const completedCount = progress?.completed_count ?? 0;

//   return (
//     <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-900 via-blue-950 to-indigo-900 text-white shadow-xl flex flex-col transition-all duration-300 z-40">
//       <div className="p-6 flex flex-col h-full">
//         {/* Logo and Title */}
//         <div className="flex items-center gap-3 mb-10 animate-fade-in-down">
//           <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg animate-bounce-slow">
//             <Brain className="h-8 w-8 text-white" />
//           </div>
//           <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200 select-none">
//             MedLearn
//           </h2>
//         </div>
        
//         {/* Navigation */}
//         <nav className="space-y-2 flex-1">
//           {navItems.map((item) => (
//             <button
//               key={item.key}
//               onClick={() => setCurrentView(item.key as SidebarProps['currentView'])}
//               className={`w-full flex items-center gap-3 px-5 py-3 rounded-lg font-medium transition-all duration-200 group
//                 ${
//                   currentView === item.key
//                     ? 'bg-gradient-to-r from-blue-700 to-indigo-700 shadow-lg scale-[1.04] text-white'
//                     : 'text-blue-100 hover:bg-blue-800/60 hover:scale-[1.02] hover:text-white'
//                 }
//                 focus:outline-none focus:ring-2 focus:ring-blue-400`}
//             >
//               <span className={`transition-transform duration-300 ${
//                 currentView === item.key ? 'scale-110 animate-pulse' : 'group-hover:scale-105'
//               }`}>
//                 {item.icon}
//               </span>
//               <span className="tracking-wide">{item.label}</span>
//             </button>
//           ))}
//         </nav>

//         {/* Progress Section - Simplified */}
//         {/* Show only if progress data is available and completed count > 0 */}
//         {progress && completedCount > 0 && (
//           <div className="mt-10 pt-8 border-t border-blue-800 animate-fade-in-up">
//             <h3 className="text-sm font-semibold text-blue-200 mb-4 tracking-wide">Learning Progress</h3>
//             <div className="space-y-4">
//               {/* Display only the count of completed tutorials */}
//               <div>
//                 <div className="flex justify-between text-xs text-blue-300 mb-1">
//                   <span>Tutorials Completed</span>
//                   {/* Use completed_count directly */}
//                   <span>{completedCount}</span>
//                 </div>
//                 {/* Removed the progress bar for completion percentage */}
//               </div>

//               {/* Removed Average Score section */}
//               {/*
//               <div>
//                 <div className="flex justify-between text-xs text-blue-300 mb-1">
//                   <span>Average Score</span>
//                   <span>{averageScore}%</span>
//                 </div>
//                 <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
//                   <div
//                     className="h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
//                     style={{ width: `${averageScore}%` }}
//                   />
//                 </div>
//               </div>
//               */}
//             </div>
//           </div>
//         )}
//       </div>
//       {/* Subtle fade-in/fade-up animations */}
//       <style>{`
//         .animate-fade-in-down {
//           animation: fadeInDown 0.7s cubic-bezier(0.4,0,0.2,1);
//         }
//         .animate-fade-in-up {
//           animation: fadeInUp 0.7s cubic-bezier(0.4,0,0.2,1);
//         }
//         .animate-bounce-slow {
//           animation: bounce 2.5s infinite;
//         }
//         @keyframes fadeInDown {
//           from { opacity: 0; transform: translateY(-20px);}
//           to { opacity: 1; transform: translateY(0);}
//         }
//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(20px);}
//           to { opacity: 1; transform: translateY(0);}
//         }
//         @keyframes bounce {
//           0%, 100% { transform: translateY(0);}
//           50% { transform: translateY(-6px);}
//         }
//       `}</style>
//     </div>
//   );
// };