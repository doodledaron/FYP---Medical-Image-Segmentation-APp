// src/components/viewer/NiftiViewer.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Niivue } from '@niivue/niivue';
import { SegmentationResult } from '../../types';
import { Layers, Columns, AlignJustify, LayoutTemplate, Loader2, Eye, EyeOff, Activity } from 'lucide-react';
// Import pako without ts-ignore and use the correct methods
import pako from "pako";
import axios from "axios";
import { ManualSegmentationViewer, ViewType } from './ManualSegmentationViewer';

interface NiftiViewerProps {
  file: File;
  segmentationResult: SegmentationResult;
  manualSegmentationScreenshot?: string | null;
  manualSegmentationData?: {
    segmentationMask: Uint8Array[];
    dimensions: [number, number, number];
    originalImageData?: Float32Array;
    windowWidth?: number;
    windowCenter?: number;
    viewType?: ViewType;
    flipped?: boolean;
  } | null;
  showManualSegmentationPreview?: boolean;
  setShowManualSegmentationPreview?: (show: boolean) => void;
}

const NiftiViewer: React.FC<NiftiViewerProps> = ({
  file,
  segmentationResult,
  manualSegmentationScreenshot = null,
  manualSegmentationData = null,
  showManualSegmentationPreview = false,
  setShowManualSegmentationPreview = () => { }
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nvRef = useRef<Niivue | null>(null);
  const [sliceView, setSliceView] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSegmentation, setShowSegmentation] = useState(true);
  const [showLungSegmentation, setShowLungSegmentation] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [segUrl, setSegUrl] = useState<string | null>(null);
  const [lungSegUrl, setLungSegUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!nvRef.current) {
      nvRef.current = new Niivue({
        backColor: [0.2, 0.2, 0.2, 1],
        show3Dcrosshair: true,
      });
      nvRef.current.attachToCanvas(canvasRef.current);
    }

    const loadData = async () => {
      setIsLoading(true);

      const nv = nvRef.current;
      if (!nv) {
        setIsLoading(false);
        return;
      }

      // Skip if segmentationResult is null or doesn't have required URLs
      if (!segmentationResult || !segmentationResult.success) {
        console.log('Skipping NiftiViewer load: segmentationResult not ready or failed');
        setIsLoading(false);
        return;
      }

      const { originalFileUrl, tumorSegmentationUrl, lungSegmentationUrl } = segmentationResult;

      if (!originalFileUrl || !tumorSegmentationUrl) {
        console.error('Missing required URLs for viewer');
        setIsLoading(false);
        return;
      }

      if (showLungSegmentation && !lungSegmentationUrl) {
        console.error('Lung segmentation URL not available');
        setIsLoading(false);
        return;
      }

      try {
        // Set slice type based on user selection
        switch (sliceView) {
          case 'axial':
            nv.setSliceType(nv.sliceTypeAxial);
            break;
          case 'coronal':
            nv.setSliceType(nv.sliceTypeCoronal);
            break;
          case 'sagittal':
            nv.setSliceType(nv.sliceTypeSagittal);
            break;
          default:
            nv.setSliceType(nv.sliceTypeAxial);
        }

        // Reset volumes to clear previous state
        nv.volumes = [];

        // Load the original scan as base
        await nv.loadVolumes([{
          url: originalFileUrl,
          colormap: 'gray'
        }]);

        // Add tumor segmentation as overlay
        await nv.addVolumeFromUrl({
          url: tumorSegmentationUrl,
          colormap: 'red',
          opacity: 1.0
        });

        // Add lung segmentation if enabled
        if (showLungSegmentation && lungSegmentationUrl) {
          await nv.addVolumeFromUrl({
            url: lungSegmentationUrl,
            colormap: 'blue',
            opacity: 0.4
          });
        }

        // Set opacity for body scan
        nv.setOpacity(0, 1.0);
        nv.setInterpolation(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading NIFTI data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [segmentationResult, sliceView, showLungSegmentation]);

  // Compress NIFTI file into gzip format if it's not already
  const compressNifti = async (file: File) => {
    console.log("Compressing NIFTI file:", file);
    const reader = new FileReader();
    return new Promise<Blob>((resolve, reject) => {
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          const compressedData = pako.deflate(new Uint8Array(event.target.result));
          console.log("File compressed successfully.");
          resolve(new Blob([compressedData], { type: "application/gzip" }));
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Function to fetch and compress a remote file
  const fetchAndCompressRemoteFile = async (url: string, filename: string) => {
    try {
      console.log(`Fetching remote file from ${url}`);
      
      // Check if the URL starts with http or https
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.log("Using relative URL path:", url);
        // For mock data, assume files are in public directory
        if (url.startsWith('/')) {
          // This is a relative URL path - no need to compress, 
          // as we assume these files are properly formatted in the public directory
          console.log("Using public directory file:", url);
          return url;
        }
      }
      
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const fileData = response.data;

      // Check if file is already compressed
      if (url.endsWith('.gz')) {
        console.log("Remote file is already compressed");
        const blob = new Blob([fileData], { type: "application/gzip" });
        return URL.createObjectURL(blob);
      } else {
        console.log("Compressing remote file");
        const compressedData = pako.deflate(new Uint8Array(fileData));
        const compressedBlob = new Blob([compressedData], { type: "application/gzip" });
        return URL.createObjectURL(compressedBlob);
      }
    } catch (error) {
      console.error("Error fetching or compressing remote file:", error);
      
      // Extra logging to diagnose the issue
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Error response:", error.response.status, error.response.statusText);
        } else if (error.request) {
          console.error("No response received. Check if the URL is accessible:", url);
        } else {
          console.error("Error setting up request:", error.message);
        }
      }
      
      // For mock data or local files that might fail with Axios, return the URL directly
      return url; // Fall back to original URL on error
    }
  };

  // Create object URLs for files only once
  useEffect(() => {
    // Handle original file
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

    // Handle tumor segmentation file if URL is available
    if (segmentationResult?.tumorSegmentationUrl && !segUrl) {
      const createSegUrl = async () => {
        const url = await fetchAndCompressRemoteFile(
          segmentationResult.tumorSegmentationUrl,
          "tumor_segmentation.nii.gz"
        );
        setSegUrl(url);
        console.log("URL created for tumor segmentation file:", url);
      };
      createSegUrl();
    }

    // Handle lung segmentation file if URL is available
    if (segmentationResult?.lungSegmentationUrl && !lungSegUrl) {
      const createLungSegUrl = async () => {
        const url = await fetchAndCompressRemoteFile(
          segmentationResult.lungSegmentationUrl,
          "lung_segmentation.nii.gz"
        );
        setLungSegUrl(url);
        console.log("URL created for lung segmentation file:", url);
      };
      createLungSegUrl();
    }

    // Cleanup URLs when component unmounts
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      if (segUrl) {
        URL.revokeObjectURL(segUrl);
      }
      if (lungSegUrl) {
        URL.revokeObjectURL(lungSegUrl);
      }
    };
  }, [file, segmentationResult]);

  // Check if we have either a screenshot or full segmentation data
  const hasManualSegmentation = manualSegmentationScreenshot || manualSegmentationData;

  // Function to toggle lung segmentation
  const toggleLungSegmentation = () => {
    setShowLungSegmentation(!showLungSegmentation);
  };

  return (
    <div className="w-full">
      {/* Main content area - flex layout for side-by-side display */}
      <div className={`flex ${showManualSegmentationPreview ? 'flex-row gap-4' : 'flex-col'}`}>
        {/* NiftiViewer canvas container - adjusted width when side-by-side */}
        <div className={`relative ${showManualSegmentationPreview ? 'w-1/2' : 'w-full'} h-[calc(100vh-150px)] min-h-[700px]`}>
          {/* Controls Bar - top right, modern style */}
          <div className="absolute top-4 right-4 z-10">

            
            {/* Control Buttons */}
            <div className="flex bg-white rounded-full shadow-sm p-1">
              {/* Manual Segmentation Preview Toggle - only show if we have manual segmentation data */}
              {hasManualSegmentation && (
                <button
                  onClick={() => setShowManualSegmentationPreview(!showManualSegmentationPreview)}
                  className={`
                    flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                    ${showManualSegmentationPreview
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  title={showManualSegmentationPreview ? "Hide Manual Segmentation" : "Show Manual Segmentation"}
                >
                  {showManualSegmentationPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="text-sm whitespace-nowrap">
                    {showManualSegmentationPreview ? "Hide Manual Segmentation" : "View Manual Segmentation"}
                  </span>
                </button>
              )}

              {/* Lung Segmentation Toggle */}
              {segmentationResult?.lungSegmentationUrl && (
                <button
                  onClick={toggleLungSegmentation}
                  disabled={isLoading}
                  className={`
                    flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                    ${showLungSegmentation
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={showLungSegmentation ? "Hide Lung Segmentation" : "Show Lung Segmentation"}
                >
                  <Activity size={16} />
                  <span className="text-sm whitespace-nowrap">
                    {showLungSegmentation ? "Hide Lung" : "View Lung"}
                  </span>
                </button>
              )}
            </div>
            
            {/* View Controls */}
            <div className="mt-3 flex bg-white rounded-full shadow-sm p-1">
              <button
                onClick={() => setSliceView('axial')}
                disabled={isLoading}
                className={`
                  flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                  ${sliceView === 'axial'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="Axial View"
              >
                <AlignJustify size={16} />
                <span className="text-sm whitespace-nowrap">Axial View</span>
              </button>
              <button
                onClick={() => setSliceView('coronal')}
                disabled={isLoading}
                className={`
                  flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                  ${sliceView === 'coronal'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="Coronal View"
              >
                <Columns size={16} />
                <span className="text-sm whitespace-nowrap">Coronal View</span>
              </button>
              <button
                onClick={() => setSliceView('sagittal')}
                disabled={isLoading}
                className={`
                  flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                  ${sliceView === 'sagittal'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="Sagittal View"
              >
                <LayoutTemplate size={16} />
                <span className="text-sm whitespace-nowrap">Sagittal View</span>
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width="800"
            height="600"
            className="w-full h-full rounded-lg"
          ></canvas>

          {/* Loading overlay - modernized */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <div className="text-gray-800 text-sm font-medium">Loading view...</div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Segmentation Preview - Side panel */}
        {showManualSegmentationPreview && (
          <div className="w-1/2 h-[calc(100vh-150px)] min-h-[700px] rounded-lg shadow-sm bg-white overflow-hidden">
            {manualSegmentationData ? (
              /* If we have full segmentation data, use the interactive viewer */
              <ManualSegmentationViewer
                segmentationMask={manualSegmentationData.segmentationMask}
                dimensions={manualSegmentationData.dimensions}
                originalImageData={manualSegmentationData.originalImageData}
                windowWidth={manualSegmentationData.windowWidth}
                windowCenter={manualSegmentationData.windowCenter}
                initialViewType={manualSegmentationData.viewType}
                flipped={manualSegmentationData.flipped}
              />
            ) : manualSegmentationScreenshot ? (
              /* Fallback to screenshot if we only have that */
              <>
                <div className="bg-white border-b border-gray-100 text-gray-900 p-3 text-center font-medium">
                  Manual Segmentation
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden">
                  <div className="relative max-w-full max-h-full p-2">
                    <img
                      src={manualSegmentationScreenshot}
                      alt="Manual Segmentation"
                      className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded shadow-sm"
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default NiftiViewer;