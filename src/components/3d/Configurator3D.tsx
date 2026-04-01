'use client';

import { Suspense, useRef, useEffect, useCallback } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three-stdlib';
import * as THREE from 'three';
import type { MaterialConfig, ModelPart } from '@/types/database';

const LOCAL_ENVIRONMENT_MAP = '/hdr/studio_small_03_1k.hdr';

// 全局复用同一个 DRACOLoader 实例
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
dracoLoader.setDecoderConfig({ type: 'js' });

interface Model3DProps {
  modelUrl: string;
  config: MaterialConfig;
  preserveMaterials?: boolean;
  onPartsDetected?: (parts: ModelPart[]) => void;
}

function Model({ modelUrl, config, preserveMaterials = false, onPartsDetected }: Model3DProps) {
  const gltf = useLoader(GLTFLoader, modelUrl, (loader) => {
    (loader as GLTFLoader).setDRACOLoader(dracoLoader);
  });
  const meshRef = useRef<THREE.Group>(null);
  const originalMaterials = useRef<Map<string, { color: THREE.Color; roughness: number; metalness: number }>>(new Map());
  const partsReported = useRef(false);

  // 首次挂载时克隆材质（解除共享）、保存原始属性并上报部件列表
  useEffect(() => {
    if (!meshRef.current) return;

    const parts: ModelPart[] = [];
    let meshIndex = 0;

    meshRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // 给没有名字的 mesh 分配一个唯一名称
        if (!mesh.name) {
          mesh.name = `part_${meshIndex}`;
        }
        meshIndex++;

        if (!originalMaterials.current.has(mesh.name)) {
          // 克隆材质，确保每个 mesh 拥有独立实例，互不干扰
          const cloned = (mesh.material as THREE.MeshStandardMaterial).clone();
          mesh.material = cloned;

          originalMaterials.current.set(mesh.name, {
            color: cloned.color.clone(),
            roughness: cloned.roughness,
            metalness: cloned.metalness,
          });

          parts.push({
            name: mesh.name,
            displayName: mesh.name.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            color: '#' + cloned.color.getHexString(),
          });
        }
      }
    });

    if (!partsReported.current && parts.length > 0) {
      partsReported.current = true;
      onPartsDetected?.(parts);
    }
  }, [gltf, onPartsDetected]);

  useEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      if (!mesh.material) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;

      // 检查该部件是否有单独配置
      const partConfig = config.parts?.[mesh.name];

      if (partConfig) {
        // 应用分部位颜色
        mat.color = new THREE.Color(partConfig.color);
        mat.needsUpdate = true;
      } else if (preserveMaterials || !config.color) {
        // 没有分部位配置且无全局颜色时，保持/还原原始材质
        const original = originalMaterials.current.get(mesh.name);
        if (original) {
          mat.color.copy(original.color);
          mat.roughness = original.roughness;
          mat.metalness = original.metalness;
          mat.needsUpdate = true;
        }
      } else {
        // 全局颜色
        mat.color = new THREE.Color(config.color);
        mat.needsUpdate = true;
      }
    });
  }, [config, preserveMaterials]);

  return (
    <group ref={meshRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

interface Configurator3DProps {
  modelUrl: string;
  config: MaterialConfig;
  className?: string;
  preserveMaterials?: boolean;
  onPartsDetected?: (parts: ModelPart[]) => void;
}

/** 加载后自动适配相机到模型包围盒 */
function AutoFit({ modelRef }: { modelRef: React.RefObject<THREE.Group | null> }) {
  const { camera } = useThree();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || !modelRef.current) return;
    const id = requestAnimationFrame(() => {
      if (!modelRef.current) return;
      const box = new THREE.Box3().setFromObject(modelRef.current);
      if (box.isEmpty()) return;

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const cam = camera as THREE.PerspectiveCamera;
      const fov = cam.fov * (Math.PI / 180);
      const dist = (maxDim / 2) / Math.tan(fov / 2);

      cam.position.set(center.x, center.y, center.z + dist * 1.1);
      cam.lookAt(center);
      cam.near = dist * 0.01;
      cam.far = dist * 100;
      cam.updateProjectionMatrix();

      fitted.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, [camera, modelRef]);

  return null;
}

function SceneContent({ modelUrl, config, preserveMaterials, onPartsDetected }: Model3DProps) {
  const groupRef = useRef<THREE.Group>(null!);

  return (
    <>
      {/* 匹配 Three.js Editor 默认灯光 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[12, 2, 3]} intensity={1.0} castShadow />
      <hemisphereLight args={[0xffffff, 0x444444, 0.4]} />
      <Environment files={LOCAL_ENVIRONMENT_MAP} background={false} />

      {/* 3D模型 - 自动居中 */}
      <group ref={groupRef}>
        <Center>
          <Model modelUrl={modelUrl} config={config} preserveMaterials={preserveMaterials} onPartsDetected={onPartsDetected} />
        </Center>
      </group>

      {/* 自动适配相机（仅测量模型，不含阴影等） */}
      <AutoFit modelRef={groupRef} />

      {/* 控制器 */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
      />
    </>
  );
}

export default function Configurator3D({ modelUrl, config, className = '', preserveMaterials = false, onPartsDetected }: Configurator3DProps) {
  return (
    <div className={`canvas-container ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        shadows
        gl={{ toneMapping: THREE.NoToneMapping }}
        onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; }}
      >
        <Suspense fallback={null}>
          <SceneContent modelUrl={modelUrl} config={config} preserveMaterials={preserveMaterials} onPartsDetected={onPartsDetected} />
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
