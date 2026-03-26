import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import { uploadSnapshot } from '@/lib/s3';
import type { ApiResponse, DesignSession } from '@/lib/types';

/**
 * POST /api/design/save
 * 保存设计方案（仅买家）
 */
export const POST = withAuth(
  async (req: NextRequest, session) => {
    try {
      const formData = await req.formData();
      
      const productId = formData.get('productId') as string;
      const sessionName = formData.get('sessionName') as string;
      const configJson = formData.get('configJson') as string;
      const snapshotFile = formData.get('snapshot') as File | null;
      const notes = formData.get('notes') as string;

      // 验证必填字段
      if (!productId || !configJson) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required fields: productId, configJson' },
          { status: 400 }
        );
      }

      // 验证产品存在
      const [product] = await sql`
        SELECT id, vendor_id FROM products WHERE id = ${productId}
      `;

      if (!product) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      // 上传渲染快照（如果有）
      let snapshotUrl: string | null = null;
      if (snapshotFile) {
        const snapshotBuffer = Buffer.from(await snapshotFile.arrayBuffer());
        
        // 生成临时 sessionId
        const tempSessionId = `temp-${Date.now()}`;
        snapshotUrl = await uploadSnapshot(
          session.user.id,
          tempSessionId,
          snapshotBuffer
        );
      }

      // 解析配置 JSON
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(configJson);
      } catch (e) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid JSON in configJson' },
          { status: 400 }
        );
      }

      // 插入设计会话
      const [designSession] = await sql<DesignSession[]>`
        INSERT INTO design_sessions (
          buyer_id,
          product_id,
          session_name,
          config_json,
          snapshot_url,
          notes,
          status
        ) VALUES (
          ${session.user.id},
          ${productId},
          ${sessionName || 'Untitled Design'},
          ${JSON.stringify(parsedConfig)},
          ${snapshotUrl},
          ${notes || null},
          'saved'
        )
        RETURNING *
      `;

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: designSession,
          message: 'Design saved successfully',
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Save design error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to save design' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['buyer', 'admin'] }
);

/**
 * GET /api/design/save
 * 获取当前用户的所有设计方案
 */
export const GET = withAuth(
  async (req: NextRequest, session) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const productId = searchParams.get('productId');
      
      const designs = await sql<DesignSession[]>`
        SELECT ds.*,
               p.name as product_name,
               p.thumbnail_url as product_thumbnail
        FROM design_sessions ds
        LEFT JOIN products p ON ds.product_id = p.id
        WHERE ds.buyer_id = ${session.user.id}
        ${productId ? sql`AND ds.product_id = ${productId}` : sql``}
        ORDER BY ds.created_at DESC
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: designs,
      });
    } catch (error) {
      console.error('Get designs error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch designs' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['buyer', 'admin'] }
);
