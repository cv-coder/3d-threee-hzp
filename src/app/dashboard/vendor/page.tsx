import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VendorDashboard from './VendorDashboard';

export default async function VendorPage() {
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

  if (profile?.role !== 'vendor') {
    redirect('/');
  }

  return <VendorDashboard profile={profile} />;
}
