import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization');
  const session = await requireUser(auth);
  if (!session) return jsonError('UNAUTHORIZED', 'Nao autenticado', 401);

  const { id } = await context.params;
  const ticket = await db.ticket.findUnique({
    where: { id }
  });

  if (!ticket) return jsonError('NOT_FOUND', 'Ticket nao encontrado', 404);

  const isAdmin = session.user.role === 'admin';
  if (ticket.userId !== session.user.id && !isAdmin) {
    return jsonError('FORBIDDEN', 'Sem permissao', 403);
  }

  await db.ticket.update({
    where: { id },
    data: {
      status: 'closed',
      updatedAt: new Date()
    }
  });

  return jsonOk({ ok: true });
}
