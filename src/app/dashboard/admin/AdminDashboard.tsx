'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Building2, LayoutDashboard, LogOut, Pencil, Plus, RefreshCw, Search, ShieldCheck, Tag, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

type AdminTab = 'overview' | 'vendors' | 'categories';

const ADMIN_MENU: Array<{ key: AdminTab; label: string; icon: React.ElementType }> = [
  { key: 'overview', label: '数据概览', icon: LayoutDashboard },
  { key: 'vendors', label: '厂家认证管理', icon: ShieldCheck },
  { key: 'categories', label: '配件分类管理', icon: Tag },
];

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

type AccessoryCategory = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

interface AdminDashboardProps {
  profile: AdminProfile;
}

export default function AdminDashboard({ profile }: AdminDashboardProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [accessoryCategories, setAccessoryCategories] = useState<AccessoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

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
    try {
      const res = await fetch('/api/admin/vendors');
      const data = await res.json();
      setVendors(data?.data?.vendors || []);
    } catch (error) {
      console.error('Load vendors error:', error);
    }
  };

  const loadAccessoryCategories = async () => {
    try {
      const res = await fetch('/api/admin/accessory-categories');
      const data = await res.json();
      setAccessoryCategories(data?.data?.categories || []);
    } catch (error) {
      console.error('Load accessory categories error:', error);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadVendors(), loadAccessoryCategories()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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

  const createAccessoryCategory = async (): Promise<boolean> => {
    const name = categoryDraft.trim();
    if (!name) {
      alert('请输入分类名称');
      return false;
    }

    setCategoryLoading(true);
    try {
      const res = await fetch('/api/admin/accessory-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || '新增分类失败');
        return false;
      }

      setCategoryDraft('');
      await loadAccessoryCategories();
      return true;
    } catch (error) {
      console.error('Create accessory category error:', error);
      alert('新增分类失败，请稍后重试');
      return false;
    } finally {
      setCategoryLoading(false);
    }
  };

  const startEditCategory = (category: AccessoryCategory) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const saveEditCategory = async () => {
    if (!editingCategoryId) return;

    const name = editingCategoryName.trim();
    if (!name) {
      alert('请输入分类名称');
      return;
    }

    setCategoryLoading(true);
    try {
      const res = await fetch(`/api/admin/accessory-categories/${editingCategoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || '更新分类失败');
        return;
      }

      setEditingCategoryId(null);
      setEditingCategoryName('');
      await loadAccessoryCategories();
    } catch (error) {
      console.error('Update accessory category error:', error);
      alert('更新分类失败，请稍后重试');
    } finally {
      setCategoryLoading(false);
    }
  };

  const deleteAccessoryCategory = async (category: AccessoryCategory) => {
    if (!confirm(`确定删除分类“${category.name}”吗？`)) return;

    setCategoryLoading(true);
    try {
      const res = await fetch(`/api/admin/accessory-categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || '删除分类失败');
        return;
      }

      if (editingCategoryId === category.id) {
        setEditingCategoryId(null);
        setEditingCategoryName('');
      }
      await loadAccessoryCategories();
    } catch (error) {
      console.error('Delete accessory category error:', error);
      alert('删除分类失败，请稍后重试');
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r bg-white">
        <div className="border-b px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">管理员后台</h1>
          <p className="truncate text-xs text-gray-500">{profile.company_name || profile.email}</p>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {ADMIN_MENU.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {ADMIN_MENU.find((m) => m.key === activeTab)?.label}
            </h2>
            <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </header>

        <main className="px-6 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
                <p className="text-sm text-gray-500">加载中...</p>
              </div>
            </div>
          ) : (
          <>
          {/* ===== 数据概览 ===== */}
          {activeTab === 'overview' && (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600">{accessoryCategories.length}</CardTitle>
              <CardDescription>配件分类数</CardDescription>
            </CardHeader>
          </Card>
        </div>
            </>
          )}

          {/* ===== 厂家认证管理 ===== */}
          {activeTab === 'vendors' && (
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
                      {workingId === vendor.id ? '处理中...' : '取消认证'}
                    </Button>
                  ) : (
                    <Button
                      disabled={workingId === vendor.id}
                      onClick={() => updateVerifyStatus(vendor, true)}
                    >
                      {workingId === vendor.id ? '处理中...' : '通过认证'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>
          )}

          {/* ===== 配件分类管理 ===== */}
          {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>配件分类管理</CardTitle>
            <CardDescription>维护厂家创建产品时可选择的配件分类</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setCategoryDraft(''); setShowCategoryModal(true); }} disabled={categoryLoading}>
                <Plus className="h-4 w-4 mr-2" />
                新增分类
              </Button>
            </div>

            {/* 新增分类弹窗 */}
            {showCategoryModal && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setShowCategoryModal(false)}>
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
                  <h3 className="mb-4 text-lg font-semibold">新增配件分类</h3>
                  <Input
                    placeholder="输入配件分类名称"
                    value={categoryDraft}
                    onChange={(e) => setCategoryDraft(e.target.value)}
                    disabled={categoryLoading}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        createAccessoryCategory().then((ok) => { if (ok) setShowCategoryModal(false); });
                      }
                    }}
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCategoryModal(false)} disabled={categoryLoading}>
                      取消
                    </Button>
                    <Button
                      onClick={async () => {
                        const ok = await createAccessoryCategory();
                        if (ok) setShowCategoryModal(false);
                      }}
                      disabled={categoryLoading}
                    >
                      {categoryLoading ? '提交中...' : '确定'}
                    </Button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {accessoryCategories.length === 0 ? (
              <p className="text-sm text-gray-500">暂无配件分类</p>
            ) : (
              <div className="space-y-3">
                {accessoryCategories.map((category) => {
                  const editing = editingCategoryId === category.id;
                  return (
                    <div
                      key={category.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex-1">
                        {editing ? (
                          <Input
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            disabled={categoryLoading}
                          />
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900">{category.name}</div>
                            <div className="text-xs text-gray-500">排序值：{category.sort_order}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {editing ? (
                          <>
                            <Button onClick={saveEditCategory} disabled={categoryLoading}>
                              保存
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setEditingCategoryName('');
                              }}
                              disabled={categoryLoading}
                            >
                              取消
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => startEditCategory(category)}
                              disabled={categoryLoading}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              编辑
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => deleteAccessoryCategory(category)}
                              disabled={categoryLoading}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
          )}
          </>
          )}
        </main>
      </div>
    </div>
  );
}
