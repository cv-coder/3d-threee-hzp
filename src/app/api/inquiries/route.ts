import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import type { ApiResponse, Inquiry } from '@/lib/types';

/**
 * POST /api/inquiries
 * 创建询价（仅买家）
 */
export const POST = withAuth(
  async (req: NextRequest, session) => {
    try {
      const body = await req.json();
      const { productId, designSessionId, quantity, message } = body;

      // 验证必填字段
      if (!productId || !quantity) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required fields: productId, quantity' },
          { status: 400 }
        );
      }

      // 获取产品信息（获取 vendor_id）
      const [product] = await sql`
        SELECT id, vendor_id, moq FROM products WHERE id = ${productId}
      `;

      if (!product) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      // 验证数量是否满足 MOQ
      if (quantity < product.moq) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: `Quantity must be at least ${product.moq} (MOQ)` },
          { status: 400 }
        );
      }

      // 创建询价
      const [inquiry] = await sql<Inquiry[]>`
        INSERT INTO inquiries (
          buyer_id,
          vendor_id,
          product_id,
          design_session_id,
          quantity,
          message,
          status
        ) VALUES (
          ${session.user.id},
          ${product.vendor_id},
          ${productId},
          ${designSessionId || null},
          ${quantity},
          ${message || null},
          'pending'
        )
        RETURNING *
      `;

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: inquiry,
          message: 'Inquiry submitted successfully',
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create inquiry error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create inquiry' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['buyer', 'admin'] }
);

/**
 * GET /api/inquiries
 * 获取询价列表
 * - Buyer: 自己发起的询价
 * - Vendor: 收到的询价
 */
export const GET = withAuth(async (req: NextRequest, session) => {
  try {
    let inquiries: Inquiry[];

    if (session.user.role === 'vendor') {
      // 厂家：查看收到的询价
      inquiries = await sql<Inquiry[]>`
        SELECT i.*,
               p.name as product_name,
               pr.email as buyer_email,
               pr.company_name as buyer_company
        FROM inquiries i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN profiles pr ON i.buyer_id = pr.id
        WHERE i.vendor_id = ${session.user.id}
        ORDER BY i.created_at DESC
      `;
    } else {
      // 买家：查看自己发起的询价
      inquiries = await sql<Inquiry[]>`
        SELECT i.*,
               p.name as product_name,
               pr.company_name as vendor_company
        FROM inquiries i
        LEFT JOIN products p ON i.product_id = p.id
        LEFT JOIN profiles pr ON i.vendor_id = pr.id
        WHERE i.buyer_id = ${session.user.id}
        ORDER BY i.created_at DESC
      `;
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
});
