import assert from 'node:assert/strict';
import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { signedProductGrants, signingPublicKeyPem } from './signed-grants.js';

test('grants are P-256 signed and bound to product, installation, IP and port', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'starfin-grant-'));
  try {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const keyPath = path.join(folder, 'key.pem');
    writeFileSync(keyPath, privateKey.export({ format: 'pem', type: 'sec1' }), { mode: 0o600 });
    process.env.STARFIN_GRANT_PRIVATE_KEY_PATH = keyPath;
    const installationId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const grants = signedProductGrants({ productIds: ['starfin_bans'], installationId,
      observedIp: '54.207.79.219', serverPort: 25565,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() });
    const [encoded, signature] = grants.starfin_bans.split('.');
    const payload = Buffer.from(encoded, 'base64url');
    const claims = JSON.parse(payload.toString('utf8'));
    assert.equal(claims.productId, 'starfin_bans');
    assert.equal(claims.installationId, installationId);
    assert.equal(claims.observedIp, '54.207.79.219');
    assert.equal(claims.serverPort, 25565);
    assert.ok(verify('SHA256', payload, publicKey, Buffer.from(signature, 'base64url')));
    assert.ok(!verify('SHA256', Buffer.from(payload.toString('utf8').replace('25565', '25566')),
      createPublicKey(signingPublicKeyPem()), Buffer.from(signature, 'base64url')));
  } finally {
    delete process.env.STARFIN_GRANT_PRIVATE_KEY_PATH;
    rmSync(folder, { recursive: true, force: true });
  }
});
