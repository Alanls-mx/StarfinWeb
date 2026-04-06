import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const article = await db.docArticle.findUnique({
    where: { slug },
  });

  if (!article) return jsonError('NOT_FOUND', 'Artigo não encontrado', 404);

  return jsonOk(article);
}
