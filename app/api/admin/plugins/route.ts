import { z } from 'zod';
import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

const createSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z.string().min(2).max(120).trim(),
  price: z.number().int().min(0),
  downloadUrl: z.string().url().optional().nullable(),
  latestVersion: z.string().min(1).max(64).optional().nullable()
});

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const admin = await requireAdmin(auth);
  if (!admin) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const items = await db.plugin.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return jsonOk({
    items: items.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))
  });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const admin = await requireAdmin(auth);
  if (!admin) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  try {
    const input = createSchema.parse(await req.json());
    const plugin = await db.plugin.create({
      data: {
        name: input.name,
        slug: input.slug,
        price: input.price,
        downloadUrl: input.downloadUrl ?? null,
        latestVersion: input.latestVersion ?? null
      }
    });
    return jsonOk({ plugin: { ...plugin, createdAt: plugin.createdAt.toISOString() } }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}

