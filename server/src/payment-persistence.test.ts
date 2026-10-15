import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createOrder,
  findOrderById,
  claimVerifiedOrder,
  completeVerifiedOrder,
  grantOrderPluginOnce,
  reverseVerifiedOrder,
  revokeOrderPlugins
} from './data.js';

test('synthetic MySQL: duplicate payment delivery grants the product only once', () => {
  const orderId = createOrder({
    userId: 'ci-customer',
    pluginIds: [87999],
    planId: null,
    totalCents: 2990,
    paymentProvider: 'mercadopago'
  });
  assert.equal(findOrderById(orderId)?.status, 'pending');
  assert.equal(claimVerifiedOrder(orderId, '100100'), true);
  assert.equal(claimVerifiedOrder(orderId, '100100'), true);
  const first = grantOrderPluginOnce(orderId, 'ci-customer', 87999);
  const duplicate = grantOrderPluginOnce(orderId, 'ci-customer', 87999);
  assert.equal(first.id, duplicate.id);
  assert.equal(first.licenseKey, duplicate.licenseKey);
  assert.equal(first.status, 'approved');
  assert.equal(completeVerifiedOrder(orderId, '100100'), true);
  assert.equal(findOrderById(orderId)?.status, 'completed');
  assert.equal(claimVerifiedOrder(orderId, '100100'), false);
  assert.equal(claimVerifiedOrder(orderId, '200200'), false);
  assert.equal(reverseVerifiedOrder(orderId, '100100', 'refunded'), true);
  revokeOrderPlugins(orderId, [87999]);
  assert.equal(findOrderById(orderId)?.status, 'refunded');
  const revoked = grantOrderPluginOnce(orderId, 'ci-customer', 87999);
  assert.equal(revoked.status, 'cancelled');
  assert.equal(claimVerifiedOrder(orderId, '100100'), false);
});
