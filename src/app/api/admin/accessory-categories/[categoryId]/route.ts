import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import type { AccessoryCategory, ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

function getCategoryIdFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const idx = segments.findIndex((s) => s === 'accessory-categories');
  if (idx === -1 || idx + 1 >= segments.length) return null;
  return decodeURIComponent(segments[idx + 1]);
}

export const PATCH = withAuth(
  async (req: NextRequest) => {
    try {
      const categoryId = getCategoryIdFromPath(req.nextUrl.pathname);
      if (!categoryId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid category id' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const name = String(body?.name || '').trim();

      if (!name) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required field: name' },
          { status: 400 }
        );
      }

      const [existing] = await sql`
        SELECT id FROM accessory_categories WHERE id = ${categoryId}
      `;

      if (!existing) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }

      const [duplicate] = await sql`
        SELECT id FROM accessory_categories
        WHERE LOWER(name) = LOWER(${name}) AND id <> ${categoryId}
      `;

      if (duplicate) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: '分类已存在' },
          { status: 409 }
        );
      }

      const [updated] = await sql<AccessoryCategory[]>`
        UPDATE accessory_categories
        SET name = ${name}, updated_at = NOW()
        WHERE id = ${categoryId}
        RETURNING id, name, sort_order, created_at, updated_at
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updated,
        message: 'Accessory category updated successfully',
      });
    } catch (error) {
      console.error('Update accessory category error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update accessory category' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['admin'] }
);

export const DELETE = withAuth(
  async (req: NextRequest) => {
    try {
      const categoryId = getCategoryIdFromPath(req.nextUrl.pathname);
      if (!categoryId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid category id' },
          { status: 400 }
        );
      }

      const [existing] = await sql<AccessoryCategory[]>`
        SELECT id, name, sort_order, created_at, updated_at
        FROM accessory_categories
        WHERE id = ${categoryId}
      `;

      if (!existing) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }

      await sql`
        DELETE FROM accessory_categories WHERE id = ${categoryId}
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: existing,
        message: 'Accessory category deleted successfully',
      });
    } catch (error) {
      console.error('Delete accessory category error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete accessory category' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['admin'] }
);