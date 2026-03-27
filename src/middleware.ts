import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  // 允许访问公开路由
  const publicPaths = ['/', '/login', '/register', '/shop'];
  const path = req.nextUrl.pathname;

  // 检查是否为公开路径或静态资源
  if (publicPaths.some((p) => path === p || path.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // 需要登录
  if (!req.auth?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 角色权限检查
  const role = (req.auth.user as any).role as string;

  // Admin 可以访问所有页面
  if (role === 'admin') {
    return NextResponse.next();
  }

  // Vendor 路由保护
  if (path.startsWith('/dashboard/vendor') && role !== 'vendor') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Buyer 路由保护
  if (path.startsWith('/dashboard/buyer') && role !== 'buyer') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/products/:path*',
    '/api/design/:path*',
    '/api/inquiries/:path*',
  ],
};
