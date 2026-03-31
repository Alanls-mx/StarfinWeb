import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'GONE'
  | 'EXPIRED'
  | 'MAX_USES'
  | 'MIN_PURCHASE';

export function jsonOk<T>(data: T, init?: number | ResponseInit) {
  const responseInit: ResponseInit | undefined =
    typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(data, responseInit);
}

export function jsonError(
  code: ApiErrorCode,
  message: string,
  init?: number | ResponseInit,
  details?: unknown
) {
  const status = typeof init === 'number' ? init : init?.status;
  const responseInit: ResponseInit = typeof init === 'number' ? { status: init } : init ?? {};
  return NextResponse.json(
    {
      error: {
        code,
        message,
        status: status ?? 500,
        details: details ?? null
      }
    },
    responseInit
  );
}

