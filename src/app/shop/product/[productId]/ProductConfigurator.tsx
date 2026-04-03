'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MaterialControls from '@/components/3d/MaterialControls';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Save, Send, Building2, LogOut, User } from 'lucide-react';
import type { Product, Profile, MaterialConfig, ModelPart } from '@/types/database';

// 动态导入3D组件（避免SSR问题）
const Configurator3D = dynamic(
  () => import('@/components/3d/Configurator3D'),
  { ssr: false }
);

interface ProductConfiguratorProps {
  product: Product & {
    vendor?: Profile;
    model_asset?: any;
  };
  modelUrl?: string;
  savedConfig?: MaterialConfig | null;
  designId?: string;
}

export default function ProductConfigurator({
  product,
  modelUrl,
  savedConfig,
  designId,
}: ProductConfiguratorProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const [config, setConfig] = useState<MaterialConfig>(() => {
    // 如果有保存的设计方案，优先使用
    if (savedConfig) return savedConfig;
    let raw = (product as any).material_config || product.config_defaults || {};
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = {}; }
    }
    return raw;
  });
  const [userModified, setUserModified] = useState(false);
  const [modelParts, setModelParts] = useState<ModelPart[]>([]);
  const [saving, setSaving] = useState(false);
  const [inquiring, setInquiring] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    quantity: product.moq.toString(),
    message: '',
  });

  const handleSaveDesign = async () => {
    if (!user) {
      alert('请先登录以保存设计方案');
      router.push('/login');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/design/save', {
        method: designId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: designId,
          product_id: product.id,
          session_name: `${product.name} - 定制方案`,
          config_json: config,
          status: 'saved',
        }),
      });

      if (!res.ok) {
        throw new Error('保存失败');
      }

      alert(designId ? '设计方案已更新！' : '设计方案已保存！');
    } catch (error) {
      console.error('Save design error:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleInquiry = async () => {
    if (!user) {
      alert('请先登录以发起询价');
      router.push('/login');
      return;
    }

    if (user.role !== 'buyer') {
      alert('只有买家账号可以发起询价');
      return;
    }

    setInquiring(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: product.vendor_id,
          product_id: product.id,
          quantity: parseInt(inquiryData.quantity),
          message: inquiryData.message,
          config_json: config,
        }),
      });

      if (!res.ok) {
        throw new Error('询价失败');
      }

      alert('询价请求已发送！厂家会尽快回复您。');
      setShowInquiryForm(false);
      setInquiryData({ quantity: product.moq.toString(), message: '' });
    } catch (error) {
      console.error('Inquiry error:', error);
      alert('询价失败，请重试');
    } finally {
      setInquiring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href={designId ? '/dashboard/buyer?tab=designs' : '/shop'}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {designId ? '返回我的设计' : '返回展厅'}
            </Button>
          </Link>
          <Link href="/">
            <h1 className="text-xl font-bold text-blue-600">
              Aether3D
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            {status === 'authenticated' && user ? (
              <>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {user.role === 'vendor' ? '厂家' : user.role === 'admin' ? '管理员' : '买家'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/shop' })}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm">登录</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左侧：3D预览 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                  {modelUrl ? (
                    <Configurator3D
                      modelUrl={modelUrl}
                      config={config}
                      preserveMaterials={!userModified}
                      onPartsDetected={setModelParts}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-500">3D模型加载中...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Guest Mode Watermark */}
                  {!user && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                      <Link href="/login" className="hover:underline">
                        登录以保存方案 →
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 产品信息 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{product.name}</CardTitle>
                    {product.vendor && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{product.vendor.company_name || '未命名厂家'}</span>
                        {product.vendor.is_verified && (
                          <span className="text-green-600">✓ 已认证</span>
                        )}
                      </div>
                    )}
                  </div>
                  {product.price && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(product.price)}
                      </div>
                      <div className="text-sm text-gray-500">起订量: {product.moq}</div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">
                  {product.description || '暂无详细描述'}
                </p>
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：材质控制和操作 */}
          <div className="space-y-6">
            <MaterialControls
              config={config}
              onChange={(c) => { setUserModified(true); setConfig(c); }}
              onReset={() => setUserModified(false)}
              parts={modelParts}
              disabled={!modelUrl}
            />

            {/* 操作按钮 */}
            <Card>
              <CardHeader>
                <CardTitle>操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSaveDesign}
                  disabled={saving || status !== 'authenticated' || !user}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '保存中...' : '保存设计方案'}
                </Button>
                
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => setShowInquiryForm(true)}
                  disabled={status !== 'authenticated' || !user || user.role !== 'buyer'}
                >
                  <Send className="h-4 w-4 mr-2" />
                  发起询价
                </Button>

                {(status === 'unauthenticated' || (status !== 'loading' && !user)) && (
                  <p className="text-xs text-center text-gray-500">
                    登录后可保存方案和发起询价
                  </p>
                )}
                
                {status === 'authenticated' && user?.role === 'vendor' && (
                  <p className="text-xs text-center text-red-500">
                    厂家账号不能发起询价
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 询价表单 */}
            {showInquiryForm && (
              <Card>
                <CardHeader>
                  <CardTitle>发起询价</CardTitle>
                  <CardDescription>告诉厂家您的需求</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">订购数量 *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={product.moq}
                      value={inquiryData.quantity}
                      onChange={(e) =>
                        setInquiryData({ ...inquiryData, quantity: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      最小起订量: {product.moq}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">留言</Label>
                    <Textarea
                      id="message"
                      value={inquiryData.message}
                      onChange={(e) =>
                        setInquiryData({ ...inquiryData, message: e.target.value })
                      }
                      placeholder="请描述您的需求、交期要求等..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleInquiry}
                      disabled={inquiring}
                    >
                      {inquiring ? '提交中...' : '提交询价'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowInquiryForm(false)}
                    >
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
