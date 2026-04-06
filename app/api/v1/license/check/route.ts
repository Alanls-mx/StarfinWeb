import { NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonError } from '@backend/lib/http';
import { rateLimit } from '@backend/lib/rateLimit';
import { checkLicense, licenseCheckRequestSchema } from '@backend/lib/license';

export const runtime = 'nodejs';

const allowedOrigins = (process.env.LICENSE_CHECK_ALLOWED_ORIGINS || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

function getCorsHeaders(origin: string | null) {
  const allowOrigin = allowedOrigins.length === 0
    ? '*'
    : (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get('origin')) });
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = await rateLimit({ key: `license_check:${ip}`, limit: 60, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      {
        valid: false,
        reason: 'RATE_LIMITED',
        licenseOwner: '',
        plan: '',
        expiresAt: '',
        allowedPlugins: [],
        updates: {}
      },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const json = (await req.json()) as unknown;
    const input = licenseCheckRequestSchema.parse(json);
    const response = await checkLicense(input);

    process.stdout.write(
      `${JSON.stringify({
        msg: 'license_check',
        valid: response.valid,
        reason: response.reason,
        ip,
        licenseKey: input.licenseKey
      })}\n`
    );

    return NextResponse.json(response, { status: 200, headers: corsHeaders });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'INVALID_INPUT',
          licenseOwner: '',
          plan: '',
          expiresAt: '',
          allowedPlugins: [],
          updates: {}
        },
        { status: 400, headers: corsHeaders }
      );
    }
    return jsonError('INTERNAL_ERROR', 'Erro interno', { status: 500, headers: corsHeaders });
  }
}
