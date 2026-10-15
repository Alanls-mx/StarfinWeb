import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reconcilePayment, verifyMercadoPagoWebhook } from './payment-validation.js';
import { createHmac } from 'node:crypto';

const order = { id: 'ord_test', paymentProvider: 'mercadopago', totalCents: 2990, paymentId: null, status: 'pending' };
const payment = { id: '1002', external_reference: 'ord_test', transaction_amount: 29.9, currency_id: 'BRL', status: 'approved' };
test('approved and matched payment can proceed to fulfillment', () => {
  assert.deepEqual(reconcilePayment(order, payment, '1002'), { ok: true, state: 'approved' });
});
test('fake or mismatched payments never grant', () => {
  assert.equal(reconcilePayment(order, { ...payment, id: '1003' }, '1002').ok, false);
  assert.equal(reconcilePayment(order, { ...payment, external_reference: 'another' }, '1002').ok, false);
  assert.equal(reconcilePayment(order, { ...payment, transaction_amount: 0.01 }, '1002').ok, false);
  assert.equal(reconcilePayment(order, { ...payment, currency_id: 'USD' }, '1002').ok, false);
  assert.equal(reconcilePayment({ ...order, paymentId: 'old' }, payment, '1002').ok, false);
});
test('pending and reversed are not approved', () => {
  assert.deepEqual(reconcilePayment(order, { ...payment, status: 'pending' }, '1002'), { ok: true, state: 'pending' });
  assert.deepEqual(reconcilePayment(order, { ...payment, status: 'refunded' }, '1002'), { ok: true, state: 'reversed' });
});

test('webhook signature must match request, payment ID and timestamp', () => {
  const secret = 'only-on-backend';
  const ts = '1742505638683';
  const requestId = 'request-xyz';
  const id = '123456789';
  const digest = createHmac('sha256', secret)
    .update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex');
  const sig = `ts=${ts},v1=${digest}`;
  assert.equal(verifyMercadoPagoWebhook(sig, requestId, id, secret), true);
  assert.equal(verifyMercadoPagoWebhook(sig, requestId, '123456780', secret), false);
  assert.equal(verifyMercadoPagoWebhook(sig, 'other', id, secret), false);
  assert.equal(verifyMercadoPagoWebhook('', requestId, id, secret), false);
  assert.equal(verifyMercadoPagoWebhook(sig, requestId, id, ''), false);
});
