import crypto from 'node:crypto';
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
  | 'IP_MISMATCH'
  | 'PLUGIN_NOT_ALLOWED'
  | 'ERROR';

export type LicenseCheckResponse = {
  valid: boolean;
  reason: string;
  licenseOwner: string;
  plan: string;
  expiresAt: string;
  allowedPlugins: string[];
  updates: Record<string, string>;
  pluginInfo?: {
    name: string;
    version: string;
    platform: string;
    jarUrl: string;
    dependencies: string[];
  };
};

type LicenseData = {
  id: string;
  licenseKey: string;
  user: { name: string; email: string };
  hwid: string | null;
  plan: string;
  status: LicenseStatus;
  expiresAt: Date | null;
  productIps: Record<string, string[]> | null;
  plugins: Array<{
    id: string;
    name: string;
    version: string | null;
    platform: string | null;
    jarUrl: string | null;
    dependencies: string[] | null;
    userHwid: string | null;
    lpId: string;
  }>;
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
        productIps: (value.productIps as Record<string, string[]>) ?? null,
        plugins: Array.isArray(value.plugins)
          ? value.plugins.map((p: any) => ({
              id: String(p.id ?? ''),
              name: String(p.name ?? ''),
              version: p.version ?? null,
              platform: p.platform ?? null,
              jarUrl: p.jarUrl ?? null,
              dependencies: p.dependencies ?? null,
              userHwid: p.userHwid ?? null,
              lpId: p.lpId ?? ''
            }))
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
    productIps: (license.productIps as Record<string, string[]>) ?? null,
    plugins: license.plugins.map((lp) => ({
      id: lp.plugin.id,
      name: lp.plugin.name,
      version: lp.plugin.latestVersion,
      platform: lp.plugin.platform,
      jarUrl: lp.plugin.jarUrl,
      dependencies: (lp.plugin.dependencies as string[]) ?? [],
      userHwid: lp.hwid,
      lpId: lp.id
    }))
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
  const targetPlugin = license.plugins.find(
    (p) => p.name.toLowerCase() === input.pluginCore.toLowerCase()
  );

  if (!targetPlugin) {
    await logUsage(license.id, input);
    return {
      ...baseResponse('PLUGIN_NOT_ALLOWED'),
      licenseOwner: license.user.name,
      plan: license.plan,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : '',
      allowedPlugins
    };
  }

  // Automatic HWID binding per plugin/user (from your request)
  if (!targetPlugin.userHwid) {
    // First bind for THIS specific plugin for THIS user
    await db.licensePlugin.update({
      where: { id: targetPlugin.lpId },
      data: { hwid }
    });
    licenseCache.delete(license.licenseKey);
    const redis = getRedis();
    if (redis) await redis.del(`license:${license.licenseKey}`);
  } else if (targetPlugin.userHwid !== hwid) {
    await logUsage(license.id, input);
    await sendDiscordWebhook({
      content: `🚨 HWID mismatch (Per-Plugin)\nlicenseKey=${license.licenseKey}\nplugin=${targetPlugin.name}\nuser=${license.user.email}\nexpected=${targetPlugin.userHwid}\nreceived=${hwid}`
    });
    return {
      ...baseResponse('HWID_MISMATCH'),
      licenseOwner: license.user.name,
      plan: license.plan,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : '',
      allowedPlugins
    };
  }

  // IP-per-product validation (from VersaoAntiga)
  if (license.productIps && license.productIps[targetPlugin.id]) {
    const allowedIps = license.productIps[targetPlugin.id];
    if (!allowedIps.includes(input.serverIp)) {
      await logUsage(license.id, input);
      return {
        ...baseResponse('IP_MISMATCH'),
        licenseOwner: license.user.name,
        plan: license.plan,
        expiresAt: license.expiresAt ? license.expiresAt.toISOString() : '',
        allowedPlugins
      };
    }
  }

  const updates: Record<string, string> = {};
  for (const p of license.plugins) {
    if (p.jarUrl) {
      updates[p.name] = p.jarUrl;
    }
  }

  return {
    valid: true,
    reason: 'OK',
    licenseOwner: license.user.name,
    plan: license.plan,
    expiresAt: license.expiresAt ? license.expiresAt.toISOString() : '',
    allowedPlugins,
    updates,
    pluginInfo: {
      name: targetPlugin.name,
      version: targetPlugin.version ?? '1.0.0',
      platform: targetPlugin.platform ?? 'Bukkit',
      jarUrl: targetPlugin.jarUrl ?? '',
      dependencies: targetPlugin.dependencies ?? []
    }
  };
}

export async function createLicenseForUser(userId: string, pluginId: string) {
  const plugin = await db.plugin.findUnique({ where: { id: pluginId } });
  if (!plugin) throw new Error('Plugin not found');

  // Check if user already has a license
  let license = await db.license.findFirst({
    where: { userId },
    include: { plugins: true }
  });

  if (!license) {
    const licenseKey = `STAR-${crypto.randomBytes(6).toString('hex').toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    license = await db.license.create({
      data: {
        userId,
        licenseKey,
        plan: 'Standard',
        status: LicenseStatus.active
      },
      include: { plugins: true }
    });
  }

  // Check if plugin is already linked to this license
  const exists = license.plugins.some((p) => p.pluginId === pluginId);
  if (!exists) {
    await db.licensePlugin.create({
      data: {
        licenseId: license.id,
        pluginId
      }
    });

    // If it's a timed license, update expiresAt
    if (plugin.licensePolicy) {
      const policy = plugin.licensePolicy as any;
      let expiresAt: Date | null = license.expiresAt;

      if (policy.type === 'duration' && policy.months) {
        const d = expiresAt ? new Date(expiresAt) : new Date();
        d.setMonth(d.getMonth() + policy.months);
        expiresAt = d;
      } else if (policy.type === 'date' && policy.expiresAt) {
        expiresAt = new Date(policy.expiresAt);
      }

      if (expiresAt) {
        await db.license.update({
          where: { id: license.id },
          data: { expiresAt }
        });
      }
    }
  }

  // Clear cache
  licenseCache.delete(license.licenseKey);
  const redis = getRedis();
  if (redis) await redis.del(`license:${license.licenseKey}`);

  return license;
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
