import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.RAILWAY_PROJECT_ID = 'starfin-ci-html';

test('published CMS and identity are present in initial HTML without a later visual replacement', async () => {
  const { app } = await import('./index.js');
  const { createSession, createUser, createUserAdmin } = await import('./data.js');
  const admin = createUserAdmin({ name: 'CMS Admin', email: `cms-admin-${Date.now()}@example.invalid`, password: 'test-only-password', role: 'admin' });
  const customer = createUser({ name: 'CMS Customer', email: `cms-customer-${Date.now()}@example.invalid`, password: 'test-only-password' });
  assert.ok(admin && customer);
  const adminToken = createSession(admin.id, 'admin').token;
  const customerToken = createSession(customer.id, 'user').token;
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const body = { siteName: 'Starfin Teste', siteDescription: 'Metadados publicados com segurança.', homeContent: {
      heroEyebrow: 'Minecraft', heroTitle: 'Mundo de teste.', heroAccent: 'Painel de teste.',
      heroDescription: 'Conteúdo persistido no CMS.', accountTitle: 'Sua conta de teste.', accountDescription: 'Licenças e servidores.'
    } };
    const headers = (token: string) => ({ authorization: `Bearer ${token}`, 'content-type': 'application/json' });
    assert.equal((await fetch(`${base}/api/admin/settings`, { method: 'POST', headers: headers(customerToken), body: JSON.stringify(body) })).status, 403);
    assert.equal((await fetch(`${base}/api/admin/settings`, { method: 'POST', headers: headers(adminToken), body: JSON.stringify(body) })).status, 200);
    const home = await (await fetch(base + '/')).text();
    const docs = await (await fetch(base + '/docs')).text();
    assert.match(home, /<title>Starfin Teste — plugins para servidores Minecraft<\/title>/);
    assert.match(home, /Metadados publicados com segurança/);
    assert.match(home, /Mundo de teste/);
    assert.doesNotMatch(home, /__STARFIN_PUBLIC_CONFIG__/);
    assert.match(docs, /Mundo de teste/);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    delete process.env.RAILWAY_PROJECT_ID;
  }
});
