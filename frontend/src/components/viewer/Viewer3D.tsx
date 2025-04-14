import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { SegmentationResult } from '../../types';
import axios from 'axios';
import * as THREE from 'three';
// You might need a library to parse NIFTI in the browser, like nifti-reader-js
// import { readNIFTI } from 'nifti-reader-js';

interface Viewer3DProps {
  segmentationData: SegmentationResult;
}

function SegmentationMesh({ 
  segmentationData 
}: { 
  segmentationData: SegmentationResult 
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const [meshData, setMeshData] = useState<any>(null);

  useEffect(() => {
    const fetchSegmentation = async () => {
      if (segmentationData?.resultUrl) {
        try {
          // Fetch the segmentation file
          const response = await axios.get(segmentationData.resultUrl, {
            responseType: 'blob'
          });
          
          // In a real application, you'd parse the NIFTI file and convert to a 3D mesh here
          // This is a complex process that requires specialized libraries
          // For now, we'll just acknowledge we fetched the file
          console.log('Fetched segmentation file, would convert to mesh here');
          
          // For this example, we're just using a placeholder sphere instead of actual mesh data
          setMeshData({
            type: 'sphere',
            position: [0, 0, 0],
            radius: 1
          });
          
        } catch (error) {
          console.error('Error fetching segmentation file for 3D view:', error);
        }
      }
    };
    
    fetchSegmentation();
  }, [segmentationData]);

  // Simple placeholder - in reality, you'd generate a proper 3D mesh from the NIFTI data
  return meshData ? (
    <mesh
      ref={meshRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[meshData.radius, 32, 32]} />
      <meshStandardMaterial 
        color="#FFD700" 
        transparent={true}
        opacity={0.7}
        wireframe={false}
      />
      {hovered && (
        <Html position={[1, 1, 0]} className="pointer-events-none">
          <div className="bg-white border border-blue-100 p-4 rounded-xl shadow-xl w-80">
            <h3 className="text-blue-900 font-bold text-lg mb-2">
              🔬 AI Detection Results
            </h3>
            <div className="space-y-2">
              <p className="text-blue-800">
                <span className="font-medium">Location:</span> Upper right lobe
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Lung Volume:</span> {segmentationData.metrics?.lungVolume} cm³
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Lesion Volume:</span> {segmentationData.metrics?.lesionVolume} cm³
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Lesion Count:</span> {segmentationData.metrics?.lesionCount}
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Confidence:</span> {segmentationData.metrics?.confidenceScore ? 
                  `${(segmentationData.metrics.confidenceScore * 100).toFixed(0)}%` : 'N/A'} ⭐
              </p>
              <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                💡 Recommended for further clinical evaluation
              </div>
            </div>
          </div>
        </Html>
      )}
    </mesh>
  ) : null;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({ segmentationData }) => {
  return (
    <div className="w-full h-[600px] bg-gradient-to-br from-blue-900 to-black rounded-lg relative overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <SegmentationMesh segmentationData={segmentationData} />
        <OrbitControls makeDefault />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport labelColor="white" axisHeadScale={1} />
        </GizmoHelper>
      </Canvas>
      <div className="absolute bottom-4 left-4 text-white bg-blue-900/50 backdrop-blur-sm rounded-lg p-4">
        <p className="font-medium mb-2">Visualization Controls</p>
        <ul className="space-y-1 text-sm text-blue-100">
          <li className="flex items-center">
            <span className="w-24">Rotate</span>
            <span className="text-blue-300">Left click + drag</span>
          </li>
          <li className="flex items-center">
            <span className="w-24">Pan</span>
            <span className="text-blue-300">Right click + drag</span>
          </li>
          <li className="flex items-center">
            <span className="w-24">Zoom</span>
            <span className="text-blue-300">Mouse wheel</span>
          </li>
        </ul>
      </div>
    </div>
  );
};