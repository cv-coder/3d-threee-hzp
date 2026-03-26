import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, validateRequest, isValidFileType, isValidFileSize } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import { upload3DModel, uploadThumbnail } from '@/lib/s3';
import type { ApiResponse, Product, ProductFormData } from '@/lib/types';

/**
 * GET /api/products
 * 获取产品列表
 * - Vendor: 返回自己的所有产品
 * - Buyer/Public: 返回所有已发布的产品
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await require('@/lib/auth').getSession();
  const searchParams = req.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const offset = (page - 1) * pageSize;
  const status = searchParams.get('status');
  const vendorId = searchParams.get('vendorId');

  try {
    let products: Product[];
    let total: number;

    if (session?.user?.role === 'vendor') {
      // 商家：返回自己的所有产品
      products = await sql<Product[]>`
        SELECT * FROM products
        WHERE vendor_id = ${session.user.id}
        ${status ? sql`AND status = ${status}` : sql``}
        ORDER BY created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      [{ count: total }] = await sql<{ count: number }[]>`
        SELECT COUNT(*) as count FROM products
        WHERE vendor_id = ${session.user.id}
        ${status ? sql`AND status = ${status}` : sql``}
      `;
    } else {
      // 买家/公开：只返回已发布的产品
      products = await sql<Product[]>`
        SELECT p.*, 
               pr.id as vendor_id,
               pr.company_name as vendor_company_name,
               pr.is_verified as vendor_is_verified
        FROM products p
        LEFT JOIN profiles pr ON p.vendor_id = pr.id
        WHERE p.status = 'published'
        ${vendorId ? sql`AND p.vendor_id = ${vendorId}` : sql``}
        ORDER BY p.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      [{ count: total }] = await sql<{ count: number }[]>`
        SELECT COUNT(*) as count FROM products
        WHERE status = 'published'
        ${vendorId ? sql`AND vendor_id = ${vendorId}` : sql``}
      `;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/products
 * 上传新产品（仅商家）
 */
export const POST = withAuth(
  async (req: NextRequest, session) => {
    try {
      const formData = await req.formData();
      
      // 提取字段
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const price = formData.get('price') as string;
      const moq = formData.get('moq') as string;
      const tags = formData.get('tags') as string;
      const materialConfig = formData.get('materialConfig') as string;
      
      const modelFile = formData.get('model') as File;
      const thumbnailFile = formData.get('thumbnail') as File;

      // 验证必填字段
      if (!name || !modelFile) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required fields: name, model' },
          { status: 400 }
        );
      }

      // 验证文件类型和大小
      const allowedModelExts = process.env.ALLOWED_MODEL_EXTENSIONS?.split(',') || ['.glb', '.gltf'];
      if (!isValidFileType(modelFile.name, allowedModelExts)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid model file type' },
          { status: 400 }
        );
      }

      const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '50');
      if (!isValidFileSize(modelFile.size, maxSizeMB)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Model file too large (max ${maxSizeMB}MB)` },
          { status: 400 }
        );
      }

      // 上传 3D 模型
      const modelBuffer = Buffer.from(await modelFile.arrayBuffer());
      const modelUrl = await upload3DModel(
        session.user.id,
        modelFile.name,
        modelBuffer
      );

      // 上传缩略图（如果有）
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbnailBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
        thumbnailUrl = await uploadThumbnail(
          session.user.id,
          thumbnailFile.name,
          thumbnailBuffer
        );
      }

      // 解析材质配置
      let parsedConfig = null;
      if (materialConfig) {
        try {
          parsedConfig = JSON.parse(materialConfig);
        } catch (e) {
          // 忽略解析错误，使用默认配置
        }
      }

      // 插入产品记录
      const [product] = await sql<Product[]>`
        INSERT INTO products (
          vendor_id,
          name,
          description,
          model_url,
          thumbnail_url,
          price,
          moq,
          tags,
          status
        ) VALUES (
          ${session.user.id},
          ${name},
          ${description || null},
          ${modelUrl},
          ${thumbnailUrl},
          ${price ? parseFloat(price) : null},
          ${moq ? parseInt(moq) : 1000},
          ${tags ? tags.split(',').map(t => t.trim()) : []},
          'draft'
        )
        RETURNING *
      `;

      // 如果有材质配置，创建默认预设
      if (parsedConfig) {
        await sql`
          INSERT INTO material_presets (
            product_id,
            name,
            config,
            is_default
          ) VALUES (
            ${product.id},
            'Default',
            ${JSON.stringify(parsedConfig)},
            true
          )
        `;
      }

      return NextResponse.json<ApiResponse>(
        { success: true, data: product, message: 'Product created successfully' },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create product error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create product' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['vendor', 'admin'] }
);
