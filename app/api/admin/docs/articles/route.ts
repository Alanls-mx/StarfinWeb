import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { z } from 'zod';

const articleSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  content: z.string().min(1),
  category: z.string().min(2),
  order: z.number().int().default(0),
});

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const articles = await db.docArticle.findMany({
    orderBy: [
      { category: 'asc' },
      { order: 'asc' },
    ],
  });

  return jsonOk({ items: articles });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  try {
    const body = await req.json();
    const input = articleSchema.parse(body);

    const article = await db.docArticle.create({
      data: input,
    });

    return jsonOk(article);
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError('INVALID_INPUT', 'Dados inválidos', 400);
    return jsonError('INTERNAL_ERROR', 'Erro ao criar artigo', 500);
  }
}
