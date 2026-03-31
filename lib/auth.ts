import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from './db';

const jwtSecret = process.env.JWT_SECRET ?? '';

export const jwtPayloadSchema = z.object({
  sub: z.string(),
  role: z.enum(['user', 'admin']).default('user'),
  iat: z.number().optional(),
  exp: z.number().optional()
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signJwt(payload: { userId: string; role?: 'user' | 'admin' }) {
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    {
      sub: payload.userId,
      role: payload.role ?? 'user'
    },
    jwtSecret,
    { expiresIn: '30d' }
  );
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    if (!jwtSecret) return null;
    const decoded = jwt.verify(token, jwtSecret) as unknown;
    return jwtPayloadSchema.parse(decoded);
  } catch {
    return null;
  }
}

export function getBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export async function requireUser(authorizationHeader: string | null) {
  const token = getBearerToken(authorizationHeader);
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;
  return { user, role: user.role };
}

export async function requireAdmin(authorizationHeader: string | null) {
  const result = await requireUser(authorizationHeader);
  if (!result) return null;
  if (result.role !== 'admin') return null;
  return result;
}
