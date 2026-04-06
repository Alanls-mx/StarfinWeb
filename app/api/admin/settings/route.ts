import { z } from 'zod';
import { requireAdmin } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { jsonError, jsonOk } from '../../../../lib/http';

export const runtime = 'nodejs';

// We'll use a generic key-value store for settings in the DB if we had a settings model.
// Since we don't have one in Prisma yet, let's add it or use a JSON file.
// Actually, let's add a Setting model to Prisma.

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  // For now, return some mock global settings since we don't have a table yet.
  // In a real app, you'd fetch from DB.
  return jsonOk({
    siteName: 'StarfinPlugins',
    siteDescription: 'Marketplace de plugins para Minecraft',
    maintenanceMode: false,
    discordUrl: 'https://discord.gg/starfin',
    supportEmail: 'suporte@starfinplugins.com',
    footerText: '© 2026 Starfin Plugins. Todos os direitos reservados.',
  });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  try {
    const body = await req.json();
    // Save settings logic here
    return jsonOk({ success: true, settings: body });
  } catch (e) {
    return jsonError('INTERNAL_ERROR', 'Erro ao salvar configurações', 500);
  }
}
