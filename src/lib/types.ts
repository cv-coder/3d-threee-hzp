// ================================================
// 数据库类型定义
// ================================================

export type UserRole = 'admin' | 'vendor' | 'buyer';
export type ProductStatus = 'draft' | 'published' | 'archived';
export type InquiryStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'closed';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';

// ================================================
// Profile (用户)
// ================================================

export interface Profile {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  is_verified: boolean;
  email_verified?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ProfilePublic {
  id: string;
  email: string;
  role: UserRole;
  company_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: Date;
}

// ================================================
// Product (产品)
// ================================================

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  accessory_category?: string;
  capacity?: string;
  material?: string;
  model_url: string;
  thumbnail_url?: string;
  price?: number;
  moq: number;
  status: ProductStatus;
  tags?: string[];
  views_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithVendor extends Product {
  vendor?: ProfilePublic;
}

export interface AccessoryCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ================================================
// Material Preset (材质预设)
// ================================================

export interface MaterialConfig {
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  logoUrl?: string;
  logoPosition?: { x: number; y: number; z: number };
  logoScale?: number;
}

export interface MaterialPreset {
  id: string;
  product_id: string;
  name: string;
  config: MaterialConfig;
  is_default: boolean;
  created_at: Date;
}

// ================================================
// Design Session (设计会话)
// ================================================

export interface DesignSession {
  id: string;
  buyer_id: string;
  product_id: string;
  session_name: string;
  config_json: MaterialConfig;
  snapshot_url?: string;
  status: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DesignSessionWithProduct extends DesignSession {
  product?: Product;
}

// ================================================
// Inquiry (询价)
// ================================================

export interface Inquiry {
  id: string;
  buyer_id: string;
  vendor_id: string;
  product_id: string;
  design_session_id?: string;
  quantity: number;
  message?: string;
  status: InquiryStatus;
  quoted_price?: number;
  quoted_at?: Date;
  vendor_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InquiryWithDetails extends Inquiry {
  buyer?: ProfilePublic;
  vendor?: ProfilePublic;
  product?: Product;
}

// ================================================
// Order (订单)
// ================================================

export interface Order {
  id: string;
  inquiry_id?: string;
  buyer_id: string;
  vendor_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_method?: string;
  payment_status: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// ================================================
// API 响应类型
// ================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ================================================
// 表单类型
// ================================================

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'vendor' | 'buyer';
  companyName?: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  accessory_category?: string;
  capacity?: string;
  material?: string;
  price?: number;
  moq: number;
  tags?: string[];
  materialConfig: MaterialConfig;
}

export interface InquiryFormData {
  product_id: string;
  design_session_id?: string;
  quantity: number;
  message?: string;
}

// ================================================
// NextAuth 扩展类型
// ================================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      companyName?: string;
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    companyName?: string;
    isVerified: boolean;
  }
}
