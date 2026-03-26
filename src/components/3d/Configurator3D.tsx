'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { MaterialConfig } from '@/types/database';

interface Model3DProps {
  modelUrl: string;
  config: MaterialConfig;
}

function Model({ modelUrl, config }: Model3DProps) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            // 创建新材质或更新现有材质
            const material = mesh.material as THREE.MeshStandardMaterial;
            material.color = new THREE.Color(config.color);
            material.roughness = config.roughness;
            material.metalness = config.metalness;
            material.needsUpdate = true;
          }
        }
      });
    }
  }, [config]);

  return (
    <group ref={meshRef}>
      <primitive object={gltf.scene} scale={1.5} />
    </group>
  );
}

interface Configurator3DProps {
  modelUrl: string;
  config: MaterialConfig;
  className?: string;
}

export default function Configurator3D({ modelUrl, config, className = '' }: Configurator3DProps) {
  return (
    <div className={`canvas-container ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        shadows
      >
        <Suspense fallback={null}>
          {/* 光照 */}
          <ambientLight intensity={0.5} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* 3D模型 */}
          <Model modelUrl={modelUrl} config={config} />

          {/* 环境贴图 */}
          <Environment preset="studio" />

          {/* 阴影 */}
          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={0.5}
            scale={10}
            blur={2}
            far={4}
          />

          {/* 控制器 */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={3}
            maxDistance={8}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>

      {/* 加载提示 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white/90 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">拖动旋转 • 滚轮缩放</p>
        </div>
      </div>
    </div>
  );
}

// 预加载模型
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
