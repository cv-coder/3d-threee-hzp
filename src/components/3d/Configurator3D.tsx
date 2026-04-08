'use client';

import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Center, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three-stdlib';
import * as THREE from 'three';
import type { MaterialConfig, ModelPart, SurfaceFinishType } from '@/types/database';

const LOCAL_ENVIRONMENT_MAP = '/hdr/studio_small_03_1k.hdr';

// Reuse one DRACOLoader instance globally.
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
dracoLoader.setDecoderConfig({ type: 'js' });

const SURFACE_FINISH_PRESETS: Record<SurfaceFinishType, { roughness: number; metalness: number; transparent?: boolean; opacity?: number; clearcoat?: number; clearcoatRoughness?: number; transmission?: number; thickness?: number; envMapIntensity?: number; ior?: number }> = {
  'injection-color': { roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0, envMapIntensity: 1, transmission: 0 },
  'paint-matte': { roughness: 0.5, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.5 },
  'electroplated-glossy': { roughness: 0.08, metalness: 1, envMapIntensity: 1, transmission: 0 },
  'electroplated-matte': { roughness: 0.3, metalness: 1, clearcoat: 0, clearcoatRoughness: 0, envMapIntensity: 0.9, transmission: 0 },
  'glass': { roughness: 0, metalness: 0.25, transmission: 1, thickness: 2, envMapIntensity: 4, clearcoat: 0, clearcoatRoughness: 0, ior: 1.5 },
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

  // Clone scene to avoid mutating useLoader cache.
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf]);

  type OriginalMaterialSnapshot = {
    material: THREE.Material | THREE.Material[];
    color: THREE.Color;
    roughness: number;
    metalness: number;
    transparent: boolean;
    opacity: number;
    clearcoat: number;
    clearcoatRoughness: number;
    transmission: number;
    thickness: number;
    ior: number;
    envMapIntensity: number;
    side: THREE.Side;
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
  };

  const meshRef = useRef<THREE.Group>(null);
  const originalMaterials = useRef<Map<string, OriginalMaterialSnapshot>>(new Map());
  const partsReported = useRef(false);

  const getPrimaryMaterial = (material: THREE.Material | THREE.Material[]) => {
    return Array.isArray(material) ? material[0] : material;
  };

  const toMaterialSnapshot = (material: THREE.Material | THREE.Material[]): OriginalMaterialSnapshot => {
    const primary = getPrimaryMaterial(material);
    const stdLike = primary as THREE.MeshStandardMaterial | undefined;
    const physLike = primary as THREE.MeshPhysicalMaterial | undefined;

    return {
      material,
      color: stdLike?.color?.clone?.() ?? new THREE.Color(0xffffff),
      roughness: typeof stdLike?.roughness === 'number' ? stdLike.roughness : 0.5,
      metalness: typeof stdLike?.metalness === 'number' ? stdLike.metalness : 0,
      transparent: !!stdLike?.transparent,
      opacity: typeof stdLike?.opacity === 'number' ? stdLike.opacity : 1,
      clearcoat: typeof physLike?.clearcoat === 'number' ? physLike.clearcoat : 0,
      clearcoatRoughness: typeof physLike?.clearcoatRoughness === 'number' ? physLike.clearcoatRoughness : 0,
      transmission: typeof physLike?.transmission === 'number' ? physLike.transmission : 0,
      thickness: typeof physLike?.thickness === 'number' ? physLike.thickness : 0,
      ior: typeof physLike?.ior === 'number' ? physLike.ior : 1.5,
      envMapIntensity: typeof stdLike?.envMapIntensity === 'number' ? stdLike.envMapIntensity : 1,
      side: typeof stdLike?.side === 'number' ? stdLike.side : THREE.FrontSide,
      map: stdLike?.map ?? null,
      normalMap: stdLike?.normalMap ?? null,
    };
  };

  const createPhysicalMaterial = (
    material: THREE.Material | undefined,
    original: OriginalMaterialSnapshot
  ) => {
    const stdLike = material as THREE.MeshStandardMaterial | undefined;
    return new THREE.MeshPhysicalMaterial({
      color: stdLike?.color?.clone?.() ?? original.color.clone(),
      roughness: typeof stdLike?.roughness === 'number' ? stdLike.roughness : original.roughness,
      metalness: typeof stdLike?.metalness === 'number' ? stdLike.metalness : original.metalness,
      transparent: typeof stdLike?.transparent === 'boolean' ? stdLike.transparent : original.transparent,
      opacity: typeof stdLike?.opacity === 'number' ? stdLike.opacity : original.opacity,
      clearcoat: original.clearcoat,
      clearcoatRoughness: original.clearcoatRoughness,
      transmission: original.transmission,
      thickness: original.thickness,
      ior: original.ior,
      envMapIntensity: original.envMapIntensity,
      map: stdLike?.map ?? original.map,
      normalMap: stdLike?.normalMap ?? original.normalMap,
      side: typeof stdLike?.side === 'number' ? stdLike.side : original.side,
    });
  };

  const ensurePhysicalMaterials = (mesh: THREE.Mesh, original: OriginalMaterialSnapshot) => {
    if (Array.isArray(mesh.material)) {
      const converted = mesh.material.map((mat) => (
        mat instanceof THREE.MeshPhysicalMaterial ? mat : createPhysicalMaterial(mat, original)
      ));
      mesh.material = converted;
      return converted;
    }

    if (mesh.material instanceof THREE.MeshPhysicalMaterial) {
      return [mesh.material];
    }

    const converted = createPhysicalMaterial(mesh.material, original);
    mesh.material = converted;
    return [converted];
  };

  const disposeMaterialIfOwned = (material: THREE.Material | THREE.Material[]) => {
    const list = Array.isArray(material) ? material : [material];
    for (const mat of list) {
      if (mat instanceof THREE.MeshPhysicalMaterial) {
        mat.dispose();
      }
    }
  };

  // On first load, snapshot original materials and report parts.
  useEffect(() => {
    if (!meshRef.current) return;

    originalMaterials.current.clear();
    partsReported.current = false;

    const parts: ModelPart[] = [];
    let meshIndex = 0;

    meshRef.current.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      if (!mesh.name) {
        mesh.name = `part_${meshIndex}`;
      }
      meshIndex++;

      const snapshot = toMaterialSnapshot(mesh.material);
      originalMaterials.current.set(mesh.name, snapshot);

      parts.push({
        name: mesh.name,
        displayName: mesh.name.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        color: '#' + snapshot.color.getHexString(),
      });
    });

    if (!partsReported.current && parts.length > 0) {
      partsReported.current = true;
      onPartsDetected?.(parts);
    }
  }, [clonedScene, onPartsDetected]);

  useEffect(() => {
    if (!meshRef.current) return;

    meshRef.current.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      if (!mesh.material) return;

      const original = originalMaterials.current.get(mesh.name);
      if (!original) return;

      // Strictly preserve original materials until user has interacted.
      if (preserveMaterials) {
        if (mesh.material !== original.material) {
          disposeMaterialIfOwned(mesh.material);
          mesh.material = original.material;
        }
        return;
      }

      const materials = ensurePhysicalMaterials(mesh, original);

      const applyToAll = (updater: (mat: THREE.MeshPhysicalMaterial) => void) => {
        for (const mat of materials) {
          updater(mat);
          mat.needsUpdate = true;
        }
      };

      const applyPreset = (mat: THREE.MeshPhysicalMaterial, preset: typeof SURFACE_FINISH_PRESETS[SurfaceFinishType]) => {
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

      const restoreOriginal = (mat: THREE.MeshPhysicalMaterial, orig: OriginalMaterialSnapshot) => {
        mat.roughness = orig.roughness;
        mat.metalness = orig.metalness;
        mat.transparent = orig.transparent;
        mat.opacity = orig.opacity;
        mat.clearcoat = orig.clearcoat;
        mat.clearcoatRoughness = orig.clearcoatRoughness;
        mat.transmission = orig.transmission;
        mat.thickness = orig.thickness;
        mat.ior = orig.ior;
        mat.envMapIntensity = orig.envMapIntensity;
        mat.side = orig.side;
      };

      const partConfig = config.parts?.[mesh.name];
      const partFinish = partConfig?.finish;
      const globalFinish = config.surfaceFinish;
      const activeFinish = partFinish || globalFinish;

      if (partConfig) {
        applyToAll((mat) => {
          mat.color.set(partConfig.color);
          if (activeFinish) {
            applyPreset(mat, SURFACE_FINISH_PRESETS[activeFinish]);
          } else {
            restoreOriginal(mat, original);
          }
        });
        return;
      }

      applyToAll((mat) => {
        if (config.color) {
          mat.color.set(config.color);
        } else {
          mat.color.copy(original.color);
        }

        if (activeFinish) {
          applyPreset(mat, SURFACE_FINISH_PRESETS[activeFinish]);
        } else {
          restoreOriginal(mat, original);
        }
      });
    });
  }, [config, preserveMaterials, clonedScene]);

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

