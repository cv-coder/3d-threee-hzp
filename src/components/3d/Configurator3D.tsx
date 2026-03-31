'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type { MaterialConfig } from '@/types/database';

const LOCAL_ENVIRONMENT_MAP = '/hdr/studio_small_03_1k.hdr';

interface Model3DProps {
  modelUrl: string;
  config: MaterialConfig;
  preserveMaterials?: boolean;
}

function Model({ modelUrl, config, preserveMaterials = false }: Model3DProps) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (preserveMaterials || !meshRef.current) return;
    meshRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.color = new THREE.Color(config.color);
          material.roughness = config.roughness;
          material.metalness = config.metalness;
          material.needsUpdate = true;
        }
      }
    });
  }, [config, preserveMaterials]);

  return (
    <group ref={meshRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

/** 加载完成后自动调整相机使模型填满视口 */
function AutoFitCamera() {
  const { camera, scene } = useThree();

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    const dist = maxDim / (2 * Math.tan(fov / 2)) * 0.5;

    camera.position.set(center.x + dist * 0.3, center.y + dist * 0.2, center.z + dist * 0.8);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [camera, scene]);

  return null;
}

interface Configurator3DProps {
  modelUrl: string;
  config: MaterialConfig;
  className?: string;
  /** 为 true 时保留模型原始材质，不覆盖颜色/粗糙度/金属度 */
  preserveMaterials?: boolean;
}

export default function Configurator3D({ modelUrl, config, className = '', preserveMaterials = false }: Configurator3DProps) {
  return (
    <div className={`canvas-container ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        shadows
        gl={{ toneMapping: THREE.NoToneMapping }}
        onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; }}
      >
        <Suspense fallback={null}>
          {/* 匹配 Three.js Editor 默认灯光 */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 7.5]} intensity={1.0} castShadow />
          <hemisphereLight args={[0xffffff, 0x444444, 0.4]} />

          {/* 3D模型 - 自动居中 */}
          <Center>
            <Model modelUrl={modelUrl} config={config} preserveMaterials={preserveMaterials} />
          </Center>

          {/* 自动适配相机距离 */}
          <AutoFitCamera />

          {/* 环境反射贴图（仅用于金属/高光反射，不参与主照明） */}
          <Environment files={LOCAL_ENVIRONMENT_MAP} background={false} />

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
            minDistance={0.5}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>

      {/* 加载提示 */}
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <div className="bg-white/90 px-3 py-1.5 rounded-lg shadow-lg">
          <p className="text-xs text-gray-500">拖动旋转 • 滚轮缩放</p>
        </div>
      </div>
    </div>
  );
}

// 预加载模型
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
