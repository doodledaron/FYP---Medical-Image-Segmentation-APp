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

  const handleFileSelect = async (selectedFile: File | null): Promise<void> => {
    // Handle clearing the file
    if (!selectedFile) {
      setFile(null);
      setSegmentationResult(null);
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setSegmentationResult(null);

    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("nifti_file", selectedFile);

      // Log the file being uploaded
      console.log("Uploading file:", selectedFile.name, "Size:", selectedFile.size);

      // Send the file to the Django API with increased timeout
      const response = await axios.post(`${API_URL}/tasks/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds timeout for the initial upload
      });

      console.log("Task created:", response.data);
      const taskId = response.data.task_id;

      // Poll for task completion with longer timeout
      let taskComplete = false;
      let attempts = 0;
      const maxAttempts = 120; // Increased from 30 to 60 attempts
      const pollingInterval = 3000; // Increased from 2 seconds to 3 seconds

      console.log("Starting to poll for task completion...");
      
      while (!taskComplete && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        try {
          // Check task status with timeout
          const statusResponse = await axios.get(`${API_URL}/tasks/${taskId}/status/`, {
            timeout: 10000 // 10 seconds timeout for status checks
          });
          
          console.log(`Poll attempt ${attempts}:`, statusResponse.data);
          
          if (statusResponse.data.status === "completed") {
            taskComplete = true;
            
            // Validate the result URL
            const resultUrl = statusResponse.data.result_file;
            console.log("Received result URL:", resultUrl);
            
            // Check if URL is valid and points to a NIFTI file
            const isValidNiftiUrl = resultUrl && 
              (resultUrl.endsWith('.nii') || resultUrl.endsWith('.nii.gz')) &&
              (resultUrl.startsWith('http://') || resultUrl.startsWith('https://') || resultUrl.startsWith('/media/'));
            
            if (!isValidNiftiUrl) {
              console.warn("Warning: Result URL may not be a valid NIFTI file URL:", resultUrl);
            } else {
              console.log("Result URL is a valid NIFTI file URL.");
            }
            
            // Create a result object with the data needed by your viewers
            setSegmentationResult({
              success: true,
              resultUrl: resultUrl,
              metrics: {
                lungVolume: statusResponse.data.lung_volume,
                lesionVolume: statusResponse.data.lesion_volume,
                lesionCount: statusResponse.data.lesion_count,
                confidenceScore: statusResponse.data.confidence_score
              }
            });
            
            console.log("Task completed successfully!");
          } else if (statusResponse.data.status === "failed") {
            throw new Error(statusResponse.data.error || "Processing failed");
          } else {
            console.log(`Task still processing (${statusResponse.data.status}), polling again...`);
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
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return { 
    file, 
    loading, 
    segmentationResult, 
    show3D, 
    setShow3D, 
    handleFileSelect 
  };
}