import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { Building2, Package } from 'lucide-react';

export default async function ShopPage() {
  // 获取所有已认证的商家
  const vendors = await db.findMany<any>(
    `SELECT id, email, company_name, is_verified, created_at 
     FROM profiles 
     WHERE role = 'vendor' AND is_verified = true 
     ORDER BY created_at DESC`
  );

  // 获取所有上架的产品（包含商家信息）
  const products = await db.findMany<any>(
    `SELECT 
      p.*,
      v.company_name as vendor_company_name,
      v.email as vendor_email
     FROM products p
     LEFT JOIN profiles v ON p.vendor_id = v.id
     WHERE p.status = 'published'
     ORDER BY p.created_at DESC
     LIMIT 20`
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              3D包材选型系统
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
        {/* 商家展示 */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">认证厂商</h2>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vendors?.map((vendor) => (
              <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {vendor.company_name?.[0] || vendor.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {vendor.company_name || '未命名商家'}
                      </CardTitle>
                      {vendor.is_verified && (
                        <span className="text-xs text-green-600">✓ 已认证</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/shop/vendor/${vendor.id}`}>
                    <Button variant="outline" className="w-full">
                      查看店铺
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!vendors || vendors.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                暂无认证商家
              </CardContent>
            </Card>
          )}
        </section>

        {/* 产品展示 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">热门产品</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => (
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
                暂无上架产品
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t mt-24 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 3D包材选型系统. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
