import assert from 'node:assert/strict';
import { test } from 'node:test';
import { app } from './index.js';
import Database from './postgres-sync.js';
import { addNotification, createPlugin, createPurchase, createSession, createUser, createUserAdmin, findPurchaseById, listAdminAudit, syncChangelog, updatePurchaseStatus, updatePurchaseTelemetry, updateUserAdmin } from './data.js';

test('one installation license model rejects legacy keys and preserves purchase grants', async () => {
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
  assert.equal(approved?.licenseKey, null);
  updateUserAdmin(owner.id, { licenseKey: 'LIC-LEGACY-ACCOUNT', licenseHwid: '11111111-1111-4111-8111-111111111111' });
  new Database().prepare('UPDATE purchases SET licenseKey = ? WHERE id = ?').run('LIC-LEGACY-PURCHASE', purchase.id);
  updatePurchaseTelemetry(purchase.id, { hwid: '11111111-1111-4111-8111-111111111111', ip: '127.0.0.1', port: 25565, serverName: 'Legacy', platform: 'Bukkit', performance: '{}' });

  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const legacy = await fetch(`http://127.0.0.1:${address.port}/v1/license/check`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ licenseKey: 'LIC-old-key', hwid: 'old-installation', pluginName: 'StarfinBans' })
    });
    assert.equal(legacy.status, 410);
    assert.equal((await legacy.json() as { code: string }).code, 'INSTALLATION_ACTIVATION_REQUIRED');
    for (const licenseKey of ['LIC-LEGACY-ACCOUNT', 'LIC-LEGACY-PURCHASE']) {
      const boundLegacy = await fetch(`http://127.0.0.1:${address.port}/v1/license/check`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ licenseKey, hwid: '11111111-1111-4111-8111-111111111111', pluginName: 'StarfinBans' })
      });
      assert.equal(boundLegacy.status, 410);
    }
    const obsoletePluginAuth = await fetch(`http://127.0.0.1:${address.port}/api/plugin-auth/verify`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pluginId: product.id })
    });
    assert.equal(obsoletePluginAuth.status, 410);
    const secondPurchase = createPurchase(owner.id, product.id);
    const secondApproved = updatePurchaseStatus(secondPurchase.id, 'approved');
    assert.equal(secondApproved?.licenseKey, null);

    const pending = createPurchase(owner.id, product.id);
    const admin = createUserAdmin({ name: 'Admin CI', email: `admin-${Date.now()}@example.invalid`, password: 'test-only-password', role: 'admin' });
    assert.ok(admin);
    const session = createSession(admin.id, 'admin');
    const adminUsersResponse = await fetch(`http://127.0.0.1:${address.port}/api/admin/users`, {
      headers: { authorization: `Bearer ${session.token}` }
    });
    assert.equal(adminUsersResponse.status, 200);
    const adminUsers = await adminUsersResponse.json() as { items: Array<{ id: string; licenseKey: string | null }> };
    const ownerInAdminList = adminUsers.items.find(item => item.id === owner.id);
    assert.ok(ownerInAdminList);
    assert.equal(ownerInAdminList.licenseKey, null);
    const forgedApproval = await fetch(`http://127.0.0.1:${address.port}/api/admin/purchases/${pending.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ status: 'approved' })
    });
    assert.equal(forgedApproval.status, 410);
    assert.equal(findPurchaseById(pending.id)?.status, 'pending');

    const revokePaid = await fetch(`http://127.0.0.1:${address.port}/api/admin/users/${owner.id}/plugins/${product.id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ reason: 'Solicitação de teste administrativo' })
    });
    assert.equal(revokePaid.status, 409);
    assert.equal(findPurchaseById(approved.id)?.status, 'approved');

    const secondOwner = createUser({ name: 'Cortesia CI', email: `grant-${Date.now()}@example.invalid`, password: 'test-only-password' });
    assert.ok(secondOwner);
    const grant = await fetch(`http://127.0.0.1:${address.port}/api/admin/users/${secondOwner.id}/plugins`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ pluginId: product.id, reason: 'Cortesia de integração para teste CI' })
    });
    assert.equal(grant.status, 201);
    const grantBody = await grant.json() as { item: { purchaseId: string; grantSource: string; licenseKey: string | null } };
    assert.equal(grantBody.item.grantSource, 'admin_grant');
    assert.equal(grantBody.item.licenseKey, null);
    assert.equal(findPurchaseById(grantBody.item.purchaseId)?.status, 'approved');
    assert.ok(listAdminAudit().some(entry => entry.action === 'license.manual_grant' && entry.resourceId === grantBody.item.purchaseId));

    const revokeGrant = await fetch(`http://127.0.0.1:${address.port}/api/admin/users/${secondOwner.id}/plugins/${product.id}`, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ reason: 'Encerramento da cortesia de teste CI' })
    });
    assert.equal(revokeGrant.status, 200);
    assert.equal(findPurchaseById(grantBody.item.purchaseId)?.status, 'cancelled');

    const newChangelog = await fetch(`http://127.0.0.1:${address.port}/api/admin/changelog`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${session.token}` },
      body: JSON.stringify({ version: 'ci-1', title: 'Teste persistido', body: 'Conteúdo de teste' })
    });
    assert.equal(newChangelog.status, 201);
    const entry = await newChangelog.json() as { id: string };
    syncChangelog();
    const publicChangelog = await fetch(`http://127.0.0.1:${address.port}/api/changelog`);
    const publicBody = await publicChangelog.json() as { items: Array<{ id: string }> };
    assert.ok(publicBody.items.some(item => item.id === entry.id));
    const removeChangelog = await fetch(`http://127.0.0.1:${address.port}/api/admin/changelog/${entry.id}`, {
      method: 'DELETE', headers: { authorization: `Bearer ${session.token}` }
    });
    assert.equal(removeChangelog.status, 200);

    const customerSession = createSession(owner.id, 'user');
    const missingCurrentPassword = await fetch(`http://127.0.0.1:${address.port}/api/users/me/password`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${customerSession.token}` },
      body: JSON.stringify({ newPassword: 'another-test-password' })
    });
    assert.equal(missingCurrentPassword.status, 401);

    addNotification('Venda administrativa', 'Mensagem restrita ao painel', { type: 'sale' });
    const inbox = await fetch(`http://127.0.0.1:${address.port}/api/users/me/notifications`, {
      headers: { authorization: `Bearer ${customerSession.token}` }
    });
    assert.deepEqual(await inbox.json(), []);
    const profile = await fetch(`http://127.0.0.1:${address.port}/api/users/me/profile`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${customerSession.token}` },
      body: JSON.stringify({ bio: 'Cliente de teste' })
    });
    const profileBody = await profile.json() as Record<string, unknown>;
    assert.equal(profileBody.passwordHash, undefined);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
