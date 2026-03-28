import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import AdminDashboard from './AdminDashboard';

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const profile = await db.findOne<any>(
    'SELECT * FROM profiles WHERE id = $1',
    [session.user.id]
  );

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return <AdminDashboard profile={profile} />;
}
