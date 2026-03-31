import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { signJwt, verifyPassword } from '@backend/lib/auth';

export const runtime = 'nodejs';

const bodySchema = z.object({
  email: z.string().email().max(255).trim(),
  password: z.string().min(1).max(128)
});

export async function POST(req: Request) {
  try {
    const input = bodySchema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user) {
      return jsonError('UNAUTHORIZED', 'Credenciais inválidas', 401);
    }
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      return jsonError('UNAUTHORIZED', 'Credenciais inválidas', 401);
    }

    const token = signJwt({ userId: user.id, role: user.role });
    return jsonOk({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      }
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
