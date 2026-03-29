'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ModelSelector from '@/components/vendor/ModelSelector';
import type { MaterialConfig } from '@/types/database';

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    moq: '1000',
    tags: '',
    model_url: '',
  });

  const [materialConfig, setMaterialConfig] = useState<MaterialConfig>({
    color: '#ffffff',
    roughness: 0.3,
    metalness: 0.1,
  });

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
          price: parseFloat(formData.price) || null,
          moq: parseInt(formData.moq) || 1000,
          status: 'draft',
          config_defaults: materialConfig,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          model_url: formData.model_url || null,
        }),
      });

      if (!res.ok) throw new Error('创建失败');

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
              <p className="text-sm text-gray-600">
                上传模型后可在产品编辑中补充或替换模型文件
              </p>
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
              onChange={(url) => setFormData({ ...formData, model_url: url })}
              disabled={loading}
            />
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
        <Button type="submit" disabled={loading}>
          {loading ? '创建中...' : '创建产品'}
        </Button>
      </div>
    </form>
  );
}
