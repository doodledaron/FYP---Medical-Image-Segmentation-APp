// src/components/dashboard/MainDashboard.tsx
import React from 'react';
import { Brain, Eye, Loader2, MousePointer2, Maximize, RotateCcw } from 'lucide-react';
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
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <Brain className="h-12 w-12 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-blue-900 mb-4">
          MedLearn AI
        </h1>
        <p className="text-blue-600 text-lg">
          Advanced medical imaging analysis powered by AI
        </p>
      </div>

      {/* File Upload Section */}
      {!file && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-blue-100">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Upload Scan</h2>
            <p className="text-blue-600 text-sm">Upload a .nii.gz or .nii file to begin analysis</p>
          </div>
          <FileUpload onFileSelect={handleFileSelect} />
        </div>
      )}

      {/* File Info - Show if file is selected */}
      {file && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-900">{file.name}</p>
                <p className="text-sm text-blue-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={() => handleFileSelect(null as any)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Change File
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-500 mb-4" />
          <p className="text-blue-800 font-medium">Processing your medical scan...</p>
          <p className="text-blue-500 text-sm mt-2">This may take a few moments</p>
        </div>
      )}

      {/* Results Section */}
      {file && segmentationResult && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-blue-900">Analysis Results</h2>
              <p className="text-blue-600 text-sm mt-1">Interactive visualization available</p>
            </div>
            <button
              onClick={() => setShow3D(!show3D)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Eye className="h-5 w-5" />
              {show3D ? 'Show 2D View' : 'View in 3D'}
            </button>
          </div>

          {show3D ? (
            <>
              {/* Controls Guide for 3D View */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <MousePointer2 className="h-5 w-5 mr-2 text-blue-600" />
                  Niivue 3D Navigation Controls
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="bg-white p-3 rounded shadow-sm flex items-start">
                    <div className="mt-1 mr-2 bg-blue-100 p-1 rounded">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Rotate</p>
                      <p className="text-blue-600">Left-click and drag to rotate the 3D view</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm flex items-start">
                    <div className="mt-1 mr-2 bg-blue-100 p-1 rounded">
                      <Maximize className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Zoom</p>
                      <p className="text-blue-600">Right-click and drag vertically or use mouse wheel</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm flex items-start">
                    <div className="mt-1 mr-2 bg-blue-100 p-1 rounded">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Pan</p>
                      <p className="text-blue-600">Middle-click and drag to pan the view</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 3D Viewer */}
              <Viewer3D segmentationData={segmentationResult} />
            </>
          ) : (
            <div className="space-y-6">
              {/* Enhanced 2D NIFTI Viewer with sliders */}
              <NiftiViewer file={file} segmentationResult={segmentationResult} />

              {/* Analysis Summary */}
              <div className="mt-6 bg-white p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">AI Analysis Summary</h4>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Lesion Volume: {segmentationResult.metrics?.lesionVolume || 'N/A'} cm³</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Lesion Count: {segmentationResult.metrics?.lesionCount || 'N/A'}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>Confidence Score: {segmentationResult.metrics?.confidenceScore
                      ? `${(segmentationResult.metrics.confidenceScore * 100).toFixed(0)}%`
                      : 'N/A'}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informational Section */}
      {!file && !loading && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-medium text-blue-900 mb-3">About NIFTI Medical Image Analysis</h3>
          <p className="text-blue-700 mb-4">
            Our platform provides advanced visualization and AI-driven analysis for neuroimaging data in NIFTI format (.nii, .nii.gz).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-blue-900 mb-2">Upload</h4>
              <p className="text-blue-600">Upload your NIFTI-formatted medical images for analysis</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-blue-900 mb-2">Visualize</h4>
              <p className="text-blue-600">Interactive 2D and 3D visualization with multiple views</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-medium text-blue-900 mb-2">Analyze</h4>
              <p className="text-blue-600">AI-powered segmentation and analysis</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};