import assert from 'node:assert/strict';
import { test } from 'node:test';
import { app } from './index.js';
import { createPlugin, createPurchase, createSession, createUser, createUserAdmin, findPurchaseById, updatePurchaseStatus } from './data.js';

test('StarfinCore v2 contract authorizes only a paid product and binds the installation', async () => {
  const product = createPlugin({
    name: 'StarfinBans',
    description: 'Produto de teste de contrato',
    category: 'Administração',
    tags: [],
    mcVersion: '1.21',
    imageUrl: 'https://example.invalid/starfin-bans.png',
    priceDisplay: 'R$ 29,90',
    licenseName: 'starfin_bans'
  });
  const owner = createUser({ name: 'Cliente CI', email: `contract-${Date.now()}@example.invalid`, password: 'test-only-password' });
  assert.ok(owner);
  const purchase = createPurchase(owner.id, product.id);
  const approved = updatePurchaseStatus(purchase.id, 'approved');
  assert.ok(approved?.licenseKey);

  const server = app.listen(0, '127.0.0.1');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/v1/license/check`;
    const check = async (key: string, hwid: string, pluginName: string) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ licenseKey: key, hwid, pluginName })
      });
      assert.equal(response.status, 200);
      return response.json() as Promise<Record<string, any>>;
    };

    const allowed = await check(approved.licenseKey, 'ci-installation-a', 'StarfinBans');
    assert.equal(allowed.valid, true);
    assert.equal(allowed.protocolVersion, 2);
    assert.deepEqual(allowed.allowedProductIds, ['starfin_bans']);
    const leaseMs = Date.parse(allowed.authorizationExpiresAt) - Date.now();
    assert.ok(leaseMs > 0 && leaseMs <= 60 * 60_000);
    assert.deepEqual(allowed.updates, {});

    assert.equal((await check(approved.licenseKey, 'ci-installation-b', 'StarfinBans')).valid, false);
    assert.equal((await check(approved.licenseKey, 'ci-installation-a', 'UnownedPlugin')).valid, false);
    assert.equal((await check('not-a-license', 'ci-installation-a', 'StarfinBans')).valid, false);

    const secondPurchase = createPurchase(owner.id, product.id);
    const secondApproved = updatePurchaseStatus(secondPurchase.id, 'approved');
    assert.ok(secondApproved?.licenseKey);
    assert.equal((await check(secondApproved.licenseKey, 'attacker-installation', 'UnownedPlugin')).valid, false);
    assert.equal((await check(secondApproved.licenseKey, 'owner-installation', 'StarfinBans')).valid, true);

    const pending = createPurchase(owner.id, product.id);
    const admin = createUserAdmin({ name: 'Admin CI', email: `admin-${Date.now()}@example.invalid`, password: 'test-only-password', role: 'admin' });
    assert.ok(admin);
    const session = createSession(admin.id, 'admin');
    const forgedApproval = await fetch(`http://127.0.0.1:${address.port}/api/admin/purchases/${pending.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ status: 'approved' })
    });
    assert.equal(forgedApproval.status, 400);
    assert.equal(findPurchaseById(pending.id)?.status, 'pending');
  } finally {
    server.close();
  }
});