/** Auto-fit camera to model bounds after the model loads. */
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
      {/* Lighting setup */}
      <ambientLight intensity={0.28} />
      <directionalLight position={[5, 8, 5]} intensity={0.45} />
      <directionalLight position={[-8, 5, 3]} intensity={0.3} />
      <directionalLight position={[-6, 2, 6]} intensity={0.22} />
      <directionalLight position={[0, 3, 8]} intensity={0.28} />
      <Environment files={LOCAL_ENVIRONMENT_MAP} background={false} environmentIntensity={0.65} />

      {/* 3D model, auto-centered */}
      <group ref={groupRef}>
        <Center>
          <Model modelUrl={modelUrl} config={config} preserveMaterials={preserveMaterials} onPartsDetected={onPartsDetected} />
        </Center>
      </group>

      {/* Auto-fit camera */}
      <AutoFit modelRef={groupRef} />

      {/* Controls */}
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
        gl={{ toneMapping: THREE.LinearToneMapping, toneMappingExposure: 1.0 }}
        onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; }}
      >
        <Suspense fallback={null}>
          <SceneContent modelUrl={modelUrl} config={config} preserveMaterials={preserveMaterials} onPartsDetected={onPartsDetected} />
        </Suspense>
      </Canvas>

      {/* Viewer hint */}
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <div className="bg-white/90 px-3 py-1.5 rounded-lg shadow-lg">
          <p className="text-xs text-gray-500">拖动旋转 • 滚轮缩放</p>
        </div>
      </div>
    </div>
  );
}

// Preload model
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
