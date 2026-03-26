'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Asset, MaterialConfig } from '@/types/database';

interface ProductCreatorProps {
  vendorId: string;
  assets: Asset[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductCreator({
  vendorId,
  assets,
  onSuccess,
  onCancel,
}: ProductCreatorProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    model_asset_id: '',
    price: '',
    moq: '1000',
    tags: '',
  });

  const [materialConfig, setMaterialConfig] = useState<MaterialConfig>({
    color: '#ffffff',
    roughness: 0.3,
    metalness: 0.1,
    logoPosition: { x: 0, y: 0, z: 0.1 },
    logoScale: 0.5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.from('products').insert({
        vendor_id: vendorId,
        name: formData.name,
        description: formData.description,
        model_asset_id: formData.model_asset_id || null,
        price: parseFloat(formData.price) || null,
        moq: parseInt(formData.moq) || 1000,
        status: 'draft',
        config_defaults: materialConfig,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      });

      if (error) throw error;

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
          <CardDescription>填写产品信息并设置默认材质配置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 基本信息 */}
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

            <div className="space-y-2">
              <Label htmlFor="model">选择3D模型 *</Label>
              <select
                id="model"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.model_asset_id}
                onChange={(e) => setFormData({ ...formData, model_asset_id: e.target.value })}
                required
              >
                <option value="">请选择模型</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.file_name}
                  </option>
                ))}
              </select>
              {assets.length === 0 && (
                <p className="text-sm text-red-600">
                  还没有可用的模型，请先上传3D模型
                </p>
              )}
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

          {/* 默认材质配置 */}
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
                    onChange={(e) =>
                      setMaterialConfig({ ...materialConfig, color: e.target.value })
                    }
                    className="h-10 w-20"
                  />
                  <Input
                    value={materialConfig.color}
                    onChange={(e) =>
                      setMaterialConfig({ ...materialConfig, color: e.target.value })
                    }
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

            <p className="text-sm text-gray-600">
              这些配置将作为买家定制的初始值，买家可以在定制页面中修改
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading || assets.length === 0}>
          {loading ? '创建中...' : '创建产品'}
        </Button>
      </div>
    </form>
  );
}
