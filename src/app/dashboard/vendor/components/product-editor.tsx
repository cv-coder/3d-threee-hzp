'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MaterialConfig, Product } from '@/types/database';

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
  });

  const initialMaterialConfig = useMemo<MaterialConfig>(() => {
    const existing = (product as any).material_config || product.config_defaults;
    return {
      color: existing?.color || '#ffffff',
      roughness: existing?.roughness ?? 0.3,
      metalness: existing?.metalness ?? 0.1,
    };
  }, [product]);

  const [materialConfig, setMaterialConfig] = useState<MaterialConfig>(initialMaterialConfig);

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
          material_config: materialConfig,
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
          <CardDescription>修改产品信息和默认材质配置</CardDescription>
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
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-lg">默认材质配置</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">默认颜色</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={materialConfig.color}
                    onChange={(e) => setMaterialConfig({ ...materialConfig, color: e.target.value })}
                    className="h-10 w-20"
                  />
                  <Input
                    value={materialConfig.color}
                    onChange={(e) => setMaterialConfig({ ...materialConfig, color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roughness">粗糙度 (0-1)</Label>
                <Input
                  id="roughness"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={materialConfig.roughness}
                  onChange={(e) =>
                    setMaterialConfig({
                      ...materialConfig,
                      roughness: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metalness">金属度 (0-1)</Label>
                <Input
                  id="metalness"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={materialConfig.metalness}
                  onChange={(e) =>
                    setMaterialConfig({
                      ...materialConfig,
                      metalness: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>
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
