import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BuyerDashboard from './BuyerDashboard';

export default async function BuyerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'buyer') {
    redirect('/');
  }

  return <BuyerDashboard profile={profile} />;
}
