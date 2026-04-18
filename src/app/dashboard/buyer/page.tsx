import BuyerDashboard from './BuyerDashboard';
import { getCurrentProfile, requireRole } from '@/lib/server-auth';

export default async function BuyerPage() {
  const profile = await getCurrentProfile('/login');
  requireRole(profile, 'buyer', '/');

  return <BuyerDashboard profile={profile} />;
}
