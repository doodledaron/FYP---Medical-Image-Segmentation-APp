import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, AlignJustify, Columns, LayoutTemplate, FlipVertical } from 'lucide-react';

// Define view types
export type ViewType = 'axial' | 'coronal' | 'sagittal';

interface ManualSegmentationViewerProps {
  segmentationMask: Uint8Array[]; // Array of masks for each slice
  dimensions: [number, number, number]; // width, height, depth
  originalImageData?: Float32Array; // Original image data for background
  windowWidth?: number;
  windowCenter?: number;
  initialViewType?: ViewType; // Added prop for initial view type
  flipped?: boolean; // Whether the image is flipped
}

export function ManualSegmentationViewer({
  segmentationMask,
  dimensions,
  originalImageData,
  windowWidth = 2048,
  windowCenter = 1024,
  initialViewType = 'axial', // Default to axial
  flipped: initialFlipped = false
}: ManualSegmentationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sliceIndex, setSliceIndex] = useState(0);
  const [maxSlices, setMaxSlices] = useState(0);
  const [viewType, setViewType] = useState<ViewType>(initialViewType);
  const [flipped, setFlipped] = useState(initialFlipped);

  // Initialize on component mount or when view changes
  useEffect(() => {
    if (segmentationMask && dimensions) {
      const [width, height, depth] = dimensions;
      
      // Set max slices based on view orientation
      let newMaxSlices: number;
      switch (viewType) {
        case 'axial':
          newMaxSlices = depth;
          break;
        case 'coronal':
          newMaxSlices = height;
          break;
        case 'sagittal':
          newMaxSlices = width;
          break;
        default:
          newMaxSlices = depth;
      }
      
      setMaxSlices(newMaxSlices);
      
      // Start in the middle slice
      const middleSlice = Math.floor(newMaxSlices / 2);
      setSliceIndex(middleSlice);
      
      // Render the initial slice
      setTimeout(() => renderSlice(middleSlice), 100);
    }
  }, [segmentationMask, dimensions, viewType, flipped]);

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
    
    // Set canvas dimensions based on view orientation
    let canvasWidth: number, canvasHeight: number;
    
    switch (viewType) {
      case 'axial':
        canvasWidth = width;
        canvasHeight = height;
        break;
      case 'coronal':
        canvasWidth = width;
        canvasHeight = depth;
        break;
      case 'sagittal':
        canvasWidth = height;
        canvasHeight = depth;
        break;
      default:
        canvasWidth = width;
        canvasHeight = height;
    }
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Create an ImageData object
    const imageDataObj = ctx.createImageData(canvasWidth, canvasHeight);
    
    // Ensure slice is within bounds for the current view
    if (slice < 0 || slice >= maxSlices) return;

    // Fill the ImageData based on view orientation
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        // Apply vertical flip if needed
        const displayY = flipped ? (canvasHeight - 1 - y) : y;
        
        // Convert canvas coordinates to volume coordinates based on view
        let voxelX: number, voxelY: number, voxelZ: number;
        
        switch (viewType) {
          case 'axial':
            voxelX = x;
            voxelY = displayY; // Apply flip to Y in axial view
            voxelZ = slice;
            break;
          case 'coronal':
            voxelX = x;
            voxelY = slice;
            voxelZ = displayY; // Apply flip to Z in coronal view
            break;
          case 'sagittal':
            voxelX = slice;
            voxelY = x;
            voxelZ = displayY; // Apply flip to Z in sagittal view
            break;
          default:
            voxelX = x;
            voxelY = displayY;
            voxelZ = slice;
        }
        
        // Ensure coordinates are within bounds
        if (
          voxelX < 0 || voxelX >= width ||
          voxelY < 0 || voxelY >= height ||
          voxelZ < 0 || voxelZ >= depth ||
          voxelZ >= segmentationMask.length
        ) continue;
        
        // Get pixel index in the canvas
        const canvasIndex = y * canvasWidth + x;
        
        // Get segmentation value from the appropriate slice
        const segValue = segmentationMask[voxelZ][voxelY * width + voxelX] || 0;
        
        // Get background pixel value from original data if available
        let bgValue = 128; // Default gray if no background
        if (originalImageData) {
          const volumeIndex = voxelZ * (width * height) + voxelY * width + voxelX;
          if (volumeIndex < originalImageData.length) {
            const pixelValue = originalImageData[volumeIndex] || 0;
            bgValue = applyWindowLevel(pixelValue);
          }
        }
        
        // Set pixel in image data
        const i = canvasIndex * 4;
        
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

  // Change view orientation
  const changeView = (newView: ViewType) => {
    setViewType(newView);
    // The useEffect will handle updating maxSlices and rendering
  };

  // Toggle vertical flip
  const toggleFlip = () => {
    setFlipped(!flipped);
    // Re-rendering will be handled by useEffect
  };

  return (
    <div className="flex flex-col h-full">
      {/* Control bar with two rows */}
      <div className="bg-blue-700 text-white rounded-t-lg">
        {/* Title and top row: view selection and flip toggle */}
        <div className="p-2 flex items-center justify-between">
          <div className="font-medium pl-2">Manual Segmentation</div>
          
          <div className="flex items-center space-x-3">
            {/* View Selection Controls */}
            <div className="flex bg-blue-600/50 rounded-full p-1">
              <button
                onClick={() => changeView('axial')}
                className={`
                  flex items-center justify-center rounded-full px-3 h-8 transition-colors
                  ${viewType === 'axial' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10'
                  }
                `}
                title="Axial View"
              >
                <AlignJustify size={16} />
                <span className="text-sm ml-1">Axial</span>
              </button>
              <button
                onClick={() => changeView('coronal')}
                className={`
                  flex items-center justify-center rounded-full px-3 h-8 transition-colors
                  ${viewType === 'coronal' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10'
                  }
                `}
                title="Coronal View"
              >
                <Columns size={16} />
                <span className="text-sm ml-1">Coronal</span>
              </button>
              <button
                onClick={() => changeView('sagittal')}
                className={`
                  flex items-center justify-center rounded-full px-3 h-8 transition-colors
                  ${viewType === 'sagittal' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10'
                  }
                `}
                title="Sagittal View"
              >
                <LayoutTemplate size={16} />
                <span className="text-sm ml-1">Sagittal</span>
              </button>
            </div>

            {/* Flip Toggle Button */}
            <button
              onClick={toggleFlip}
              className={`
                flex items-center justify-center rounded-full px-3 h-8 transition-colors
                ${flipped
                  ? 'bg-white text-blue-700' 
                  : 'bg-blue-600/50 text-white hover:bg-white/10'
                }
                border border-white/50
              `}
              title="Flip Image Vertically"
            >
              <FlipVertical size={16} />
              <span className="text-sm ml-1">Flip</span>
            </button>
          </div>
        </div>
        
        {/* Bottom row: slice navigation */}
        <div className="px-4 pb-2 flex items-center justify-center">
          <div className="flex items-center w-full max-w-lg">
            <button
              onClick={() => changeSlice(sliceIndex - 1)}
              disabled={sliceIndex <= 0}
              className="flex items-center justify-center rounded-full w-8 h-8 mr-2 transition-colors bg-blue-600/50 text-white disabled:opacity-50 hover:bg-white/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex-1 flex items-center">
              <input 
                type="range" 
                min="0" 
                max={maxSlices - 1} 
                value={sliceIndex} 
                onChange={(e) => changeSlice(parseInt(e.target.value))} 
                className="w-full h-1.5 bg-blue-600/50 rounded-full appearance-none cursor-pointer"
              />
            </div>
            
            <button
              onClick={() => changeSlice(sliceIndex + 1)}
              disabled={sliceIndex >= maxSlices - 1}
              className="flex items-center justify-center rounded-full w-8 h-8 ml-2 transition-colors bg-blue-600/50 text-white disabled:opacity-50 hover:bg-white/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            
            <span className="text-white text-sm ml-3 min-w-[60px] text-center">
              {sliceIndex + 1}/{maxSlices}
            </span>
          </div>
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