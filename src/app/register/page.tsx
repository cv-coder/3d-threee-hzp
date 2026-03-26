'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserRole } from '@/types/database';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as UserRole,
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: formData.role,
          company_name: formData.companyName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 注册成功，更新 profile 信息
      await supabase
        .from('profiles')
        .update({ company_name: formData.companyName })
        .eq('id', data.user.id);

      // 根据角色重定向
      if (formData.role === 'vendor') {
        router.push('/dashboard/vendor');
      } else {
        router.push('/dashboard/buyer');
      }
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
          <CardDescription className="text-center">
            创建您的账号，开始使用3D包材选型系统
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>账号类型</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'buyer' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'buyer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <div className="text-2xl mb-2">🛍️</div>
                  <div className="font-semibold">品牌方</div>
                  <div className="text-xs text-gray-600">浏览定制产品</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'vendor' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.role === 'vendor'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <div className="text-2xl mb-2">🏭</div>
                  <div className="font-semibold">包材厂商</div>
                  <div className="text-xs text-gray-600">上传销售产品</div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">公司名称 (可选)</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="您的公司名称"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少6位"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
            <p className="text-sm text-center text-gray-600">
              已有账号？{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                立即登录
              </Link>
            </p>
            <Link href="/" className="text-sm text-center text-gray-600 hover:underline">
              返回首页
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
