import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

/**
 * API 权限校验中间件
 */
export async function withAuth(
  handler: (req: NextRequest, session: any) => Promise<NextResponse>,
  options?: {
    requiredRoles?: string[];
  }
) {
  return async (req: NextRequest) => {
    try {
      // 获取会话
      const session = await getSession();

      // 检查是否登录
      if (!session || !session.user) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // 检查角色权限
      if (options?.requiredRoles && !hasRole(session, options.requiredRoles)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      // 执行处理器
      return await handler(req, session);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * 错误处理包装器
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 验证请求体
 */
export function validateRequest<T>(
  data: any,
  requiredFields: string[]
): { valid: boolean; error?: string; data?: T } {
  for (const field of requiredFields) {
    if (!data[field]) {
      return {
        valid: false,
        error: `Missing required field: ${field}`,
      };
    }
  }

  return { valid: true, data: data as T };
}

/**
 * 解析分页参数
 */
export function parsePaginationParams(req: NextRequest): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * 检查文件类型
 */
export function isValidFileType(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * 检查文件大小
 */
export function isValidFileSize(
  size: number,
  maxSizeMB: number = 50
): boolean {
  return size <= maxSizeMB * 1024 * 1024;
}
