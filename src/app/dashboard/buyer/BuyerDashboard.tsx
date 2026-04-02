'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatPrice } from '@/lib/utils';
import { LogOut, Inbox, FileText, ShoppingBag, Eye } from 'lucide-react';
import type { Profile } from '@/types/database';

interface BuyerDashboardProps {
  profile: Profile;
}

type Tab = 'overview' | 'designs' | 'inquiries';

export default function BuyerDashboard({ profile }: BuyerDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [designs, setDesigns] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [designsRes, inquiriesRes] = await Promise.all([
        fetch('/api/design/save'),
        fetch('/api/inquiries'),
      ]);
      if (designsRes.ok) {
        const data = await designsRes.json();
        setDesigns(data.data || []);
      }
      if (inquiriesRes.ok) {
        const data = await inquiriesRes.json();
        setInquiries(data.data || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      quoted: 'bg-blue-100 text-blue-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    const labels = {
      pending: '待报价',
      quoted: '已报价',
      accepted: '已接受',
      rejected: '已拒绝',
      closed: '已关闭',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">买家中心</h1>
            <p className="text-sm text-gray-600">{profile.company_name || profile.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/shop">
              <Button variant="outline">
                <ShoppingBag className="h-4 w-4 mr-2" />
                浏览产品
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Inbox className="h-5 w-5" />
                <span>总览</span>
              </button>
              <button
                onClick={() => setActiveTab('designs')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'designs'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>我的设计</span>
              </button>
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'inquiries'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Inbox className="h-5 w-5" />
                <span>询价记录</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{designs.length}</CardTitle>
                      <CardDescription>设计方案</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">{inquiries.length}</CardTitle>
                      <CardDescription>询价记录</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-2xl">
                        {inquiries.filter(i => i.status === 'pending').length}
                      </CardTitle>
                      <CardDescription>待处理询价</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>快速开始</CardTitle>
                    <CardDescription>探索更多产品并开始定制</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/shop">
                      <Button size="lg">
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        浏览产品展厅
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* 最近询价 */}
                {inquiries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>最近询价</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {inquiries.slice(0, 5).map((inquiry) => (
                          <div
                            key={inquiry.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold">{inquiry.product?.name}</h4>
                              <p className="text-sm text-gray-600">
                                数量: {inquiry.quantity} • {formatDate(inquiry.created_at)}
                              </p>
                            </div>
                            <div className="text-right space-y-2">
                              {getStatusBadge(inquiry.status)}
                              {inquiry.quoted_price && (
                                <div className="text-lg font-bold text-blue-600">
                                  {formatPrice(inquiry.quoted_price)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'designs' && (
              <Card>
                <CardHeader>
                  <CardTitle>我的设计方案</CardTitle>
                  <CardDescription>您保存的所有定制方案</CardDescription>
                </CardHeader>
                <CardContent>
                  {designs.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      还没有保存的设计方案
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {designs.map((design) => (
                        <div
                          key={design.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-500 transition-colors"
                        >
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            {design.snapshot_url ? (
                              <img
                                src={design.snapshot_url}
                                alt={design.session_name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <span className="text-3xl">📦</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                              {design.session_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {design.product?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(design.created_at)}
                            </p>
                          </div>
                          <Link href={`/shop/product/${design.product_id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'inquiries' && (
              <Card>
                <CardHeader>
                  <CardTitle>询价记录</CardTitle>
                  <CardDescription>查看所有询价状态和报价</CardDescription>
                </CardHeader>
                <CardContent>
                  {inquiries.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      还没有询价记录
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inquiries.map((inquiry) => (
                        <div
                          key={inquiry.id}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {inquiry.product?.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                厂家: {inquiry.vendor?.company_name || '未知'}
                              </p>
                            </div>
                            {getStatusBadge(inquiry.status)}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">数量:</span>
                              <span className="ml-2 font-semibold">
                                {inquiry.quantity}
                              </span>
                            </div>
                            {inquiry.quoted_price && (
                              <div>
                                <span className="text-gray-500">报价:</span>
                                <span className="ml-2 font-semibold text-blue-600">
                                  {formatPrice(inquiry.quoted_price)}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">创建时间:</span>
                              <span className="ml-2">{formatDate(inquiry.created_at)}</span>
                            </div>
                            {inquiry.quoted_at && (
                              <div>
                                <span className="text-gray-500">报价时间:</span>
                                <span className="ml-2">
                                  {formatDate(inquiry.quoted_at)}
                                </span>
                              </div>
                            )}
                          </div>

                          {inquiry.message && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">留言:</span> {inquiry.message}
                              </p>
                            </div>
                          )}

                          {inquiry.vendor_notes && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-900">
                                <span className="font-semibold">厂家回复:</span>{' '}
                                {inquiry.vendor_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
