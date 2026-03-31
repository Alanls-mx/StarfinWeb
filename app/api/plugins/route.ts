import { db } from '@backend/lib/db';
import { jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

export async function GET() {
  const items = await db.plugin.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      jarUrl: true,
      latestVersion: true,
      createdAt: true
    }
  });
  return jsonOk({
    items: items.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString()
    }))
  });
}

