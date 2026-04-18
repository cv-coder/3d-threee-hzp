import VendorDashboard from './VendorDashboard';
import { getCurrentProfile, requireRole } from '@/lib/server-auth';

export default async function VendorPage() {
  const profile = await getCurrentProfile('/login');
  requireRole(profile, 'vendor', '/');

  return <VendorDashboard profile={profile} />;
}
