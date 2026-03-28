import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    // 获取用户资料并重定向到相应的 Dashboard
    const profile = await db.findOne<any>(
      'SELECT role FROM profiles WHERE id = $1',
      [session.user.id]
    );

    if (profile?.role === 'vendor') {
      redirect('/dashboard/vendor');
    } else if (profile?.role === 'buyer') {
      redirect('/dashboard/buyer');
    } else if (profile?.role === 'admin') {
      redirect('/dashboard/admin');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            3D包材选型系统
          </h1>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>注册</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold text-gray-900">
            轻松定制您的专属包装
          </h2>
          <p className="text-xl text-gray-600">
            连接包材厂商与品牌方，提供在线3D可视化定制体验
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="text-xl font-semibold mb-2">厂商入驻</h3>
              <p className="text-gray-600">
                上传3D模型，展示产品，接收询价订单
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">3D定制</h3>
              <p className="text-gray-600">
                实时预览材质颜色，上传Logo，所见即所得
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">快速询价</h3>
              <p className="text-gray-600">
                保存设计方案，一键发起询价，对接厂商
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link href="/shop">
              <Button size="lg" className="text-lg px-8 py-6">
                浏览产品展厅 →
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t mt-24 py-8 bg-white/50">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2026 3D包材选型系统. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
