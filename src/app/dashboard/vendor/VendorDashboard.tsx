'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Upload, FileBox, LogOut, Settings } from 'lucide-react';
import type { Profile, Product, Asset } from '@/types/database';
import ModelUpload from './components/ModelUpload';
import ProductList from './components/ProductList';
import ProductCreator from './components/ProductCreator';

interface VendorDashboardProps {
  profile: Profile;
}

type Tab = 'overview' | 'products' | 'upload' | 'create-product';

export default function VendorDashboard({ profile }: VendorDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    const [productsRes, assetsRes] = await Promise.all([
      supabase.from('products').select('*').eq('vendor_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('assets').select('*').eq('vendor_id', profile.id).eq('status', 'ready').order('created_at', { ascending: false }),
    ]);

    if (productsRes.data) setProducts(productsRes.data);
    if (assetsRes.data) setAssets(assetsRes.data);
    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">商家后台</h1>
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
                onClick={() => setActiveTab('upload')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Upload className="h-5 w-5" />
                <span>上传模型</span>
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
                        {products.filter(p => p.status === 'active').length}
                      </CardTitle>
                      <CardDescription>上架中</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{assets.length}</CardTitle>
                      <CardDescription>3D模型</CardDescription>
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
                          onClick={() => setActiveTab('upload')}
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
                          选择已上传的模型，填写产品信息并设置默认材质
                        </p>
                        {assets.length > 0 && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => setActiveTab('create-product')}
                          >
                            创建产品
                          </Button>
                        )}
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

            {activeTab === 'upload' && (
              <ModelUpload vendorId={profile.id} onUploadComplete={loadData} />
            )}

            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">产品管理</h2>
                  <Button onClick={() => setActiveTab('create-product')}>
                    创建新产品
                  </Button>
                </div>
                <ProductList products={products} onUpdate={loadData} />
              </div>
            )}

            {activeTab === 'create-product' && (
              <ProductCreator
                vendorId={profile.id}
                assets={assets}
                onSuccess={() => {
                  loadData();
                  setActiveTab('products');
                }}
                onCancel={() => setActiveTab('products')}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
