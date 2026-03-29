import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/models/[id] - 删除模型资产
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    if (session.user.role !== 'vendor' && session.user.role !== 'admin') {
      return NextResponse.json({ error: '仅厂家可删除模型' }, { status: 403 });
    }

    const { id } = params;

    // 先验证这个模型属于当前用户（防止越权删除）
    const model = await db.findOne<any>(
      `SELECT id FROM model_assets WHERE id = $1 AND vendor_id = $2`,
      [id, session.user.id]
    );

    if (!model) {
      return NextResponse.json({ error: '模型不存在或无权删除' }, { status: 404 });
    }

    await db.delete(
      `DELETE FROM model_assets WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
