-- ================================================
-- 3D包材SaaS平台 - Supabase 数据库初始化脚本
-- ================================================

-- 1. 创建枚举类型
-- ================================================

-- 用户角色
CREATE TYPE user_role AS ENUM ('vendor', 'buyer', 'admin');

-- 产品状态
CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive', 'archived');

-- 资产处理状态
CREATE TYPE asset_status AS ENUM ('uploading', 'processing', 'ready', 'failed');

-- 设计会话状态
CREATE TYPE design_status AS ENUM ('draft', 'saved', 'submitted');

-- 询价状态
CREATE TYPE inquiry_status AS ENUM ('pending', 'quoted', 'accepted', 'rejected', 'closed');


-- 2. 创建主表
-- ================================================

-- 用户资料表 (扩展 auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'buyer',
  email TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 profiles 创建索引
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_verified ON profiles(is_verified);

-- 资产表 (3D模型文件)
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  status asset_status DEFAULT 'uploading',
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 assets 创建索引
CREATE INDEX idx_assets_vendor ON assets(vendor_id);
CREATE INDEX idx_assets_status ON assets(status);

-- 产品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  model_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  model_url TEXT, -- 直接存储模型URL (备用)
  thumbnail_url TEXT,
  price DECIMAL(10, 2),
  moq INTEGER DEFAULT 1000, -- 最小起订量
  status product_status DEFAULT 'draft',
  config_defaults JSONB DEFAULT '{
    "color": "#ffffff",
    "roughness": 0.3,
    "metalness": 0.1,
    "logoPosition": {"x": 0, "y": 0, "z": 0.1},
    "logoScale": 0.5
  }'::jsonb,
  tags TEXT[],
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 products 创建索引
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- 设计会话表 (买家的定制方案)
CREATE TABLE design_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_name TEXT DEFAULT 'Untitled Design',
  snapshot_url TEXT, -- 3D截图
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status design_status DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 design_sessions 创建索引
CREATE INDEX idx_design_buyer ON design_sessions(buyer_id);
CREATE INDEX idx_design_product ON design_sessions(product_id);
CREATE INDEX idx_design_status ON design_sessions(status);

-- 询价表
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  design_session_id UUID REFERENCES design_sessions(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  message TEXT,
  status inquiry_status DEFAULT 'pending',
  quoted_price DECIMAL(10, 2),
  quoted_at TIMESTAMPTZ,
  vendor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 inquiries 创建索引
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_vendor ON inquiries(vendor_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);


-- 3. 创建触发器函数
-- ================================================

-- 更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_sessions_updated_at BEFORE UPDATE ON design_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自动创建 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在用户注册时自动创建 profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. Row Level Security (RLS) 策略
-- ================================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- ===== Profiles 策略 =====
-- 所有人可以查看已认证的商家资料
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (
    role = 'vendor' AND is_verified = true
    OR auth.uid() = id
  );

-- 用户可以更新自己的资料
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 用户可以插入自己的资料 (通过触发器创建)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ===== Assets 策略 =====
-- 商家可以查看自己的资产
CREATE POLICY "Vendors can view own assets"
  ON assets FOR SELECT
  USING (vendor_id = auth.uid());

-- 商家可以上传资产
CREATE POLICY "Vendors can upload assets"
  ON assets FOR INSERT
  WITH CHECK (
    vendor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

-- 商家可以更新自己的资产
CREATE POLICY "Vendors can update own assets"
  ON assets FOR UPDATE
  USING (vendor_id = auth.uid());

-- 商家可以删除自己的资产
CREATE POLICY "Vendors can delete own assets"
  ON assets FOR DELETE
  USING (vendor_id = auth.uid());

-- ===== Products 策略 =====
-- 所有人可以查看上架的产品
CREATE POLICY "Active products are viewable by everyone"
  ON products FOR SELECT
  USING (
    status = 'active'
    OR vendor_id = auth.uid()
  );

-- 商家可以创建产品
CREATE POLICY "Vendors can create products"
  ON products FOR INSERT
  WITH CHECK (
    vendor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'vendor'
    )
  );

-- 商家可以更新自己的产品
CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  USING (vendor_id = auth.uid());

-- 商家可以删除自己的产品
CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  USING (vendor_id = auth.uid());

-- ===== Design Sessions 策略 =====
-- 买家可以查看自己的设计
CREATE POLICY "Buyers can view own designs"
  ON design_sessions FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM products
      WHERE products.id = design_sessions.product_id
      AND products.vendor_id = auth.uid()
    )
  );

-- 登录用户可以创建设计会话
CREATE POLICY "Authenticated users can create designs"
  ON design_sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 买家可以更新自己的设计
CREATE POLICY "Buyers can update own designs"
  ON design_sessions FOR UPDATE
  USING (buyer_id = auth.uid());

-- 买家可以删除自己的设计
CREATE POLICY "Buyers can delete own designs"
  ON design_sessions FOR DELETE
  USING (buyer_id = auth.uid());

-- ===== Inquiries 策略 =====
-- 买家和商家可以查看相关询价
CREATE POLICY "Users can view related inquiries"
  ON inquiries FOR SELECT
  USING (
    buyer_id = auth.uid()
    OR vendor_id = auth.uid()
  );

-- 买家可以创建询价
CREATE POLICY "Buyers can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

-- 买家可以更新自己的询价
CREATE POLICY "Buyers can update own inquiries"
  ON inquiries FOR UPDATE
  USING (buyer_id = auth.uid());

-- 商家可以更新收到的询价 (报价)
CREATE POLICY "Vendors can update received inquiries"
  ON inquiries FOR UPDATE
  USING (vendor_id = auth.uid());


-- 5. 存储桶配置 (需要在 Supabase Dashboard 中手动创建)
-- ================================================
-- 创建以下存储桶:
-- 1. '3d-models' - 存储 GLB/GLTF 文件
-- 2. 'thumbnails' - 存储缩略图
-- 3. 'logos' - 存储用户上传的Logo
-- 4. 'snapshots' - 存储3D场景截图

-- 存储桶策略需要在 Supabase Dashboard 中设置:
-- - 3d-models: 商家可上传，所有人可读取已上架产品的模型
-- - thumbnails: 商家可上传，公开读取
-- - logos: 买家可上传，私有访问
-- - snapshots: 买家可上传，私有访问


-- 6. 示例数据 (可选)
-- ================================================

-- 插入示例商家用户 (需要先在 Auth 中创建用户)
-- INSERT INTO profiles (id, role, email, company_name, is_verified)
-- VALUES 
--   ('user-uuid-1', 'vendor', 'vendor@example.com', 'Premium Bottles Co.', true),
--   ('user-uuid-2', 'buyer', 'buyer@example.com', 'Brand Solutions Inc.', true);

-- 初始化完成标记
COMMENT ON SCHEMA public IS '3D包材SaaS平台数据库 - 初始化于 2026-03-26';
