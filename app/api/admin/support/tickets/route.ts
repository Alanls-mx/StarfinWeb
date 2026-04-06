import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const tickets = await db.ticket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return jsonOk({ items: tickets });
}
