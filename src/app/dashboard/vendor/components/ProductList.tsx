'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatPrice } from '@/lib/utils';
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import type { Product } from '@/types/database';

const Configurator3D = dynamic(
  () => import('@/components/3d/Configurator3D'),
  { ssr: false }
);

interface ProductListProps {
  products: Product[];
  onUpdate: () => void;
  onEdit: (product: Product) => void;
}

function resolveModelUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const baseUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';
  const normalized = path.replace(/^\/+/, '');

  if (normalized.startsWith('3d-models/')) {
    return `${baseUrl}/${normalized}`;
  }

  if (normalized.startsWith('models/')) {
    return `${baseUrl}/3d-models/${normalized.slice('models/'.length)}`;
  }

  return `${baseUrl}/3d-models/${normalized}`;
}

export default function ProductList({ products, onUpdate, onEdit }: ProductListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const previewModelUrl = resolveModelUrl(previewProduct?.model_url);

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    setLoading(productId);
    
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    } finally {
      setLoading(null);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    
    setLoading(productId);
    
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Delete product error:', error);
    } finally {
      setLoading(null);
    }
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">还没有产品，快去创建吧！</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-gray-400 text-3xl">📦</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description || '暂无描述'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        product.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : product.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.status === 'published'
                        ? '上架中'
                        : product.status === 'draft'
                        ? '草稿'
                        : '已下架'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">价格：</span>
                    <span className="font-semibold ml-1">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">MOQ：</span>
                    <span className="font-semibold ml-1">{product.moq}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">浏览：</span>
                    <span className="font-semibold ml-1">{product.views_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">创建：</span>
                    <span className="ml-1">{formatDate(product.created_at)}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
                  {product.accessory_category && (
                    <span className="rounded-full bg-gray-100 px-3 py-1">分类：{product.accessory_category}</span>
                  )}
                  {product.capacity && (
                    <span className="rounded-full bg-gray-100 px-3 py-1">容量：{product.capacity}</span>
                  )}
                  {product.material && (
                    <span className="rounded-full bg-gray-100 px-3 py-1">材料：{product.material}</span>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleProductStatus(product.id, product.status)}
                    disabled={loading === product.id}
                  >
                    {product.status === 'published' ? (
                      <>
                        <ToggleRight className="h-4 w-4 mr-1" />
                        下架
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-1" />
                        上架
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewProduct(product)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    预览
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteProduct(product.id)}
                    disabled={loading === product.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {previewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className="w-full max-w-6xl rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewProduct.name}</h3>
                <p className="text-sm text-gray-500">产品 3D 预览</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPreviewProduct(null)}
                aria-label="关闭预览弹窗"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-5">
              <div className="relative h-[60vh] min-h-[420px] rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {previewModelUrl ? (
                  <Configurator3D
                    modelUrl={previewModelUrl}
                    config={previewProduct.config_defaults || {}}
                    className="h-full w-full"
                    preserveMaterials
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <div className="text-5xl text-gray-300">📦</div>
                      <p className="mt-3 text-gray-500">该产品暂未绑定 3D 模型</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
