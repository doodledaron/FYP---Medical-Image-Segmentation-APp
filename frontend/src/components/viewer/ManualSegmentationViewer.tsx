import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface ManualSegmentationViewerProps {
  segmentationMask: Uint8Array[]; // Array of masks for each slice
  dimensions: [number, number, number]; // width, height, depth
  originalImageData?: Float32Array; // Original image data for background
  windowWidth?: number;
  windowCenter?: number;
}

export function ManualSegmentationViewer({
  segmentationMask,
  dimensions,
  originalImageData,
  windowWidth = 2048,
  windowCenter = 1024
}: ManualSegmentationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sliceIndex, setSliceIndex] = useState(0);
  const [maxSlices, setMaxSlices] = useState(0);

  // Initialize on component mount
  useEffect(() => {
    if (segmentationMask && dimensions) {
      // Set max slices based on the depth dimension
      setMaxSlices(dimensions[2]);
      
      // Start in the middle slice
      const middleSlice = Math.floor(dimensions[2] / 2);
      setSliceIndex(middleSlice);
      
      // Render the initial slice
      setTimeout(() => renderSlice(middleSlice), 100);
    }
  }, [segmentationMask, dimensions]);

  // Apply window level to pixel value (same as in ManualSegmentation)
  const applyWindowLevel = (value: number): number => {
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;
    
    if (value <= lower) return 0;
    if (value >= upper) return 255;
    
    return Math.round(((value - lower) / windowWidth) * 255);
  };

  // Render the current slice to the canvas
  const renderSlice = (slice: number) => {
    if (!canvasRef.current || !segmentationMask || !dimensions) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const [width, height, depth] = dimensions;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    // Create an ImageData object
    const imageDataObj = ctx.createImageData(width, height);
    
    // Ensure slice is within bounds
    if (slice < 0 || slice >= segmentationMask.length) return;
    
    // Get the segmentation mask for this slice
    const sliceMask = segmentationMask[slice];
    
    // Fill the ImageData
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Get pixel index
        const pixelIndex = y * width + x;
        
        // Get segmentation value (0 or 1)
        const segValue = sliceMask[pixelIndex] || 0;
        
        // Get background pixel value from original data if available
        let bgValue = 128; // Default gray if no background
        if (originalImageData) {
          const volumeIndex = slice * (width * height) + pixelIndex;
          if (volumeIndex < originalImageData.length) {
            const pixelValue = originalImageData[volumeIndex] || 0;
            bgValue = applyWindowLevel(pixelValue);
          }
        }
        
        // Set pixel in image data
        const i = pixelIndex * 4;
        
        // Set background first
        imageDataObj.data[i] = bgValue; // R
        imageDataObj.data[i + 1] = bgValue; // G
        imageDataObj.data[i + 2] = bgValue; // B
        imageDataObj.data[i + 3] = 255; // Alpha
        
        // Overlay segmentation in red if present
        if (segValue > 0) {
          imageDataObj.data[i] = 255; // Red for segmentation
          imageDataObj.data[i + 1] = 0;
          imageDataObj.data[i + 2] = 0;
        }
      }
    }
    
    ctx.putImageData(imageDataObj, 0, 0);
  };

  // Handle slice navigation
  const changeSlice = (newSlice: number) => {
    const bounded = Math.max(0, Math.min(newSlice, maxSlices - 1));
    setSliceIndex(bounded);
    renderSlice(bounded);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Control bar */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-3 flex items-center justify-between rounded-t-lg">
        <div className="font-medium">Manual Segmentation</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeSlice(sliceIndex - 1)}
            disabled={sliceIndex <= 0}
            className="p-1 rounded bg-white/20 text-white disabled:opacity-50 hover:bg-white/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min="0" 
              max={maxSlices - 1} 
              value={sliceIndex} 
              onChange={(e) => changeSlice(parseInt(e.target.value))} 
              className="w-24 sm:w-32"
            />
            <span className="text-white text-sm w-24">Slice: {sliceIndex + 1}/{maxSlices}</span>
          </div>
          <button
            onClick={() => changeSlice(sliceIndex + 1)}
            disabled={sliceIndex >= maxSlices - 1}
            className="p-1 rounded bg-white/20 text-white disabled:opacity-50 hover:bg-white/30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Canvas for displaying the slice */}
      <div className="flex-1 flex items-center justify-center bg-black rounded-b-lg p-2 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
} 