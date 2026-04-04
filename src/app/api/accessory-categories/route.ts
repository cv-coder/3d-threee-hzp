import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import { ACCESSORY_CATEGORY_OPTIONS } from '@/lib/product-options';
import type { ApiResponse, AccessoryCategory } from '@/lib/types';

export const GET = withErrorHandler(async (_req: NextRequest) => {
  try {
    const categories = await sql<AccessoryCategory[]>`
      SELECT id, name, sort_order, created_at, updated_at
      FROM accessory_categories
      ORDER BY sort_order ASC, created_at ASC
    `;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Get accessory categories error:', error);

    const fallbackCategories = ACCESSORY_CATEGORY_OPTIONS.map((name, index) => ({
      id: `fallback-${index + 1}`,
      name,
      sort_order: index + 1,
      created_at: new Date(0),
      updated_at: new Date(0),
    }));

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { categories: fallbackCategories },
    });
  }
});
