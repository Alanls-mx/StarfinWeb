import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { app } from './index.js';
import { createPlugin, createPurchase, createSession, createUser, findServerById, listPluginsForServer, updatePurchaseStatus, updateUserAdmin } from './data.js';
import { transferInstallation } from './installations.js';
import Database from './postgres-sync.js';

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
    const post = (path: string, body: any, auth?: string) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
      body: JSON.stringify(path.startsWith('/v3/installations/') ? { serverPort: 25565, ...body } : body) });
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
    assert.equal((await fetch(`${base}/api/users/me/servers/${winner}`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ ips: [] }) })).status, 400);
    assert.equal((await post(`/api/users/me/servers/${loser}/claim`, { code }, `Bearer ${token}`)).status, 409);
    const check = await post('/v3/installations/check', { installationId, platform: 'Bukkit', coreVersion: '0.3.0' }, `Installation ${credential}`);
    assert.equal(check.status, 200);
    const authorized = await check.json() as any;
    assert.equal(authorized.valid, true);
    assert.equal(authorized.protocolVersion, 3);
    assert.equal(authorized.installation.observedIp, '127.0.0.1');
    assert.equal(authorized.installation.authorizedPort, 25565);
    assert.equal(authorized.installation.reportedPort, 25565);
    assert.equal(authorized.installation.portMatches, true);
    assert.equal(authorized.allowedProductIds.includes('core_test'), true);
    assert.equal(authorized.products[0].quantity.purchased, 2);
    assert.equal(authorized.products[0].quantity.used, 2);
    assert.equal(authorized.products[0].quantity.available, 2);
    // Links created before port capture are pinned by their first authenticated check.
    new Database().prepare("UPDATE servers SET authorizedPort = NULL, ips = '[]' WHERE id = ?").run(winner);
    const legacyPortCheck = await post('/v3/installations/check', { installationId }, `Installation ${credential}`);
    assert.equal((await legacyPortCheck.json() as any).installation.authorizedPort, 25565);
    assert.deepEqual(findServerById(winner)?.ips, ['127.0.0.1']);
    const wrongPort = await post('/v3/installations/check', { installationId, serverPort: 25566 }, `Installation ${credential}`);
    const wrongPortBody = await wrongPort.json() as any;
    assert.equal(wrongPortBody.valid, false);
    assert.equal(wrongPortBody.code, 'PORT_MISMATCH');
    assert.equal(wrongPortBody.installation.portMatches, false);
    assert.deepEqual(wrongPortBody.allowedProductIds, []);
    const changePort = await fetch(`${base}/api/users/me/servers/${winner}`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ authorizedPort: 25566 }) });
    assert.equal(changePort.status, 200);
    assert.equal((await changePort.json() as any).authorizedPort, 25566);
    assert.equal((await (await post('/v3/installations/check', { installationId, serverPort: 25566 }, `Installation ${credential}`)).json() as any).valid, true);
    assert.equal((await (await post('/v3/installations/check', { installationId }, `Installation ${credential}`)).json() as any).code, 'PORT_MISMATCH');
    assert.equal((await fetch(`${base}/api/users/me/servers/${winner}`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ authorizedPort: 25565 }) })).status, 200);
    assert.equal((await post('/v3/installations/check', { installationId }, 'Installation wrongcredential')).status, 401);

    const secondInstallationId = crypto.randomUUID();
    const secondCredential = crypto.randomBytes(32).toString('base64url');
    const secondChallenge = await post('/v3/installations/challenge', { installationId: secondInstallationId, credential: secondCredential, name: 'Survival', platform: 'Bukkit', coreVersion: '0.3.0' });
    assert.equal(secondChallenge.status, 201);
    const secondCode = (await secondChallenge.json() as { code: string }).code;
    assert.equal((await post(`/api/users/me/servers/${loser}/claim`, { code: secondCode, reason: 'Segunda ativação CI' }, `Bearer ${token}`)).status, 200);
    assert.deepEqual(findServerById(loser)?.ips, ['127.0.0.1']);
    updatePurchaseStatus(secondPurchase.id, 'cancelled');
    const afterRefund = await Promise.all([
      post('/v3/installations/check', { installationId }, `Installation ${credential}`),
      post('/v3/installations/check', { installationId: secondInstallationId }, `Installation ${secondCredential}`)
    ]);
    const states = await Promise.all(afterRefund.map(item => item.json() as Promise<{ allowedProductIds: string[] }>));
    assert.equal(states[winner === firstId ? 0 : 1].allowedProductIds.includes('core_test'), true);
    assert.equal(states[winner === firstId ? 1 : 0].allowedProductIds.includes('core_test'), true); // one purchase covers two installs on the same observed IP

    const ipUpdate = await fetch(`${base}/api/users/me/servers/${winner}`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ ips: ['127.0.0.2'] }) });
    assert.equal(ipUpdate.status, 200);
    const mismatch = await post('/v3/installations/check', { installationId }, `Installation ${credential}`);
    assert.equal((await mismatch.json() as { code: string }).code, 'IP_MISMATCH');
    const revoke = await post(`/api/users/me/servers/${winner}/revoke`, { reason: 'Teste de revogação autorizado' }, `Bearer ${token}`);
    assert.equal(revoke.status, 200);
    assert.equal((await post('/v3/installations/check', { installationId }, `Installation ${credential}`)).status, 401);
    const afterRevoke = await fetch(`${base}/api/users/me/servers`, { headers: { authorization: `Bearer ${token}` } });
    assert.deepEqual((await afterRevoke.json() as { items: Array<{ id: string; plugins: number[] }> }).items.find(item => item.id === winner)?.plugins, []);
    assert.equal((await post(`/api/users/me/servers/${winner}/revoke`, { reason: 'Revogação repetida de teste' }, `Bearer ${token}`)).status, 409);
    assert.equal((await assign(winner)).status, 409); // another installation still holds the remaining paid seat
    const list = await fetch(`${base}/api/users/me/servers`, { headers: { authorization: `Bearer ${token}` } });
    const items = (await list.json() as { items: any[] }).items;
    assert.equal(items.find(item => item.id === winner).entitlements.find((item: any) => item.pluginId === plugin.id).purchased, 1);
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
    const legacyOwner = createUser({ name: 'Migração de identidade', email: `legacy-core-${Date.now()}@example.invalid`, password: 'test-only-password' });
    assert.ok(legacyOwner);
    const legacyPurchase = createPurchase(legacyOwner.id, plugin.id);
    updatePurchaseStatus(legacyPurchase.id, 'approved');
    const legacyInstallationId = crypto.randomUUID();
    const legacyCredential = crypto.randomBytes(32).toString('base64url');
    updateUserAdmin(legacyOwner.id, { licenseHwid: legacyInstallationId });
    const legacyToken = createSession(legacyOwner.id, 'user').token;
    const legacyServer = await post('/api/users/me/servers', { name: 'Servidor legado', ips: [] }, `Bearer ${legacyToken}`);
    const legacyServerId = (await legacyServer.json() as { id: string }).id;
    const legacyChallenge = await post('/v3/installations/challenge', { installationId: legacyInstallationId, credential: legacyCredential, name: 'Servidor legado', platform: 'Bukkit', coreVersion: '0.3.0' });
    const legacyCode = (await legacyChallenge.json() as { code: string }).code;
    assert.equal((await post(`/api/users/me/servers/${legacyServerId}/claim`, { code: legacyCode }, `Bearer ${legacyToken}`)).status, 200);
    const migrated = await post('/v3/installations/check', { installationId: legacyInstallationId }, `Installation ${legacyCredential}`);
    assert.equal((await migrated.json() as { allowedProductIds: string[] }).allowedProductIds.includes('core_test'), true);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('linking an installation assigns only eligible purchases and keeps manual removal effective', async () => {
  const suffix = Date.now();
  const owned = createPlugin({ name: `AutoClaim-${suffix}`, description: 'Owned', category: 'Administração', tags: [], mcVersion: '1.21', imageUrl: 'https://example.invalid/owned.png', priceDisplay: 'R$ 10,00', licenseName: `auto_claim_${suffix}` });
  const ownedProductId = `auto_claim_${suffix}`;
  const unowned = createPlugin({ name: `NotOwned-${suffix}`, description: 'Unowned', category: 'Administração', tags: [], mcVersion: '1.21', imageUrl: 'https://example.invalid/unowned.png', priceDisplay: 'R$ 10,00', licenseName: `unowned_${suffix}` });
  const owner = createUser({ name: 'Cliente com compra', email: `auto-claim-${suffix}@example.invalid`, password: 'test-only-password' });
  assert.ok(owner);
  updatePurchaseStatus(createPurchase(owner.id, owned.id).id, 'approved');
  const token = createSession(owner.id, 'user').token;
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const post = (path: string, body: unknown, auth?: string) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) }, body: JSON.stringify(body) });
    const registered = await post('/api/users/me/servers', { name: 'Lobby', ips: [] }, `Bearer ${token}`);
    assert.equal(registered.status, 201);
    const serverId = (await registered.json() as { id: string }).id;
    const installationId = crypto.randomUUID();
    const credential = crypto.randomBytes(32).toString('base64url');
    const challenge = await post('/v3/installations/challenge', { installationId, credential, name: 'Lobby', platform: 'Bukkit', coreVersion: '0.3.1', serverPort: 25565 });
    assert.equal(challenge.status, 201);
    const code = (await challenge.json() as { code: string }).code;
    assert.equal((await post(`/api/users/me/servers/${serverId}/claim`, { code }, `Bearer ${token}`)).status, 200);
    assert.equal(listPluginsForServer(serverId).includes(owned.id), true);
    assert.equal(listPluginsForServer(serverId).includes(unowned.id), false);
    const check = await post('/v3/installations/check', { installationId, platform: 'Bukkit', coreVersion: '0.3.1', serverPort: 25565 }, `Installation ${credential}`);
    assert.equal((await check.json() as { allowedProductIds: string[] }).allowedProductIds.includes(ownedProductId), true);
    assert.equal((await fetch(`${base}/api/users/me/servers/${serverId}/plugins/${owned.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })).status, 200);
    assert.equal(listPluginsForServer(serverId).includes(owned.id), false);
    assert.equal((await (await post('/v3/installations/check', { installationId, serverPort: 25565 }, `Installation ${credential}`)).json() as { allowedProductIds: string[] }).allowedProductIds.includes(ownedProductId), false);
    assert.equal(listPluginsForServer(serverId).includes(unowned.id), false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
