import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, company_name } = body;

    // 验证必填字段
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为6位' },
        { status: 400 }
      );
    }

    // 验证角色（admin 仅允许通过 bootstrap 接口创建）
    if (!['buyer', 'vendor'].includes(role)) {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      );
    }

    // 注册用户
    const result = await registerUser({
      email,
      password,
      role,
      companyName: company_name,
    });

    if (!result.success) {
      if (result.errorCode === 'EMAIL_EXISTS') {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 409 }
        );
      }

      if (result.errorCode === 'ECONNRESET') {
        return NextResponse.json(
          { error: '数据库连接被重置，请检查数据库服务与网络连通性' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: result.error || '注册失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        userId: result.userId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // 处理重复邮箱错误
    if (error.code === '23505') {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    if (error.code === 'ECONNRESET') {
      return NextResponse.json(
        { error: '数据库连接被重置，请检查数据库服务与网络连通性' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}
