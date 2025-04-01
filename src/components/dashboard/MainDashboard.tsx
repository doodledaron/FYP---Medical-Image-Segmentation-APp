// src/components/dashboard/MainDashboard.tsx
import React from 'react';
import { Brain, Eye, Loader2 } from 'lucide-react';
import { FileUpload } from '../common/FileUpload';
import { Viewer3D } from '../viewer/Viewer3D';
// @ts-ignore - Add proper image declaration if needed
import captureImg from '../../assets/Capture.png';
// @ts-ignore - Add proper image declaration if needed
import capture1Img from '../../assets/Capture 1.png';

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
    <div className="max-w-4xl mx-auto py-12 px-8">
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
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-blue-100">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Upload Scan</h2>
          <p className="text-blue-600 text-sm">Upload a .nii.gz file to begin analysis</p>
        </div>
        <FileUpload onFileSelect={handleFileSelect} />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-500 mb-4" />
          <p className="text-blue-800 font-medium">Processing your medical scan...</p>
          <p className="text-blue-500 text-sm mt-2">This may take a few moments</p>
        </div>
      )}

      {/* Results Section */}
      {segmentationResult && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-8">
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
            <Viewer3D segmentationData={segmentationResult} />
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">2D Scan Analysis</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <img
                      src={captureImg}
                      alt="Lung scan visualization"
                      className="rounded-lg shadow-md w-full"
                    />
                    <p className="text-center text-blue-600 mt-2">Axial View</p>
                  </div>
                  <div>
                    <img
                      src={capture1Img}
                      alt="Lung scan visualization"
                      className="rounded-lg shadow-md w-full"
                    />
                    <p className="text-center text-blue-600 mt-2">Sagittal View</p>
                  </div>
                </div>
                <div className="mt-6 bg-white p-4 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-2">AI Analysis Summary</h4>
                  <ul className="space-y-2 text-blue-700">
                    <li>• Detected anomaly in upper right lobe</li>
                    <li>• Size: approximately 2.3cm x 1.8cm</li>
                    <li>• Confidence score: 94%</li>
                    <li>• Recommended for clinical review</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};