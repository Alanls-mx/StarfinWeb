import { z } from 'zod';
import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

const updateSchema = z.object({
  name: z.string().min(2).max(120).trim().optional(),
  slug: z.string().min(2).max(120).trim().optional(),
  price: z.number().int().min(0).optional(),
  downloadUrl: z.string().url().nullable().optional(),
  latestVersion: z.string().min(1).max(64).nullable().optional()
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization');
  const admin = await requireAdmin(auth);
  if (!admin) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const { id } = await ctx.params;
  try {
    const input = updateSchema.parse(await req.json());
    const plugin = await db.plugin.update({
      where: { id },
      data: input
    });
    return jsonOk({ plugin: { ...plugin, createdAt: plugin.createdAt.toISOString() } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('NOT_FOUND', 'Plugin não encontrado', 404);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization');
  const admin = await requireAdmin(auth);
  if (!admin) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const { id } = await ctx.params;
  try {
    await db.plugin.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch {
    return jsonError('NOT_FOUND', 'Plugin não encontrado', 404);
  }
}

