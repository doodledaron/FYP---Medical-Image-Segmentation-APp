import React from 'react';
import { Brain, PenTool } from 'lucide-react';

interface SegmentationChoiceModalProps {
  onSelectMode: (mode: 'manual' | 'ai') => void;
  fileName: string;
}

export function SegmentationChoiceModal({ onSelectMode, fileName }: SegmentationChoiceModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full animate-fadeIn">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">Choose Segmentation Method</h2>
        
        <p className="text-blue-700 mb-6 text-center">
          File loaded: <span className="font-semibold">{fileName}</span>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Manual Segmentation Option */}
          <button
            onClick={() => onSelectMode('manual')}
            className="bg-white border-2 border-blue-200 hover:border-blue-500 rounded-xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center hover:-translate-y-1"
          >
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <PenTool className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">Manual Segmentation</h3>
            <p className="text-blue-600 text-sm">
              Draw tumor regions manually using the brush tool. Ideal for learning and practice.
            </p>
          </button>
          
          {/* AI Segmentation Option */}
          <button
            onClick={() => onSelectMode('ai')}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-500 rounded-xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col items-center text-center hover:-translate-y-1"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-bold text-blue-900 text-lg mb-2">AI Segmentation</h3>
            <p className="text-blue-600 text-sm">
              Let our advanced AI automatically detect and segment tumor regions with high precision.
            </p>
          </button>
        </div>
        
        <div className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg">
          <strong>Tip:</strong> For learning purposes, try manual segmentation first, then compare with AI results to improve your skills.
        </div>
      </div>
    </div>
  );
} 