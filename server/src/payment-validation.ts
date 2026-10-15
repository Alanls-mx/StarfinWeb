import { createHmac, timingSafeEqual } from 'node:crypto';
export interface VerifiedPayment {
  id: string | number;
  status: string;
  external_reference: string;
  transaction_amount: number;
  currency_id: string;
}

export interface ExpectedOrder {
  id: string;
  paymentProvider: string;
  totalCents: number;
  paymentId: string | null;
  status: string;
}

/** Never grant based on webhook body alone; this checks a payment retrieved with merchant credentials. */
export function reconcilePayment(order: ExpectedOrder, payment: VerifiedPayment, paymentId: string):
  { ok: true; state: 'approved' | 'reversed' | 'pending' } | { ok: false; reason: string } {
  if (String(payment.id) !== paymentId) return { ok: false, reason: 'PAYMENT_ID_MISMATCH' };
  if (payment.external_reference !== order.id) return { ok: false, reason: 'ORDER_MISMATCH' };
  if (order.paymentProvider !== 'mercadopago') return { ok: false, reason: 'PROVIDER_MISMATCH' };
  if (order.paymentId && order.paymentId !== paymentId) return { ok: false, reason: 'PAYMENT_CONFLICT' };
  if (order.totalCents <= 0 || !Number.isSafeInteger(order.totalCents))
    return { ok: false, reason: 'INVALID_ORDER_AMOUNT' };
  if (payment.currency_id !== 'BRL') return { ok: false, reason: 'CURRENCY_MISMATCH' };
  const paymentCents = Math.round(payment.transaction_amount * 100);
  if (!Number.isFinite(payment.transaction_amount) || paymentCents !== order.totalCents)
    return { ok: false, reason: 'AMOUNT_MISMATCH' };
  if (['approved'].includes(payment.status)) return { ok: true, state: 'approved' };
  if (['rejected', 'cancelled', 'canceled', 'refunded', 'charged_back'].includes(payment.status))
    return { ok: true, state: 'reversed' };
  return { ok: true, state: 'pending' };
}

/** The secret stays on the server, never in the frontend. */
export function verifyMercadoPagoWebhook(
  signature: string | undefined,
  requestId: string | undefined,
  dataId: string,
  secret: string
): boolean {
  if (!secret || !requestId || requestId.length > 256 || !/^\d{1,32}$/.test(dataId) || !signature) return false;
  const parts = new Map(signature.split(',').map((p) => {
    const index = p.indexOf('=');
    return [p.slice(0, index).trim(), p.slice(index + 1).trim()] as const;
  }));
  const ts = parts.get('ts') || '';
  const v1 = parts.get('v1') || '';
  if (!/^\d{10,16}$/.test(ts) || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const digest = createHmac('sha256', secret).update(manifest).digest();
  const signatureBytes = Buffer.from(v1, 'hex');
  return signatureBytes.length === digest.length && timingSafeEqual(signatureBytes, digest);
}
