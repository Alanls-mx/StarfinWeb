import { DollarSign, Package, ShoppingBag, Ticket, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useAuth } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { getAdminStats, type AdminStats } from '../../lib/api';

function statusBadgeClass(value: number, type: 'ok' | 'warn' | 'error' | 'neutral') {
  if (value <= 0) return 'bg-[#7B2CBF]/10 text-gray-400 border border-[#7B2CBF]/20';
  if (type === 'ok') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  if (type === 'warn') return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  if (type === 'error') return 'bg-red-500/20 text-red-300 border border-red-500/30';
  return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
}

export function AdminDashboard() {
  const { state } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const token = state.status === 'authenticated' ? state.token : null;

  useEffect(() => {
    if (!token) return;
    getAdminStats(token).then(setStats).catch(console.error);
  }, [token]);

  const cards = [
    {
      title: 'Receita Aprovada',
      value: `R$ ${((stats?.stats?.totalRevenueCents ?? 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    {
      title: 'Pagamentos',
      value: stats?.stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      title: 'Licenças',
      value: stats?.stats?.totalSales ?? 0,
      icon: Package,
      color: 'text-[#C77DFF]',
      bg: 'bg-[#C77DFF]/10'
    },
    {
      title: 'Usuários',
      value: stats?.stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    }
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-400">Indicadores reais de pagamentos, plugins/licenças e atendimento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={stat.bg + ' p-3 rounded-xl'}>
                <stat.icon className={stat.color + ' w-6 h-6'} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Pagamentos</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.paymentStatus.approved ?? 0, 'ok')}`}>Aprovados: {stats?.paymentStatus.approved ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.paymentStatus.pending ?? 0, 'warn')}`}>Pendentes: {stats?.paymentStatus.pending ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.paymentStatus.rejected ?? 0, 'error')}`}>Recusados: {stats?.paymentStatus.rejected ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.paymentStatus.cancelled ?? 0, 'neutral')}`}>Cancelados: {stats?.paymentStatus.cancelled ?? 0}</div>
          </div>
        </section>

        <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Plugins/Licenças</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.pluginStatus.approved ?? 0, 'ok')}`}>Aprovados: {stats?.pluginStatus.approved ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.pluginStatus.pending ?? 0, 'warn')}`}>Pendentes: {stats?.pluginStatus.pending ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.pluginStatus.rejected ?? 0, 'error')}`}>Recusados: {stats?.pluginStatus.rejected ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.pluginStatus.cancelled ?? 0, 'neutral')}`}>Cancelados: {stats?.pluginStatus.cancelled ?? 0}</div>
          </div>
        </section>

        <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Atendimento</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.tickets.open ?? 0, 'warn')}`}>Tickets abertos: {stats?.tickets.open ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.tickets.answered ?? 0, 'neutral')}`}>Tickets respondidos: {stats?.tickets.answered ?? 0}</div>
            <div className={`px-3 py-2 rounded-lg ${statusBadgeClass(stats?.tickets.closed ?? 0, 'ok')}`}>Tickets fechados: {stats?.tickets.closed ?? 0}</div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Plugins com mais vendas</h3>
            <Link to="/admin/plugins" className="text-sm text-[#C77DFF] hover:underline">Ver plugins</Link>
          </div>
          <div className="space-y-4">
            {stats?.topPlugins?.map((plugin) => (
              <div key={plugin.id} className="flex items-center justify-between p-4 bg-[#0B0B0F]/40 rounded-xl border border-[#7B2CBF]/5">
                <div>
                  <div className="text-sm font-medium">{plugin.name}</div>
                  <div className="text-xs text-gray-500">/{plugin.slug}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{plugin.sales} aprovações</div>
                  <div className="text-xs text-emerald-400">R$ {(plugin.revenueCents / 100).toFixed(2)}</div>
                </div>
              </div>
            ))}
            {!stats?.topPlugins?.length && <p className="text-sm text-gray-500">Sem vendas aprovadas ainda.</p>}
          </div>
        </section>

        <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Clientes com mais plugins</h3>
            <Link to="/admin/users" className="text-sm text-[#C77DFF] hover:underline">Ver usuários</Link>
          </div>
          <div className="space-y-4">
            {stats?.topCustomers?.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 bg-[#0B0B0F]/40 rounded-xl border border-[#7B2CBF]/5">
                <div>
                  <div className="text-sm font-medium">{customer.name}</div>
                  <div className="text-xs text-gray-500">{customer.email}</div>
                </div>
                <div className="text-sm font-bold text-white">{customer.pluginCount} plugins</div>
              </div>
            ))}
            {!stats?.topCustomers?.length && <p className="text-sm text-gray-500">Sem dados de clientes ainda.</p>}
          </div>
        </section>
      </div>

      <section className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="w-5 h-5 text-[#C77DFF]" />
          <h3 className="text-lg font-bold">Cobertura de Catálogo</h3>
        </div>
        <p className="text-sm text-gray-400">
          Plugins totais: <span className="text-white font-semibold">{stats?.stats.totalPlugins ?? 0}</span> | Plugins com venda aprovada:{' '}
          <span className="text-white font-semibold">{stats?.stats.pluginsWithSales ?? 0}</span>
        </p>
      </section>
    </div>
  );
}
