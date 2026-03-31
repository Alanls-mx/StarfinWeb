import { z } from 'zod';
import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

const createSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z.string().min(2).max(120).trim(),
  description: z.string().min(1),
  price: z.number().int().min(0),
  jarUrl: z.string().url().optional().nullable(),
  dependencies: z.array(z.string()).optional().default([]),
  platform: z.string().optional().default('Bukkit'),
  latestVersion: z.string().min(1).max(64).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  images: z.array(z.string()).optional().default([])
});

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  const admin = await requireAdmin(auth);
  if (!admin) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const items = await db.plugin.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return jsonOk({
    items: items.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      dependencies: (p.dependencies as string[]) ?? [],
      images: (p.images as string[]) ?? []
    }))
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
        description: input.description,
        price: input.price,
        jarUrl: input.jarUrl ?? null,
        dependencies: input.dependencies,
        platform: input.platform,
        latestVersion: input.latestVersion ?? null,
        imageUrl: input.imageUrl ?? null,
        images: input.images
      }
    });
    return jsonOk(
      {
        plugin: {
          ...plugin,
          createdAt: plugin.createdAt.toISOString(),
          dependencies: (plugin.dependencies as string[]) ?? [],
          images: (plugin.images as string[]) ?? []
        }
      },
      201
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}

