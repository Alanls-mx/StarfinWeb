import { z } from 'zod';
import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

const updateSchema = z.object({
  featured: z.boolean().optional(),
  comment: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional()
});

// Admin management of reviews
export async function PATCH(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return jsonError('INVALID_INPUT', 'ID da avaliação requerido', 400);

  try {
    const input = updateSchema.parse(await req.json());
    const review = await db.review.update({
      where: { id },
      data: input
    });
    return jsonOk({ review });
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Erro ao atualizar avaliação', 500);
  }
}

export async function DELETE(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return jsonError('INVALID_INPUT', 'ID da avaliação requerido', 400);

  await db.review.delete({ where: { id } });
  return jsonOk({ success: true });
}
