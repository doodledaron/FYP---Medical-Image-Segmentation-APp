// src/hooks/useFileProcessing.ts
import { useState, useEffect } from "react";
import { SegmentationResult } from "../types";
import axios from "axios";
import * as fs from 'fs';

// Define API URL - you'll want to configure this based on your environment
const API_URL = "http://localhost:8000/api/segmentation";

// Mock data paths for local testing
const MOCK_DATA = {
  originalNiftiUrl: "/mock_lung_scan.nii.gz",
  lungSegmentationUrl: "/mock_lung_segmentation.nii.gz",
  tumorSegmentationUrl: "/mock_tumor_segmentation.nii.gz",
};

// Global preloaded mock file variable
let PRELOADED_MOCK_FILE: File | null = null;

// Include a small base64 encoded sample NIFTI file as fallback
// This is a minimal valid NIFTI file structure that can be used if loading from public directory fails
const MINIMAL_NIFTI_BASE64 = `
H4sIAAAAAAAAA52T0U7bMBSG73diez15BOCmCNig4qYXBcpg3SrohlRN3SdI7cRZnSiDs6ru3Y/dbEEDDhJX
tpPz+f/Ox3Y4fiAcPpKQhvhBxGM6dIOAeq7vBdQP6ZD4NPRcj4RBGAz9IDyCIzmSY3iG4IRGf6jLhlNgUFH4
OyuWHJOQhS5zXslImSUlIbKJsFVa8XKxyvHeBitCdNrWtbdFNH6nFCnF5xJVmvNVjqCRGK9EmS3RlBmfL1Xz
CrNsiaIU7draVOk2/ziR2gINwGMprko8zUWV4YjnJV9iXWmHTDymxbZqCn5P/HUl9/K6HGXFslgZX/UC0GeR
L1Qj9nP/EAx8zzuAzcVUm60rekewUvXeS1YrtoK0yDVbK3aE1WJl9D2bPqdLj7dUd/i66VTrZtWQKWXDv+Kv
8qLGtvpilhHuai6554aNuImCzgnumvH8lQZ912Xnk7PJ2Xh6fjGdTb4ZMIDGdDOrRtdQ7f67F9y+Z57GceS6
84iAf5eKnWZ0fTo9PfPczw8CdNhlmb864CsOAiT1C/x7kWZzfZnqjpBk5bI0DSON1KK/dNR6oJoXcln/R0Is
tBFS2bIRVX5/E31QH7//+Xp7cyrGkW57ChWinT0eRv4BAAD//ze+D6l9AwAA
`;

// Function to preload the mock file (call this at app startup)
export async function preloadMockFile(): Promise<void> {
  try {
    console.log("Preloading mock file...");
    
    // First try to fetch from the public directory
    try {
      const response = await fetch(MOCK_DATA.originalNiftiUrl);
      if (response.ok) {
        const blob = await response.blob();
        console.log("Mock blob loaded from public dir, size:", blob.size);
        
        if (blob.size > 0) {
          PRELOADED_MOCK_FILE = new File([blob], "mock_lung_scan.nii.gz", {
            type: "application/gzip",
            lastModified: Date.now()
          });
          
          console.log("Mock file successfully preloaded from public dir, size:", PRELOADED_MOCK_FILE.size);
          return;
        }
      }
    } catch (fetchError) {
      console.error("Failed to fetch from public dir:", fetchError);
    }
    
    // If public directory fetch failed, use the base64 fallback
    console.log("Using base64 fallback for mock file");
    try {
      // Convert base64 to binary
      const base64 = MINIMAL_NIFTI_BASE64.replace(/\s/g, '');
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create file from binary data
      PRELOADED_MOCK_FILE = new File([bytes.buffer], "mock_lung_scan.nii.gz", {
        type: "application/gzip",
        lastModified: Date.now()
      });
      
      console.log("Mock file successfully created from base64, size:", PRELOADED_MOCK_FILE.size);
    } catch (base64Error) {
      console.error("Failed to create mock file from base64:", base64Error);
    }
  } catch (error) {
    console.error("Failed to preload mock file:", error);
  }
}

// Try to preload the mock file as soon as this module is imported
preloadMockFile();

