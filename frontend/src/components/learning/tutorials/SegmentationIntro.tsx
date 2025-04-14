// src/components/learning/tutorials/InteractiveSegmentationTutorial.tsx
import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../common/ui/alert';
import { introSteps } from '../../../data/introSteps';

interface TutorialProps {
  onComplete: () => void;
}

export const InteractiveSegmentationTutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const handleNext = () => {
    if (currentStep < introSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowHint(false);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowHint(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / introSteps.length) * 100}%` }}
        />
      </div>

      {/* Main Tutorial Content */}
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="flex items-center space-x-4">
          {introSteps[currentStep].icon}
          <h2 className="text-2xl font-bold text-blue-900">{introSteps[currentStep].title}</h2>
        </div>

        <p className="text-lg text-blue-700">{introSteps[currentStep].description}</p>

        {showHint && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hint</AlertTitle>
            <AlertDescription>
              {introSteps[currentStep].hint}
            </AlertDescription>
          </Alert>
        )}

        {/* Interactive Demo Area */}
        {introSteps[currentStep].demo && (
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center bg-blue-50">
            <p className="text-blue-600">Interactive demo area for step {currentStep + 1}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </button>

          <button
            onClick={() => setShowHint(!showHint)}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>

          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            {currentStep === introSteps.length - 1 ? 'Start Using App' : introSteps[currentStep].action}
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};