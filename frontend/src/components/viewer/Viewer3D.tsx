import React, { useEffect, useRef } from 'react';
import { SegmentationResult } from '../../types';
import { Niivue, SLICE_TYPE } from '@niivue/niivue';

interface Viewer3DProps {
  segmentationData: SegmentationResult;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({ segmentationData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nvRef = useRef<Niivue | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Niivue
    const nv = new Niivue({
      backColor: [0, 0, 0, 1],
      show3Dcrosshair: true,
    });
    nvRef.current = nv;

    // Attach Niivue to the canvas
    nv.attachToCanvas(canvasRef.current);

    // Load the volume
    if (segmentationData?.resultUrl) {
      const volumes = [
        {
          url: segmentationData.resultUrl,
          colormap: 'gray',
          opacity: 1,
          visible: true,
        },
      ];

      nv.loadVolumes(volumes).then(() => {
        // Set the slice type to render (3D view)
        nv.setSliceType(SLICE_TYPE.RENDER);
      });
    }

    // Cleanup on unmount
    // (Removed cleanup logic)
  }, [segmentationData]);

  return (
    <div className="w-full h-[600px] bg-black rounded-lg relative overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
