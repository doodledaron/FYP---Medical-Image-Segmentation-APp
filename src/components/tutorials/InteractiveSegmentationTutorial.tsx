import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Play, FileImage, Box, Eye, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface TutorialProps {
  onComplete: () => void;
}

export const InteractiveSegmentationTutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const tutorialSteps = [
    {
      title: "Welcome to Medical Image Segmentation",
      description: "Learn how to segment 3D medical images using our AI-powered platform.",
      hint: "Click 'Next' to begin your journey into medical image analysis.",
      action: "Start Tutorial",
      icon: <Play className="w-12 h-12 text-blue-500" />
    },
    {
      title: "Upload Your NIFTI Scan",
      description: "First, you'll need to upload your medical scan in NIFTI format.",
      hint: "Ensure your file is in .nii or .nii.gz format for compatibility.",
      action: "Try Uploading",
      demo: true,
      icon: <FileImage className="w-12 h-12 text-green-500" />
    },
    {
      title: "View in 3D",
      description: "Explore your scan in three dimensions using our interactive viewer.",
      hint: "Use mouse controls: Left click to rotate, right click to pan, scroll to zoom.",
      action: "Practice Navigation",
      demo: true,
      icon: <Box className="w-12 h-12 text-purple-500" />
    },
    {
      title: "AI Segmentation",
      description: "Watch as our AI model automatically identifies and segments the tumor.",
      hint: "The process typically takes 30-60 seconds depending on scan size.",
      action: "Run Demo Segmentation",
      demo: true,
      icon: <Activity className="w-12 h-12 text-orange-500" />
    },
    {
      title: "Review Results",
      description: "Examine the segmentation results and confidence scores.",
      hint: "Toggle between 2D and 3D views to thoroughly inspect the results.",
      action: "Explore Results",
      demo: true,
      icon: <Eye className="w-12 h-12 text-teal-500" />
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
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
          style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
        />
      </div>

      {/* Main Tutorial Content */}
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="flex items-center space-x-4">
          {tutorialSteps[currentStep].icon}
          <h2 className="text-2xl font-bold text-blue-900">{tutorialSteps[currentStep].title}</h2>
        </div>

        <p className="text-lg text-blue-700">{tutorialSteps[currentStep].description}</p>

        {showHint && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hint</AlertTitle>
            <AlertDescription>
              {tutorialSteps[currentStep].hint}
            </AlertDescription>
          </Alert>
        )}

        {/* Interactive Demo Area */}
        {tutorialSteps[currentStep].demo && (
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
            {currentStep === tutorialSteps.length - 1 ? 'Start Using App' : tutorialSteps[currentStep].action}
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};