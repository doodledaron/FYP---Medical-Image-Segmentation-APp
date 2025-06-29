// src/components/dashboard/MainDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Brain, Eye, Loader2, MousePointer2, Maximize, RotateCcw, FileSymlink, Settings, Layers, Check, CheckSquare, Square, BookOpen, Clock, Upload } from 'lucide-react';
import { FileUpload } from '../common/FileUpload';
import { Viewer3D } from '../viewer/Viewer3D';
import NiftiViewer from '../viewer/NiftiViewer';
import { SegmentationChoiceModal } from '../common/SegmentationChoiceModal';
import { ManualSegmentation } from '../viewer/ManualSegmentation';
import axios from 'axios';
import { ManualSegmentationViewer } from '../viewer/ManualSegmentationViewer';

interface MainDashboardProps {
  file: File | null;
  loading: boolean;
  segmentationResult: any;
  show3D: boolean;
  setShow3D: (show: boolean) => void;
  handleFileSelect: (file: File) => void;
  showSegmentationChoice: boolean;
  handleSegmentationChoice: (mode: "manual" | "ai") => void;
  showManualSegmentation: boolean;
  completeManualSegmentation: (segData: any) => void;
  isMockData: boolean;
}

// TNM Fun Facts for loading screen
const tnmFunFacts = [
  {
    title: "TNM Basics",
    fact: "The 'p' prefix in TNM staging indicates pathologic stage based on surgical resection only."
  },
  {
    title: "TNM System",
    fact: "The TNM system for lung cancer does not apply to pulmonary sarcomas."
  },
  {
    title: "TNM Classification",
    fact: "The 9th edition of TNM classification was issued by the International Association for the Study of Lung Cancer (IASLC)."
  },
  {
    title: "TNM Purpose",
    fact: "The primary purpose of TNM is to standardize anatomical extent for communication and data applicability."
  },
  {
    title: "Subsolid Lesions",
    fact: "Pure ground glass lesions ≤ 30 mm are classified as at most cTis."
  },
  {
    title: "CT Reconstruction",
    fact: "Subsolid lesion measurements should be obtained on CT reconstructions with slice thickness of < 1.5 mm."
  },
  {
    title: "T-Staging",
    fact: "A tumor measuring between 1-2 cm is classified as T1b."
  },
  {
    title: "T3 Classification",
    fact: "A tumor > 5 cm but ≤ 7 cm is classified as T3."
  },
  {
    title: "N-Staging",
    fact: "Metastasis to a single ipsilateral mediastinal station is classified as N2a."
  },
  {
    title: "PET-CT Usage",
    fact: "PET-CT has a high negative predictive value for nodal staging."
  },
  {
    title: "M-Staging",
    fact: "M1a disease includes malignant pleural effusion."
  },
  {
    title: "Metastasis Classification",
    fact: "A solitary liver metastasis is classified as M1b."
  }
];

