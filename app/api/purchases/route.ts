import crypto from 'node:crypto';
import { z } from 'zod';
import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { sendDiscordWebhook } from '@backend/lib/discord';
import { createLicenseForUser } from '@backend/lib/license';

export const runtime = 'nodejs';

const bodySchema = z.object({
  pluginId: z.string().min(1)
});

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const result = await requireUser(auth);
  if (!result) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  try {
    const input = bodySchema.parse(await req.json());
    const plugin = await db.plugin.findUnique({ where: { id: input.pluginId } });
    if (!plugin) return jsonError('NOT_FOUND', 'Plugin não encontrado', 404);

    const license = await createLicenseForUser(result.user.id, plugin.id);

    await sendDiscordWebhook({
      content: `✅ Nova licença ativada\nuser=${result.user.email}\nlicenseKey=${license.licenseKey}\nplugin=${plugin.slug}`
    });

    return jsonOk(
      {
        license: {
          id: license.id,
          licenseKey: license.licenseKey,
          plan: license.plan,
          status: license.status,
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

