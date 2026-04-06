import { z } from 'zod';
import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

const createTicketSchema = z.object({
  subject: z.string().min(5).max(100),
  category: z.string().min(2),
  priority: z.enum(['low', 'medium', 'high']),
  message: z.string().min(10).max(5000)
});

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const session = await requireUser(auth);
  if (!session) return jsonError('UNAUTHORIZED', 'Nao autenticado', 401);

  try {
    const body = await req.json();
    const input = createTicketSchema.parse(body);

    const ticket = await db.ticket.create({
      data: {
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        userId: session.user.id,
        status: 'open',
        messages: {
          create: {
            content: input.message,
            userId: session.user.id,
            isAdmin: false
          }
        }
      },
      include: {
        messages: true
      }
    });

    return jsonOk(ticket);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError('INVALID_INPUT', 'Dados invalidos', 400, e.flatten());
    return jsonError('INTERNAL_ERROR', 'Erro ao criar ticket', 500);
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const session = await requireUser(auth);
  if (!session) return jsonError('UNAUTHORIZED', 'Nao autenticado', 401);

  const tickets = await db.ticket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' }
  });

  return jsonOk({ items: tickets });
}