export function useFileProcessing() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [segmentationResult, setSegmentationResult] = useState<SegmentationResult | null>(null);
  const [show3D, setShow3D] = useState<boolean>(false);
  const [showSegmentationChoice, setShowSegmentationChoice] = useState<boolean>(false);
  const [segmentationMode, setSegmentationMode] = useState<"manual" | "ai" | null>(null);
  const [showManualSegmentation, setShowManualSegmentation] = useState<boolean>(false);
  const [manualSegmentationData, setManualSegmentationData] = useState<any>(null);
  const [manualSegmentationScreenshot, setManualSegmentationScreenshot] = useState<string | null>(null);
  const [showManualSegmentationPreview, setShowManualSegmentationPreview] = useState<boolean>(false);
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<{
    currentAttempt: number;
    maxAttempts: number;
    elapsedMinutes: number;
    estimatedRemainingMinutes: number;
    status: string;
  } | null>(null);
  
  // New background processing states
  const [isProcessingInBackground, setIsProcessingInBackground] = useState<boolean>(false);
  const [backgroundTaskInfo, setBackgroundTaskInfo] = useState<{
    fileName: string;
    startTime: Date;
    taskId?: string;
  } | null>(null);
  const [showCompletionNotification, setShowCompletionNotification] = useState<boolean>(false);

  // Also try to load the mock file on component mount
  useEffect(() => {
    if (!PRELOADED_MOCK_FILE) {
      preloadMockFile();
    }
  }, []);

  const handleFileSelect = async (selectedFile: File | null, forcedMode?: 'mock' | 'real'): Promise<void> => {
    console.log("=== HANDLE FILE SELECT ===");
    console.log("Selected file:", selectedFile);
    console.log("Forced mode:", forcedMode);
    
    // Handle clearing the file
    if (!selectedFile) {
      console.log("Clearing file selection");
      setFile(null);
      setSegmentationResult(null);
      setShowSegmentationChoice(false);
      setSegmentationMode(null);
      setShowManualSegmentation(false);
      setIsMockData(false);
      return;
    }

    // Determine if this is mock data based on forcedMode or filename
    let isMock: boolean;
    if (forcedMode) {
      isMock = forcedMode === 'mock';
      console.log(`Using forced mode: ${forcedMode}, isMock: ${isMock}`);
    } else {
      isMock = selectedFile.name.includes('mock');
      console.log(`Using filename detection for: ${selectedFile.name}, isMock: ${isMock}`);
    }
    
    console.log(`File name: ${selectedFile.name}`);
    console.log(`Final isMock decision: ${isMock}`);
    setIsMockData(isMock);
    
    // If this is a mock file and we have a preloaded version, use that
    if (isMock && PRELOADED_MOCK_FILE) {
      console.log("Using preloaded mock file with size:", PRELOADED_MOCK_FILE.size);
      setFile(PRELOADED_MOCK_FILE);
    } else {
      console.log("Using uploaded file");
      setFile(selectedFile);
    }
    
    setSegmentationResult(null);
    setShowSegmentationChoice(true);
    setSegmentationMode(null);
    console.log("=== FILE SELECT COMPLETED ===");
  };

  // Wrapper function specifically for real file uploads
  const handleRealFileSelect = async (selectedFile: File | null): Promise<void> => {
    console.log("🤖 REAL FILE SELECT - forcing real mode");
    return handleFileSelect(selectedFile, 'real');
  };

  // Wrapper function specifically for mock file selection  
  const handleMockFileSelect = async (selectedFile: File | null): Promise<void> => {
    console.log("🎭 MOCK FILE SELECT - forcing mock mode");
    return handleFileSelect(selectedFile, 'mock');
  };

  const handleSegmentationChoice = (mode: "manual" | "ai"): void => {
    console.log("=== HANDLE SEGMENTATION CHOICE ===");
    console.log("Selected mode:", mode);
    console.log("Current isMockData state:", isMockData);
    console.log("Current file:", file?.name);
    
    setSegmentationMode(mode);
    setShowSegmentationChoice(false);
    
    if (mode === "manual") {
      // For mock data, use directUrl approach
      if (isMockData) {
        console.log("Entering manual segmentation with mock data");
        // Set mock URL directly for manual segmentation
        console.log("Setting direct URL for manual segmentation with mock data");
        console.log("Mock URL path:", MOCK_DATA.originalNiftiUrl);
        // We still need a file object (even if empty) for component props
        if (!file || file.size === 0) {
          const emptyFile = new File([], "mock_lung_scan.nii.gz", { 
            type: "application/gzip", 
            lastModified: Date.now() 
          });
          setFile(emptyFile);
        }
        // The directUrl will be passed to the ManualSegmentation component
        setShowManualSegmentation(true);
      } else {
        console.log("Entering manual segmentation with real data");
        // Real data - proceed with manual segmentation as normal
        setShowManualSegmentation(true);
      }
    } else {
      // For AI segmentation, check if it's mock data
      console.log("AI segmentation selected");
      if (isMockData) {
        console.log("🎭 Starting MOCK segmentation");
        startMockSegmentation();
      } else {
        console.log("🤖 Starting REAL AI segmentation");
        startAISegmentation();
      }
    }
    console.log("=== SEGMENTATION CHOICE COMPLETED ===");
  };

  // New function for mock segmentation
  const startMockSegmentation = async (): Promise<void> => {
    setLoading(true);
    
    try {
      // Create mock result using relative URLs 
      const mockResult = {
        success: true,
        originalFileUrl: MOCK_DATA.originalNiftiUrl,
        tumorSegmentationUrl: MOCK_DATA.tumorSegmentationUrl,
        lungSegmentationUrl: MOCK_DATA.lungSegmentationUrl,
        resultUrl: MOCK_DATA.tumorSegmentationUrl,
        metrics: {
          tumorVolume: 45.7,
          lungVolume: 3245.2,
          lesionCount: 2,
          confidenceScore: 0.89
        }
      };
      
      // Simulate delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSegmentationResult(mockResult);
      
      console.log("Mock segmentation complete with paths:", mockResult);
    } catch (error) {
      console.error("Error processing mock file:", error);
      setSegmentationResult({ 
        success: false, 
        error: "Failed to process mock data",
        originalFileUrl: '',
        tumorSegmentationUrl: '',
        lungSegmentationUrl: '',
        resultUrl: '',
        metrics: {
          tumorVolume: 0,
          lungVolume: 0,
          lesionCount: 0,
          confidenceScore: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const startAISegmentation = async (): Promise<void> => {
    if (!file) return;
    
    console.log("=== STARTING AI SEGMENTATION ===");
    setLoading(true); // Show loading only during initial upload
    
    try {
      console.log("Creating form data for file upload...");
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("nifti_file", file);

      console.log("Sending file to Django API...");
      // Send the file to the Django API with increased timeout
      const response = await axios.post(`${API_URL}/tasks/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds timeout for the initial upload
      });

      const taskId = response.data.task_id;
      console.log(`Task created with ID: ${taskId}`);

      // After successful upload, switch to background mode
      setLoading(false); // Stop blocking UI
      setIsProcessingInBackground(true);
      setBackgroundTaskInfo({
        fileName: file.name,
        startTime: new Date(),
        taskId: taskId
      });

      // Start background polling
      console.log("🔄 Starting background polling...");
      pollTaskInBackground(taskId);

    } catch (error) {
      console.error("💥 ERROR IN INITIAL FILE UPLOAD:", error);
      
      // Clear progress state on error
      setProcessingProgress(null);
      setLoading(false); // Set loading to false on error
      
      // More detailed error reporting
      let errorMessage = "Failed to process file";
      if (axios.isAxiosError(error)) {
        console.log("This is an Axios error");
        if (error.code === 'ECONNABORTED') {
          errorMessage = "Request timed out. The server might be busy or the file is too large.";
        } else if (error.response) {
          errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
          if (error.response.data?.error) {
            errorMessage += ` (${error.response.data.error})`;
          }
        } else if (error.request) {
          errorMessage = "No response received from server. Check your network connection.";
        }
      } else if (error instanceof Error) {
        console.log("This is a standard Error");
        errorMessage = error.message;
      }
      
      console.log("Final error message:", errorMessage);
      console.log("Setting failed segmentation result...");
      
      // Only set segmentationResult on actual processing failures, not polling errors
      setSegmentationResult({ 
        success: false, 
        error: errorMessage,
        originalFileUrl: '',
        tumorSegmentationUrl: '',
        lungSegmentationUrl: '',
        resultUrl: '',
        metrics: {
          tumorVolume: 0,
          lungVolume: 0,
          lesionCount: 0,
          confidenceScore: 0
        }
      });
      
      console.log("❌ AI SEGMENTATION FAILED");
    }
    
    console.log("=== AI SEGMENTATION FUNCTION ENDED ===");
  };

  // Separate function for background polling
  const pollTaskInBackground = async (taskId: string): Promise<void> => {
    console.log("=== STARTING BACKGROUND POLLING ===");
    
    let taskComplete = false;
    let attempts = 0;
    const maxAttempts = 600; // 30 minutes total
    const pollingInterval = 3000; // 3 seconds between polls

    console.log(`Background polling for task ${taskId}. Max attempts: ${maxAttempts}`);

    while (!taskComplete && attempts < maxAttempts) {
      attempts++;
      
      // Update progress state
      const elapsedMinutes = (attempts * pollingInterval) / 1000 / 60;
      const remainingMinutes = ((maxAttempts - attempts) * pollingInterval) / 1000 / 60;
      
      setProcessingProgress({
        currentAttempt: attempts,
        maxAttempts: maxAttempts,
        elapsedMinutes: elapsedMinutes,
        estimatedRemainingMinutes: remainingMinutes,
        status: 'polling'
      });
      
      // Log progress every 20 attempts (1 minute)
      if (attempts % 20 === 0) {
        console.log(`Background polling: ${attempts}/${maxAttempts} (${elapsedMinutes.toFixed(1)} min elapsed)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollingInterval));

      try {
        // Check task status
        const statusResponse = await axios.get(`${API_URL}/tasks/${taskId}/`, {
          timeout: 10000 // 10 seconds timeout for status checks
        });

        // Update progress with current status
        setProcessingProgress(prev => prev ? {
          ...prev,
          status: statusResponse.data.status
        } : null);

        if (statusResponse.data.status === "completed") {
          console.log("🎉 BACKGROUND TASK COMPLETED!");
          taskComplete = true;
          
          // Clear progress state
          setProcessingProgress(null);
          setIsProcessingInBackground(false);
          setBackgroundTaskInfo(null);

          // Get the URLs for both segmentations
          const tumorSegUrl = statusResponse.data.tumor_segmentation_url;
          const lungSegUrl = statusResponse.data.lung_segmentation_url;
          const originalNiftiUrl = statusResponse.data.nifti_file_url;

          // Create result object
          const result = {
            success: true,
            originalFileUrl: originalNiftiUrl,
            tumorSegmentationUrl: tumorSegUrl,
            lungSegmentationUrl: lungSegUrl,
            resultUrl: tumorSegUrl,
            metrics: {
              tumorVolume: statusResponse.data.tumor_volume,
              lungVolume: statusResponse.data.lung_volume,
              lesionCount: statusResponse.data.lesion_count,
              confidenceScore: statusResponse.data.confidence_score
            }
          };
          
          console.log("Background segmentation result:", result);
          
          setSegmentationResult(result);
          setShowCompletionNotification(true); // Show notification
          
          console.log("✅ BACKGROUND SEGMENTATION COMPLETED");
          return;
        } else if (statusResponse.data.status === "failed") {
          console.log("❌ BACKGROUND TASK FAILED");
          taskComplete = true;
          
          setProcessingProgress(null);
          setIsProcessingInBackground(false);
          setBackgroundTaskInfo(null);
          
          setSegmentationResult({
            success: false,
            error: statusResponse.data.error || "Processing failed",
            originalFileUrl: '',
            tumorSegmentationUrl: '',
            lungSegmentationUrl: '',
            resultUrl: '',
            metrics: {
              tumorVolume: 0,
              lungVolume: 0,
              lesionCount: 0,
              confidenceScore: 0
            }
          });
          
          setShowCompletionNotification(true); // Show error notification
          return;
        }
        // Continue polling for other statuses
      } catch (pollError) {
        console.error(`Background polling error (attempt ${attempts}):`, pollError);
        // Continue polling despite errors
      }
    }

    // Handle timeout
    if (!taskComplete) {
      console.log("⏰ BACKGROUND POLLING TIMED OUT");
      setProcessingProgress(null);
      setIsProcessingInBackground(false);
      setBackgroundTaskInfo(null);
      
      setSegmentationResult({
        success: false,
        error: "Processing timed out after 30 minutes. The task may still be running on the server.",
        originalFileUrl: '',
        tumorSegmentationUrl: '',
        lungSegmentationUrl: '',
        resultUrl: '',
        metrics: {
          tumorVolume: 0,
          lungVolume: 0,
          lesionCount: 0,
          confidenceScore: 0
        }
      });
      
      setShowCompletionNotification(true); // Show timeout notification
    }
  };

  // Function to handle notification click - navigate to results
  const handleNotificationClick = () => {
    setShowCompletionNotification(false);
    // The segmentationResult is already set, so the UI will automatically show the results
  };

  // Function to dismiss notification without viewing
  const dismissNotification = () => {
    setShowCompletionNotification(false);
  };

  const completeManualSegmentation = (segData: any) => {
    setManualSegmentationData(segData.segmentationMask);
    // Store the screenshot if available
    if (segData.screenshot) {
      setManualSegmentationScreenshot(segData.screenshot);
    }
    setShowManualSegmentation(false);
    
    // Check if we're using mock data
    if (isMockData) {
      startMockSegmentation();
    } else {
      startAISegmentation();
    }
  };

  return { 
    file, 
    loading, 
    segmentationResult, 
    show3D, 
    setShow3D, 
    handleFileSelect,
    handleRealFileSelect,
    handleMockFileSelect,
    showSegmentationChoice,
    segmentationMode,
    handleSegmentationChoice,
    showManualSegmentation,
    setShowManualSegmentation,
    completeManualSegmentation,
    manualSegmentationData,
    manualSegmentationScreenshot,
    showManualSegmentationPreview,
    setShowManualSegmentationPreview,
    isMockData,
    processingProgress,
    isProcessingInBackground,
    setIsProcessingInBackground,
    backgroundTaskInfo,
    setBackgroundTaskInfo,
    showCompletionNotification,
    setShowCompletionNotification,
    handleNotificationClick,
    dismissNotification
  };
}