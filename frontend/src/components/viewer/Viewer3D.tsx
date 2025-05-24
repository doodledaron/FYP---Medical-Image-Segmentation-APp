import React, { useEffect, useRef, useState } from 'react'; // Import useState
import { SegmentationResult } from '../../types';
import { Niivue, SLICE_TYPE } from '@niivue/niivue';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons
import { ManualSegmentationViewer, ViewType } from './ManualSegmentationViewer';

interface Viewer3DProps {
  segmentationData: SegmentationResult;
  reloadKey: number;
  colormapKey: string;
  showBody?: boolean; // Show body scan
  showLung?: boolean; // Show lung segmentation
  showTumour?: boolean; // Show tumor segmentation
  manualSegmentationScreenshot?: string | null; // For backward compatibility
  manualSegmentationData?: {
    segmentationMask: Uint8Array[];
    dimensions: [number, number, number];
    originalImageData?: Float32Array;
    windowWidth?: number;
    windowCenter?: number;
    viewType?: ViewType; // Add viewType to support remembering the view
    flipped?: boolean; // Add flipped state
  } | null;
  showManualSegmentationPreview?: boolean;
  setShowManualSegmentationPreview?: (show: boolean) => void;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  segmentationData,
  reloadKey,
  colormapKey,
  showBody = true,
  showLung = false,
  showTumour = true,
  manualSegmentationScreenshot = null,
  manualSegmentationData = null,
  showManualSegmentationPreview = false,
  setShowManualSegmentationPreview = () => {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nvRef     = useRef<Niivue | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  // Check if no components are selected
  const noComponentsSelected = !showBody && !showLung && !showTumour;
  
  // Effect to handle initialization and cleanup of Niivue
  useEffect(() => {
    // If all components are deselected, we should clean up the Niivue instance
    if (noComponentsSelected) {
      // If we had a Niivue instance, we need to clean it up properly
      if (nvRef.current) {
        // Clean up any event listeners or resources if needed
        console.log('Cleaning up Niivue instance due to no components selected');
        nvRef.current = null; // Reset the instance so it will be reinitialized when needed
      }
      return;
    }
    
    return () => {
      // Cleanup function if needed
    };
  }, [noComponentsSelected]);

  // Effect to load and render volumes
  useEffect(() => {
    // Skip processing if no components are selected
    if (noComponentsSelected) return;
    
    // Skip if no canvas is available
    if (!canvasRef.current) return;

    setIsLoading(true); // Start loading

    const loadData = async () => {
      // Initialize Niivue if needed
      if (!nvRef.current) {
        console.log('Initializing new Niivue instance');
        nvRef.current = new Niivue({
          backColor: [0, 0, 0, 1],
          show3Dcrosshair: true,
          loadingText: 'Loading...',
          // Use standard options compatible with your version
        });
        
        // Attach to canvas - add null check to satisfy TypeScript
        if (canvasRef.current) {
          nvRef.current.attachToCanvas(canvasRef.current);
        } else {
          console.error('Canvas reference not available');
          setIsLoading(false);
          return;
        }
      }
      
      const nv = nvRef.current;
      const { originalFileUrl, tumorSegmentationUrl, lungSegmentationUrl } = segmentationData;
      
      // Debug logs for URLs
      console.log('Loading files from these URLs:', {
        originalFileUrl,
        tumorSegmentationUrl,
        lungSegmentationUrl
      });
      
      // Check for required URLs
      if (!originalFileUrl) {
        setIsLoading(false);
        console.error('Missing original file URL');
        return;
      }
      
      if (showTumour && !tumorSegmentationUrl) {
        setIsLoading(false);
        console.error('Missing tumor segmentation URL');
        return;
      }

      if (showLung && !lungSegmentationUrl) {
        setIsLoading(false);
        console.error('Missing lung segmentation URL');
        return;
      }

      // Prepare volumes array
      const volumes = [];
      
      // Change loading order - load original body scan first as the reference volume
      if (showBody) {
        volumes.push({
          url: originalFileUrl,
          colormap: colormapKey,
          opacity: colormapKey === 'ct_soft' ? 1.0 : 
                   colormapKey === 'ct_bones' ? 0.8 : 
                   (showLung && showTumour ? 0.5 : showLung ? 0.6 : 1.0),
          visible: true,
        });
      }
      
      // Add tumor segmentation with explicit reference to original volume for alignment
      if (showTumour && tumorSegmentationUrl) {
        volumes.push({
          url: tumorSegmentationUrl,
          colormap: 'red',
          opacity: 1.0,
          visible: true,
        });
      }
      
      // Add lung segmentation last to ensure it's properly aligned to the reference volume
      if (showLung && lungSegmentationUrl) {
        volumes.push({
          url: lungSegmentationUrl,
          colormap: 'copper',
          opacity: 0.04,
          visible: true,
        });
      }
      
      // Only proceed if we have at least one volume to display
      if (volumes.length === 0) {
        setIsLoading(false);
        console.error('No volumes to display');
        return;
      }

      try {
        // Clear + reload with new volumes
        console.log('Loading volumes:', volumes);
        await nv.loadVolumes(volumes);
        
        // Set display properties
        nv.setSliceType(SLICE_TYPE.RENDER);
        
        // Force redraw to ensure alignment
        nv.drawScene();
        setIsLoading(false); // Stop loading on success
      } catch (err) {
        console.error('Viewer3D load error:', err);
        setIsLoading(false); // Stop loading on error
        
        // Add a retry mechanism - if the error includes "Failed to fetch", try again
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error')) {
          console.log('Network error loading files, please make sure they are accessible at the specified paths');
        }
      }
    };
    
    loadData();
  }, [segmentationData, reloadKey, colormapKey, showBody, showLung, showTumour, noComponentsSelected]);

