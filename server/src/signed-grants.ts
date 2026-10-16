import { createPrivateKey, createPublicKey, randomUUID, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const GRANT_ISSUER = 'starfinplugins.com.br';
export const GRANT_KEY_ID = 'starfin-2026-10-p256';

export type GrantClaims = {
  version: 1;
  issuer: string;
  keyId: string;
  productId: string;
  installationId: string;
  sessionId: string;
  issuedAt: number;
  notBefore: number;
  expiresAt: number;
  jti: string;
  observedIp: string;
  serverPort: number;
};

let signingKey: ReturnType<typeof createPrivateKey> | undefined;

export function signedProductGrants(input: {
  productIds: string[]; installationId: string; observedIp: string; serverPort: number;
  expiresAt: string;
}): Record<string, string> {
  if (!signingKey) {
    const path = process.env.STARFIN_GRANT_PRIVATE_KEY_PATH;
    if (!path) throw new Error('STARFIN_GRANT_PRIVATE_KEY_PATH ausente');
    const key = createPrivateKey(readFileSync(path));
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1')
      throw new Error('Chave de assinatura deve ser ECDSA P-256');
    signingKey = key;
  }
  const now = Math.floor(Date.now() / 1000);
  const until = Math.floor(Date.parse(input.expiresAt) / 1000);
  if (!Number.isFinite(until) || until <= now || until > now + 3600) throw new Error('Prazo de grant invalido');
  const sessionId = randomUUID();
  return Object.fromEntries(input.productIds.map(productId => {
    if (!/^[a-z0-9_]{2,64}$/.test(productId)) throw new Error('Produto invalido');
    const claims: GrantClaims = {
      version: 1, issuer: GRANT_ISSUER, keyId: GRANT_KEY_ID, productId,
      installationId: input.installationId, sessionId, issuedAt: now,
      notBefore: now, expiresAt: until, jti: randomUUID(),
      observedIp: input.observedIp, serverPort: input.serverPort
    };
    const payload = Buffer.from(JSON.stringify(claims));
    const signature = sign('SHA256', payload, signingKey!);
    return [productId, `${payload.toString('base64url')}.${signature.toString('base64url')}`];
  }));
}

export function signingPublicKeyPem(): string {
  if (!signingKey) throw new Error('Chave de assinatura indisponivel');
  return createPublicKey(signingKey).export({ format: 'pem', type: 'spki' }).toString();
}
