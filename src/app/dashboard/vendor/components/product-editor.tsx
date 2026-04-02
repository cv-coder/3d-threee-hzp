'use client';

import { useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ModelSelector from '@/components/vendor/ModelSelector';
import type { MaterialConfig, Product, SurfaceFinishType, ModelPart } from '@/types/database';

const Configurator3D = dynamic(
  () => import('@/components/3d/Configurator3D'),
  { ssr: false }
);

const SURFACE_FINISH_OPTIONS: Array<{ value: SurfaceFinishType; label: string }> = [
  { value: 'injection-color', label: '注塑色' },
  { value: 'paint-matte', label: '喷漆哑' },
  { value: 'electroplated-glossy', label: '电镀亮' },
  { value: 'electroplated-matte', label: '电镀哑' },
];

function resolveModelUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';
  const normalized = path.replace(/^\/+/, '');
  if (normalized.startsWith('3d-models/')) return `${baseUrl}/${normalized}`;
  if (normalized.startsWith('models/')) return `${baseUrl}/3d-models/${normalized.slice('models/'.length)}`;
  return `${baseUrl}/3d-models/${normalized}`;
}

interface ProductEditorProps {
  product: Product;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductEditor({ product, onSuccess, onCancel }: ProductEditorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price?.toString() || '',
    moq: product.moq?.toString() || '1000',
    tags: (product.tags || []).join(','),
    model_url: product.model_url || '',
  });

  // 从已有产品配置中恢复部件工艺
  const existingConfig = useMemo<MaterialConfig>(() => {
    let raw = (product as any).material_config || product.config_defaults || {};
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = {}; }
    }
    return raw;
  }, [product]);

  const [modelParts, setModelParts] = useState<ModelPart[]>([]);
  const [partFinishes, setPartFinishes] = useState<Record<string, SurfaceFinishType[]>>(
    existingConfig.partSurfaceOptions || {}
  );

  const modelUrl = resolveModelUrl(formData.model_url);

  const handlePartsDetected = useCallback((parts: ModelPart[]) => {
    setModelParts(parts);
    setPartFinishes((prev) => {
      const next: Record<string, SurfaceFinishType[]> = {};
      for (const part of parts) {
        next[part.name] = part.name in prev ? prev[part.name] : ['injection-color', 'paint-matte', 'electroplated-glossy', 'electroplated-matte'];
      }
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null,
          moq: parseInt(formData.moq) || 1000,
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          model_url: formData.model_url || null,
          material_config: (() => {
            const config: MaterialConfig = {};
            if (Object.keys(partFinishes).length > 0) {
              config.partSurfaceOptions = partFinishes;
            }
            return config;
          })(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '更新失败');
      }

      alert('产品更新成功！');
      onSuccess();
    } catch (error) {
      console.error('Update product error:', error);
      alert(error instanceof Error ? error.message : '更新产品失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>编辑产品</CardTitle>
          <CardDescription>修改产品信息和部件表面工艺</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">基本信息</h3>

            <div className="space-y-2">
              <Label htmlFor="name">产品名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：透明PET瓶 500ml"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">产品描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="详细描述产品特点、用途等..."
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">单价 (¥)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moq">最小起订量 (MOQ)</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">标签 (用逗号分隔)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="例如：透明,500ml,PET"
              />
            </div>

            <ModelSelector
              value={formData.model_url}
              onChange={(url) => {
                setFormData({ ...formData, model_url: url });
                if (!url) { setModelParts([]); setPartFinishes({}); }
              }}
              disabled={loading}
            />

            {/* 模型预览 & 部件检测 */}
            {modelUrl && (
              <div className="relative rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden" style={{ height: 280 }}>
                <Configurator3D
                  modelUrl={modelUrl}
                  config={{}}
                  preserveMaterials
                  onPartsDetected={handlePartsDetected}
                />
                <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-500">
                  模型预览 · 检测到 {modelParts.length} 个部件
                </div>
              </div>
            )}
          </div>

          {/* 部件表面工艺配置 */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-lg">部件可选表面工艺</h3>

            {modelParts.length === 0 ? (
              <p className="text-sm text-gray-500">请先选择 3D 模型以自动检测部件</p>
            ) : (
              <div className="space-y-3">
                {modelParts.map((part) => {
                  const finishes = partFinishes[part.name] || [];
                  return (
                    <div key={part.name} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded border shrink-0"
                          style={{ backgroundColor: part.color }}
                        />
                        <span className="font-medium text-sm">{part.displayName}</span>
                        <span className="text-xs text-gray-400">({part.name})</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {SURFACE_FINISH_OPTIONS.map((option) => {
                          const checked = finishes.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setPartFinishes((prev) => {
                                    const current = prev[part.name] || [];
                                    const next = e.target.checked
                                      ? Array.from(new Set([...current, option.value]))
                                      : current.filter((f) => f !== option.value);
                                    return { ...prev, [part.name]: next };
                                  });
                                }}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-gray-600">
              买家在产品定制页可按部件从这里配置的工艺中进行选择
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : '保存修改'}
        </Button>
      </div>
    </form>
  );
}
