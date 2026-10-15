import { jsonError } from '@backend/lib/http';

export const runtime = 'nodejs';

/**
 * Disabled by design.
 *
 * Previous demonstration implementation marked orders as "completed" and
 * issued licenses without any verified payment. It must never be used in
 * a commercial environment. Production checkout is currently handled by
 * the Express/Mercado Pago integration and must be reconciled with this
 * route only after server-side payment confirmation and webhook auditing.
 */
export async function POST() {
  return jsonError(
    'CHECKOUT_NOT_CONFIGURED',
    'Checkout temporariamente indisponível neste backend. Nenhuma cobrança foi realizada.',
    503
  );
}
