import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonError } from '@backend/lib/http';
import { rateLimit } from '@backend/lib/rateLimit';
import { checkLicense, licenseCheckRequestSchema } from '@backend/lib/license';

export const runtime = 'nodejs';

const allowedOrigins = (process.env.LICENSE_CHECK_ALLOWED_ORIGINS || '')
  .split(',').map((value) => value.trim()).filter(Boolean);

function responseHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  // License validation is server-to-server; there is no public wildcard CORS.
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: responseHeaders(req.headers.get('origin')) });
}

export async function POST(req: Request) {
  const headers = responseHeaders(req.headers.get('origin'));
  try {
    const input = licenseCheckRequestSchema.parse((await req.json()) as unknown);
    // An untrusted X-Forwarded-For must never be used as a rate-limit identity.
    // The license is high entropy, so its fingerprint can be used safely here.
    const fingerprint = createHash('sha256').update(input.licenseKey).digest('hex');
    const limit = await rateLimit({
      key: `license_check:${fingerprint}`,
      limit: 60,
      windowMs: 60_000
    });
    if (!limit.ok) {
      return NextResponse.json({
        valid: false,
        reason: 'RATE_LIMITED',
        licenseOwner: '',
        plan: '',
        expiresAt: '',
        allowedPlugins: [],
        updates: {}
      }, { status: 429, headers });
    }

    const result = await checkLicense(input);
    process.stdout.write(`${JSON.stringify({
      msg: 'license_check',
      valid: result.valid,
      reason: result.reason,
      keyRef: fingerprint.slice(0, 12)
    })}\n`);
    return NextResponse.json(result, { status: 200, headers });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        valid: false,
        reason: 'INVALID_INPUT',
        licenseOwner: '',
        plan: '',
        expiresAt: '',
        allowedPlugins: [],
        updates: {}
      }, { status: 400, headers });
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', { status: 500, headers });
  }
}
