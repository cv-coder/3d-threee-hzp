import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import VendorDashboard from './VendorDashboard';

export default async function VendorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const profile = await db.findOne<any>(
    'SELECT * FROM profiles WHERE id = $1',
    [session.user.id]
  );

  if (profile?.role !== 'vendor') {
    redirect('/');
  }

  return <VendorDashboard profile={profile} />;
}
