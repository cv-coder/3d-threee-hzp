import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Profile, UserRole } from '@/types/database';

export async function getCurrentProfile(redirectTo: string = '/login'): Promise<Profile> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(redirectTo);
  }

  const profile = await db.findOne<Profile>(
    'SELECT * FROM profiles WHERE id = $1',
    [session.user.id]
  );

  if (!profile) {
    redirect(redirectTo);
  }

  return profile;
}

export function requireRole(profile: Pick<Profile, 'role'>, role: UserRole, redirectTo: string = '/') {
  if (profile.role !== role) {
    redirect(redirectTo);
  }
}
