import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const result = await requireUser(auth);
  if (!result) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  const licenses = await db.license.findMany({
    where: { userId: result.user.id },
    orderBy: { createdAt: 'desc' },
    include: { plugins: { include: { plugin: true } } }
  });

  return jsonOk({
    items: licenses.map((l) => ({
      id: l.id,
      licenseKey: l.licenseKey,
      hwid: l.hwid,
      plan: l.plan,
      status: l.status,
      expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
      createdAt: l.createdAt.toISOString(),
      plugins: l.plugins.map((lp) => ({
        id: lp.plugin.id,
        name: lp.plugin.name,
        slug: lp.plugin.slug
      }))
    }))
  });
}

