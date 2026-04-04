'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ModelSelector from '@/components/vendor/ModelSelector';
import { ACCESSORY_CATEGORY_OPTIONS } from '@/lib/product-options';
import type { AccessoryCategory, MaterialConfig, ModelPart, SurfaceFinishType } from '@/types/database';

const Configurator3D = dynamic(
  () => import('@/components/3d/Configurator3D'),
  { ssr: false }
);

const SURFACE_FINISH_OPTIONS: Array<{ value: SurfaceFinishType; label: string }> = [
  { value: 'injection-color', label: '注塑色' },
  { value: 'paint-matte', label: '喷漆哑' },
  { value: 'electroplated-glossy', label: '电镀亮' },
  { value: 'electroplated-matte', label: '电镀哑' },
  { value: 'glass', label: '玻璃' },
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

interface ProductCreatorProps {
  vendorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductCreator({
  vendorId,
  onSuccess,
  onCancel,
}: ProductCreatorProps) {
  const [loading, setLoading] = useState(false);
  const [accessoryCategories, setAccessoryCategories] = useState<string[]>([...ACCESSORY_CATEGORY_OPTIONS]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accessory_category: '',
    capacity: '',
    material: '',
    price: '',
    moq: '1000',
    tags: '',
    model_url: '',
  });
  const [modelParts, setModelParts] = useState<ModelPart[]>([]);
  const [partFinishes, setPartFinishes] = useState<Record<string, SurfaceFinishType[]>>({});

  const modelUrl = resolveModelUrl(formData.model_url);

  useEffect(() => {
    let active = true;

    const loadAccessoryCategories = async () => {
      try {
        const res = await fetch('/api/accessory-categories');
        if (!res.ok) return;

        const data = await res.json();
        const names = (data?.data?.categories || [])
          .map((category: AccessoryCategory) => category.name)
          .filter(Boolean);

        if (active && names.length > 0) {
          setAccessoryCategories(names);
        }
      } catch (error) {
        console.error('Load accessory categories error:', error);
      }
    };

    loadAccessoryCategories();

    return () => {
      active = false;
    };
  }, []);

  const handlePartsDetected = useCallback((parts: ModelPart[]) => {
    setModelParts(parts);
    setPartFinishes((prev) => {
      const next: Record<string, SurfaceFinishType[]> = {};
      for (const part of parts) {
        next[part.name] = part.name in prev
          ? prev[part.name]
          : ['injection-color', 'paint-matte', 'electroplated-glossy', 'electroplated-matte', 'glass'];
      }
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          accessory_category: formData.accessory_category || null,
          capacity: formData.capacity || null,
          material: formData.material || null,
          price: parseFloat(formData.price) || null,
          moq: parseInt(formData.moq, 10) || 1000,
          status: 'draft',
          config_defaults: (() => {
            const config: MaterialConfig = {};
            if (Object.keys(partFinishes).length > 0) {
              config.partSurfaceOptions = partFinishes;
            }
            return config;
          })(),
          tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()) : [],
          model_url: formData.model_url || null,
          vendorId,
        }),
      });

      if (!res.ok) {
        throw new Error('创建失败');
      }

      alert('产品创建成功！');
      onSuccess();
    } catch (error) {
      console.error('Create product error:', error);
      alert('创建产品失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>创建新产品</CardTitle>
          <CardDescription>填写产品信息并配置不同部件可选表面工艺</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本信息</h3>

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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="accessory_category">配件分类</Label>
                <Select
                  value={formData.accessory_category}
                  onValueChange={(value) => setFormData({ ...formData, accessory_category: value })}
                >
                  <SelectTrigger id="accessory_category">
                    <SelectValue placeholder="请选择配件分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessoryCategories.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">容量</Label>
                <Input
                  id="capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="例如：500ml"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">材料</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="例如：PET、PP、玻璃"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                上传模型后可在产品编辑中补充或替换模型文件
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                if (!url) {
                  setModelParts([]);
                  setPartFinishes({});
                }
              }}
              disabled={loading}
            />

            {modelUrl && (
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200" style={{ height: 280 }}>
                <Configurator3D
                  modelUrl={modelUrl}
                  config={{}}
                  preserveMaterials
                  onPartsDetected={handlePartsDetected}
                />
                <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-500">
                  模型预览 · 检测到 {modelParts.length} 个部件
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">部件可选表面工艺</h3>

            {modelParts.length === 0 ? (
              <p className="text-sm text-gray-500">请先选择 3D 模型以自动检测部件</p>
            ) : (
              <div className="space-y-3">
                {modelParts.map((part) => {
                  const finishes = partFinishes[part.name] || [];
                  return (
                    <div key={part.name} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 shrink-0 rounded border" style={{ backgroundColor: part.color }} />
                        <span className="text-sm font-medium">{part.displayName}</span>
                        <span className="text-xs text-gray-400">({part.name})</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {SURFACE_FINISH_OPTIONS.map((option) => {
                          const checked = finishes.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setPartFinishes((prev) => {
                                    const current = prev[part.name] || [];
                                    const next = e.target.checked
                                      ? Array.from(new Set([...current, option.value]))
                                      : current.filter((finish) => finish !== option.value);
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

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '创建中...' : '创建产品'}
        </Button>
      </div>
    </form>
  );
}
