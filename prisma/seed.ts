import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

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
  const adminPassword =
    (process.env.SEED_ADMIN_PASSWORD || '').trim() || crypto.randomBytes(18).toString('base64url');

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
    {
      name: 'EconomyPlus Pro',
      price: 4990,
      jarUrl: 'https://example.com/economyplus.jar',
      latestVersion: '2.5.1',
      description: 'O melhor plugin de economia para seu servidor.'
    },
    {
      name: 'UltraRanks',
      price: 3990,
      jarUrl: 'https://example.com/ultraranks.jar',
      latestVersion: '1.9.3',
      description: 'Gerencie cargos e permissoes com facilidade.'
    },
    {
      name: 'AntiCheat Ultimate',
      price: 6990,
      jarUrl: 'https://example.com/anticheat.jar',
      latestVersion: '5.0.1',
      description: 'Protecao avancada contra trapaceiros.'
    }
  ];

  const plugins = [];
  for (const p of pluginsSeed) {
    const slug = slugify(p.name);
    const plugin = await db.plugin.upsert({
      where: { slug },
      update: {
        name: p.name,
        price: p.price,
        jarUrl: p.jarUrl,
        latestVersion: p.latestVersion,
        description: p.description
      },
      create: {
        name: p.name,
        slug,
        price: p.price,
        jarUrl: p.jarUrl,
        latestVersion: p.latestVersion,
        description: p.description
      }
    });
    plugins.push(plugin);
  }

  const demoEmail = 'joao@exemplo.com';
  const demoPassword =
    (process.env.SEED_DEMO_PASSWORD || '').trim() || crypto.randomBytes(18).toString('base64url');
  const demo = await db.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: 'Joao Silva',
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

  process.stdout.write(`Seed concluido.\nAdmin: ${adminEmail}\nDemo: ${demoEmail}\n`);
  if (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_DEMO_PASSWORD) {
    process.stdout.write(
      'Senhas aleatorias foram geradas para esta execucao. Defina SEED_ADMIN_PASSWORD e SEED_DEMO_PASSWORD para valores fixos.\n'
    );
  }
  process.stdout.write(`Admin id: ${admin.id}\n`);
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + '\n');
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
