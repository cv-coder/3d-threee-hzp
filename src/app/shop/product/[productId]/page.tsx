import { db } from '@/lib/db';
import { getPublicUrl } from '@/lib/s3';
import { notFound } from 'next/navigation';
import ProductConfigurator from './ProductConfigurator';

interface ProductPageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ designId?: string }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { productId } = await params;
  const { designId } = await searchParams;

  // 获取产品信息（包含厂家信息）
  const product = await db.findOne<any>(
    `SELECT 
      p.*,
      v.id as vendor_id,
      v.email as vendor_email,
      v.company_name as vendor_company_name,
      v.is_verified as vendor_is_verified
    FROM products p
    LEFT JOIN profiles v ON p.vendor_id = v.id
    WHERE p.id = $1 AND p.status = 'published'`,
    [productId]
  );

  if (!product) {
    notFound();
  }

  // 组装 vendor 对象
  const productWithVendor = {
    ...product,
    vendor: {
      id: product.vendor_id,
      email: product.vendor_email,
      company_name: product.vendor_company_name,
      is_verified: product.vendor_is_verified,
    },
  };

  // 异步增加浏览次数（不等待完成）
  db.update(
    `UPDATE products SET views_count = views_count + 1 WHERE id = $1`,
    [productId]
  ).catch(console.error);

  // 如果有 designId，查询保存的设计方案配置
  let savedConfig = null;
  if (designId) {
    const design = await db.findOne<any>(
      `SELECT config_json FROM design_sessions WHERE id = $1`,
      [designId]
    );
    if (design?.config_json) {
      savedConfig = typeof design.config_json === 'string'
        ? JSON.parse(design.config_json)
        : design.config_json;
    }
  }

  // 获取模型 URL
  let modelUrl = product.model_url;
  if (!modelUrl && product.model_asset_id) {
    // 从 MinIO 获取公开 URL
    modelUrl = getPublicUrl('3d-models', `${productId}/model.glb`);
  }

  return (
    <ProductConfigurator
      key={Date.now()}
      product={productWithVendor}
      modelUrl={modelUrl}
      savedConfig={savedConfig}
      designId={designId}
    />
  );
}
