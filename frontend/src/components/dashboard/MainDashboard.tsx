// src/components/dashboard/MainDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Brain, Eye, Loader2, MousePointer2, Maximize, RotateCcw, FileSymlink, Settings } from 'lucide-react';
import { FileUpload } from '../common/FileUpload';
import { Viewer3D } from '../viewer/Viewer3D';
import NiftiViewer from '../viewer/NiftiViewer';
import axios from 'axios';

interface MainDashboardProps {
  file: File | null;
  loading: boolean;
  segmentationResult: any;
  show3D: boolean;
  setShow3D: (show: boolean) => void;
  handleFileSelect: (file: File) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  file,
  loading,
  segmentationResult,
  show3D,
  setShow3D,
  handleFileSelect
}) => {
  // key to force remount of Viewer3D (simulates hot-reload)
  const [reloadKey, setReloadKey] = useState(0);
  const [colormapKey, setColormapKey] = useState('gray');
  const [showLungOnly, setShowLungOnly] = useState(false);
  const [hasClickedViewButton, setHasClickedViewButton] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(!file);

  // Enhanced preset list with icons and descriptions
  const presets = [
    { key: 'gray', label: 'Gray', description: 'Standard grayscale view' },
    { key: 'ct_soft', label: 'CT Soft', description: 'Enhanced soft tissue contrast' },
    { key: 'ct_bones', label: 'CT Bones', description: 'Optimized for bone structures' },
  ];

  // Effect to handle fade-in for upload section
  useEffect(() => {
    if (!file) {
      const timer = setTimeout(() => setShowUploadSection(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowUploadSection(false);
    }
  }, [file]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Enhanced Header with Stronger Visual Presence */}
      <div className="text-center mb-16 relative">
        {/* Background gradient circle for visual interest */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-xl"></div>
        </div>
        
        {/* Logo and title with enhanced animations */}
        <div className="relative">
          <div className="flex items-center justify-center mb-8">
            <div className="transform transition-all duration-700 hover:rotate-12 hover:scale-110 bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl shadow-lg">
              <Brain className="h-16 w-16 text-white animate-[pulse_3s_ease-in-out_infinite]" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 mb-6 opacity-0 animate-[slideDown_0.8s_ease-out_0.5s_forwards]">
            MedLearn AI
          </h1>
          
          <p className="text-blue-600 text-xl max-w-2xl mx-auto opacity-0 animate-[slideUp_0.8s_ease-out_0.8s_forwards]">
            Advanced medical imaging analysis powered by artificial intelligence
          </p>
        </div>
      </div>

      {/* Main Content Area with Card-Based Layout */}
      <div className="grid gap-8">
        {/* File Upload Section with Enhanced Animation */}
        {!file && (
          <div
            className={`
              transition-all duration-500 ease-out
              ${showUploadSection ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}
            `}
          >
            <div 
              className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200"
            >
              <div className="flex items-start mb-6">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <FileSymlink className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-blue-900 mb-2">Upload Medical Scan</h2>
                  <p className="text-blue-600">Upload a .nii.gz or .nii file to begin AI-powered analysis</p>
                </div>
              </div>
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {/* File Info with Enhanced Design */}
        {file && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl mr-4">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-blue-900 text-lg">{file.name}</p>
                  <p className="text-blue-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={() => handleFileSelect(null as any)}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Change File
              </button>
            </div>
          </div>
        )}

        {/* Loading State with Enhanced Visual Feedback */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border border-blue-100">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full blur-md animate-pulse"></div>
              </div>
              <Loader2 className="animate-spin h-16 w-16 mx-auto text-blue-600 mb-6 relative" />
            </div>
            <p className="text-blue-900 font-medium text-xl mb-2">Processing your medical scan...</p>
            <p className="text-blue-600 max-w-md mx-auto">Our AI is analyzing your data. This may take a few moments depending on the file size.</p>
          </div>
        )}

        {/* Results Section with Improved Organization */}
        {file && segmentationResult && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
            {/* Header with Clear Visual Hierarchy */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-blue-100">
              <div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Analysis Results</h2>
                <p className="text-blue-600">Interactive visualization with AI-powered segmentation</p>
              </div>
              <button
                onClick={() => setShow3D(!show3D)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <Eye className="h-5 w-5" />
                {show3D ? 'Show 2D View' : 'View in 3D'}
              </button>
            </div>

            {/* Visualization Controls with Improved Layout */}
            {show3D && (
              <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Visualization Settings
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  {/* Conditionally render presets with improved design */}
                  {hasClickedViewButton && (
                    <div className="flex flex-wrap gap-3 mr-4">
                      {presets.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => {
                            setColormapKey(p.key);
                            setReloadKey((k) => k + 1);
                          }}
                          className={`
                            px-5 py-2 rounded-lg transition-all flex items-center
                            ${colormapKey === p.key
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                              : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}
                          `}
                          title={p.description}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Toggle button with improved design */}
                  <button
                    onClick={() => {
                      if (!hasClickedViewButton) {
                        setHasClickedViewButton(true);
                        setShowLungOnly(false);
                      } else {
                        setShowLungOnly((prev) => !prev);
                      }
                      setReloadKey((k) => k + 1);
                    }}
                    className={`
                      px-5 py-2 rounded-lg transition-all flex items-center
                      ${!hasClickedViewButton 
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : showLungOnly
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }
                    `}
                  >
                    {!hasClickedViewButton
                      ? 'View Tumour and Lung'
                      : showLungOnly
                        ? 'View Tumour and Lung'
                        : 'View Lung Only'
                    }
                  </button>
                </div>
              </div>
            )}

            {/* 3D Viewer with Improved Container */}
            <div className={show3D ? 'block' : 'hidden'}>
              {/* Controls Guide with Better Organization */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl mb-6 border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <MousePointer2 className="h-5 w-5 mr-2 text-blue-600" />
                  Niivue 3D Navigation Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {/* ... existing control cards ... */}
                </div>
              </div>
              
              {/* Viewer with enhanced container */}
              <div className="rounded-xl overflow-hidden shadow-lg border border-blue-100">
                <Viewer3D
                  segmentationData={segmentationResult}
                  reloadKey={reloadKey}
                  colormapKey={colormapKey}
                  showLungOnly={showLungOnly}
                />
              </div>
            </div>

            {/* 2D Viewer Container (Only contains the viewer now) */}
            <div className={!show3D ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div className="rounded-xl overflow-hidden shadow-lg border border-blue-100">
                  <NiftiViewer file={file} segmentationResult={segmentationResult} />
                </div>
                {/* Summary section is moved out from here */}
              </div>
            </div>

            {/* AI Analysis Summary (Moved outside the 2D/3D toggle divs) */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <h4 className="font-medium text-blue-900 mb-4 text-lg">AI Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-600 mb-1">Lesion Volume</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {segmentationResult.metrics?.lesionVolume || 'N/A'} cm³
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-600 mb-1">Lesion Count</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {segmentationResult.metrics?.lesionCount || 'N/A'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-600 mb-1">Confidence Score</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {segmentationResult.metrics?.confidenceScore
                      ? `${(segmentationResult.metrics.confidenceScore * 100).toFixed(0)}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            {/* End of moved AI Analysis Summary */}

          </div>
        )}

        {/* Informational Section with Card-Based Layout */}
        {!file && !loading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-xl font-bold text-blue-900 mb-4">About NIFTI Medical Image Analysis</h3>
            <p className="text-blue-700 mb-6">
              Our platform provides advanced visualization and AI-driven analysis for neuroimaging data in NIFTI format (.nii, .nii.gz).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FileSymlink className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-blue-900 mb-2 text-lg">Upload</h4>
                <p className="text-blue-600">Upload your NIFTI-formatted medical images for analysis</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-blue-900 mb-2 text-lg">Visualize</h4>
                <p className="text-blue-600">Interactive 2D and 3D visualization with multiple views</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-blue-900 mb-2 text-lg">Analyze</h4>
                <p className="text-blue-600">AI-powered segmentation and analysis</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
