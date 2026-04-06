import { z } from 'zod';
import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

const messageSchema = z.object({
  content: z.string().min(1).max(5000)
});

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

  if (ticket.status === 'closed' && !isAdmin) {
    return jsonError('INVALID_INPUT', 'Ticket encerrado', 400);
  }

  try {
    const body = await req.json();
    const { content } = messageSchema.parse(body);

    const message = await db.ticketMessage.create({
      data: {
        content,
        ticketId: id,
        userId: session.user.id,
        isAdmin
      }
    });

    await db.ticket.update({
      where: { id },
      data: {
        status: isAdmin ? 'answered' : 'open',
        updatedAt: new Date()
      }
    });

    return jsonOk(message);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError('INVALID_INPUT', 'Dados invalidos', 400);
    return jsonError('INTERNAL_ERROR', 'Erro ao enviar mensagem', 500);
  }
}
