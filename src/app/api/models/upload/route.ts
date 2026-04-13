import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { upload3DModel } from '@/lib/s3';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Role = 'vendor' | 'admin' | 'buyer';

function getSafeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getModelContentType(filename: string, fileType?: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.glb')) return 'model/gltf-binary';
  if (lower.endsWith('.gltf')) return 'model/gltf+json';
  return fileType || 'application/octet-stream';
}

/**
 * POST /api/models/upload
 * 真实上传模型文件到 MinIO，并创建 model_assets 记录
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const role = session.user.role as Role;
    if (role !== 'vendor' && role !== 'admin') {
      return NextResponse.json({ success: false, error: '仅厂家和管理员可上传模型' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customName = (formData.get('name') as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ success: false, error: '缺少文件参数 file' }, { status: 400 });
    }

    const filename = file.name || 'model.glb';
    const lower = filename.toLowerCase();

    if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
      return NextResponse.json({ success: false, error: '仅支持 .glb 或 .gltf 文件' }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '文件大小不能超过 50MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeFilename = getSafeFilename(filename);

    const uploadedUrl = await upload3DModel(
      session.user.id,
      safeFilename,
      buffer,
      getModelContentType(filename, file.type)
    );

    const modelName = customName || filename.replace(/\.(glb|gltf)$/i, '');

    const model = await db.insert<any>(
      `INSERT INTO model_assets (vendor_id, name, file_path, file_size, original_filename, status)
       VALUES ($1, $2, $3, $4, $5, 'ready')
       RETURNING id, vendor_id, name, file_path, file_size, original_filename, status, created_at, updated_at`,
      [session.user.id, modelName, uploadedUrl, file.size, filename]
    );

    return NextResponse.json({
      success: true,
      data: {
        model,
        fileUrl: uploadedUrl,
      },
      message: '模型上传成功',
    });
  } catch (error) {
    console.error('Upload model file error:', error);
    return NextResponse.json({ success: false, error: '模型上传失败' }, { status: 500 });
  }
}
