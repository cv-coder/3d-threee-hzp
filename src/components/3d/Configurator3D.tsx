'use client';

import { Suspense, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three-stdlib';
import * as THREE from 'three';
import type { MaterialConfig, ModelPart, SurfaceFinishType } from '@/types/database';

const LOCAL_ENVIRONMENT_MAP = '/hdr/studio_small_03_1k.hdr';

// 全局复用同一个 DRACOLoader 实例
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
dracoLoader.setDecoderConfig({ type: 'js' });

const SURFACE_FINISH_PRESETS: Record<SurfaceFinishType, { roughness: number; metalness: number; transparent?: boolean; opacity?: number; clearcoat?: number; clearcoatRoughness?: number; transmission?: number; thickness?: number; envMapIntensity?: number; ior?: number }> = {
  'injection-color': { roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0 },
  'paint-matte': { roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.5 },
  'electroplated-glossy': { roughness: 0, metalness: 1 },
  'electroplated-matte': { roughness: 0.3, metalness: 1 },
  'glass': { roughness: 0, metalness: .25, transmission: 1, thickness: 1, envMapIntensity: 0.6 ,clearcoat: 0,
        clearcoatRoughness: 0},
};

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

  // 克隆整个 scene，避免污染 useLoader 的全局缓存
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf]);

  const meshRef = useRef<THREE.Group>(null);
  const originalMaterials = useRef<Map<string, { color: THREE.Color; roughness: number; metalness: number; transparent: boolean; opacity: number; clearcoat: number; clearcoatRoughness: number }>>(new Map());
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
          // 转为 MeshPhysicalMaterial 以支持 clearcoat 等高级属性
          const srcMat = mesh.material as THREE.MeshStandardMaterial;
          const physical = new THREE.MeshPhysicalMaterial({
            color: srcMat.color?.clone?.() ?? new THREE.Color(0xffffff),
            roughness: srcMat.roughness ?? 0.5,
            metalness: srcMat.metalness ?? 0,
            transparent: srcMat.transparent ?? false,
            opacity: srcMat.opacity ?? 1,
            map: srcMat.map ?? null,
            normalMap: srcMat.normalMap ?? null,
            side: srcMat.side ?? THREE.FrontSide,
          });
          mesh.material = physical;

          originalMaterials.current.set(mesh.name, {
            color: physical.color.clone(),
            roughness: physical.roughness,
            metalness: physical.metalness,
            transparent: physical.transparent,
            opacity: physical.opacity,
            clearcoat: physical.clearcoat,
            clearcoatRoughness: physical.clearcoatRoughness,
          });

          parts.push({
            name: mesh.name,
            displayName: mesh.name.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            color: '#' + physical.color.getHexString(),
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
      const mat = mesh.material as THREE.MeshPhysicalMaterial;

      const applyPreset = (preset: typeof SURFACE_FINISH_PRESETS[SurfaceFinishType]) => {
        mat.roughness = preset.roughness;
        mat.metalness = preset.metalness;
        mat.transparent = !!preset.transparent;
        mat.opacity = preset.opacity ?? 1;
        mat.clearcoat = preset.clearcoat ?? 0;
        mat.clearcoatRoughness = preset.clearcoatRoughness ?? 0;
        mat.transmission = preset.transmission ?? 0;
        mat.thickness = preset.thickness ?? 0;
        mat.ior = preset.ior ?? 1.5;
        mat.envMapIntensity = preset.envMapIntensity ?? 1;
        mat.side = preset.transmission ? THREE.DoubleSide : THREE.FrontSide;
      };

      const resetPhysical = () => {
        mat.transparent = false;
        mat.opacity = 1;
        mat.clearcoat = 0;
        mat.clearcoatRoughness = 0;
        mat.transmission = 0;
        mat.thickness = 0;
        mat.ior = 1.5;
        mat.envMapIntensity = 1;
        mat.side = THREE.FrontSide;
      };

      const restoreOriginal = (orig: NonNullable<typeof original>) => {
        mat.roughness = orig.roughness;
        mat.metalness = orig.metalness;
        mat.transparent = orig.transparent;
        mat.opacity = orig.opacity;
        mat.clearcoat = orig.clearcoat;
        mat.clearcoatRoughness = orig.clearcoatRoughness;
        mat.transmission = 0;
        mat.thickness = 0;
        mat.ior = 1.5;
        mat.envMapIntensity = 1;
        mat.side = THREE.FrontSide;
      };

      // 检查该部件是否有单独配置
      const partConfig = config.parts?.[mesh.name];
      const partFinish = partConfig?.finish;
      const globalFinish = config.surfaceFinish;
      const activeFinish = partFinish || globalFinish;
      const original = originalMaterials.current.get(mesh.name);

      if (partConfig) {
        mat.color = new THREE.Color(partConfig.color);
        if (activeFinish) {
          applyPreset(SURFACE_FINISH_PRESETS[activeFinish]);
        } else {
          resetPhysical();
        }
        mat.needsUpdate = true;
      } else if (preserveMaterials && !config.color && !activeFinish) {
        if (original) {
          mat.color.copy(original.color);
          restoreOriginal(original);
          mat.needsUpdate = true;
        }
      } else {
        if (config.color) {
          mat.color = new THREE.Color(config.color);
        } else if (original) {
          mat.color.copy(original.color);
        }
        if (activeFinish) {
          applyPreset(SURFACE_FINISH_PRESETS[activeFinish]);
        } else if (original) {
          restoreOriginal(original);
        }
        mat.needsUpdate = true;
      }
    });
  }, [config, preserveMaterials]);

  return (
    <group ref={meshRef}>
      <primitive object={clonedScene} />
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
      {/* 仅 HDR 环境光照明，降低强度防止过曝 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.7} />
      <directionalLight position={[-8, 5, 3]} intensity={0.5} />
      <directionalLight position={[-6, 2, 6]} intensity={0.4} />
      <directionalLight position={[0, 3, 8]} intensity={0.5} />
      <Environment files={LOCAL_ENVIRONMENT_MAP} background={false} environmentIntensity={0.3} />

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
        gl={{ toneMapping: THREE.LinearToneMapping, toneMappingExposure: 1 }}
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