  // Check if we have either a screenshot or full segmentation data
  const hasManualSegmentation = manualSegmentationScreenshot || manualSegmentationData;

  return (
    <div className="w-full">
      {/* Main content area - flex layout for side-by-side display */}
      <div className={`flex ${showManualSegmentationPreview ? 'flex-row gap-4' : 'flex-col'}`}>
        {/* 3D Viewer container - adjusted width when side-by-side */}
        <div className={`relative ${showManualSegmentationPreview ? 'w-1/2' : 'w-full'} h-[600px] bg-gray-50 rounded-lg overflow-hidden`}>
          {/* Controls Bar - top right */}
          <div className="absolute top-4 right-4 z-10">
            
            {/* Manual Segmentation Preview Toggle - only show if we have manual segmentation data */}
            {hasManualSegmentation && (
              <div className="flex bg-white rounded-full shadow-sm p-1">
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
              </div>
            )}
          </div>
            
          {/* Always render the canvas to maintain its DOM presence, but conditionally show content */}
          <canvas 
            ref={canvasRef} 
            className="w-full h-full" 
            style={{ display: noComponentsSelected ? 'none' : 'block' }}
          />
          
          {/* No components selected message */}
          {noComponentsSelected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="bg-white shadow-sm p-6 rounded-2xl flex flex-col items-center gap-4 max-w-md text-center">
                <AlertCircle className="h-12 w-12 text-gray-400" />
                <h3 className="text-xl font-medium text-gray-900">No Components Selected</h3>
                <p className="text-gray-600">
                  Please select at least one component (Body, Lung, or Tumour) from the checkboxes above to visualize the data.
                </p>
              </div>
            </div>
          )}
          
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col items-center gap-3">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                <div className="text-sm text-gray-700">Loading visualization...</div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Segmentation Preview - Side panel */}
        {showManualSegmentationPreview && (
          <div className="w-1/2 h-[600px] rounded-lg shadow-sm overflow-hidden bg-white">
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
                      className="max-w-full max-h-[550px] object-contain rounded shadow-sm"
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
