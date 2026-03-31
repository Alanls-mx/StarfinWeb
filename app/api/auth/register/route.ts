import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { hashPassword, signJwt } from '@backend/lib/auth';

export const runtime = 'nodejs';

const bodySchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().max(255).trim(),
  password: z.string().min(8).max(128)
});

export async function POST(req: Request) {
  try {
    const input = bodySchema.parse(await req.json());

    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return jsonError('FORBIDDEN', 'Email já cadastrado', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash
      }
    });

    const token = signJwt({ userId: user.id, role: user.role });
    return jsonOk(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString()
        }
      },
      201
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
