import { requireAdmin } from '@backend/lib/auth';
import { db } from '@backend/lib/db';
import { jsonError, jsonOk } from '@backend/lib/http';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!(await requireAdmin(auth))) return jsonError('FORBIDDEN', 'Admin requerido', 403);

  // 1. Most purchased plugins (Top 5)
  const topPlugins = await db.plugin.findMany({
    take: 5,
    include: {
      _count: {
        select: { licenses: true }
      }
    },
    orderBy: {
      licenses: {
        _count: 'desc'
      }
    }
  });

  // 2. Best customers (by number of plugins owned)
  const topCustomers = await db.user.findMany({
    take: 5,
    where: { role: 'user' },
    include: {
      _count: {
        select: { licenses: true }
      }
    },
    orderBy: {
      licenses: {
        _count: 'desc'
      }
    }
  });

  // 3. Overall stats
  const totalSales = await db.licensePlugin.count();
  const totalRevenue = await db.plugin.findMany({
    select: {
      price: true,
      _count: {
        select: { licenses: true }
      }
    }
  }).then(plugins => 
    plugins.reduce((acc, p) => acc + (p.price * p._count.licenses), 0)
  );

  return jsonOk({
    topPlugins: topPlugins.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sales: p._count.licenses
    })),
    topCustomers: topCustomers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      pluginCount: u._count.licenses
    })),
    stats: {
      totalSales,
      totalRevenueCents: totalRevenue
    }
  });
}
