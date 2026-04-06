import { z } from 'zod';
import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

const reviewSchema = z.object({
  pluginId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000)
});

// GET reviews for a plugin or all reviews (public)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pluginId = searchParams.get('pluginId');
  const featured = searchParams.get('featured') === 'true';

  const reviews = await db.review.findMany({
    where: {
      ...(pluginId ? { pluginId } : {}),
      ...(featured ? { featured: true } : {})
    },
    include: {
      user: {
        select: { name: true }
      },
      plugin: {
        select: { name: true, slug: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return jsonOk({ reviews });
}

// POST a new review
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const session = await requireUser(auth);
  if (!session) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  try {
    const input = reviewSchema.parse(await req.json());

    // 1. Check if user owns the plugin
    const ownership = await db.licensePlugin.findFirst({
      where: {
        pluginId: input.pluginId,
        license: {
          userId: session.user.id
        }
      }
    });

    if (!ownership) {
      return jsonError('FORBIDDEN', 'Você precisa adquirir o plugin antes de avaliar', 403);
    }

    // 2. Create or update review
    const review = await db.review.upsert({
      where: {
        userId_pluginId: {
          userId: session.user.id,
          pluginId: input.pluginId
        }
      },
      update: {
        rating: input.rating,
        comment: input.comment
      },
      create: {
        userId: session.user.id,
        pluginId: input.pluginId,
        rating: input.rating,
        comment: input.comment
      }
    });

    return jsonOk({ review }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}
