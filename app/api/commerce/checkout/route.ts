import { z } from 'zod';
import { requireUser } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';
import { createLicenseForUser } from '@backend/lib/license';
import { sendDiscordWebhook } from '@backend/lib/discord';
import { getOrderConfirmationHtml, sendMail } from '@backend/lib/mail-service';

export const runtime = 'nodejs';

const checkoutSchema = z.object({
  pluginIds: z.array(z.string().min(1)).min(1),
  couponCode: z.string().optional()
});

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const session = await requireUser(auth);
  if (!session) return jsonError('UNAUTHORIZED', 'Não autorizado', 401);

  try {
    const input = checkoutSchema.parse(await req.json());
    
    // 1. Fetch all plugins and calculate subtotal
    const plugins = await db.plugin.findMany({
      where: { id: { in: input.pluginIds } }
    });

    if (plugins.length !== input.pluginIds.length) {
      return jsonError('NOT_FOUND', 'Um ou mais plugins não foram encontrados', 404);
    }

    const subtotalCents = plugins.reduce((acc, p) => acc + p.price, 0);
    let discountCents = 0;
    let couponId = null;

    // 2. Validate and apply coupon if present
    if (input.couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: input.couponCode.toUpperCase(), active: true }
      });

      if (coupon) {
        const isExpired = coupon.expiresAt && new Date() > coupon.expiresAt;
        const isMaxUses = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
        const isMinPurchase = coupon.minPurchase && subtotalCents < coupon.minPurchase;

        if (!isExpired && !isMaxUses && !isMinPurchase) {
          couponId = coupon.id;
          if (coupon.discountType === 'percentage') {
            discountCents = Math.floor((subtotalCents * coupon.discountValue) / 100);
          } else {
            discountCents = coupon.discountValue;
          }
        }
      }
    }

    const finalCents = Math.max(0, subtotalCents - discountCents);

    // 3. Create Order and items (Transaction)
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          totalCents: subtotalCents,
          discountCents,
          finalCents,
          status: 'completed', // For this demo, we assume payment is instant
          couponId,
          items: {
            create: plugins.map(p => ({
              pluginId: p.id,
              priceCents: p.price
            }))
          }
        },
        include: { items: { include: { plugin: true } } }
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } }
        });
      }

      return newOrder;
    });

    // 4. Generate licenses and send emails for each plugin
    const licenses = [];
    for (const item of order.items) {
      const license = await createLicenseForUser(session.user.id, item.pluginId);
      licenses.push({
        pluginName: item.plugin.name,
        licenseKey: license.licenseKey
      });

      // Send individual email per plugin or one summary email
      // Here we send one summary email for the whole order
    }

    // Send summary email
    const licenseInfo = licenses.map(l => `${l.pluginName}: ${l.licenseKey}`).join('\n');
    await sendMail({
      to: session.user.email,
      subject: `Pedido #${order.id.slice(-6)} Confirmado!`,
      html: getOrderConfirmationHtml(
        session.user.name, 
        order.id, 
        plugins.map(p => p.name).join(', '), 
        licenses.map(l => l.licenseKey).join(' | ')
      )
    });

    await sendDiscordWebhook({
      content: `🛒 Novo Checkout Realizado\nuser=${session.user.email}\norderId=${order.id}\ntotal=R$ ${(finalCents / 100).toFixed(2)}\nplugins=${plugins.map(p => p.slug).join(', ')}`
    });

    return jsonOk({
      orderId: order.id,
      finalTotal: finalCents,
      licenses
    }, 201);

  } catch (e) {
    if (e instanceof z.ZodError) {
      return jsonError('INVALID_INPUT', 'Entrada inválida', 400, e.flatten());
    }
    console.error('Checkout error:', e);
    return jsonError('INTERNAL_ERROR', 'Erro ao processar checkout', 500);
  }
}
