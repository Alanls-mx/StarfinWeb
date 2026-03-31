import crypto from 'node:crypto';
import { z } from 'zod';
import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { sendDiscordWebhook } from '@backend/lib/discord';

export const runtime = 'nodejs';

const bodySchema = z.object({
  pluginId: z.string().min(1),
  plan: z.string().min(1).max(64).default('Premium'),
  expiresInDays: z.number().int().min(1).max(3650).default(365)
});

function generateLicenseKey() {
  return `LIC-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const result = await requireUser(auth);
  if (!result) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  try {
    const input = bodySchema.parse(await req.json());
    const plugin = await db.plugin.findUnique({ where: { id: input.pluginId } });
    if (!plugin) return jsonError('NOT_FOUND', 'Plugin não encontrado', 404);

    const expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);

    const license = await db.license.create({
      data: {
        licenseKey: generateLicenseKey(),
        userId: result.user.id,
        plan: input.plan,
        status: 'active',
        expiresAt,
        plugins: {
          create: [{ pluginId: plugin.id }]
        }
      },
      include: { plugins: { include: { plugin: true } } }
    });

    await sendDiscordWebhook({
      content: `✅ Nova licença ativada\nuser=${result.user.email}\nlicenseKey=${license.licenseKey}\nplugin=${plugin.slug}\nexpiresAt=${expiresAt.toISOString()}`
    });

    return jsonOk(
      {
        license: {
          id: license.id,
          licenseKey: license.licenseKey,
          plan: license.plan,
          status: license.status,
          expiresAt: license.expiresAt?.toISOString() ?? null,
          plugins: license.plugins.map((lp) => ({ slug: lp.plugin.slug, name: lp.plugin.name }))
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

