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
  
  // Also try to load the mock file on component mount
  useEffect(() => {
    if (!PRELOADED_MOCK_FILE) {
      preloadMockFile();
    }
  }, []);

  const handleFileSelect = async (selectedFile: File | null): Promise<void> => {
    // Handle clearing the file
    if (!selectedFile) {
      setFile(null);
      setSegmentationResult(null);
      setShowSegmentationChoice(false);
      setSegmentationMode(null);
      setShowManualSegmentation(false);
      setIsMockData(false);
      return;
    }

    // If this is a mock file, set isMockData flag
    const isMock = selectedFile.name.includes('mock');
    setIsMockData(isMock);
    
    // If this is a mock file and we have a preloaded version, use that
    if (isMock && PRELOADED_MOCK_FILE) {
      console.log("Using preloaded mock file with size:", PRELOADED_MOCK_FILE.size);
      setFile(PRELOADED_MOCK_FILE);
    } else {
      setFile(selectedFile);
    }
    
    setSegmentationResult(null);
    setShowSegmentationChoice(true);
    setSegmentationMode(null);
  };

  const handleSegmentationChoice = (mode: "manual" | "ai"): void => {
    setSegmentationMode(mode);
    setShowSegmentationChoice(false);
    
    if (mode === "manual") {
      // For mock data, use directUrl approach
      if (isMockData) {
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
        // Real data - proceed with manual segmentation as normal
        setShowManualSegmentation(true);
      }
    } else {
      // For AI segmentation, check if it's mock data
      if (isMockData) {
        startMockSegmentation();
      } else {
        startAISegmentation();
      }
    }
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
    
    setLoading(true);
    
    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("nifti_file", file);

      // Send the file to the Django API with increased timeout
      const response = await axios.post(`${API_URL}/tasks/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds timeout for the initial upload
      });

      console.log("Task creation response:", response.data);
      const taskId = response.data.task_id;
      console.log("Task ID received:", taskId);

      if (!taskId) {
        throw new Error("No task ID received from server");
      }

      // Poll for task completion with longer timeout
      let taskComplete = false;
      let attempts = 0;
      const maxAttempts = 20; // Reduced from 120 for faster testing
      const pollingInterval = 2000; // Reduced from 3000 for faster testing

      console.log(`Starting polling for task ${taskId} with ${maxAttempts} max attempts, ${pollingInterval}ms interval`);

      while (!taskComplete && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollingInterval));

        console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${taskId}`);

        try {
          // Check task status with timeout - use the status endpoint
          const statusUrl = `${API_URL}/tasks/${taskId}/status/`;
          console.log(`Calling status endpoint: ${statusUrl}`);
          
          const statusResponse = await axios.get(statusUrl, {
            timeout: 10000 // 10 seconds timeout for status checks
          });

          console.log(`Status response for attempt ${attempts}:`, statusResponse.data);

          if (statusResponse.data.status === "completed") {
            taskComplete = true;

            // Debug: Log the full response to see what we're getting
            console.log("Full API response:", statusResponse.data);

            // Get the URLs for both segmentations
            const tumorSegUrl = statusResponse.data.tumor_segmentation_url;
            const lungSegUrl = statusResponse.data.lung_segmentation_url;
            const originalNiftiUrl = statusResponse.data.nifti_file_url;

            // Debug: Log the individual URL fields
            console.log("URL fields from API:");
            console.log("  originalNiftiUrl:", originalNiftiUrl);
            console.log("  tumorSegUrl:", tumorSegUrl);
            console.log("  lungSegUrl:", lungSegUrl);

            // Validate that we have all required URLs
            if (!originalNiftiUrl) {
              throw new Error("Missing original NIFTI file URL in API response");
            }
            if (!tumorSegUrl) {
              throw new Error("Missing tumor segmentation URL in API response");
            }
            if (!lungSegUrl) {
              throw new Error("Missing lung segmentation URL in API response");
            }

            // Create a result object with the data needed by your viewers
            const result = {
              success: true,
              originalFileUrl: originalNiftiUrl,
              tumorSegmentationUrl: tumorSegUrl,
              lungSegmentationUrl: lungSegUrl,
              resultUrl: tumorSegUrl, // For backward compatibility
              metrics: {
                tumorVolume: statusResponse.data.tumor_volume,
                lungVolume: statusResponse.data.lung_volume,
                lesionCount: statusResponse.data.lesion_count,
                confidenceScore: statusResponse.data.confidence_score
              }
            };
            
            setSegmentationResult(result);
          } else if (statusResponse.data.status === "failed") {
            throw new Error(statusResponse.data.error || "Processing failed");
          } else {
            console.log(`Task ${taskId} status: ${statusResponse.data.status}, continuing to poll...`);
          }
        } catch (pollError) {
          console.error("Error during polling:", pollError);
          console.error("Poll error details:", {
            message: pollError instanceof Error ? pollError.message : String(pollError),
            isAxiosError: axios.isAxiosError(pollError),
            response: axios.isAxiosError(pollError) ? pollError.response?.data : null,
            status: axios.isAxiosError(pollError) ? pollError.response?.status : null
          });
          // Continue polling despite error
        }
      }

      if (!taskComplete) {
        throw new Error("Task processing timed out");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      
      // More detailed error reporting
      let errorMessage = "Failed to process file";
      if (axios.isAxiosError(error)) {
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
        errorMessage = error.message;
      }
      
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
    } finally {
      setLoading(false);
    }
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
    isMockData
  };
}