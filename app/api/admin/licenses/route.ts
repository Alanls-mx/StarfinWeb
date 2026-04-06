import crypto from 'node:crypto';
import { z } from 'zod';
import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { sendDiscordWebhook } from '@backend/lib/discord';

export const runtime = 'nodejs';

const bodySchema = z.object({
  userEmail: z.string().email().max(255).trim(),
  plan: z.string().min(1).max(64).default('Premium'),
  status: z.enum(['active', 'suspended']).default('active'),
  expiresInDays: z.number().int().min(1).max(3650).default(365),
  pluginIds: z.array(z.string().min(1)).min(1).max(50)
});

function generateLicenseKey() {
  return `LIC-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const admin = await requireAdmin(auth);
  if (!admin) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  try {
    const input = bodySchema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: input.userEmail } });
    if (!user) return jsonError('NOT_FOUND', 'Usuário não encontrado', 404);

    const plugins = await db.plugin.findMany({ where: { id: { in: input.pluginIds } } });
    if (plugins.length !== input.pluginIds.length) {
      return jsonError('NOT_FOUND', 'Um ou mais plugins não foram encontrados', 404);
    }

    const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
    const license = await db.license.create({
      data: {
        licenseKey: generateLicenseKey(),
        userId: user.id,
        plan: input.plan,
        status: input.status,
        expiresAt,
        plugins: { create: input.pluginIds.map((pluginId) => ({ pluginId })) }
      }
    });

    await sendDiscordWebhook({
      content: `✅ Licença criada (admin)\nuser=${user.email}\nlicenseKey=${license.licenseKey}\nplugins=${plugins.map((p) => p.slug).join(', ')}`
    });

    return jsonOk(
      {
        license: {
          id: license.id,
          licenseKey: license.licenseKey,
          status: license.status,
          plan: license.plan,
          expiresAt: license.expiresAt?.toISOString() ?? null
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

