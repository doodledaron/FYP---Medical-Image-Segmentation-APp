import { useState } from "react";
import { SegmentationResult } from "../../types";

export function useFileProcessing() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [segmentationResult, setSegmentationResult] = useState<SegmentationResult | null>(null);
  const [show3D, setShow3D] = useState<boolean>(false);

  const handleFileSelect = async (selectedFile: File): Promise<void> => {
    setFile(selectedFile);
    setLoading(true);

    try {
      // Simulated processing time - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSegmentationResult({ success: true });
    } catch (error) {
      console.error("Error processing file:", error);
      setSegmentationResult({ success: false, error: "Failed to process file" });
    } finally {
      setLoading(false);
    }
  };

  return { file, loading, segmentationResult, show3D, setShow3D, handleFileSelect };
}
