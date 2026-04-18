import AdminDashboard from './AdminDashboard';
import { getCurrentProfile, requireRole } from '@/lib/server-auth';

export default async function AdminPage() {
  const profile = await getCurrentProfile('/login');
  requireRole(profile, 'admin', '/');

  return <AdminDashboard profile={profile} />;
}
