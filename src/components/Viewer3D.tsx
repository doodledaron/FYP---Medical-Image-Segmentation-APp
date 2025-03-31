import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, PivotControls, GizmoHelper, GizmoViewport } from '@react-three/drei';

interface Viewer3DProps {
  segmentationData?: any;
}

function Mesh() {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  return (
    <PivotControls>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#FFD700" />
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
                  <span className="font-medium">Size:</span> 2.3cm x 1.8cm
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Confidence:</span> 94% ⭐
                </p>
                <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Recommended for further clinical evaluation
                </div>
              </div>
            </div>
          </Html>
        )}
      </mesh>
    </PivotControls>
  );
}

export const Viewer3D: React.FC<Viewer3DProps> = ({ segmentationData }) => {
  return (
    <div className="w-full h-[600px] bg-gradient-to-br from-blue-900 to-black rounded-lg relative overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Mesh />
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