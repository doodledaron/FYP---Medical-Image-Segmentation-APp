// src/components/viewer/NiftiViewer.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Niivue } from '@niivue/niivue';
import { SegmentationResult } from '../../types';
import { Layers, Columns, AlignJustify, LayoutTemplate, Loader2, Eye, EyeOff, Activity } from 'lucide-react';
// Import pako without ts-ignore and use the correct methods
import pako from "pako";
import axios from "axios";
import { ManualSegmentationViewer } from './ManualSegmentationViewer';

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
          {/* Control panel - Top right */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            {/* Manual Segmentation Preview Toggle - only show if we have manual segmentation data */}
            {hasManualSegmentation && (
              <div className="bg-black/30 p-2 rounded-lg">
                <div className="text-xs text-white font-semibold mb-1">Manual Segmentation</div>
                <button
                  onClick={() => setShowManualSegmentationPreview(!showManualSegmentationPreview)}
                  className={`
                    flex items-center gap-1 text-xs py-1 px-2 rounded-md transition-colors
                    ${showManualSegmentationPreview
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                    }
                  `}
                >
                  {showManualSegmentationPreview ? (
                    <>
                      <EyeOff size={14} />
                      Hide Manual
                    </>
                  ) : (
                    <>
                      <Eye size={14} />
                      Show Manual
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Segmentation Type Toggle */}
            {segmentationResult?.lungSegmentationUrl && (
              <div className="bg-black/30 p-2 rounded-lg">
                <div className="text-xs text-white font-semibold mb-1">Segmentation</div>
                <button
                  onClick={toggleLungSegmentation}
                  disabled={isLoading}
                  className={`
                    flex items-center gap-1 text-xs py-1 px-2 rounded-md transition-colors mb-2
                    ${showLungSegmentation
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Activity size={14} />
                  {showLungSegmentation ? 'Hide Lung' : 'Show Lung'}
                </button>
              </div>
            )}

            {/* Slice view toggle */}
            <div className="bg-black/30 p-2 rounded-lg">
              <div className="text-xs text-white font-semibold mb-1">Slice View</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSliceView('axial')}
                  disabled={isLoading}
                  className={`
                    flex items-center gap-1 text-xs py-1 px-2 rounded-md transition-colors
                    ${sliceView === 'axial'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <AlignJustify size={14} />
                  Axial
                </button>
                <button
                  onClick={() => setSliceView('coronal')}
                  disabled={isLoading}
                  className={`
                    flex items-center gap-1 text-xs py-1 px-2 rounded-md transition-colors
                    ${sliceView === 'coronal'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Columns size={14} />
                  Coronal
                </button>
                <button
                  onClick={() => setSliceView('sagittal')}
                  disabled={isLoading}
                  className={`
                    flex items-center gap-1 text-xs py-1 px-2 rounded-md transition-colors
                    ${sliceView === 'sagittal'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <LayoutTemplate size={14} />
                  Sagittal
                </button>
              </div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width="800"
            height="600"
            className="w-full h-full rounded-lg"
          ></canvas>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                <div className="text-white text-sm font-medium">Loading view...</div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Segmentation Preview - Side panel */}
        {showManualSegmentationPreview && (
          <div className="w-1/2 h-[calc(100vh-150px)] min-h-[700px] rounded-lg border border-blue-200 flex flex-col">
            {manualSegmentationData ? (
              /* If we have full segmentation data, use the interactive viewer */
              <ManualSegmentationViewer
                segmentationMask={manualSegmentationData.segmentationMask}
                dimensions={manualSegmentationData.dimensions}
                originalImageData={manualSegmentationData.originalImageData}
                windowWidth={manualSegmentationData.windowWidth}
                windowCenter={manualSegmentationData.windowCenter}
              />
            ) : manualSegmentationScreenshot ? (
              /* Fallback to screenshot if we only have that */
              <>
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3 text-center font-medium rounded-t-lg">
                  Manual Segmentation Preview
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-b-lg overflow-hidden">
                  <div className="relative max-w-full max-h-full p-2">
                    <img
                      src={manualSegmentationScreenshot}
                      alt="Manual Segmentation"
                      className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded shadow-lg"
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