export const MainDashboard: React.FC<MainDashboardProps> = ({
  file,
  loading,
  segmentationResult,
  show3D,
  setShow3D,
  handleFileSelect,
  showSegmentationChoice,
  handleSegmentationChoice,
  showManualSegmentation,
  completeManualSegmentation,
  isMockData
}) => {
  // key to force remount of Viewer3D (simulates hot-reload)
  const [reloadKey, setReloadKey] = useState(0);
  const [colormapKey, setColormapKey] = useState('gray');
  
  // New visibility state for each component
  const [showBody, setShowBody] = useState(true);
  const [showLung, setShowLung] = useState(false);
  const [showTumour, setShowTumour] = useState(true);
  
  // For fun fact rotation
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  // Add state for manual segmentation data
  const [manualSegmentationData, setManualSegmentationData] = useState<{
    segmentationMask: Uint8Array[];
    dimensions: [number, number, number];
    screenshot: string | null;
    originalImageData?: Float32Array;
    windowWidth?: number;
    windowCenter?: number;
  } | null>(null);
  
  const [showManualSegmentationPreview, setShowManualSegmentationPreview] = useState(false);
  
  // Active tab state for the upload section - default to 'mock' for demo-only
  const [activeUploadTab, setActiveUploadTab] = useState<'mock' | 'real'>('mock');
  
  // Toast notification state for mock segmentation
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Enhanced preset list with icons and descriptions
  const presets = [
    { key: 'gray', label: 'Gray', description: 'Standard grayscale view' },
    { key: 'ct_soft', label: 'CT Soft', description: 'Enhanced soft tissue contrast' },
    { key: 'ct_bones', label: 'CT Bones', description: 'Optimized for bone structures' },
  ];

  // Effect to handle fade-in for upload section
  const [showUploadSection, setShowUploadSection] = useState(!file);
  useEffect(() => {
    if (!file) {
      const timer = setTimeout(() => setShowUploadSection(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowUploadSection(false);
    }
  }, [file]);

  // Toast timeout effect
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Rotate fun facts every 5 seconds during loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prevIndex) => (prevIndex + 1) % tnmFunFacts.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Function to update view settings and reload viewer
  const updateView = () => {
    setReloadKey((k) => k + 1);
  };

  // Handle completing manual segmentation
  const handleCompleteManualSegmentation = (segData: any) => {
    // Save all segmentation data, not just the screenshot
    setManualSegmentationData({
      segmentationMask: segData.segmentationMask,
      dimensions: segData.dimensions,
      screenshot: segData.screenshot,
      originalImageData: segData.originalImageData,
      windowWidth: segData.windowWidth,
      windowCenter: segData.windowCenter
    });
    
    // Pass the data to the parent component
    completeManualSegmentation(segData);
  };

  // Function to handle mock segmentation
  const handleMockSegmentation = () => {
    // Show toast notification
    setToastMessage('Loading pre-segmented lung scan (5-10 seconds)...');
    setShowToast(true);
    
    // Create a mock File object to pass to the handler
    const mockFile = new File([""], "mock_lung_scan.nii.gz", { type: "application/gzip" });
    handleFileSelect(mockFile);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center animate-in slide-in-from-top duration-300">
          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Segmentation Choice Modal */}
      {showSegmentationChoice && file && (
        <SegmentationChoiceModal 
          onSelectMode={handleSegmentationChoice}
          fileName={file.name}
        />
      )}

      {/* Manual Segmentation View */}
      {showManualSegmentation && file && (
        <ManualSegmentation
          file={file}
          onComplete={handleCompleteManualSegmentation}
          onCancel={() => handleFileSelect(null as any)}
          directUrl={isMockData ? '/mock_lung_scan.nii.gz' : undefined}
        />
      )}

      {/* Main Content Area with Card-Based Layout */}
      <div className={`grid gap-6 ${showManualSegmentation ? 'hidden' : ''}`}>
        {/* File Upload Section with Tabs */}
        {!file && (
          <div
            className={`
              transition-all duration-500 ease-out
              ${showUploadSection ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}
            `}
          >
            <div 
              className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <FileSymlink className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-gray-900 mb-2">Upload Medical Scan</h2>
                  <p className="text-blue-600">Choose an option below to start analysis</p>
                </div>
              </div>
              
              {/* Demo-Only Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Demo Version</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>This is a demonstration version using pre-segmented data. For real-time AI segmentation, please contact us.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Simplified Single Option - No Tabs */}
              <div className="py-2">
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Interactive Demo</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Explore a pre-segmented lung CT scan with interactive 2D/3D visualization and educational content.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleMockSegmentation}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Brain className="h-5 w-5" />
                  Start Interactive Demo
                </button>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Pre-loaded with lung and tumor segmentation for educational purposes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Info with Enhanced Design */}
        {file && !loading && !showSegmentationChoice && (
          <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-50 p-3 rounded-xl mr-4">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-lg">{file.name}</p>
                  <p className="text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
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

        {/* Loading State with Fun Facts */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <div className="text-gray-900 font-medium text-xl mb-6">
              {isMockData ? 
                'Processing demo scan (5-10 seconds)...' : 
                'Processing your medical scan (5-10 minutes)...'}
            </div>
            
            {/* Progress indicator */}
            <div className="w-full max-w-md mx-auto mb-8">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full animate-pulse" 
                  style={{
                    width: isMockData ? '70%' : '30%',
                    animationDuration: isMockData ? '1s' : '3s'
                  }}
                ></div>
              </div>
            </div>
            
            {/* Enhanced Fun Fact Card */}
            <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 transition-all animate-[fadeIn_0.5s_ease-in]">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-gray-800 text-lg">
                  TNM Fun Fact: {tnmFunFacts[currentFactIndex].title}
                </h3>
              </div>
              <p className="text-gray-700 text-base">
                {tnmFunFacts[currentFactIndex].fact}
              </p>
              <div className="flex justify-center gap-1 mt-5">
                {tnmFunFacts.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 w-10 rounded-full transition-all duration-300 ${idx === currentFactIndex ? 'bg-blue-600' : 'bg-blue-200'}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Section with Improved Organization */}
        {file && segmentationResult && !loading && !showSegmentationChoice && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            {/* Header with Clear Visual Hierarchy */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Results</h2>
                <p className="text-gray-500">Interactive visualization with AI-powered segmentation</p>
              </div>
              <button
                onClick={() => {
                  if (!show3D) {
                    setShowLung(true);
                    setShowTumour(true);
                  }
                  setShow3D(!show3D);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm"
              >
                <Eye className="h-5 w-5" />
                {show3D ? 'Show 2D View' : 'View in 3D'}
              </button>
            </div>

            {/* Visualization Controls with Improved Layout */}
            {show3D && (
              <div className="mb-6 p-5 bg-blue-50 rounded-xl">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Visualization Settings
                </h3>
                
                <div className="flex flex-col gap-4">
                  {/* View Mode Selection - New Checkbox Style */}
                  <div>
                    <div className="flex items-center font-medium text-gray-700 mb-3">
                      <Layers className="h-4 w-4 mr-1" /> View Components:
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {/* Body Checkbox */}
                      <label 
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div 
                          className="w-5 h-5 flex items-center justify-center rounded border border-gray-300"
                          onClick={() => {
                            setShowBody(!showBody);
                            updateView();
                          }}
                        >
                          {showBody ? (
                            <Check className="h-4 w-4 text-blue-600" />
                          ) : null}
                        </div>
                        <span className="text-gray-800">Body</span>
                      </label>
                      
                      {/* Lung Checkbox */}
                      <label 
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div 
                          className="w-5 h-5 flex items-center justify-center rounded border border-gray-300"
                          onClick={() => {
                            setShowLung(!showLung);
                            updateView();
                          }}
                        >
                          {showLung ? (
                            <Check className="h-4 w-4 text-blue-600" />
                          ) : null}
                        </div>
                        <span className="text-gray-800">Lung</span>
                      </label>
                      
                      {/* Tumour Checkbox */}
                      <label 
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div 
                          className="w-5 h-5 flex items-center justify-center rounded border border-gray-300"
                          onClick={() => {
                            setShowTumour(!showTumour);
                            updateView();
                          }}
                        >
                          {showTumour ? (
                            <Check className="h-4 w-4 text-blue-600" />
                          ) : null}
                        </div>
                        <span className="text-gray-800">Tumour</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Conditionally render presets only if Body is visible */}
                  {showBody && (
                    <div className="mt-2">
                      <div className="flex items-center font-medium text-gray-700 mb-2">
                        <Settings className="h-4 w-4 mr-1" /> Body Visualization:
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {presets.map((p) => (
                          <button
                            key={p.key}
                            onClick={() => {
                              setColormapKey(p.key);
                              updateView();
                            }}
                            className={`
                              px-4 py-2 rounded-lg transition-all flex items-center
                              ${colormapKey === p.key
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'}
                            `}
                            title={p.description}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3D Viewer with Improved Container */}
            <div className={show3D ? 'block' : 'hidden'}>
              {/* Viewer with enhanced container */}
              <div className="rounded-xl overflow-hidden shadow-sm">
                <Viewer3D
                  segmentationData={segmentationResult}
                  reloadKey={reloadKey}
                  colormapKey={colormapKey}
                  showBody={showBody}
                  showLung={showLung}
                  showTumour={showTumour}
                  manualSegmentationData={manualSegmentationData}
                  showManualSegmentationPreview={showManualSegmentationPreview}
                  setShowManualSegmentationPreview={setShowManualSegmentationPreview}
                />
              </div>
            </div>

            {/* 2D Viewer Container */}
            <div className={!show3D ? 'block' : 'hidden'}>
              <div className="space-y-6">
                <div className="rounded-xl overflow-hidden shadow-sm">
                  <NiftiViewer 
                    file={file} 
                    segmentationResult={segmentationResult} 
                    manualSegmentationData={manualSegmentationData}
                    showManualSegmentationPreview={showManualSegmentationPreview}
                    setShowManualSegmentationPreview={setShowManualSegmentationPreview}
                  />
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="mt-6 bg-blue-50 p-6 rounded-xl">
              <h4 className="font-medium text-gray-900 mb-4 text-lg">Analysis Summary</h4>
              
              {/* Metrics Cards - Clean white cards with stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col justify-between h-full">
                  <p className="text-sm text-gray-500 mb-1">Tumor Volume</p>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {segmentationResult.metrics?.tumorVolume || 'N/A'} cm³
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col justify-between h-full">
                  <p className="text-sm text-gray-500 mb-1">Lung Volume</p>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {segmentationResult.metrics?.lungVolume || 'N/A'} cm³
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col justify-between h-full">
                  <p className="text-sm text-gray-500 mb-1">Lesion Count</p>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {segmentationResult.metrics?.lesionCount || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Unified Summary Section */}
              {segmentationResult.metrics?.tumorVolume && segmentationResult.metrics?.lungVolume && (
                <div className="bg-white rounded-lg overflow-hidden">
                  {/* Summary sentence */}
                  <div className="p-4 transition-all duration-300 ease-in-out hover:bg-blue-50 cursor-default">
                    <p className="text-gray-800 font-medium text-lg leading-relaxed">
                      {(() => {
                        const tumorVolume = segmentationResult.metrics.tumorVolume;
                        const lungVolume = segmentationResult.metrics.lungVolume;
                        const lesionCount = segmentationResult.metrics.lesionCount || 1;
                        const percentage = (tumorVolume / lungVolume * 100).toFixed(2);
                        const avgSize = (tumorVolume / lesionCount).toFixed(2);
                        
                        const severityClass = parseFloat(percentage) < 1 
                          ? "text-green-700 font-semibold" 
                          : parseFloat(percentage) < 5 
                            ? "text-yellow-700 font-semibold" 
                            : "text-red-700 font-semibold";
                        
                        if (parseFloat(percentage) < 1) {
                          return (
                            <>
                              Analysis shows <span className={severityClass}>minimal tumor burden</span> ({percentage}% of lung volume) with {lesionCount} lesion(s) averaging {avgSize} cm³ each.
                            </>
                          );
                        } else if (parseFloat(percentage) < 5) {
                          return (
                            <>
                              Analysis shows <span className={severityClass}>moderate tumor burden</span> ({percentage}% of lung volume) with {lesionCount} lesion(s) averaging {avgSize} cm³ each.
                            </>
                          );
                        } else {
                          return (
                            <>
                              Analysis shows <span className={severityClass}>significant tumor burden</span> ({percentage}% of lung volume) with {lesionCount} lesion(s) averaging {avgSize} cm³ each.
                            </>
                          );
                        }
                      })()}
                    </p>
                  </div>
                  
                  {/* Classification indicators */}
                  <div className="p-4 bg-gray-50">
                    <p className="text-sm text-gray-700 font-medium mb-3">Tumor Burden Classification</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded h-full">
                        <div className="flex items-center mb-1.5">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="font-semibold text-sm text-gray-800">Minimal (&lt;1%)</span>
                        </div>
                        <p className="text-xs text-gray-600">Small tumor volume relative to lung size; often early-stage and more favorable for treatment.</p>
                      </div>
                      <div className="bg-white p-3 rounded h-full">
                        <div className="flex items-center mb-1.5">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span className="font-semibold text-sm text-gray-800">Moderate (1-5%)</span>
                        </div>
                        <p className="text-xs text-gray-600">Intermediate tumor volume; may indicate progression beyond early stage or multiple lesions.</p>
                      </div>
                      <div className="bg-white p-3 rounded h-full">
                        <div className="flex items-center mb-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="font-semibold text-sm text-gray-800">Significant (&gt;5%)</span>
                        </div>
                        <p className="text-xs text-gray-600">Large tumor volume relative to lung size; often associated with advanced disease and complex treatment needs.</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-3">Note: This classification is for educational purposes only. Clinical staging requires expert assessment of multiple factors.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informational Section */}
        {!file && !loading && (
          <div className="bg-blue-50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Learning Through Doing: TNM Staging</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FileSymlink className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2 text-lg">Try nnUnet Model</h4>
                <p className="text-gray-600">Learn segmentation by analyzing real medical images</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2 text-lg">Take TNM Quizzes</h4>
                <p className="text-gray-600">Test and expand your tumor staging knowledge</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2 text-lg">Track Progress</h4>
                <p className="text-gray-600">Build expertise through hands-on experimentation</p>
              </div>
            </div>
            <div className="bg-white mt-6 p-3 rounded-lg text-center">
              <p className="text-gray-700 text-sm">
                A constructivist platform for medical students: learn by doing, test your knowledge, master TNM staging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
