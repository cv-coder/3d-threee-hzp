export type UserRole = 'vendor' | 'buyer' | 'admin';
export type ProductStatus = 'draft' | 'published' | 'archived';
export type AssetStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type DesignStatus = 'draft' | 'saved' | 'submitted';
export type InquiryStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'closed';
export type SurfaceFinishType = 'injection-color' | 'paint-matte' | 'electroplated-glossy' | 'electroplated-matte' | 'glass';

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
  accessory_category?: string;
  capacity?: string;
  material?: string;
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

export interface AccessoryCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialConfig {
  color?: string;
  roughness?: number;
  metalness?: number;
  logoPosition?: { x: number; y: number; z: number };
  logoScale?: number;
  /** 全局表面工艺 */
  surfaceFinish?: SurfaceFinishType;
  /** 部件可选表面工艺配置（由厂家定义） */
  partSurfaceOptions?: Record<string, SurfaceFinishType[]>;
  logoUrl?: string;
  /** 分部位材质覆盖，key 为 mesh 名称 */
  parts?: Record<string, { color: string; finish?: SurfaceFinishType }>;
}

/** 模型中单个可编辑部件的描述 */
export interface ModelPart {
  name: string;
  displayName: string;
  color: string;
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
