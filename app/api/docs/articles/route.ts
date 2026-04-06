import { db } from '@backend/lib/db';
import { jsonOk } from '@backend/lib/http';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const articles = await db.docArticle.findMany({
    where: category ? { category } : undefined,
    orderBy: [
      { category: 'asc' },
      { order: 'asc' },
    ],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      order: true,
      updatedAt: true,
    }
  });

  return jsonOk({ items: articles });
}
