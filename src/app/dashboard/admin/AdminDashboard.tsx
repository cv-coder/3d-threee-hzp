'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Building2, LogOut, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

type AdminProfile = {
  id: string;
  email: string;
  company_name?: string;
};

type Vendor = {
  id: string;
  email: string;
  company_name?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

interface AdminDashboardProps {
  profile: AdminProfile;
}

export default function AdminDashboard({ profile }: AdminDashboardProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const verifiedCount = useMemo(() => vendors.filter((v) => v.is_verified).length, [vendors]);
  const pendingCount = useMemo(() => vendors.filter((v) => !v.is_verified).length, [vendors]);

  // 模糊搜索厂家（支持公司名称和邮箱）
  const filteredVendors = useMemo(() => {
    if (!searchText.trim()) {
      return vendors;
    }
    const query = searchText.toLowerCase();
    return vendors.filter(
      (v) =>
        (v.company_name?.toLowerCase() || '').includes(query) ||
        v.email.toLowerCase().includes(query)
    );
  }, [vendors, searchText]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendors');
      const data = await res.json();
      setVendors(data?.data?.vendors || []);
    } catch (error) {
      console.error('Load vendors error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const updateVerifyStatus = async (vendor: Vendor, next: boolean) => {
    setWorkingId(vendor.id);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: next }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || '操作失败');
        return;
      }

      await loadVendors();
    } catch (error) {
      console.error('Update verify status error:', error);
      alert('操作失败，请稍后重试');
    } finally {
      setWorkingId(null);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">管理员后台</h1>
            <p className="text-sm text-gray-600">{profile.company_name || profile.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadVendors} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{vendors.length}</CardTitle>
              <CardDescription>厂家总数</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">{verifiedCount}</CardTitle>
              <CardDescription>已认证厂家</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-amber-600">{pendingCount}</CardTitle>
              <CardDescription>待认证厂家</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              厂家认证管理
            </CardTitle>
            <CardDescription>开启后厂家会出现在公开展厅"认证厂商"列表</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 搜索框 */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索厂家名称、邮箱..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {loading && <p className="text-sm text-gray-500">加载中...</p>}

            {!loading && vendors.length === 0 && (
              <p className="text-sm text-gray-500">暂无厂家账号</p>
            )}

            {!loading && filteredVendors.length === 0 && searchText && (
              <p className="text-sm text-gray-500">
                未找到匹配的厂家 "{searchText}"
              </p>
            )}

            {!loading && filteredVendors.length > 0 && searchText && (
              <p className="text-sm text-gray-500">
                找到 {filteredVendors.length} 个匹配结果
              </p>
            )}

            <div className="space-y-3">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {vendor.company_name || '未命名厂家'}
                    </div>
                    <div className="text-sm text-gray-600">{vendor.email}</div>
                    <div className="mt-1">
                      {vendor.is_verified ? (
                        <span className="inline-flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          <BadgeCheck className="h-3 w-3 mr-1" />已认证
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          待认证
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {vendor.is_verified ? (
                    <Button
                      variant="outline"
                      disabled={workingId === vendor.id}
                      onClick={() => updateVerifyStatus(vendor, false)}
                    >
                      取消认证
                    </Button>
                  ) : (
                    <Button
                      disabled={workingId === vendor.id}
                      onClick={() => updateVerifyStatus(vendor, true)}
                    >
                      通过认证
                    </Button>
                  )}
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
