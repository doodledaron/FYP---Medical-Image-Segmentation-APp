import { useEffect, useRef, useState } from "react";
import { Niivue, SLICE_TYPE } from "@niivue/niivue";
import { SegmentationResult } from "../../types";
// @ts-ignore
import * as pako from "pako";
import axios from "axios";

interface NiftiViewerProps {
  file: File;
  segmentationResult: SegmentationResult;
}

// Define interface for Niivue volume objects
interface NiivueVolume {
  url: string;
  name: string;
  colormap?: string;
  opacity?: number;
  visible?: boolean;
}

const NiftiViewer: React.FC<NiftiViewerProps> = ({ file, segmentationResult }) => {
  const niivueRef = useRef<Niivue | null>(null);
  const [view, setView] = useState(SLICE_TYPE.CORONAL);
  const [segmentationFile, setSegmentationFile] = useState<File | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);

  // Load segmentation file from API when available
  useEffect(() => {
    const fetchSegmentation = async () => {
      if (segmentationResult?.resultUrl) {
        console.log("Fetching segmentation from URL:", segmentationResult.resultUrl);
        try {
          const response = await axios.get(segmentationResult.resultUrl, {
            responseType: 'blob',
          });

          console.log("Segmentation file received:", response);

          // Create a File object from the blob
          const segFile = new File([response.data], 'segmentation.nii.gz', {
            type: 'application/gzip',
          });

          console.log("Segmentation file created:", segFile);

          setSegmentationFile(segFile);
          
          // Also use this as the main file to display (instead of the original upload)
          setProcessedFile(segFile);
        } catch (error) {
          console.error('Error fetching segmentation file:', error);
        }
      }
    };

    fetchSegmentation();
  }, [segmentationResult]);

  // Compress NIFTI file into gzip format if it's not already
  const compressNifti = async (file: File) => {
    console.log("Compressing NIFTI file:", file);
    const reader = new FileReader();
    return new Promise<Blob>((resolve, reject) => {
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          const compressedData = pako.gzip(new Uint8Array(event.target.result));
          console.log("File compressed successfully.");
          resolve(new Blob([compressedData], { type: "application/gzip" }));
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Load the NIFTI file into the viewer
  useEffect(() => {
    const loadNifti = async () => {
      console.log("Loading NIFTI file into viewer...");

      const canvas = document.getElementById("niivue-canvas") as HTMLCanvasElement;
      if (!canvas) {
        console.error("Canvas not found!");
        return;
      }

      // Attach Niivue to the canvas
      niivueRef.current = new Niivue();
      niivueRef.current.attachToCanvas(canvas);
      niivueRef.current.setSliceType(view);

      // Use the processed file if available, otherwise use the original file
      const fileToDisplay = processedFile || file;
      console.log("File to display:", fileToDisplay?.name);
      
      // Compress file if necessary
      let fileBlob = fileToDisplay;
      if (fileToDisplay && !fileToDisplay.name.endsWith(".gz")) {
        console.log("File not compressed, compressing...");
        const compressedBlob = await compressNifti(fileToDisplay);
        fileBlob = new File([compressedBlob], `${fileToDisplay.name}.gz`, {
          type: "application/gzip",
          lastModified: Date.now(),
        });
      }

      if (!fileBlob) {
        console.error("No file to display!");
        return;
      }

      const fileUrl = URL.createObjectURL(fileBlob);
      console.log("File URL created:", fileUrl);

      // Prepare volumes for the viewer
      let volumes: NiivueVolume[] = [];
      
      // Only add the main volume if we're using the original file
      // (if we're using the processed file, it's the same as the segmentation file)
      if (fileToDisplay !== segmentationFile) {
        volumes.push({
          url: fileUrl,
          name: fileToDisplay.name.endsWith(".gz") ? fileToDisplay.name : `${fileToDisplay.name}.gz`,
        });
      }

      // Add segmentation overlay if available
      if (segmentationFile) {
        const segUrl = URL.createObjectURL(segmentationFile);
        console.log("Segmentation file URL created:", segUrl);
        volumes.push({
          url: segUrl,
          name: 'segmentation.nii.gz',
          colormap: 'overlay',  // Use the overlay colormap for segmentation
          opacity: 0.7,         // Set opacity for segmentation overlay
          visible: true,
        });
      }

      // Load volumes into the viewer
      console.log("Loading volumes into Niivue:", volumes);
      if (volumes.length > 0) {
        niivueRef.current.loadVolumes(volumes);
      } else {
        console.error("No volumes to load!");
      }
    };

    // Only load if we have either the original file or the processed file
    if (file || processedFile) {
      loadNifti();
    }

    // Cleanup the Niivue instance and revoke object URLs on unmount
    return () => {
      if (niivueRef.current) {
        niivueRef.current.closeDrawing();
        niivueRef.current = null;
      }

      // Revoke object URLs to free up memory
      if (file) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
      if (segmentationFile) {
        URL.revokeObjectURL(URL.createObjectURL(segmentationFile));
      }
      if (processedFile && processedFile !== segmentationFile) {
        URL.revokeObjectURL(URL.createObjectURL(processedFile));
      }
    };
  }, [file, segmentationFile, processedFile, view]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-100">
      <h2 className="text-lg font-semibold text-blue-900 mb-2">2D NIFTI Viewer</h2>
      <p className="text-gray-600 text-sm mb-2">Hint: Use mouse scroll to navigate slices</p>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setView(SLICE_TYPE.AXIAL)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Axial View
        </button>
        <button
          onClick={() => setView(SLICE_TYPE.CORONAL)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Coronal View
        </button>
        <button
          onClick={() => setView(SLICE_TYPE.SAGITTAL)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Sagittal View
        </button>
      </div>
      {segmentationFile && (
        <div className="bg-green-50 border border-green-100 p-2 rounded mb-4">
          <p className="text-green-700 text-sm">✓ Segmentation overlay loaded successfully</p>
        </div>
      )}
      <canvas
        id="niivue-canvas"
        width="800"
        height="600"
        className="w-full h-auto border border-gray-300"
      ></canvas>
    </div>
  );
};

export default NiftiViewer;
