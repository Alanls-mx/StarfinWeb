import { Ratelimit } from '@upstash/ratelimit';
import { getRedis } from './redis';

type Bucket = {
  count: number;
  resetAtMs: number;
};

const buckets = new Map<string, Bucket>();

export async function rateLimit(input: { key: string; limit: number; windowMs: number }) {
  const redis = getRedis();
  if (redis) {
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(input.limit, `${Math.max(1, Math.floor(input.windowMs / 1000))} s`),
      analytics: true,
      prefix: 'rl'
    });
    const res = await rl.limit(input.key);
    return {
      ok: res.success,
      remaining: res.remaining,
      resetAtMs: res.reset
    };
  }

  const now = Date.now();
  const existing = buckets.get(input.key);
  if (!existing || existing.resetAtMs <= now) {
    buckets.set(input.key, { count: 1, resetAtMs: now + input.windowMs });
    return { ok: true, remaining: input.limit - 1, resetAtMs: now + input.windowMs };
  }

  if (existing.count >= input.limit) {
    return { ok: false, remaining: 0, resetAtMs: existing.resetAtMs };
  }

  existing.count += 1;
  return { ok: true, remaining: input.limit - existing.count, resetAtMs: existing.resetAtMs };
}
