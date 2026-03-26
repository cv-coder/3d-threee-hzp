import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // 允许访问公开路由
      const publicPaths = ['/', '/login', '/register', '/shop'];
      const path = req.nextUrl.pathname;
      
      // 检查是否为公开路径或静态资源
      if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
        return true;
      }

      // 需要登录
      if (!token) {
        return false;
      }

      // 角色权限检查
      const role = token.role as string;

      // Admin 可以访问所有页面
      if (role === 'admin') {
        return true;
      }

      // Vendor 路由保护
      if (path.startsWith('/dashboard/vendor')) {
        return role === 'vendor';
      }

      // Buyer 路由保护
      if (path.startsWith('/dashboard/buyer')) {
        return role === 'buyer';
      }

      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/products/:path*',
    '/api/design/:path*',
    '/api/inquiries/:path*',
  ],
};
