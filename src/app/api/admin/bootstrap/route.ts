import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';

interface BootstrapAdminBody {
  email: string;
  password: string;
  companyName?: string;
}

/**
 * POST /api/admin/bootstrap
 * 安全初始化第一个管理员账号（仅当系统中尚无 admin 时可调用）
 *
 * 安全要求：
 * 1) 必须提供 X-Init-Token 请求头
 * 2) token 必须等于环境变量 ADMIN_BOOTSTRAP_TOKEN
 * 3) 数据库中一旦已有 admin，接口永久返回 409
 */
export async function POST(req: NextRequest) {
  try {
    const initToken = req.headers.get('x-init-token');
    const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN;

    if (!expectedToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'ADMIN_BOOTSTRAP_TOKEN is not configured' },
        { status: 503 }
      );
    }

    if (!initToken || initToken !== expectedToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid bootstrap token' },
        { status: 401 }
      );
    }

    const [adminCountRow] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count
      FROM profiles
      WHERE role = 'admin'
    `;

    const adminCount = parseInt(adminCountRow?.count || '0', 10);
    if (adminCount > 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Admin already exists; bootstrap is disabled' },
        { status: 409 }
      );
    }

    const body = (await req.json()) as BootstrapAdminBody;
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    const companyName = body?.companyName?.trim() || null;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const [existingUser] = await sql`
      SELECT id FROM profiles WHERE email = ${email}
    `;

    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [admin] = await sql<{ id: string; email: string; role: string; is_verified: boolean }[]>`
      INSERT INTO profiles (
        email,
        password_hash,
        role,
        company_name,
        is_verified,
        email_verified
      ) VALUES (
        ${email},
        ${passwordHash},
        'admin',
        ${companyName},
        true,
        NOW()
      )
      RETURNING id, email, role, is_verified
    `;

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: admin,
        message: 'Admin bootstrap successful',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin bootstrap error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to bootstrap admin' },
      { status: 500 }
    );
  }
}
