import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createUser, findUserById } from './data.js';
import { attachProvider, createSubscriptionIntent, currentSubscription, recordPaidInvoice,
  revokePaidInvoice, suspendSubscription } from './subscriptions.js';

test('monthly invoice grants a paid term exactly once and cancellation preserves it', () => {
  const owner = createUser({ name: 'Assinante', email: `subscription-${Date.now()}@example.invalid`, password: 'test-only-password' });
  assert.ok(owner);
  const intent = createSubscriptionIntent(owner.id, 'craft');
  const providerId = `provider_${Date.now()}`;
  assert.equal(attachProvider(intent.id, providerId, 'https://www.mercadopago.com.br/test'), true);
  assert.equal(findUserById(owner.id)?.plan, 'Spawn');
  const paidAtISO = '2026-10-16T12:00:00.000Z';
  const invoice = { subscriptionId: intent.id, invoiceId: `invoice_${Date.now()}`,
    paymentId: `payment_${Date.now()}`, paidAtISO, amountCents: 3990 };
  assert.equal(recordPaidInvoice(invoice), true);
  assert.equal(recordPaidInvoice(invoice), false);
  assert.equal(findUserById(owner.id)?.plan, 'Craft');
  assert.ok(Date.parse(findUserById(owner.id)?.planExpiresAt || '') > Date.parse(paidAtISO));
  assert.equal(currentSubscription(owner.id)?.status, 'authorized');
  assert.equal(suspendSubscription(providerId, 'cancelled'), true);
  assert.equal(currentSubscription(owner.id), null);
  assert.equal(findUserById(owner.id)?.plan, 'Craft');
  assert.equal(revokePaidInvoice(invoice.paymentId), true);
  assert.equal(revokePaidInvoice(invoice.paymentId), false);
  assert.equal(findUserById(owner.id)?.plan, 'Spawn');
});
