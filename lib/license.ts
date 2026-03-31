import { LicenseStatus } from '@prisma/client';
import { z } from 'zod';
import { db } from './db';
import { sendDiscordWebhook } from './discord';
import { TtlCache } from './ttlCache';
import { getRedis } from './redis';

export const performanceSchema = z.record(z.string().min(1).max(64), z.number().finite()).default({});

export const licenseCheckRequestSchema = z.object({
  licenseKey: z.string().min(8).max(128).trim(),
  hwid: z.string().min(3).max(256).trim().nullable().optional(),
  serverIp: z.string().min(3).max(64).trim(),
  serverPort: z.number().int().min(1).max(65535),
  serverName: z.string().min(1).max(128).trim(),
  platform: z.string().min(1).max(64).trim(),
  pluginCore: z.string().min(1).max(64).trim(),
  coreVersion: z.string().min(1).max(64).trim(),
  performance: performanceSchema
});

export type LicenseCheckRequest = z.infer<typeof licenseCheckRequestSchema>;

export type LicenseCheckReason =
  | 'OK'
  | 'NOT_FOUND'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'HWID_REQUIRED'
  | 'HWID_MISMATCH'
  | 'ERROR';

export type LicenseCheckResponse = {
  valid: boolean;
  reason: string;
  licenseOwner: string;
  plan: string;
  expiresAt: string;
  allowedPlugins: string[];
  updates: Record<string, string>;
};

type LicenseData = {
  id: string;
  licenseKey: string;
  user: { name: string; email: string };
  hwid: string | null;
  plan: string;
  status: LicenseStatus;
  expiresAt: Date | null;
  plugins: Array<{ name: string; downloadUrl: string | null }>;
};

const licenseCache = new TtlCache<string, LicenseData>(30_000);

async function getLicenseByKey(licenseKey: string): Promise<LicenseData | null> {
  // Cache to reduce DB load for noisy servers; logs are still written per request.
  const cached = licenseCache.get(licenseKey);
  if (cached) return cached;
  const redis = getRedis();
  const redisKey = `license:${licenseKey}`;
  if (redis) {
    const value = (await redis.get(redisKey)) as any;
    if (value && typeof value === 'object' && typeof value.id === 'string') {
      const parsed: LicenseData = {
        id: value.id,
        licenseKey: value.licenseKey,
        user: { name: value.user?.name ?? '', email: value.user?.email ?? '' },
        hwid: value.hwid ?? null,
        plan: value.plan ?? '',
        status: value.status ?? LicenseStatus.active,
        expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
        plugins: Array.isArray(value.plugins)
          ? value.plugins.map((p: any) => ({ name: String(p.name ?? ''), downloadUrl: p.downloadUrl ?? null }))
          : []
      };
      licenseCache.set(licenseKey, parsed);
      return parsed;
    }
  }

  const license = await db.license.findUnique({
    where: { licenseKey },
    include: {
      user: true,
      plugins: { include: { plugin: true } }
    }
  });
  if (!license) return null;

  const data: LicenseData = {
    id: license.id,
    licenseKey: license.licenseKey,
    user: { name: license.user.name, email: license.user.email },
    hwid: license.hwid ?? null,
    plan: license.plan,
    status: license.status,
    expiresAt: license.expiresAt ?? null,
    plugins: license.plugins.map((lp) => ({ name: lp.plugin.name, downloadUrl: lp.plugin.downloadUrl ?? null }))
  };

  licenseCache.set(licenseKey, data);
  if (redis) {
    await redis.set(
      redisKey,
      {
        ...data,
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : null
      },
      { ex: 30 }
    );
  }
  return data;
}

function baseResponse(reason: LicenseCheckReason): LicenseCheckResponse {
  return {
    valid: false,
    reason,
    licenseOwner: '',
    plan: '',
    expiresAt: '',
    allowedPlugins: [],
    updates: {}
  };
}

export async function checkLicense(input: LicenseCheckRequest): Promise<LicenseCheckResponse> {
  const now = new Date();

  const license = await getLicenseByKey(input.licenseKey);
  if (!license) {
    return baseResponse('NOT_FOUND');
  }

  if (license.status !== LicenseStatus.active) {
    await logUsage(license.id, input);
    return {
      ...baseResponse('SUSPENDED'),
      licenseOwner: license.user.name,
      plan: license.plan,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : ''
    };
  }

  if (license.expiresAt && license.expiresAt.getTime() < now.getTime()) {
    await logUsage(license.id, input);
    return {
      ...baseResponse('EXPIRED'),
      licenseOwner: license.user.name,
      plan: license.plan,
      expiresAt: license.expiresAt.toISOString()
    };
  }

  const hwid = input.hwid?.trim() ?? null;
  if (!hwid) {
    await logUsage(license.id, input);
    return {
      ...baseResponse('HWID_REQUIRED'),
      licenseOwner: license.user.name,
      plan: license.plan,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : ''
    };
  }

  if (!license.hwid) {
    // First bind: if the license has no HWID yet, bind it to the first server that validates successfully.
    await db.license.update({
      where: { id: license.id },
      data: { hwid }
    });
    licenseCache.delete(license.licenseKey);
    const redis = getRedis();
    if (redis) await redis.del(`license:${license.licenseKey}`);
  } else if (license.hwid !== hwid) {
    await logUsage(license.id, input);
    // HWID mismatch is the main anti-piracy signal; notify Discord for moderation workflows.
    await sendDiscordWebhook({
      content: `🚨 HWID mismatch\nlicenseKey=${license.licenseKey}\nuser=${license.user.email}\nexpected=${license.hwid}\nreceived=${hwid}\nip=${input.serverIp}:${input.serverPort}`
    });
    return {
      ...baseResponse('HWID_MISMATCH'),
      licenseOwner: license.user.name,
      plan: license.plan,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : '',
      allowedPlugins: license.plugins.map((p) => p.name)
    };
  }

  await logUsage(license.id, input);

  const allowedPlugins = license.plugins.map((p) => p.name);
  const updates: Record<string, string> = {};
  for (const p of license.plugins) {
    if (p.downloadUrl) {
      updates[p.name] = p.downloadUrl;
    }
  }

  return {
    valid: true,
    reason: 'OK',
    licenseOwner: license.user.name,
    plan: license.plan,
    expiresAt: license.expiresAt ? license.expiresAt.toISOString() : '',
    allowedPlugins,
    updates
  };
}

async function logUsage(licenseId: string, input: LicenseCheckRequest) {
  await db.log.create({
    data: {
      licenseId,
      serverIp: input.serverIp,
      serverPort: input.serverPort,
      serverName: input.serverName,
      platform: input.platform,
      pluginCore: input.pluginCore,
      coreVersion: input.coreVersion,
      performance: input.performance
    }
  });
}
