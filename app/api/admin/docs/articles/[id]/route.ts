import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  content: z.string().min(1).optional(),
  category: z.string().min(2).optional(),
  order: z.number().int().optional(),
});

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  try {
    const body = await req.json();
    const input = updateSchema.parse(body);

    const article = await db.docArticle.update({
      where: { id },
      data: input,
    });

    return jsonOk(article);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError('INVALID_INPUT', 'Dados inválidos', 400);
    return jsonError('INTERNAL_ERROR', 'Erro ao atualizar artigo', 500);
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  await db.docArticle.delete({
    where: { id },
  });

  return jsonOk({ ok: true });
}
