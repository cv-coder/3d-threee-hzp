import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/vendors
 * 管理员获取厂家列表（含认证状态）
 */
export const GET = withAuth(
  async (_req: NextRequest) => {
    try {
      const vendors = await sql`
        SELECT
          id,
          email,
          company_name,
          is_verified,
          created_at,
          updated_at
        FROM profiles
        WHERE role = 'vendor'
        ORDER BY created_at DESC
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: { vendors },
      });
    } catch (error) {
      console.error('Get vendors error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch vendors' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['admin'] }
);
