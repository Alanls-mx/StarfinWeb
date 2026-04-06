import { z } from 'zod';
import { requireAdmin } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { jsonError, jsonOk } from '../../../../lib/http';

export const runtime = 'nodejs';

const couponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().int().positive(),
  minPurchase: z.number().int().nonnegative().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  active: z.boolean().default(true),
});

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return jsonOk({ items: coupons });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  try {
    const input = couponSchema.parse(await req.json());
    
    const existing = await db.coupon.findUnique({ where: { code: input.code } });
    if (existing) return jsonError('INVALID_INPUT', 'Código de cupom já existe', 400);

    const coupon = await db.coupon.create({
      data: {
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minPurchase: input.minPurchase,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxUses: input.maxUses,
        active: input.active,
      },
    });

    return jsonOk({ item: coupon }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', 500);
  }
}

export async function DELETE(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('INVALID_INPUT', 'ID requerido', 400);

  try {
    await db.coupon.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError('NOT_FOUND', 'Cupom não encontrado', 404);
  }
}

export async function PATCH(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return jsonError('INVALID_INPUT', 'ID requerido', 400);

  try {
    const body = await req.json();
    const coupon = await db.coupon.update({
      where: { id },
      data: body,
    });
    return jsonOk({ item: coupon });
  } catch (e) {
    return jsonError('NOT_FOUND', 'Cupom não encontrado', 404);
  }
}
