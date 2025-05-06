import React, { useEffect, useRef, useState } from 'react'; // Import useState
import { SegmentationResult } from '../../types';
import { Niivue, SLICE_TYPE } from '@niivue/niivue';
import { Loader2 } from 'lucide-react'; // Import Loader2

interface Viewer3DProps {
  segmentationData: SegmentationResult;
  reloadKey: number;
  colormapKey: string;
  showLungOnly?: boolean; // NEW PROP
}

export const Viewer3D: React.FC<Viewer3DProps> = ({
  segmentationData,
  reloadKey,
  colormapKey,
  showLungOnly = false, // DEFAULT
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nvRef     = useRef<Niivue | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  useEffect(() => {
    if (!canvasRef.current) return;

    setIsLoading(true); // Start loading

    // 1) Init Niivue once
    if (!nvRef.current) {
      nvRef.current = new Niivue({
        backColor: [0, 0, 0, 1],
        show3Dcrosshair: true,
        loadingText: 'Loading...', // Optional: Niivue's built-in text
      });
      nvRef.current.attachToCanvas(canvasRef.current);
    }
    const nv = nvRef.current;

    const { originalFileUrl, resultUrl } = segmentationData;
    if (!originalFileUrl || !resultUrl) {
        setIsLoading(false); // Stop loading if no URLs
        return;
    }

    // Determine opacity based on colormapKey and showLungOnly
    let originalOpacity = 1.0; // Default opacity
    let tumourOpacity = 1.0;   // Default tumour opacity
    if (showLungOnly) {
      // When showing only lung, force lung to 1 and tumour to 0
      originalOpacity = 1.0;
      tumourOpacity = 0.0;
    } else {
      // When showing tumour location, use preset logic
      if (colormapKey === 'gray') {
        originalOpacity = 0.35;
      } else if (colormapKey === 'ct_soft' || colormapKey === 'ct_bones') {
        originalOpacity = 1.0;
      }
      tumourOpacity = 1.0;
    }

    // 2) Volume definitions
    const volumes = [
      {
        url: originalFileUrl,
        colormap: colormapKey,
        opacity: originalOpacity,
        visible: true,
      },
      {
        url: resultUrl,
        colormap: 'red',
        opacity: tumourOpacity,
        visible: true,
      },
    ];

    // 3) Clear + reload
    nv.loadVolumes(volumes)
      .then(() => {
        nv.setSliceType(SLICE_TYPE.RENDER);
        volumes.forEach((v, i) => nv.setOpacity(i, v.opacity));
        setIsLoading(false); // Stop loading on success
      })
      .catch((err) => {
        console.error('Viewer3D load error:', err);
        setIsLoading(false); // Stop loading on error
      });
  }, [segmentationData, reloadKey, colormapKey, showLungOnly]);

  return (
    <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <Loader2 className="animate-spin h-12 w-12 text-white" />
        </div>
      )}
    </div>
  );
};
