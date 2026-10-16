import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { app } from './index.js';
import { createUser, findUserById } from './data.js';
import { attachProvider, createSubscriptionIntent } from './subscriptions.js';

test('signed recurring invoice is checked against provider and paid exactly once', async () => {
  const user = createUser({ name: 'Webhook', email: `webhook-sub-${Date.now()}@example.invalid`, password: 'test-only-password' });
  assert.ok(user);
  const sub = createSubscriptionIntent(user.id, 'craft');
  const providerId = `provider_${Date.now()}`;
  attachProvider(sub.id, providerId, 'https://www.mercadopago.com.br/test');
  const invoiceId = String(Date.now());
  const paymentId = String(Date.now() + 1);
  const originalFetch = globalThis.fetch;
  const previousSecret = process.env.MP_WEBHOOK_SECRET;
  const previousToken = process.env.MP_ACCESS_TOKEN;
  process.env.MP_WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.MP_ACCESS_TOKEN = 'TEST-webhook-token';
  globalThis.fetch = (input, init) => {
    const url = String(input);
    if (!url.startsWith('https://api.mercadopago.com/')) return originalFetch(input, init);
    const data = url.endsWith(`/authorized_payments/${invoiceId}`)
      ? { id: Number(invoiceId), preapproval_id: providerId, external_reference: sub.id,
          currency_id: 'BRL', transaction_amount: '39.90', payment: { id: Number(paymentId), status: 'approved' } }
      : url.endsWith(`/preapproval/${providerId}`)
        ? { id: providerId, external_reference: sub.id, status: 'authorized',
            auto_recurring: { currency_id: 'BRL', transaction_amount: '39.90' } }
        : { id: Number(paymentId), status: 'approved', currency_id: 'BRL', transaction_amount: 39.9,
            date_approved: new Date().toISOString() };
    return Promise.resolve(new Response(JSON.stringify(data), { status: 200,
      headers: { 'Content-Type': 'application/json' } }));
  };
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    const requestId = `request-${Date.now()}`;
    const ts = String(Date.now());
    const v1 = createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
      .update(`id:${invoiceId};request-id:${requestId};ts:${ts};`).digest('hex');
    const url = `http://127.0.0.1:${address.port}/api/webhooks/mercadopago?type=subscription_authorized_payment&data.id=${invoiceId}`;
    const send = (signature: string) => originalFetch(url, { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-request-id': requestId, 'x-signature': signature },
      body: JSON.stringify({ type: 'subscription_authorized_payment', data: { id: invoiceId } }) });
    assert.equal((await send('ts=1234567890,v1=' + '0'.repeat(64))).status, 401);
    assert.equal(findUserById(user.id)?.plan, 'Spawn');
    const signature = `ts=${ts},v1=${v1}`;
    assert.equal((await send(signature)).status, 200);
    const firstExpiry = findUserById(user.id)?.planExpiresAt;
    assert.equal(findUserById(user.id)?.plan, 'Craft');
    assert.ok(firstExpiry);
    assert.equal((await send(signature)).status, 200);
    assert.equal(findUserById(user.id)?.planExpiresAt, firstExpiry);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET; else process.env.MP_WEBHOOK_SECRET = previousSecret;
    if (previousToken === undefined) delete process.env.MP_ACCESS_TOKEN; else process.env.MP_ACCESS_TOKEN = previousToken;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
