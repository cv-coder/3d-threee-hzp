import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import type { ApiResponse, Product } from '@/lib/types';

function getProductIdFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  const idx = segments.findIndex((s) => s === 'products');
  if (idx === -1 || idx + 1 >= segments.length) return null;
  return decodeURIComponent(segments[idx + 1]);
}

/**
 * PATCH /api/products/:id
 * 更新产品状态（仅产品所属厂家或管理员）
 */
export const PATCH = withAuth(
  async (req: NextRequest, session) => {
    try {
      const productId = getProductIdFromPath(req.nextUrl.pathname);
      if (!productId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid product id' },
          { status: 400 }
        );
      }

      const body = await req.json();
      const {
        status,
        name,
        description,
        model_url,
        price,
        moq,
        tags,
        material_config,
      } = body as {
        status?: string;
        name?: string;
        description?: string | null;
        model_url?: string | null;
        price?: number | null;
        moq?: number;
        tags?: string[];
        material_config?: Record<string, unknown> | null;
      };

      const [existing] = await sql<Product[]>`
        SELECT * FROM products WHERE id = ${productId}
      `;

      if (!existing) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const role = (session.user as any).role as string;
      const isOwner = existing.vendor_id === session.user.id;
      if (role !== 'admin' && !isOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }

      if (
        status === undefined &&
        name === undefined &&
        description === undefined &&
        model_url === undefined &&
        price === undefined &&
        moq === undefined &&
        tags === undefined &&
        material_config === undefined
      ) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'No fields provided to update' },
          { status: 400 }
        );
      }

      if (status !== undefined && !['draft', 'published', 'archived'].includes(status)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }

      if (name !== undefined && !String(name).trim()) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Name cannot be empty' },
          { status: 400 }
        );
      }

      if (moq !== undefined && (!Number.isFinite(moq) || moq <= 0)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'MOQ must be a positive number' },
          { status: 400 }
        );
      }

      if (price !== undefined && price !== null && !Number.isFinite(price)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Price must be a valid number' },
          { status: 400 }
        );
      }

      const nextStatus = status ?? existing.status;
      const nextName = name !== undefined ? String(name).trim() : existing.name;
      const nextDescription = description !== undefined ? description : (existing.description ?? null);
      const nextModelUrl = model_url !== undefined ? model_url : (existing.model_url ?? null);
      const nextPrice = price !== undefined ? price : (existing.price ?? null);
      const nextMoq = moq !== undefined ? moq : existing.moq;
      const nextTags = tags !== undefined ? tags : (existing.tags ?? []);
      const nextMaterialConfig =
        material_config !== undefined ? material_config : ((existing as any).material_config ?? null);

      const [updated] = await sql<Product[]>`
        UPDATE products
        SET
          status = ${nextStatus},
          name = ${nextName},
          description = ${nextDescription},
          model_url = ${nextModelUrl},
          price = ${nextPrice},
          moq = ${nextMoq},
          tags = ${nextTags},
          material_config = ${nextMaterialConfig ?? null},
          updated_at = NOW()
        WHERE id = ${productId}
        RETURNING *
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        data: updated,
        message: 'Product updated successfully',
      });
    } catch (error) {
      console.error('Update product error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update product' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['vendor', 'admin'] }
);

/**
 * DELETE /api/products/:id
 * 删除产品（仅产品所属厂家或管理员）
 */
export const DELETE = withAuth(
  async (req: NextRequest, session) => {
    try {
      const productId = getProductIdFromPath(req.nextUrl.pathname);
      if (!productId) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid product id' },
          { status: 400 }
        );
      }

      const [existing] = await sql<Product[]>`
        SELECT * FROM products WHERE id = ${productId}
      `;

      if (!existing) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const role = (session.user as any).role as string;
      const isOwner = existing.vendor_id === session.user.id;
      if (role !== 'admin' && !isOwner) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        );
      }

      await sql`
        DELETE FROM products WHERE id = ${productId}
      `;

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Delete product error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete product' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['vendor', 'admin'] }
);
