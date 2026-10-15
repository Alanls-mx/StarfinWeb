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
  user: { name: string; email: string; banned: boolean };
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
  const redisKey = `license:${crypto.createHash('sha256').update(licenseKey).digest('hex')}`;
  if (redis) {
    const value = (await redis.get(redisKey)) as any;
    if (value && typeof value === 'object' && typeof value.id === 'string') {
      const parsed: LicenseData = {
        id: value.id,
        licenseKey: value.licenseKey,
        user: { name: value.user?.name ?? '', email: value.user?.email ?? '', banned: value.user?.banned === true },
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
    user: { name: license.user.name, email: license.user.email, banned: license.user.banned },
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

  if (license.user.banned || license.status !== LicenseStatus.active) {
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

  // Resolve product authorization before binding an installation ID.
  // StarfinCore/StarfinLicense are bootstrap callers, not commercial products.
  const isBootstrap = ['starfincore', 'starfinlicense', 'starfin-core', 'starfin-license']
    .includes(input.pluginCore.toLowerCase());
  const accessiblePlugins = license.plugins.filter((p) => {
    const ips = license.productIps?.[p.id];
    return !Array.isArray(ips) || ips.length === 0 || ips.includes(input.serverIp);
  });
  const targetPlugin = isBootstrap
    ? undefined
    : license.plugins.find((p) => p.name.toLowerCase() === input.pluginCore.toLowerCase());

  if (!isBootstrap && !targetPlugin) {
    return { ...baseResponse('PLUGIN_NOT_ALLOWED'), licenseOwner: license.user.name, plan: license.plan };
  }
  if (targetPlugin && !accessiblePlugins.includes(targetPlugin)) {
    return { ...baseResponse('IP_MISMATCH'), licenseOwner: license.user.name, plan: license.plan };
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
    // Atomic compare-and-set: two concurrent servers cannot both claim the same license.
    const claimed = await db.license.updateMany({
      where: { id: license.id, hwid: null },
      data: { hwid }
    });
    if (claimed.count === 0) {
      const current = await db.license.findUnique({ where: { id: license.id }, select: { hwid: true } });
      if (current?.hwid !== hwid) {
        return { ...baseResponse('HWID_MISMATCH'), licenseOwner: license.user.name, plan: license.plan };
      }
    }
    licenseCache.delete(license.licenseKey);
    const redis = getRedis();
    if (redis) await redis.del(`license:${crypto.createHash('sha256').update(license.licenseKey).digest('hex')}`);
  } else if (license.hwid !== hwid) {
    await logUsage(license.id, input);
    // HWID mismatch is the main anti-piracy signal; notify Discord for moderation workflows.
    await sendDiscordWebhook({
      content: `🚨 HWID divergente\nlicenseId=${license.id}\nserver=${input.serverName}`
    });
    return {
      ...baseResponse('HWID_MISMATCH'),
      licenseOwner: license.user.name,
      plan: license.plan,
      expiresAt: license.expiresAt ? license.expiresAt.toISOString() : '',
      allowedPlugins: []
    };
  }

  await logUsage(license.id, input);

  const allowedPlugins = accessiblePlugins.map((p) => p.name);

  // Only product checks bind individual product installations; bootstrap does not.
  if (targetPlugin) {
    if (!targetPlugin.userHwid) {
      const claimed = await db.licensePlugin.updateMany({
        where: { id: targetPlugin.lpId, hwid: null },
        data: { hwid }
      });
      if (claimed.count === 0) {
        const current = await db.licensePlugin.findUnique({
          where: { id: targetPlugin.lpId },
          select: { hwid: true }
        });
        if (current?.hwid !== hwid) {
          return { ...baseResponse('HWID_MISMATCH'), licenseOwner: license.user.name, plan: license.plan };
        }
      }
      licenseCache.delete(license.licenseKey);
      const redis = getRedis();
      if (redis) await redis.del(`license:${crypto.createHash('sha256').update(license.licenseKey).digest('hex')}`);
    } else if (targetPlugin.userHwid !== hwid) {
      await sendDiscordWebhook({
        content: `🚨 HWID divergente (plugin)\nlicenseId=${license.id}\nplugin=${targetPlugin.name}`
      });
      return {
        ...baseResponse('HWID_MISMATCH'),
        licenseOwner: license.user.name,
        plan: license.plan,
        expiresAt: license.expiresAt ? license.expiresAt.toISOString() : ''
      };
    }
  }


  const updates: Record<string, string> = {};
  for (const p of accessiblePlugins) {
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
    pluginInfo: targetPlugin ? {
      name: targetPlugin.name,
      version: targetPlugin.version ?? '1.0.0',
      platform: targetPlugin.platform ?? 'Bukkit',
      jarUrl: targetPlugin.jarUrl ?? '',
      dependencies: targetPlugin.dependencies ?? []
    } : undefined
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
  if (redis) await redis.del(`license:${crypto.createHash('sha256').update(license.licenseKey).digest('hex')}`);

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
