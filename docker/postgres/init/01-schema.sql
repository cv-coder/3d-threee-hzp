-- ================================================
-- 3D Packaging SaaS - PostgreSQL Schema
-- Self-Hosted Architecture
-- ================================================

-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 枚举类型定义
-- ================================================

CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'buyer');
CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE inquiry_status AS ENUM ('pending', 'quoted', 'accepted', 'rejected', 'closed');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled');

-- ================================================
-- 核心表结构
-- ================================================

-- 用户表 (扩展 NextAuth 的 users 表)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'buyer',
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 产品表
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    model_url TEXT,            -- MinIO 中的 3D 模型路径（可后续上传）
    thumbnail_url TEXT,
    price DECIMAL(10, 2),
    moq INTEGER DEFAULT 1000,  -- 最小起订量
    status product_status DEFAULT 'draft',
    tags TEXT[],
    material_config JSONB,     -- 默认材质配置
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT products_vendor_id_idx CHECK (vendor_id IS NOT NULL)
);

CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- 模型资产表（厂家上传的 3D 模型）
CREATE TABLE model_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,        -- MinIO 中的路径
    file_size BIGINT,               -- 文件大小（字节）
    original_filename VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ready',  -- uploading / ready / failed
    preview_url TEXT,               -- 缩略图 URL
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_model_assets_vendor ON model_assets(vendor_id);
CREATE INDEX idx_model_assets_created ON model_assets(created_at);

-- 材质预设表
CREATE TABLE material_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    config JSONB NOT NULL DEFAULT '{
        "color": "#ffffff",
        "roughness": 0.3,
        "metalness": 0.1,
        "opacity": 1.0
    }'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_material_presets_product ON material_presets(product_id);

-- 设计会话表 (买家的定制方案)
CREATE TABLE design_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    session_name VARCHAR(255) DEFAULT 'Untitled Design',
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    snapshot_url TEXT,  -- 渲染快照路径
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_design_sessions_buyer ON design_sessions(buyer_id);
CREATE INDEX idx_design_sessions_product ON design_sessions(product_id);

-- 询价表
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    design_session_id UUID REFERENCES design_sessions(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    message TEXT,
    status inquiry_status DEFAULT 'pending',
    quoted_price DECIMAL(10, 2),
    quoted_at TIMESTAMP,
    vendor_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX idx_inquiries_vendor ON inquiries(vendor_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);

-- 订单表 (扩展功能)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE SET NULL,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    total_amount DECIMAL(12, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ================================================
-- 触发器函数
-- ================================================

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_design_sessions_updated_at 
    BEFORE UPDATE ON design_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at 
    BEFORE UPDATE ON inquiries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 初始数据 (可选)
-- ================================================

-- 创建管理员账号 (密码: admin123, 使用 bcrypt hash)
-- 注意: 实际部署时请修改密码！
INSERT INTO profiles (email, password_hash, role, is_verified, email_verified)
VALUES (
    'admin@packaging.local',
    '$2a$10$Uezq4emM1gizz9dIyqmLIuENATSHds69Vx53s3mInkda7dvqTauJS',  -- admin123
    'admin',
    TRUE,
    NOW()
);

-- 创建示例厂家账号 (密码: vendor123)
INSERT INTO profiles (email, password_hash, role, company_name, is_verified, email_verified)
VALUES (
    'vendor@packaging.local',
    '$2a$10$BzcpeEuzzZknu/7P7fuyAuhy50V/cK8D8L10CEMoPJ/VXeO6A4kOG',  -- vendor123
    'vendor',
    'Premium Bottles Co.',
    TRUE,
    NOW()
);

-- 创建示例买家账号 (密码: buyer123)
INSERT INTO profiles (email, password_hash, role, company_name, is_verified, email_verified)
VALUES (
    'buyer@packaging.local',
    '$2a$10$1uVS7RBO8u2sD8ABtKVi1.khY.CxO8n1NI/.nAjEDmFi9sBJMOTY2',  -- buyer123
    'buyer',
    'Brand Solutions Inc.',
    TRUE,
    NOW()
);

-- ================================================
-- 视图和辅助查询 (可选)
-- ================================================

-- 产品统计视图
CREATE VIEW product_stats AS
SELECT 
    p.id,
    p.name,
    p.vendor_id,
    p.status,
    COUNT(DISTINCT ds.id) as design_count,
    COUNT(DISTINCT i.id) as inquiry_count,
    p.views_count
FROM products p
LEFT JOIN design_sessions ds ON p.id = ds.product_id
LEFT JOIN inquiries i ON p.id = i.product_id
GROUP BY p.id;

-- 厂家统计视图
CREATE VIEW vendor_stats AS
SELECT 
    pr.id,
    pr.email,
    pr.company_name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT i.id) as inquiry_count,
    COUNT(DISTINCT o.id) as order_count
FROM profiles pr
LEFT JOIN products p ON pr.id = p.vendor_id
LEFT JOIN inquiries i ON pr.id = i.vendor_id
LEFT JOIN orders o ON pr.id = o.vendor_id
WHERE pr.role = 'vendor'
GROUP BY pr.id;

-- ================================================
-- 数据库元信息
-- ================================================

COMMENT ON DATABASE packaging_saas IS '3D Packaging SaaS - Self-Hosted v1.0';
COMMENT ON TABLE profiles IS '用户资料表，包含所有角色 (admin/vendor/buyer)';
COMMENT ON TABLE products IS '厂家产品表';
COMMENT ON TABLE material_presets IS '产品材质预设配置';
COMMENT ON TABLE design_sessions IS '买家定制设计会话';
COMMENT ON TABLE inquiries IS '询价记录';
COMMENT ON TABLE orders IS '订单记录';
