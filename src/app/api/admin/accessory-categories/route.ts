import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { sql } from '@/lib/db';
import { ACCESSORY_CATEGORY_OPTIONS } from '@/lib/product-options';
import type { AccessoryCategory, ApiResponse } from '@/lib/types';

async function ensureAccessoryCategoryTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS accessory_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) UNIQUE NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_accessory_categories_sort_order
    ON accessory_categories(sort_order, created_at)
  `;

  for (let index = 0; index < ACCESSORY_CATEGORY_OPTIONS.length; index += 1) {
    const name = ACCESSORY_CATEGORY_OPTIONS[index];
    await sql`
      INSERT INTO accessory_categories (name, sort_order)
      VALUES (${name}, ${index + 1})
      ON CONFLICT (name) DO NOTHING
    `;
  }
}

export const GET = withAuth(
  async (_req: NextRequest) => {
    try {
      await ensureAccessoryCategoryTable();

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
      console.error('Get admin accessory categories error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch accessory categories' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['admin'] }
);

export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      await ensureAccessoryCategoryTable();

      const body = await req.json();
      const name = String(body?.name || '').trim();

      if (!name) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Missing required field: name' },
          { status: 400 }
        );
      }

      const [existing] = await sql`
        SELECT id FROM accessory_categories WHERE LOWER(name) = LOWER(${name})
      `;

      if (existing) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: '分类已存在' },
          { status: 409 }
        );
      }

      const [maxOrderRow] = await sql<{ max_sort_order: number | null }[]>`
        SELECT MAX(sort_order) as max_sort_order FROM accessory_categories
      `;

      const nextOrder = Number(maxOrderRow?.max_sort_order || 0) + 1;

      const [created] = await sql<AccessoryCategory[]>`
        INSERT INTO accessory_categories (name, sort_order)
        VALUES (${name}, ${nextOrder})
        RETURNING id, name, sort_order, created_at, updated_at
      `;

      return NextResponse.json<ApiResponse>(
        { success: true, data: created, message: 'Accessory category created successfully' },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create accessory category error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create accessory category' },
        { status: 500 }
      );
    }
  },
  { requiredRoles: ['admin'] }
);
