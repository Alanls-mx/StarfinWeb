import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

const bodySchema = z.object({
  token: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const input = bodySchema.parse(await req.json());

    const verificationToken = await db.verificationToken.findUnique({
      where: { token: input.token },
      include: { user: true }
    });

    if (!verificationToken) {
      return jsonError('NOT_FOUND', 'Token de verificação inválido', 404);
    }

    if (new Date() > verificationToken.expiresAt) {
      await db.verificationToken.delete({ where: { id: verificationToken.id } });
      return jsonError('GONE', 'Token de verificação expirado', 410);
    }

    await db.$transaction([
      db.user.update({
        where: { id: verificationToken.userId },
        data: { verified: true }
      }),
      db.verificationToken.delete({ where: { id: verificationToken.id } })
    ]);

    return jsonOk({ success: true, message: 'Email verificado com sucesso' });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
