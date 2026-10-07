/**
 * Stateless session: HS256 JWT in an httpOnly, SameSite=Lax cookie.
 */
import type { Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';

const COOKIE = 'session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const secret = new TextEncoder().encode(
  process.env['JWT_SECRET'] ?? 'dev-jwt-secret-change-in-production'
);
const secure = process.env['NODE_ENV'] === 'production' && process.env['COOKIE_SECURE'] !== 'false';

export interface SessionUser {
  id: string;
  username: string;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

function readCookie(req: Request, name: string): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export async function setSession(res: Response, user: SessionUser): Promise<void> {
  const token = await new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret);
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: MAX_AGE_SECONDS * 1000,
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(COOKIE, { path: '/' });
}

export async function readSession(req: Request): Promise<SessionUser | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload.sub && typeof payload['username'] === 'string'
      ? { id: payload.sub, username: payload['username'] }
      : null;
  } catch {
    return null;
  }
}

export async function requireUser(req: Request): Promise<SessionUser> {
  const user = await readSession(req);
  if (!user) throw new HttpError(401, 'Please log in first');
  return user;
}
