import assert from 'node:assert/strict';
import { test } from 'node:test';
import { app } from './index.js';
import { createPlugin, createSession, createUser, updateUserAdmin } from './data.js';

test('Craft excludes launches and grants one installation; Nexus grants two', async () => {
  const plugin = createPlugin({ name: `Launch-${Date.now()}`, description: 'Teste de plano', category: 'Administração',
    tags: [], mcVersion: '1.21', imageUrl: 'https://example.invalid/launch.png', priceDisplay: 'R$ 10,00',
    licenseName: `launch_${Date.now()}`, launchOverride: 'launch' });
  const owner = createUser({ name: 'Assinante', email: `plan-${Date.now()}@example.invalid`, password: 'test-only-password' });
  assert.ok(owner);
  const token = createSession(owner.id, 'user').token;
  const expiry = new Date(Date.now() + 30 * 86_400_000).toISOString();
  updateUserAdmin(owner.id, { plan: 'Craft', planExpiresAt: expiry });
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const post = (path: string, body: unknown) => fetch(base + path, { method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const first = await post('/api/users/me/servers', { name: 'Craft-1', ips: ['127.0.0.1'] });
    const second = await post('/api/users/me/servers', { name: 'Craft-2', ips: ['127.0.0.1'] });
    assert.equal(first.status, 201); assert.equal(second.status, 201);
    const firstId = (await first.json() as { id: string }).id;
    const secondId = (await second.json() as { id: string }).id;
    assert.equal((await post(`/api/users/me/servers/${firstId}/plugins`, { pluginId: plugin.id })).status, 403);
    updateUserAdmin(owner.id, { plan: 'Nexus', planExpiresAt: expiry });
    assert.equal((await post(`/api/users/me/servers/${firstId}/plugins`, { pluginId: plugin.id })).status, 200);
    assert.equal((await post(`/api/users/me/servers/${secondId}/plugins`, { pluginId: plugin.id })).status, 200);
    updateUserAdmin(owner.id, { plan: 'Craft', planExpiresAt: expiry });
    const list = await fetch(`${base}/api/users/me/servers`, { headers: { authorization: `Bearer ${token}` } });
    const data = await list.json() as { availableProducts: Array<{ pluginId: number }> };
    assert.equal(data.availableProducts.some(item => item.pluginId === plugin.id), false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
