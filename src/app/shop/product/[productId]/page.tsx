import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProductConfigurator from './ProductConfigurator';

interface ProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const supabase = await createClient();

  // 获取产品信息
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      vendor:profiles!products_vendor_id_fkey(*),
      model_asset:assets!products_model_asset_id_fkey(*)
    `)
    .eq('id', productId)
    .single();

  if (!product || product.status !== 'active') {
    notFound();
  }

  // 增加浏览次数
  await supabase
    .from('products')
    .update({ views_count: (product.views_count || 0) + 1 })
    .eq('id', productId);

  // 检查用户登录状态
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  // 获取模型URL
  let modelUrl = product.model_url;
  if (product.model_asset && !modelUrl) {
    const { data: { publicUrl } } = supabase.storage
      .from('3d-models')
      .getPublicUrl(product.model_asset.file_path);
    modelUrl = publicUrl;
  }

  return (
    <ProductConfigurator
      product={product}
      modelUrl={modelUrl}
      user={user}
      profile={profile}
    />
  );
}
