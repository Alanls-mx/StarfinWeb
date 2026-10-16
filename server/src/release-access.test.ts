import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const releaseDir = mkdtempSync(path.join(os.tmpdir(), 'starfin-releases-'));
process.env.STARFIN_PRIVATE_RELEASES_DIR = releaseDir;

test('releases require active ownership, publication and authenticated download; notifications stay private', async () => {
  const { app } = await import('./index.js');
  const { createPlugin, createPurchase, createSession, createUser, createUserAdmin, updatePurchaseStatus, listUserNotifications } = await import('./data.js');
  const product = createPlugin({ name: 'Plugin CI', description: 'Teste', category: 'Administração', tags: [], mcVersion: '1.21', imageUrl: 'https://example.invalid/image.png', priceDisplay: 'R$ 29,90' });
  const owner = createUser({ name: 'Dono CI', email: `release-owner-${Date.now()}@example.invalid`, password: 'test-only-password' });
  const stranger = createUser({ name: 'Outro CI', email: `release-stranger-${Date.now()}@example.invalid`, password: 'test-only-password' });
  const admin = createUserAdmin({ name: 'Admin CI', email: `release-admin-${Date.now()}@example.invalid`, password: 'test-only-password', role: 'admin' });
  assert.ok(owner && stranger && admin);
  const purchase = createPurchase(owner.id, product.id);
  updatePurchaseStatus(purchase.id, 'approved');
  const ownerToken = createSession(owner.id, 'user').token;
  const strangerToken = createSession(stranger.id, 'user').token;
  const adminToken = createSession(admin.id, 'admin').token;
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const auth = (token: string) => ({ authorization: `Bearer ${token}` });
    const listPath = `/api/users/me/plugins/${product.id}/releases`;
    assert.equal((await fetch(base + listPath)).status, 401);
    assert.equal((await fetch(base + listPath, { headers: auth(strangerToken) })).status, 403);
    assert.deepEqual((await (await fetch(base + listPath, { headers: auth(ownerToken) })).json() as any).items, []);

    const archive = Buffer.concat([Buffer.from('504b0304', 'hex'), Buffer.alloc(32), Buffer.from('504b0506', 'hex'), Buffer.alloc(18)]);
    const form = new FormData();
    form.set('version', '1.0.0'); form.set('mcVersion', '1.21'); form.set('notes', 'Primeira versão');
    form.set('file', new Blob([archive], { type: 'application/java-archive' }), 'plugin.jar');
    const upload = await fetch(`${base}/api/admin/plugins/${product.id}/releases`, { method: 'POST', headers: auth(adminToken), body: form });
    assert.equal(upload.status, 201);
    const release = (await upload.json() as any).item;
    assert.equal(release.fileName, undefined);
    assert.deepEqual((await (await fetch(base + listPath, { headers: auth(ownerToken) })).json() as any).items, []);
    assert.equal((await fetch(`${base}/api/users/me/releases/${release.id}/download`, { headers: auth(ownerToken) })).status, 404);

    assert.equal((await fetch(`${base}/api/admin/releases/${release.id}`, { method: 'PATCH', headers: { ...auth(adminToken), 'content-type': 'application/json' }, body: JSON.stringify({ published: true }) })).status, 200);
    assert.equal((await fetch(`${base}/api/users/me/releases/${release.id}/download`)).status, 401);
    assert.equal((await fetch(`${base}/api/users/me/releases/${release.id}/download`, { headers: auth(strangerToken) })).status, 403);
    const download = await fetch(`${base}/api/users/me/releases/${release.id}/download`, { headers: auth(ownerToken) });
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), archive);

    const send = await fetch(`${base}/api/admin/users/${owner.id}/notifications`, { method: 'POST', headers: { ...auth(adminToken), 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Sua versão', message: 'Disponível para download.' }) });
    assert.equal(send.status, 201);
    assert.equal(listUserNotifications(stranger.id).length, 0);
    assert.equal((await (await fetch(`${base}/api/users/me/notifications`, { headers: auth(ownerToken) })).json() as any[]).length, 1);
    assert.equal((await fetch(`${base}/api/users/me/notifications/read-all`, { method: 'POST', headers: auth(ownerToken) })).status, 200);
    assert.ok(listUserNotifications(owner.id)[0].readISO);

    updatePurchaseStatus(purchase.id, 'cancelled');
    assert.equal((await fetch(`${base}/api/users/me/releases/${release.id}/download`, { headers: auth(ownerToken) })).status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    rmSync(releaseDir, { recursive: true, force: true });
  }
});
