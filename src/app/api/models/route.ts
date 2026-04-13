import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function normalizeModelUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const baseUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';
  const normalized = path.replace(/^\/+/, '');

  if (normalized.startsWith('3d-models/')) {
    return `${baseUrl}/${normalized}`;
  }

  if (normalized.startsWith('models/')) {
    return `${baseUrl}/3d-models/${normalized.slice('models/'.length)}`;
  }

  return `${baseUrl}/3d-models/${normalized}`;
}

/**
 * GET /api/models - 获取当前用户的模型资产列表
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 只有厂家和管理员可以查看模型
    if (session.user.role !== 'vendor' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '仅厂家和管理员可访问' },
        { status: 403 }
      );
    }

    const models = await db.findMany<any>(
      `SELECT id, name, file_path, preview_url, original_filename, created_at
       FROM model_assets
       WHERE vendor_id = $1 AND status = 'ready'
       ORDER BY created_at DESC`,
      [session.user.id]
    );

    const modelsWithFileUrl = models.map((model: any) => ({
      ...model,
      file_url: normalizeModelUrl(model.file_path || null),
    }));

    return NextResponse.json({
      success: true,
      data: {
        models: modelsWithFileUrl,
        total: modelsWithFileUrl.length,
      },
    });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: '获取模型列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/models - 上传新模型资产（在实际上传到 MinIO 后调用）
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (session.user.role !== 'vendor' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '仅厂家可上传模型' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, filePath, fileSize, originalFilename, previewUrl } = body;

    if (!name || !filePath) {
      return NextResponse.json(
        { error: '缺少必要参数: name, filePath' },
        { status: 400 }
      );
    }

    const model = await db.insert<any>(
      `INSERT INTO model_assets (vendor_id, name, file_path, file_size, original_filename, preview_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ready')
       RETURNING *`,
      [session.user.id, name, filePath, fileSize || null, originalFilename || null, previewUrl || null]
    );

    return NextResponse.json(
      {
        success: true,
        data: { model },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create model asset error:', error);
    return NextResponse.json(
      { error: '创建模型资产失败' },
      { status: 500 }
    );
  }
}
