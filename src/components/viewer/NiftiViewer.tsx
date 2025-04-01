import { useEffect, useRef, useState } from "react";
import { Niivue, SLICE_TYPE } from "@niivue/niivue";
import * as pako from "pako";

interface NiftiViewerProps {
  file: File;
  segmentationResult: any;
}

const NiftiViewer: React.FC<NiftiViewerProps> = ({ file, segmentationResult }) => {
  const niivueRef = useRef<Niivue | null>(null);
  const [view, setView] = useState(SLICE_TYPE.CORONAL);

  useEffect(() => {
    const compressNifti = async (file: File) => {
      const reader = new FileReader();
      return new Promise<Blob>((resolve, reject) => {
        reader.onload = (event) => {
          if (event.target?.result instanceof ArrayBuffer) {
            const compressedData = pako.gzip(new Uint8Array(event.target.result));
            resolve(new Blob([compressedData], { type: "application/gzip" }));
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.readAsArrayBuffer(file);
      });
    };

    const loadNifti = async () => {
      const canvas = document.getElementById("niivue-canvas") as HTMLCanvasElement;
      if (!canvas) return;

      niivueRef.current = new Niivue();
      niivueRef.current.attachToCanvas(canvas);
      niivueRef.current.setSliceType(view);

      let fileBlob = file;
      if (!file.name.endsWith(".gz")) {
        const compressedBlob = await compressNifti(file);
        fileBlob = new File([compressedBlob], `${file.name}.gz`, { type: "application/gzip", lastModified: Date.now() });
      }

      const fileUrl = URL.createObjectURL(fileBlob);
      niivueRef.current.loadVolumes([{ url: fileUrl, name: file.name.endsWith(".gz") ? file.name : `${file.name}.gz` }]);
    };

    loadNifti();
  }, [file, view]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-100">
      <h2 className="text-lg font-semibold text-blue-900 mb-2">2D NIFTI Viewer</h2>
      <p className="text-gray-600 text-sm mb-2">Hint: Move the mouse roller to move the slides</p>
      <div className="flex space-x-4 mb-4">
        <button onClick={() => setView(SLICE_TYPE.AXIAL)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Axial View</button>
        <button onClick={() => setView(SLICE_TYPE.CORONAL)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Coronal View</button>
        <button onClick={() => setView(SLICE_TYPE.SAGITTAL)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Sagittal View</button>
      </div>
      <canvas id="niivue-canvas" width="800" height="600" className="w-full h-auto border border-gray-300"></canvas>
    </div>
  );
};

export default NiftiViewer;
