import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateLicenseKey() {
  return `LIC-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

async function main() {
  const adminEmail = 'admin@starfinplugins.com';
  const adminPassword = 'admin123456';

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'admin' },
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'admin'
    }
  });

  const pluginsSeed = [
    { name: 'EconomyPlus Pro', price: 4990, downloadUrl: 'https://example.com/economyplus.jar', latestVersion: '2.5.1' },
    { name: 'UltraRanks', price: 3990, downloadUrl: 'https://example.com/ultraranks.jar', latestVersion: '1.9.3' },
    { name: 'AntiCheat Ultimate', price: 6990, downloadUrl: 'https://example.com/anticheat.jar', latestVersion: '5.0.1' }
  ];

  const plugins = [];
  for (const p of pluginsSeed) {
    const slug = slugify(p.name);
    const plugin = await db.plugin.upsert({
      where: { slug },
      update: {
        name: p.name,
        price: p.price,
        downloadUrl: p.downloadUrl,
        latestVersion: p.latestVersion
      },
      create: {
        name: p.name,
        slug,
        price: p.price,
        downloadUrl: p.downloadUrl,
        latestVersion: p.latestVersion
      }
    });
    plugins.push(plugin);
  }

  const demoEmail = 'joao@exemplo.com';
  const demoPassword = '12345678';
  const demo = await db.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: 'João Silva',
      email: demoEmail,
      passwordHash: await bcrypt.hash(demoPassword, 12),
      role: 'user'
    }
  });

  const existing = await db.license.findFirst({
    where: { userId: demo.id },
    select: { id: true }
  });

  if (!existing) {
    await db.license.create({
      data: {
        licenseKey: generateLicenseKey(),
        userId: demo.id,
        plan: 'Premium',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        plugins: {
          create: plugins.map((p) => ({ pluginId: p.id }))
        }
      }
    });
  }

  process.stdout.write(
    `Seed concluído.\nAdmin: ${adminEmail} / ${adminPassword}\nDemo: ${demoEmail} / ${demoPassword}\n`
  );
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + '\n');
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

