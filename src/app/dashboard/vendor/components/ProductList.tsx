'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatPrice } from '@/lib/utils';
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Product } from '@/types/database';

interface ProductListProps {
  products: Product[];
  onUpdate: () => void;
}

export default function ProductList({ products, onUpdate }: ProductListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    setLoading(productId);
    const supabase = createClient();
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', productId);

    if (!error) {
      onUpdate();
    }
    setLoading(null);
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    
    setLoading(productId);
    const supabase = createClient();
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (!error) {
      onUpdate();
    }
    setLoading(null);
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
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : product.status === 'draft'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.status === 'active'
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

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleProductStatus(product.id, product.status)}
                    disabled={loading === product.id}
                  >
                    {product.status === 'active' ? (
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
                    onClick={() => window.open(`/shop/product/${product.id}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    预览
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
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
    </div>
  );
}
