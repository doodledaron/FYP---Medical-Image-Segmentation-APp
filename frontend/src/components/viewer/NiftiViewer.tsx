// src/components/viewer/NiftiViewer.tsx
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
  const [loadingStatus, setLoadingStatus] = useState<string>("idle");
  const [showSegmentation, setShowSegmentation] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [segUrl, setSegUrl] = useState<string | null>(null);

  // Load segmentation file from API when available
  useEffect(() => {
    const fetchSegmentation = async () => {
      if (segmentationResult?.resultUrl) {
        try {
          setLoadingStatus("loading-segmentation");
          console.log("Segmentation result data:", segmentationResult);
          console.log("Fetching segmentation from URL:", segmentationResult.resultUrl);

          // FIXED: Removed the strict NIFTI extension check that was causing problems
          if (!segmentationResult.resultUrl.includes('.gz')) {
            console.warn("Segmentation result URL might not be a compressed file:", segmentationResult.resultUrl);
            // Continue anyway as it might still work
          }

          const response = await axios.get(segmentationResult.resultUrl, {
            responseType: 'blob',
          });

          if (!response.data || response.data.size === 0) {
            console.error("Segmentation file fetch returned empty data.");
            setLoadingStatus("segmentation-empty");
            return;
          }

          console.log("Segmentation file fetch response:", response);
          console.log("Response content type:", response.headers['content-type']);
          console.log("Blob size:", response.data.size, "bytes");

          // Create a File object from the blob with correct MIME type
          const segFile = new File([response.data], 'segmentation.nii.gz', {
            type: 'application/gzip',
          });

          console.log("Segmentation file created:", segFile);
          setSegmentationFile(segFile);
          setLoadingStatus("segmentation-loaded");
        } catch (error) {
          console.error('Error fetching segmentation file:', error);
          setLoadingStatus("segmentation-error");
        }
      } else {
        console.warn("No segmentationResult.resultUrl provided:", segmentationResult);
        setLoadingStatus("no-segmentation-url");
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

  // Create object URLs for files only once
  useEffect(() => {
    if (file) {
      const createFileUrl = async () => {
        let fileBlob = file;
        if (!file.name.endsWith(".gz")) {
          console.log("File not compressed, compressing...");
          const compressedBlob = await compressNifti(file);
          fileBlob = new File([compressedBlob], `${file.name}.gz`, {
            type: "application/gzip",
            lastModified: Date.now(),
          });
        }
        const url = URL.createObjectURL(fileBlob);
        setFileUrl(url);
        console.log("File URL created for original file:", url);
      };
      createFileUrl();
    }

    if (segmentationFile) {
      const url = URL.createObjectURL(segmentationFile);
      setSegUrl(url);
      console.log("Segmentation file URL created:", url);
    }

    // Cleanup URLs when component unmounts
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      if (segUrl) {
        URL.revokeObjectURL(segUrl);
      }
    };
  }, [file, segmentationFile]);

  // Load the NIFTI file into the viewer
  useEffect(() => {
    const loadNifti = async () => {
      console.log("Loading NIFTI file into viewer with view type:", view);
      console.log("Show segmentation:", showSegmentation);
      setLoadingStatus("loading-viewer");

      const canvas = document.getElementById("niivue-canvas") as HTMLCanvasElement;
      if (!canvas) {
        console.error("Canvas not found!");
        setLoadingStatus("canvas-error");
        return;
      }

      // Cleanup previous Niivue instance if it exists
      if (niivueRef.current) {
        niivueRef.current.closeDrawing();
        niivueRef.current = null;
      }

      // Create new Niivue instance
      niivueRef.current = new Niivue();
      niivueRef.current.attachToCanvas(canvas);
      niivueRef.current.setSliceType(view);

      if (!fileUrl) {
        console.error("No file URL available!");
        setLoadingStatus("no-file-error");
        return;
      }

      // Prepare volumes for the viewer
      let volumes: NiivueVolume[] = [];

      // Always add the main volume (original file)
      volumes.push({
        url: fileUrl,
        name: file.name,
      });

      // Add segmentation overlay if available and visible
      if (segUrl && showSegmentation) {
        volumes.push({
          url: segUrl,
          name: 'segmentation.nii.gz',
          // Using 'red' colormap as requested
          colormap: 'red',
          opacity: 0.7,
          visible: true,
        });
      }

      // Load volumes into the viewer
      console.log("Loading volumes into Niivue:", volumes);
      try {
        if (volumes.length > 0) {
          await niivueRef.current.loadVolumes(volumes);
          setLoadingStatus("volumes-loaded");
          console.log("Volumes loaded successfully");
        } else {
          console.error("No volumes to load!");
          setLoadingStatus("no-volumes-error");
        }
      } catch (error) {
        console.error("Error loading volumes:", error);
        setLoadingStatus("loading-volumes-error");
      }
    };

    // Only load if we have the original file
    if (file && fileUrl) {
      loadNifti();
    }
  }, [file, fileUrl, segUrl, view, showSegmentation]);



  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-100">
      <h2 className="text-lg font-semibold text-blue-900 mb-2">2D NIFTI Viewer</h2>
      <p className="text-gray-600 text-sm mb-2">Hint: Use mouse scroll to navigate slices</p>

      {/* Debug info with more detailed information */}
      <div className="mb-4 text-xs bg-blue-50 p-2 rounded">
        <p>Loading status: {loadingStatus}</p>
        <p>Original file: {file?.name}</p>
        <p>Segmentation file: {segmentationFile ? 'Loaded' : 'Not loaded'}</p>
        <p>Segmentation visible: {showSegmentation ? 'Yes' : 'No'}</p>
        {segmentationResult?.resultUrl && (
          <p>Result URL: {segmentationResult.resultUrl}</p>
        )}
        {loadingStatus === "segmentation-error" && (
          <p className="text-red-600">Error loading segmentation overlay. Check console for details.</p>
        )}
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setView(SLICE_TYPE.AXIAL)}
          className={`px-4 py-2 ${view === SLICE_TYPE.AXIAL ? 'bg-blue-800' : 'bg-blue-600'} text-white rounded-lg`}
        >
          Axial View
        </button>
        <button
          onClick={() => setView(SLICE_TYPE.CORONAL)}
          className={`px-4 py-2 ${view === SLICE_TYPE.CORONAL ? 'bg-blue-800' : 'bg-blue-600'} text-white rounded-lg`}
        >
          Coronal View
        </button>
        <button
          onClick={() => setView(SLICE_TYPE.SAGITTAL)}
          className={`px-4 py-2 ${view === SLICE_TYPE.SAGITTAL ? 'bg-blue-800' : 'bg-blue-600'} text-white rounded-lg`}
        >
          Sagittal View
        </button>
      </div>

      {segmentationFile && (
        <div className="bg-green-50 border border-green-100 p-2 rounded mb-4">
          <p className="text-green-700 text-sm">
            ✓ Segmentation overlay loaded successfully
            {!showSegmentation && " (currently hidden)"}
          </p>
        </div>
      )}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => setShowSegmentation(prev => !prev)}
          className={`px-4 py-2 ${showSegmentation ? 'bg-indigo-600' : 'bg-gray-500'} text-white rounded-lg`}
        >
          {showSegmentation ? "Hide Segmentation" : "Show Segmentation"}
        </button>
      </div>

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