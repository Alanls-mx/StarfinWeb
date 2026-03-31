import { z } from 'zod';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

const validateSchema = z.object({
  code: z.string().min(1),
  totalCents: z.number().int().min(0)
});

export async function POST(req: Request) {
  try {
    const input = validateSchema.parse(await req.json());
    
    const coupon = await db.coupon.findUnique({
      where: { code: input.code.toUpperCase() }
    });

    if (!coupon || !coupon.active) {
      return jsonError('NOT_FOUND', 'Cupom inválido ou inativo', 404);
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return jsonError('EXPIRED', 'Este cupom já expirou', 410);
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return jsonError('MAX_USES', 'Este cupom atingiu o limite de usos', 410);
    }

    if (coupon.minPurchase && input.totalCents < coupon.minPurchase) {
      return jsonError('MIN_PURCHASE', `Este cupom requer uma compra mínima de R$ ${(coupon.minPurchase / 100).toFixed(2)}`, 400);
    }

    let discountCents = 0;
    if (coupon.discountType === 'percentage') {
      discountCents = Math.floor((input.totalCents * coupon.discountValue) / 100);
    } else {
      discountCents = coupon.discountValue;
    }

    return jsonOk({
      couponId: coupon.id,
      code: coupon.code,
      discountCents,
      finalCents: Math.max(0, input.totalCents - discountCents)
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno ao validar cupom', 500);
  }
}
