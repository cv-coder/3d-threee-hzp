export type UserRole = 'vendor' | 'buyer' | 'admin';
export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type AssetStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type DesignStatus = 'draft' | 'saved' | 'submitted';
export type InquiryStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'closed';

export interface Profile {
  id: string;
  role: UserRole;
  email: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  vendor_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: AssetStatus;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  model_asset_id?: string;
  model_url?: string;
  thumbnail_url?: string;
  price?: number;
  moq: number;
  status: ProductStatus;
  config_defaults: MaterialConfig;
  tags?: string[];
  views_count: number;
  created_at: string;
  updated_at: string;
  // 关联数据
  vendor?: Profile;
  model_asset?: Asset;
}

export interface MaterialConfig {
  color: string;
  roughness: number;
  metalness: number;
  logoPosition?: { x: number; y: number; z: number };
  logoScale?: number;
  logoUrl?: string;
}

export interface DesignSession {
  id: string;
  buyer_id?: string;
  product_id: string;
  session_name: string;
  snapshot_url?: string;
  config_json: MaterialConfig;
  status: DesignStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  product?: Product;
}

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
  quoted_at?: string;
  vendor_notes?: string;
  created_at: string;
  updated_at: string;
  // 关联数据
  product?: Product;
  buyer?: Profile;
  vendor?: Profile;
}
