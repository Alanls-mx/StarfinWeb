import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { hashPassword } from '@backend/lib/auth';

export const runtime = 'nodejs';

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128)
});

export async function POST(req: Request) {
  try {
    const input = bodySchema.parse(await req.json());

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: input.token },
      include: { user: true }
    });

    if (!resetToken) {
      return jsonError('NOT_FOUND', 'Token de recuperação inválido', 404);
    }

    if (new Date() > resetToken.expiresAt) {
      await db.passwordResetToken.delete({ where: { id: resetToken.id } });
      return jsonError('GONE', 'Token de recuperação expirado', 410);
    }

    const passwordHash = await hashPassword(input.password);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      db.passwordResetToken.delete({ where: { id: resetToken.id } })
    ]);

    return jsonOk({ success: true, message: 'Senha redefinida com sucesso' });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
