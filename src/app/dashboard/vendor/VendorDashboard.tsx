'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileBox, LogOut, Boxes, X } from 'lucide-react';
import type { Profile, Product } from '@/types/database';
import MyModels from './components/MyModels';
import ProductList from './components/ProductList';
import ProductCreator from './components/ProductCreator';
import ProductEditor from './components/product-editor';
import ModelUploadArea from './components/ModelUploadArea';

interface VendorDashboardProps {
  profile: Profile;
}

type Tab = 'overview' | 'products' | 'models' | 'create-product' | 'edit-product';

export default function VendorDashboard({ profile }: VendorDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 获取产品列表
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data?.data?.products || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">厂家后台</h1>
            <p className="text-sm text-gray-600">{profile.company_name || profile.email}</p>
          </div>
          <div className="flex items-center gap-4">
            {profile.is_verified && (
              <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                已认证
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Package className="h-5 w-5" />
                <span>总览</span>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'products'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <FileBox className="h-5 w-5" />
                <span>产品管理</span>
              </button>
              <button
                onClick={() => setActiveTab('models')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'models'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Boxes className="h-5 w-5" />
                <span>我的模型</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{products.length}</CardTitle>
                      <CardDescription>产品总数</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">
                        {products.filter((p) => p.status === 'published').length}
                      </CardTitle>
                      <CardDescription>上架中</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">
                        {products.filter(p => p.status === 'draft').length}
                      </CardTitle>
                      <CardDescription>草稿</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>快速开始</CardTitle>
                    <CardDescription>按照以下步骤开始销售您的产品</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">上传3D模型</h4>
                        <p className="text-sm text-gray-600">
                          上传您的 .glb 或 .gltf 格式的3D模型文件
                        </p>
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => setShowUploadModal(true)}
                        >
                          立即上传
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">创建产品</h4>
                        <p className="text-sm text-gray-600">
                          填写产品信息，上传3D模型并设置默认材质
                        </p>
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => setActiveTab('products')}
                        >
                          管理产品
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">上架销售</h4>
                        <p className="text-sm text-gray-600">
                          在产品管理中将状态改为"上架"，买家即可浏览您的产品
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'models' && (
              <MyModels vendorId={profile.id} />
            )}

            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">产品管理</h2>
                  <Button onClick={() => setActiveTab('create-product')}>
                    创建新产品
                  </Button>
                </div>
                <ProductList
                  products={products}
                  onUpdate={loadData}
                  onEdit={(product) => {
                    setEditingProduct(product);
                    setActiveTab('edit-product');
                  }}
                />
              </div>
            )}

            {activeTab === 'create-product' && (
              <ProductCreator
                vendorId={profile.id}
                onSuccess={() => {
                  loadData();
                  setActiveTab('products');
                }}
                onCancel={() => setActiveTab('products')}
              />
            )}

            {activeTab === 'edit-product' && editingProduct && (
              <ProductEditor
                product={editingProduct}
                onSuccess={() => {
                  loadData();
                  setEditingProduct(null);
                  setActiveTab('products');
                }}
                onCancel={() => {
                  setEditingProduct(null);
                  setActiveTab('products');
                }}
              />
            )}
          </main>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">上传 3D 模型</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowUploadModal(false)}
                aria-label="关闭上传弹窗"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <ModelUploadArea
                vendorId={profile.id}
                onUploaded={async () => {
                  setShowUploadModal(false);
                  await loadData();
                  setActiveTab('models');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
