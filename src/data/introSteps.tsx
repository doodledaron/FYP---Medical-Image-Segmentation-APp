// src/data/tutorialSteps.ts
import { Play, FileImage, Box, Eye, Activity } from 'lucide-react';
import { IntroStep } from '../types';

// Static data for tutorial steps in the interactive segmentation tutorial
export const introSteps: IntroStep[] = [
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