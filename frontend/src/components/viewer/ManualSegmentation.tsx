import React, { useEffect, useRef, useState } from 'react';
import { Brain, Eraser, MousePointer, ChevronRight, Layers, RotateCw, AlignJustify, Columns, LayoutTemplate, FlipVertical } from 'lucide-react';
import * as nifti from 'nifti-reader-js';
import pako from 'pako';

// Define view types
type ViewType = 'axial' | 'coronal' | 'sagittal';

interface ManualSegmentationProps {
  file: File;
  onComplete: (segmentationData: any) => void;
  onCancel: () => void;
  directUrl?: string; // Added new optional parameter for direct URL loading
}

export function ManualSegmentation({ file, onComplete, onCancel, directUrl }: ManualSegmentationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(10);
  const [sliceIndex, setSliceIndex] = useState(0);
  const [maxSlices, setMaxSlices] = useState(0);
  const [imageData, setImageData] = useState<any>(null);
  const [segmentationData, setSegmentationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(2048);
  const [windowCenter, setWindowCenter] = useState(1024);
  const [currentView, setCurrentView] = useState<ViewType>('axial');
  const [flipped, setFlipped] = useState(false);
  
  // Load the NIFTI file data
  useEffect(() => {
    const loadNiftiData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!file && !directUrl) {
          throw new Error("No file or URL provided");
        }
        
        let buffer: ArrayBuffer;
        
        // If directUrl is provided, load from URL instead of file
        if (directUrl) {
          console.log("Loading NIFTI directly from URL:", directUrl);
          try {
            const response = await fetch(directUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
            }
            buffer = await response.arrayBuffer();
            console.log("Successfully loaded from URL, size:", buffer.byteLength);
          } catch (urlError: any) {
            console.error("Error loading from URL:", urlError);
            throw new Error(`Failed to load from URL: ${urlError.message}`);
          }
        } else {
          console.log("Starting to load NIFTI file:", file.name, "size:", file.size);
          
          // If file size is 0, it's likely corrupted or empty
          if (file.size === 0) {
            throw new Error("File is empty (0 bytes). Please provide a valid NIFTI file.");
          }
          
          // Read the file as an ArrayBuffer
          buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (!e.target || !e.target.result) {
                reject(new Error("Failed to read file"));
              } else {
                resolve(e.target.result as ArrayBuffer);
              }
            };
            reader.onerror = (err) => {
              console.error("FileReader error:", err);
              reject(new Error("Error reading file"));
            };
            reader.readAsArrayBuffer(file);
          });
          console.log("File loaded, size:", buffer.byteLength);
        }
        
        // Safety check for buffer size
        if (buffer.byteLength === 0) {
          throw new Error("File buffer is empty. Cannot process an empty file.");
        }
        
        // Check if this is a gzipped file (.nii.gz)
        const fileArray = new Uint8Array(buffer);
        
        // Safety check before accessing array elements
        if (fileArray.length < 2) {
          throw new Error("File data is too small to be a valid NIFTI file");
        }
        
        const isGzipped = (directUrl && directUrl.toLowerCase().endsWith('.gz')) || 
                         (file && file.name.toLowerCase().endsWith('.gz')) || 
                         (fileArray[0] === 0x1f && fileArray[1] === 0x8b);
        
        console.log("Is file gzipped:", isGzipped, "Magic bytes:", 
                   fileArray[0] !== undefined ? fileArray[0].toString(16) : "undefined", 
                   fileArray[1] !== undefined ? fileArray[1].toString(16) : "undefined");
        
        let uncompressedBuffer: ArrayBuffer;
        
        if (isGzipped) {
          try {
            // For direct URL, try to interpret the data directly first as it might be pre-processed
            if (directUrl) {
              console.log("Using direct URL data without decompression first");
              try {
                // Check if this is a valid NIFTI file without decompression
                if (nifti.isNIFTI(buffer)) {
                  console.log("Direct URL data is already a valid NIFTI without decompression");
                  uncompressedBuffer = buffer;
                } else {
                  console.log("Direct URL data is not a valid NIFTI without decompression, trying decompression");
                  throw new Error("Need to decompress");
                }
              } catch (directCheckError) {
                // If that fails, then try decompression
                console.log("Failed direct NIFTI check, attempting decompression");
                const decompressedData = pako.inflate(fileArray);
                uncompressedBuffer = decompressedData.buffer;
              }
            } else {
              // Standard file decompression
              console.log("Decompressing gzipped data...");
              const decompressedData = pako.inflate(fileArray);
              uncompressedBuffer = decompressedData.buffer;
            }
            
            console.log("Decompression/processing complete, new size:", uncompressedBuffer.byteLength);
          } catch (gzipError) {
            console.error("Failed to decompress gzipped data:", gzipError);
            
            // More detailed error handling
            if (buffer.byteLength < 1000) {
              console.error("Buffer appears too small for a valid NIFTI file");
            }
            
            // For direct URL loading, try using the buffer directly as a last resort
            if (directUrl) {
              console.log("Decompression failed, but trying direct NIFTI parsing as fallback");
              try {
                if (nifti.isNIFTI(buffer)) {
                  console.log("Buffer is valid NIFTI without decompression - using as is");
                  uncompressedBuffer = buffer;
                } else {
                  throw new Error("Not a valid NIFTI file either");
                }
              } catch (fallbackError) {
                console.error("Fallback NIFTI parsing failed:", fallbackError);
                throw new Error("Failed to decompress or parse the NIFTI file. Make sure it's a valid NIFTI file.");
              }
            } else {
              throw new Error("Failed to decompress the NIFTI file. Make sure it's a valid .nii.gz file.");
            }
          }
        } else {
          uncompressedBuffer = buffer;
        }
        
        // Safety check for uncompressed buffer
        if (!uncompressedBuffer || uncompressedBuffer.byteLength === 0) {
          throw new Error("Uncompressed data is empty. Cannot process.");
        }
        
        // Check if this is a valid NIFTI file
        if (!nifti.isNIFTI(uncompressedBuffer)) {
          console.error("Not a valid NIFTI file");
          throw new Error("Not a valid NIFTI file");
        }
        
        // Parse the NIFTI header
        const header = nifti.readHeader(uncompressedBuffer);
        if (!header) {
          throw new Error("Failed to read NIFTI header");
        }
        
        const image = nifti.readImage(header, uncompressedBuffer);
        if (!image) {
          throw new Error("Failed to read NIFTI image data");
        }
        
        // Extract dimensions
        const width = header.dims[1];
        const height = header.dims[2];
        const depth = header.dims[3];
        
        console.log("NIFTI dimensions:", width, "x", height, "x", depth);
        console.log("NIFTI datatype:", header.datatypeCode);
        console.log("NIFTI spatial units:", header.xyzt_units);
        
        // Prepare image data object
        const pixelData = new Float32Array(width * height * depth);
        
        // Determine actual data type and convert to Float32Array for standardized handling
        let srcData: any;
        switch (header.datatypeCode) {
          case nifti.NIFTI1.TYPE_UINT8:
            srcData = new Uint8Array(image);
            break;
          case nifti.NIFTI1.TYPE_INT16:
            srcData = new Int16Array(image);
            break;
          case nifti.NIFTI1.TYPE_INT32:
            srcData = new Int32Array(image);
            break;
          case nifti.NIFTI1.TYPE_FLOAT32:
            srcData = new Float32Array(image);
            break;
          case nifti.NIFTI1.TYPE_FLOAT64:
            srcData = new Float64Array(image);
            break;
          case nifti.NIFTI1.TYPE_INT8:
            srcData = new Int8Array(image);
            break;
          case nifti.NIFTI1.TYPE_UINT16:
            srcData = new Uint16Array(image);
            break;
          case nifti.NIFTI1.TYPE_UINT32:
            srcData = new Uint32Array(image);
            break;
          default:
            srcData = new Uint8Array(image);
        }
        
        // Find min and max for window level adjustment
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        
        for (let i = 0; i < srcData.length; i++) {
          const val = srcData[i];
          if (val < min) min = val;
          if (val > max) max = val;
          pixelData[i] = val;
        }
        
        console.log("NIFTI data range:", min, "to", max);
        
        // Set auto window level based on data
        setWindowCenter((min + max) / 2);
        setWindowWidth(max - min);
        
        // Set up imageData object
        const imgData = {
          dimensions: [width, height, depth],
          pixelData: pixelData,
          min: min,
          max: max
        };
        
        setImageData(imgData);
        
        // Set initial slice index and max slices for axial view
        const axialMid = Math.floor(depth / 2);
        setSliceIndex(axialMid);
        setMaxSlices(depth);
        
        // Initialize segmentation data for each slice
        const initSegData = Array(depth).fill(null).map(() => 
          new Uint8Array(width * height).fill(0)
        );
        setSegmentationData(initSegData);
        
        setLoading(false);
        
        // Render the middle slice
        setTimeout(() => {
          renderCanvas(axialMid, imgData, initSegData);
        }, 100);
        
      } catch (error: any) {
        console.error("Error loading NIFTI file:", error);
        setError(error.message || "Unknown error loading NIFTI file");
        setLoading(false);
      }
    };
    
    loadNiftiData();
  }, [file, directUrl]);

  // When view type changes, update maxSlices and reset to middle slice
  useEffect(() => {
    if (imageData) {
      const [width, height, depth] = imageData.dimensions;
      
      // Set max slices based on view orientation
      let newMaxSlices: number;
      switch (currentView) {
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
      
      // Reset to middle slice
      const middleSlice = Math.floor(newMaxSlices / 2);
      setSliceIndex(middleSlice);
      
      // Re-render with new view
      renderCanvas(middleSlice);
    }
  }, [currentView, flipped]);

  // Apply window level to pixel value
  const applyWindowLevel = (value: number): number => {
    // Apply window level transformation
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;
    
    if (value <= lower) return 0;
    if (value >= upper) return 255;
    
    // Linear transformation to 0-255 range
    return Math.round(((value - lower) / windowWidth) * 255);
  };

  // Render the current slice to the canvas
  const renderCanvas = (slice: number, imgData = imageData, segData = segmentationData) => {
    if (!canvasRef.current || !imgData || !segData || segData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const [width, height, depth] = imgData.dimensions;
    
    // Set canvas dimensions based on view orientation
    let canvasWidth: number, canvasHeight: number;
    
    switch (currentView) {
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
    
    // Fill the ImageData based on view orientation
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        // Apply vertical flip if needed
        const displayY = flipped ? (canvasHeight - 1 - y) : y;
        
        // Convert canvas coordinates to volume coordinates based on view
        let voxelX: number, voxelY: number, voxelZ: number;
        
        switch (currentView) {
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
        const validCoords = (
          voxelX >= 0 && voxelX < width &&
          voxelY >= 0 && voxelY < height &&
          voxelZ >= 0 && voxelZ < depth
        );
        
        // Get pixel value
        let pixelValue = 0;
        let segValue = 0;
        
        if (validCoords) {
          // Calculate proper 3D volume index
          const volumeIndex = voxelZ * (width * height) + voxelY * width + voxelX;
          pixelValue = imgData.pixelData[volumeIndex] || 0;
          
          // Get segmentation value if it exists
          if (voxelZ < segData.length) {
            segValue = segData[voxelZ][voxelY * width + voxelX] || 0;
          }
        }
        
        // Apply window level to get display value
        const displayValue = applyWindowLevel(pixelValue);
        
        // Set pixel in image data
        const i = (y * canvasWidth + x) * 4;
        imageDataObj.data[i] = displayValue; // R
        imageDataObj.data[i + 1] = displayValue; // G
        imageDataObj.data[i + 2] = displayValue; // B
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

  // Handle drawing on the canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !imageData || segmentationData.length === 0) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = Math.floor((e.clientX - rect.left) * scaleX);
    const canvasY = Math.floor((e.clientY - rect.top) * scaleY);
    
    // Apply vertical flip if needed when converting from canvas coordinates to volume
    const effectiveCanvasY = flipped ? (canvas.height - 1 - canvasY) : canvasY;
    
    // Convert canvas coordinates to volume coordinates based on view
    const [width, height, depth] = imageData.dimensions;
    
    let voxelX: number, voxelY: number, voxelZ: number;
    
    switch (currentView) {
      case 'axial':
        voxelX = canvasX;
        voxelY = effectiveCanvasY; // Use flipped Y coordinate
        voxelZ = sliceIndex;
        break;
      case 'coronal':
        voxelX = canvasX;
        voxelY = sliceIndex;
        voxelZ = effectiveCanvasY; // Use flipped Y coordinate
        break;
      case 'sagittal':
        voxelX = sliceIndex;
        voxelY = canvasX;
        voxelZ = effectiveCanvasY; // Use flipped Y coordinate
        break;
      default:
        voxelX = canvasX;
        voxelY = effectiveCanvasY;
        voxelZ = sliceIndex;
    }
    
    // Ensure coordinates are within bounds
    if (
      voxelX < 0 || voxelX >= width ||
      voxelY < 0 || voxelY >= height ||
      voxelZ < 0 || voxelZ >= depth ||
      voxelZ >= segmentationData.length
    ) return;
    
    // Create a copy of the segmentation data for modification
    const currentSegData = [...segmentationData];
    
    // Draw on the segmentation data using a circular brush
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        // Only apply pixels within the circular brush radius
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= brushSize) {
          let px: number, py: number, pz: number;
          
          // Assign coordinates based on view
          switch (currentView) {
            case 'axial':
              px = voxelX + dx;
              py = voxelY + dy;
              pz = voxelZ;
              break;
            case 'coronal':
              px = voxelX + dx;
              py = voxelY;
              pz = voxelZ + dy;
              break;
            case 'sagittal':
              px = voxelX;
              py = voxelY + dx;
              pz = voxelZ + dy;
              break;
            default:
              px = voxelX + dx;
              py = voxelY + dy;
              pz = voxelZ;
          }
          
          // Check bounds
          if (px >= 0 && px < width && py >= 0 && py < height && pz >= 0 && pz < depth) {
            // Update the correct slice based on the Z coordinate
            const sliceToUpdate = currentSegData[pz];
            if (!sliceToUpdate) continue;
            
            // Get proper 2D index within the slice
            const index = py * width + px;
            
            // Apply brush or eraser
            sliceToUpdate[index] = tool === 'brush' ? 1 : 0;
          }
        }
      }
    }
    
    setSegmentationData(currentSegData);
    
    // Render the updated canvas
    renderCanvas(sliceIndex, imageData, currentSegData);
  };

  // Toggle image flip
  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  // Handle slice navigation
  const changeSlice = (newSlice: number) => {
    const bounded = Math.max(0, Math.min(newSlice, maxSlices - 1));
    setSliceIndex(bounded);
    renderCanvas(bounded);
  };

  // Change view orientation
  const changeView = (newView: ViewType) => {
    setCurrentView(newView);
    // The useEffect will handle updating maxSlices and re-rendering
  };

  // Adjust window/level
  const adjustWindowLevel = (newWidth: number, newCenter: number) => {
    setWindowWidth(newWidth);
    setWindowCenter(newCenter);
    renderCanvas(sliceIndex);
  };

  // Re-render when slice changes or window/level changes
  useEffect(() => {
    if (imageData) {
      renderCanvas(sliceIndex);
    }
  }, [sliceIndex, windowWidth, windowCenter]);

  // Handle completion
  const handleComplete = () => {
    // Take a screenshot of the canvas
    const screenshot = canvasRef.current?.toDataURL('image/png');
    
    // Package segmentation data for return to parent component
    onComplete({
      segmentationMask: segmentationData,
      dimensions: imageData?.dimensions,
      screenshot: screenshot,
      originalImageData: imageData?.pixelData,
      windowWidth: windowWidth,
      windowCenter: windowCenter,
      viewType: currentView, // Include the current view type
      flipped: flipped // Include the flip state
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Manual Segmentation</h2>
          <p className="text-blue-600">Use the brush tool to mark tumor regions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
          >
            <ChevronRight className="h-5 w-5" />
            Proceed to AI Analysis
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20">
          <div className="animate-spin mb-4">
            <Brain className="h-10 w-10 text-blue-600" />
          </div>
          <p className="text-blue-700">Loading NIFTI data...</p>
        </div>
      ) : error ? (
        <div className="text-center p-10 bg-red-50 rounded-xl border border-red-100">
          <p className="text-red-600 font-medium mb-2">Error loading NIFTI file</p>
          <p className="text-red-500">{error}</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Change File
          </button>
        </div>
      ) : (
        <div>
          {/* Tools and controls */}
          <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setTool('brush')}
                className={`p-3 rounded-lg flex items-center gap-2 ${tool === 'brush' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              >
                <MousePointer className="h-5 w-5" />
                Brush
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-3 rounded-lg flex items-center gap-2 ${tool === 'eraser' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
              >
                <Eraser className="h-5 w-5" />
                Eraser
              </button>
              <div className="flex items-center gap-2">
                <span className="text-blue-800">Size:</span>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                  className="w-24 sm:w-32"
                />
                <span className="text-blue-800 w-8">{brushSize}px</span>
              </div>
            </div>
            
            {/* View selection controls and flip toggle */}
            <div className="flex flex-wrap justify-center gap-2">
              <div className="flex bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => changeView('axial')}
                  className={`flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                    ${currentView === 'axial' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  title="Axial View"
                >
                  <AlignJustify size={16} />
                  <span className="text-sm whitespace-nowrap">Axial</span>
                </button>
                <button
                  onClick={() => changeView('coronal')}
                  className={`flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                    ${currentView === 'coronal' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  title="Coronal View"
                >
                  <Columns size={16} />
                  <span className="text-sm whitespace-nowrap">Coronal</span>
                </button>
                <button
                  onClick={() => changeView('sagittal')}
                  className={`flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                    ${currentView === 'sagittal' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  title="Sagittal View"
                >
                  <LayoutTemplate size={16} />
                  <span className="text-sm whitespace-nowrap">Sagittal</span>
                </button>
              </div>
              
              {/* Flip toggle button */}
              <button
                onClick={toggleFlip}
                className={`flex items-center justify-center gap-2 rounded-full px-3 h-8 transition-colors
                  ${flipped
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                title="Flip Image Vertically"
              >
                <FlipVertical size={16} />
                <span className="text-sm whitespace-nowrap">Flip</span>
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => changeSlice(sliceIndex - 1)}
                disabled={sliceIndex <= 0}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="0" 
                  max={maxSlices - 1} 
                  value={sliceIndex} 
                  onChange={(e) => changeSlice(parseInt(e.target.value))} 
                  className="w-24 sm:w-40"
                />
                <span className="text-blue-800 w-20">Slice: {sliceIndex + 1}/{maxSlices}</span>
              </div>
              <button
                onClick={() => changeSlice(sliceIndex + 1)}
                disabled={sliceIndex >= maxSlices - 1}
                className="p-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          
          {/* Window/Level controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-blue-800 whitespace-nowrap">Window Width:</span>
                <input 
                  type="range" 
                  min="1" 
                  max={imageData?.max - imageData?.min || 4000} 
                  value={windowWidth} 
                  onChange={(e) => adjustWindowLevel(parseInt(e.target.value), windowCenter)} 
                  className="w-24 sm:w-32"
                />
                <span className="text-blue-800 w-12">{windowWidth}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-800 whitespace-nowrap">Window Center:</span>
                <input 
                  type="range" 
                  min={imageData?.min || 0} 
                  max={imageData?.max || 4000} 
                  value={windowCenter} 
                  onChange={(e) => adjustWindowLevel(windowWidth, parseInt(e.target.value))} 
                  className="w-24 sm:w-32"
                />
                <span className="text-blue-800 w-12">{windowCenter}</span>
              </div>
              <button
                onClick={() => {
                  // Reset to default window/level
                  if (imageData) {
                    const newCenter = (imageData.min + imageData.max) / 2;
                    const newWidth = imageData.max - imageData.min;
                    adjustWindowLevel(newWidth, newCenter);
                  }
                }}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-all text-sm"
              >
                Reset
              </button>
            </div>
          </div>
          
          {/* Canvas for drawing */}
          <div className="relative border border-gray-200 rounded-lg flex justify-center overflow-hidden bg-gray-900">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onMouseMove={draw}
              className="max-w-full object-contain cursor-crosshair"
              style={{ maxHeight: '60vh' }}
            />
          </div>
          
          <div className="mt-4 text-center text-gray-500 text-sm">
            Use the brush tool to mark tumors (red). Switch to the eraser to remove markings.
            <br />
            Navigate through slices using the Previous/Next buttons or the slider.
          </div>
        </div>
      )}
    </div>
  );
} 