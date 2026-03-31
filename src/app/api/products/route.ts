import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import type { ApiResponse, Product } from '@/lib/types';

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
      // 厂家：返回自己的所有产品
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
 * 创建新产品（仅厂家）—— 接收 JSON，文件上传通过独立接口完成
 */
export const POST = withAuth(
  async (req: NextRequest, session) => {
    try {
      const body = await req.json();
      const { name, description, price, moq, tags, config_defaults, status, model_url } = body;

      if (!name) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required field: name' },
          { status: 400 }
        );
      }

      const [product] = await sql<Product[]>`
        INSERT INTO products (
          vendor_id,
          name,
          description,
          model_url,
          price,
          moq,
          tags,
          material_config,
          status
        ) VALUES (
          ${session.user.id},
          ${name},
          ${description || null},
          ${model_url || null},
          ${price ?? null},
          ${moq ?? 1000},
          ${tags ?? []},
          ${config_defaults ? JSON.stringify(config_defaults) : null},
          ${status ?? 'draft'}
        )
        RETURNING *
      `;

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
