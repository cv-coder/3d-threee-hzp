import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, Package, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface VendorShopPageProps {
  params: Promise<{ vendorId: string }>;
}

export default async function VendorShopPage({ params }: VendorShopPageProps) {
  const { vendorId } = await params;

  // 获取厂家信息
  const vendor = await db.findOne<any>(
    `SELECT id, email, company_name, is_verified, created_at
     FROM profiles
     WHERE id = $1 AND role = 'vendor' AND is_verified = true`,
    [vendorId]
  );

  if (!vendor) {
    notFound();
  }

  // 获取该厂家的所有上架产品
  const products = await db.findMany<any>(
    `SELECT *
     FROM products
     WHERE vendor_id = $1 AND status = 'published'
     ORDER BY created_at DESC`,
    [vendorId]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Aether3D
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>注册</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link href="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4" />
          返回商城
        </Link>

        {/* 厂家信息卡片 */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0">
                {vendor.company_name?.[0] || vendor.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold truncate">
                    {vendor.company_name || '未命名厂家'}
                  </h2>
                  {vendor.is_verified && (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="h-4 w-4" />
                      已认证
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  入驻时间：{new Date(vendor.created_at).toLocaleDateString('zh-CN')}
                </p>
                <p className="text-gray-500 text-sm">
                  在售产品：{products?.length || 0} 件
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 产品列表 */}
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold">全部产品</h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map((product: any) => (
            <Link key={product.id} href={`/shop/product/${product.id}`}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">📦</span>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.description || '暂无描述'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      {product.price && (
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(product.price)}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        MOQ: {product.moq}
                      </div>
                    </div>
                    <Button size="sm">定制</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {(!products || products.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              该厂家暂无上架产品
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
