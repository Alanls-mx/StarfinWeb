import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { signJwt, verifyPassword } from '@backend/lib/auth';
import { rateLimit } from '@backend/lib/rateLimit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email().max(255).trim(),
  password: z.string().min(1).max(128)
});

export async function POST(req: Request) {
  try {
    const input = bodySchema.parse(await req.json());
    const email = input.email.toLowerCase();
    // Untrusted X-Forwarded-For is not a safe identifier for brute-force limits.
    const fingerprint = createHash('sha256').update(email).digest('hex');
    const [perAccount, global] = await Promise.all([
      rateLimit({ key: `auth:login:email:${fingerprint}`, limit: 10, windowMs: 60_000 }),
      rateLimit({ key: 'auth:login:global', limit: 600, windowMs: 60_000 })
    ]);
    if (!perAccount.ok || !global.ok) {
      return jsonError('RATE_LIMITED', 'Muitas tentativas. Tente novamente em instantes.', 429);
    }

    const user = await db.user.findUnique({ where: { email } });
    // Same reply for unknown, banned or incorrect-password accounts.
    if (!user || user.banned) {
      return jsonError('UNAUTHORIZED', 'Credenciais inválidas', 401);
    }
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) return jsonError('UNAUTHORIZED', 'Credenciais inválidas', 401);

    const token = signJwt({ userId: user.id, role: user.role });
    return jsonOk({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) return jsonError('INVALID_INPUT', 'Entrada inválida', 400, error.flatten());
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
