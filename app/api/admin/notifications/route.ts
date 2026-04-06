import { z } from 'zod';
import { requireAdmin } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { jsonError, jsonOk } from '../../../../lib/http';

export const runtime = 'nodejs';

const notificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  userId: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const notifications = await db.notification.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  return jsonOk({ items: notifications });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  try {
    const input = notificationSchema.parse(await req.json());
    
    if (input.userId) {
      const user = await db.user.findUnique({ where: { id: input.userId } });
      if (!user) return jsonError('NOT_FOUND', 'Usuário não encontrado', 404);
    }

    const notification = await db.notification.create({
      data: {
        title: input.title,
        message: input.message,
        userId: input.userId || null,
      },
    });

    return jsonOk({ item: notification }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}

export async function DELETE(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('INVALID_INPUT', 'ID requerido', 400);

  try {
    await db.notification.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError('NOT_FOUND', 'Notificação não encontrada', 404);
  }
}
