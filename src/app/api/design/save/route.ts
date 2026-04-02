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
      const contentType = req.headers.get('content-type') || '';

      let productId: string;
      let sessionName: string;
      let configJson: string;
      let snapshotFile: File | null = null;
      let notes: string;

      if (contentType.includes('application/json')) {
        // JSON 请求（前端 fetch）
        const body = await req.json();
        productId = body.product_id || body.productId;
        sessionName = body.session_name || body.sessionName || '';
        configJson = typeof body.config_json === 'string'
          ? body.config_json
          : JSON.stringify(body.config_json || body.configJson);
        notes = body.notes || '';
      } else {
        // FormData 请求
        const formData = await req.formData();
        productId = formData.get('productId') as string;
        sessionName = formData.get('sessionName') as string;
        configJson = formData.get('configJson') as string;
        snapshotFile = formData.get('snapshot') as File | null;
        notes = formData.get('notes') as string;
      }

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
 * PUT /api/design/save
 * 更新已有设计方案
 */
export const PUT = withAuth(
  async (req: NextRequest, session) => {
    try {
      const body = await req.json();
      const designId = body.id;
      const configJson = typeof body.config_json === 'string'
        ? body.config_json
        : JSON.stringify(body.config_json);

      if (!designId || !configJson) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required fields: id, config_json' },
          { status: 400 }
        );
      }

      // 验证该设计方案属于当前用户
      const [existing] = await sql<DesignSession[]>`
        SELECT id FROM design_sessions WHERE id = ${designId} AND buyer_id = ${session.user.id}
      `;
      if (!existing) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Design not found or not owned by you' },
          { status: 404 }
        );
      }

      const [updated] = await sql<DesignSession[]>`
        UPDATE design_sessions
        SET config_json = ${configJson},
            updated_at = NOW()
        WHERE id = ${designId} AND buyer_id = ${session.user.id}
        RETURNING *
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updated,
        message: 'Design updated successfully',
      });
    } catch (error) {
      console.error('Update design error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update design' },
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
