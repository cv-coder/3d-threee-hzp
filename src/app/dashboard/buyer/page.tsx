import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import BuyerDashboard from './BuyerDashboard';

export default async function BuyerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const profile = await db.findOne<any>(
    'SELECT * FROM profiles WHERE id = $1',
    [session.user.id]
  );

  if (profile?.role !== 'buyer') {
    redirect('/');
  }

  return <BuyerDashboard profile={profile} />;
}
