import type { NextAuthConfig } from 'next-auth';

/**
 * 轻量 Auth 配置 —— 仅供 middleware 使用。
 * 不引入任何 Node.js / 数据库依赖，可安全运行在 Edge Runtime。
 */
export const authConfig: NextAuthConfig = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyName = (user as any).companyName;
        token.isVerified = (user as any).isVerified;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).companyName = token.companyName as string;
        (session.user as any).isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
};
