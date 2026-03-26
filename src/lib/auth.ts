import NextAuth, { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import type { Profile } from '@/lib/types';

// NextAuth 配置
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 查询用户
          const [user] = await sql<Profile[]>`
            SELECT 
              id, 
              email, 
              password_hash, 
              role, 
              company_name,
              is_verified
            FROM profiles 
            WHERE email = ${credentials.email as string}
          `;

          if (!user) {
            return null;
          }

          // 验证密码
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );

          if (!isValid) {
            return null;
          }

          // 返回用户信息 (不包含密码)
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            companyName: user.company_name,
            isVerified: user.is_verified,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 首次登录时，将用户信息添加到 token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyName = user.companyName;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      // 将 token 中的信息添加到 session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyName = token.companyName as string;
        session.user.isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '2592000'), // 30 天
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// 导出 NextAuth handlers
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * 注册新用户
 */
export async function registerUser(data: {
  email: string;
  password: string;
  role: 'vendor' | 'buyer';
  companyName?: string;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // 检查邮箱是否已存在
    const [existingUser] = await sql`
      SELECT id FROM profiles WHERE email = ${data.email}
    `;

    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 创建用户
    const [newUser] = await sql<{ id: string }[]>`
      INSERT INTO profiles (
        email, 
        password_hash, 
        role, 
        company_name
      )
      VALUES (
        ${data.email},
        ${passwordHash},
        ${data.role},
        ${data.companyName || null}
      )
      RETURNING id
    `;

    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

/**
 * 获取当前会话
 */
export async function getSession() {
  return await auth();
}

/**
 * 检查用户权限
 */
export function hasRole(session: any, allowedRoles: string[]): boolean {
  return session?.user?.role && allowedRoles.includes(session.user.role);
}
