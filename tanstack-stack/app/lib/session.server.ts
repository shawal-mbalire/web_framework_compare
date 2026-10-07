/**
 * Encrypted cookie session (TanStack Start's built-in sealed sessions).
 */
import { useSession } from '@tanstack/react-start/server';
import type { SessionUser } from './schemas';

type SessionData = Partial<SessionUser>;

const password =
  process.env.SESSION_SECRET ?? 'dev-session-secret-change-in-production-32+chars';

export function getAppSession() {
  return useSession<SessionData>({
    password,
    name: 'social-audit',
    maxAge: 60 * 60 * 24 * 7,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
      path: '/',
    },
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const { data } = await getAppSession();
  return data.id && data.username ? { id: data.id, username: data.username } : null;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('Please log in first');
  return user;
}
