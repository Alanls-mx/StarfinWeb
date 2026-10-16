import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const mediaDir = mkdtempSync(path.join(os.tmpdir(), 'starfin-media-'));
process.env.STARFIN_UPLOADS_DIR = mediaDir;

test('media and avatars enforce roles, ownership, image checks and persistence', async () => {
  const { app } = await import('./index.js');
  const { createSession, createUser, createUserAdmin, findUserById } = await import('./data.js');
  const user = createUser({ name: 'Avatar CI', email: `avatar-${Date.now()}@example.invalid`, password: 'test-only-password' });
  const another = createUser({ name: 'Other CI', email: `other-avatar-${Date.now()}@example.invalid`, password: 'test-only-password' });
  const admin = createUserAdmin({ name: 'Media Admin CI', email: `media-admin-${Date.now()}@example.invalid`, password: 'test-only-password', role: 'admin' });
  assert.ok(user && another && admin);
  const token = createSession(user.id, 'user').token;
  const otherToken = createSession(another.id, 'user').token;
  const adminToken = createSession(admin.id, 'admin').token;
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const headers = (value: string) => ({ authorization: `Bearer ${value}` });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lG8AAAAASUVORK5CYII=', 'base64');
    const form = (bytes: Buffer) => { const data = new FormData(); data.set('file', new Blob([new Uint8Array(bytes)], { type: 'image/png' }), 'avatar.png'); return data; };

    assert.equal((await fetch(`${base}/api/admin/media`, { headers: headers(token) })).status, 403);
    assert.equal((await fetch(`${base}/api/admin/upload`, { method: 'POST', headers: headers(token), body: form(png) })).status, 403);
    assert.equal((await fetch(`${base}/api/users/me/avatar`, { method: 'POST', body: form(png) })).status, 401);
    assert.equal((await fetch(`${base}/api/users/me/avatar`, { method: 'POST', headers: headers(token), body: form(Buffer.from('not-an-image')) })).status, 415);

    const uploaded = await fetch(`${base}/api/users/me/avatar`, { method: 'POST', headers: headers(token), body: form(png) });
    assert.equal(uploaded.status, 200);
    const { avatarUrl } = await uploaded.json() as { avatarUrl: string };
    assert.match(avatarUrl, /^\/uploads\/avatar-user_[a-f0-9-]+-[a-f0-9-]+\.png$/);
    assert.equal(findUserById(user.id)?.avatarUrl, avatarUrl);
    assert.equal((await fetch(base + avatarUrl)).status, 200);
    assert.equal((await fetch(`${base}/api/users/me/profile`, { method: 'PATCH', headers: { ...headers(token), 'content-type': 'application/json' }, body: JSON.stringify({ avatarUrl: 'https://example.invalid/evil.png' }) })).status, 400);
    assert.equal((await (await fetch(`${base}/api/users/me/settings`, { headers: headers(token) })).json() as any).avatarUrl, avatarUrl);
    assert.equal((await (await fetch(`${base}/api/users/me/settings`, { headers: headers(otherToken) })).json() as any).avatarUrl, null);

    const media = await fetch(`${base}/api/admin/upload`, { method: 'POST', headers: headers(adminToken), body: form(png) });
    assert.equal(media.status, 200);
    const { url } = await media.json() as { url: string };
    const library = await (await fetch(`${base}/api/admin/media`, { headers: headers(adminToken) })).json() as { items: Array<{ url: string }> };
    assert.ok(library.items.some(item => item.url === url));
    assert.ok(!library.items.some(item => item.url === avatarUrl));

    assert.equal((await fetch(`${base}/api/users/me/avatar`, { method: 'DELETE', headers: headers(token) })).status, 200);
    assert.equal(findUserById(user.id)?.avatarUrl, null);
    assert.equal((await fetch(base + avatarUrl)).status, 404);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    rmSync(mediaDir, { recursive: true, force: true });
  }
});
