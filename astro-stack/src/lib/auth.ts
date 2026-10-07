/**
 * Stateless session: a signed JWT (HS256) in an httpOnly cookie.
 */
import type { AstroCookies } from 'astro';
import { jwtVerify, SignJWT } from 'jose';

export const SESSION_COOKIE = 'session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? import.meta.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production'
);

export interface SessionUser {
  id: string;
  username: string;
}

export async function createSession(cookies: AstroCookies, user: SessionUser): Promise<void> {
  const token = await new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret);

  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD && process.env.COOKIE_SECURE !== 'false',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function readSession(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    if (!payload.sub || typeof payload.username !== 'string') return null;
    return { id: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

export function destroySession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
