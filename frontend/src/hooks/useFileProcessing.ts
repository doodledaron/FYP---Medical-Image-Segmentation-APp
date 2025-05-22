// src/hooks/useFileProcessing.ts
import { useState } from "react";
import { SegmentationResult } from "../types";
import axios from "axios";

// Define API URL - you'll want to configure this based on your environment
const API_URL = "http://localhost:8000/api/segmentation";

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

  const handleFileSelect = async (selectedFile: File | null): Promise<void> => {
    // Handle clearing the file
    if (!selectedFile) {
      setFile(null);
      setSegmentationResult(null);
      setShowSegmentationChoice(false);
      setSegmentationMode(null);
      setShowManualSegmentation(false);
      return;
    }

    setFile(selectedFile);
    setSegmentationResult(null);
    setShowSegmentationChoice(true);
    setSegmentationMode(null);
  };

  const handleSegmentationChoice = (mode: "manual" | "ai"): void => {
    setSegmentationMode(mode);
    setShowSegmentationChoice(false);
    
    if (mode === "manual") {
      setShowManualSegmentation(true);
    } else {
      startAISegmentation();
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

      const taskId = response.data.task_id;

      // Poll for task completion with longer timeout
      let taskComplete = false;
      let attempts = 0;
      const maxAttempts = 120;
      const pollingInterval = 3000;

      while (!taskComplete && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollingInterval));

        try {
          // Check task status with timeout
          const statusResponse = await axios.get(`${API_URL}/tasks/${taskId}/`, {
            timeout: 10000 // 10 seconds timeout for status checks
          });

          if (statusResponse.data.status === "completed") {
            taskComplete = true;

            // Get the URLs for both segmentations
            const tumorSegUrl = statusResponse.data.tumor_segmentation_url;
            const lungSegUrl = statusResponse.data.lung_segmentation_url;
            const originalNiftiUrl = statusResponse.data.nifti_file_url;

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
          }
        } catch (pollError) {
          console.error("Error during polling:", pollError);
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
    startAISegmentation();
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
    setShowManualSegmentationPreview
  };
}