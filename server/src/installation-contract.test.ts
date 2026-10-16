import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { app } from './index.js';
import { createPlugin, createPurchase, createSession, createUser, updatePurchaseStatus } from './data.js';
import { transferInstallation } from './installations.js';

test('installation activation, identity, purchased quantity, observed IP and revocation', async () => {
  const plugin = createPlugin({ name: `CoreTest-${Date.now()}`, description: 'Teste de instalação', category: 'Administração', tags: [], mcVersion: '1.21', imageUrl: 'https://example.invalid/core.png', priceDisplay: 'R$ 10,00', licenseName: 'core_test' });
  const owner = createUser({ name: 'Cliente de integração', email: `installation-${Date.now()}@example.invalid`, password: 'test-only-password' });
  assert.ok(owner);
  const purchase = createPurchase(owner.id, plugin.id);
  updatePurchaseStatus(purchase.id, 'approved');
  const token = createSession(owner.id, 'user').token;
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const post = (path: string, body: unknown, auth?: string) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) }, body: JSON.stringify(body) });
    const first = await post('/api/users/me/servers', { name: 'Lobby', ips: ['127.0.0.1'] }, `Bearer ${token}`);
    const second = await post('/api/users/me/servers', { name: 'Survival', ips: [] }, `Bearer ${token}`);
    assert.equal(first.status, 201); assert.equal(second.status, 201);
    const firstId = (await first.json() as { id: string }).id;
    const secondId = (await second.json() as { id: string }).id;
    const assign = (id: string) => post(`/api/users/me/servers/${id}/plugins`, { pluginId: plugin.id }, `Bearer ${token}`);
    const results = await Promise.all([assign(firstId), assign(secondId)]);
    assert.deepEqual(results.map(item => item.status).sort(), [200, 409]);
    const winner = results[0].status === 200 ? firstId : secondId;
    const loser = winner === firstId ? secondId : firstId;
    const secondPurchase = createPurchase(owner.id, plugin.id);
    updatePurchaseStatus(secondPurchase.id, 'approved');
    assert.equal((await assign(loser)).status, 200);
    const spare = await post('/api/users/me/servers', { name: 'Reserva', ips: [] }, `Bearer ${token}`);
    assert.equal(spare.status, 201);
    const spareId = (await spare.json() as { id: string }).id;
    const transfer = (from: string, to: string) => post(`/api/users/me/servers/${from}/plugins/${plugin.id}/transfer`, { targetServerId: to }, `Bearer ${token}`);
    assert.equal((await transfer(loser, spareId)).status, 200);
    assert.equal((await transfer(loser, spareId)).status, 409);
    assert.equal((await assign(loser)).status, 409);
    assert.equal((await transfer(spareId, loser)).status, 200);

    const installationId = crypto.randomUUID();
    const credential = crypto.randomBytes(32).toString('base64url');
    const challenge = await post('/v3/installations/challenge', { installationId, credential, name: 'Lobby', platform: 'Bukkit', coreVersion: '0.3.0' });
    assert.equal(challenge.status, 201);
    const code = (await challenge.json() as { code: string }).code;
    const unclaimed = await post('/v3/installations/check', { installationId }, `Installation ${credential}`);
    assert.equal(unclaimed.status, 401);
    const claim = await post(`/api/users/me/servers/${winner}/claim`, { code, reason: 'Primeira ativação CI' }, `Bearer ${token}`);
    assert.equal(claim.status, 200);
    assert.equal((await post(`/api/users/me/servers/${loser}/claim`, { code }, `Bearer ${token}`)).status, 409);
    const check = await post('/v3/installations/check', { installationId, platform: 'Bukkit', coreVersion: '0.3.0' }, `Installation ${credential}`);
    assert.equal(check.status, 200);
    const authorized = await check.json() as any;
    assert.equal(authorized.valid, true);
    assert.equal(authorized.protocolVersion, 3);
    assert.equal(authorized.installation.observedIp, '127.0.0.1');
    assert.deepEqual(authorized.allowedProductIds, ['core_test']);
    assert.equal(authorized.products[0].quantity.purchased, 2);
    assert.equal(authorized.products[0].quantity.used, 2);
    assert.equal(authorized.products[0].quantity.available, 0);
    assert.equal((await post('/v3/installations/check', { installationId }, 'Installation wrongcredential')).status, 401);

    const secondInstallationId = crypto.randomUUID();
    const secondCredential = crypto.randomBytes(32).toString('base64url');
    const secondChallenge = await post('/v3/installations/challenge', { installationId: secondInstallationId, credential: secondCredential, name: 'Survival', platform: 'Bukkit', coreVersion: '0.3.0' });
    assert.equal(secondChallenge.status, 201);
    const secondCode = (await secondChallenge.json() as { code: string }).code;
    assert.equal((await post(`/api/users/me/servers/${loser}/claim`, { code: secondCode, reason: 'Segunda ativação CI' }, `Bearer ${token}`)).status, 200);
    updatePurchaseStatus(secondPurchase.id, 'cancelled');
    const afterRefund = await Promise.all([
      post('/v3/installations/check', { installationId }, `Installation ${credential}`),
      post('/v3/installations/check', { installationId: secondInstallationId }, `Installation ${secondCredential}`)
    ]);
    const states = await Promise.all(afterRefund.map(item => item.json() as Promise<{ allowedProductIds: string[] }>));
    assert.equal(states[winner === firstId ? 0 : 1].allowedProductIds.includes('core_test'), true);
    assert.equal(states[winner === firstId ? 1 : 0].allowedProductIds.includes('core_test'), false);

    const ipUpdate = await fetch(`${base}/api/users/me/servers/${winner}`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ ips: ['127.0.0.2'] }) });
    assert.equal(ipUpdate.status, 200);
    const mismatch = await post('/v3/installations/check', { installationId }, `Installation ${credential}`);
    assert.equal((await mismatch.json() as { code: string }).code, 'IP_MISMATCH');
    const revoke = await post(`/api/users/me/servers/${winner}/revoke`, { reason: 'Teste de revogação autorizado' }, `Bearer ${token}`);
    assert.equal(revoke.status, 200);
    assert.equal((await post('/v3/installations/check', { installationId }, `Installation ${credential}`)).status, 401);
    assert.equal((await assign(winner)).status, 200); // already assigned; no extra entitlement granted
    const list = await fetch(`${base}/api/users/me/servers`, { headers: { authorization: `Bearer ${token}` } });
    const items = (await list.json() as { items: any[] }).items;
    assert.equal(items.find(item => item.id === winner).entitlements[0].purchased, 1);
    assert.equal(items.find(item => item.id === winner).credentialHash, undefined);
    const recipient = createUser({ name: 'Destino de transferência', email: `installation-target-${Date.now()}@example.invalid`, password: 'test-only-password' });
    assert.ok(recipient);
    assert.equal(transferInstallation(winner, recipient.id, owner.id, 'Transferência administrativa de teste'), true);
    const formerOwnerView = await fetch(`${base}/api/users/me/servers`, { headers: { authorization: `Bearer ${token}` } });
    assert.equal((await formerOwnerView.json() as { items: any[] }).items.some(item => item.id === winner), false);
    const recipientToken = createSession(recipient.id, 'user').token;
    const recipientView = await fetch(`${base}/api/users/me/servers`, { headers: { authorization: `Bearer ${recipientToken}` } });
    const recipientServers = (await recipientView.json() as { items: any[] }).items;
    assert.deepEqual(recipientServers.find(item => item.id === winner).plugins, []);
    assert.equal(recipientServers.find(item => item.id === winner).linked, false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
