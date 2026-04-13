import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getVendorIdFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const idx = segments.findIndex((s) => s === 'vendors');
  if (idx === -1 || idx + 1 >= segments.length) return null;
  return decodeURIComponent(segments[idx + 1]);
}

/**
 * PATCH /api/admin/vendors/:vendorId/verify
 * 管理员认证/取消认证厂家
 */
export const PATCH = withAuth(
  async (req: NextRequest) => {
    try {
      const vendorId = getVendorIdFromPath(req.nextUrl.pathname);
      if (!vendorId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid vendor id' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const { isVerified } = body as { isVerified?: boolean };

      if (typeof isVerified !== 'boolean') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'isVerified must be boolean' },
          { status: 400 }
        );
      }

      const [vendor] = await sql`
        SELECT id, role FROM profiles WHERE id = ${vendorId}
      `;

      if (!vendor) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Vendor not found' },
          { status: 404 }
        );
      }

      if (vendor.role !== 'vendor') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Target user is not vendor' },
          { status: 400 }
        );
      }

      const [updated] = await sql`
        UPDATE profiles
        SET is_verified = ${isVerified}, updated_at = NOW()
        WHERE id = ${vendorId}
        RETURNING id, email, company_name, is_verified, created_at, updated_at
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updated,
        message: isVerified ? 'Vendor verified' : 'Vendor verification revoked',
      });
    } catch (error) {
      console.error('Verify vendor error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update vendor verification' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['admin'] }
);
