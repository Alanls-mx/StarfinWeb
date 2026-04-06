import { ShoppingBag, Users, TrendingUp, DollarSign, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useAuth } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { getAdminStats } from '../../lib/api';

export function AdminDashboard() {
  const { state } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const token = state.status === 'authenticated' ? state.token : null;

  useEffect(() => {
    if (!token) return;
    getAdminStats(token).then(setStats).catch(console.error);
  }, [token]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-400">Bem-vindo de volta! Aqui está o que está acontecendo no seu site hoje.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Vendas Totais', value: stats?.stats?.totalSales || 0, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { title: 'Receita Total', value: `R$ ${(stats?.stats?.totalRevenueCents / 100 || 0).toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { title: 'Plugins Ativos', value: stats?.topPlugins?.length || 0, icon: Package, color: 'text-[#C77DFF]', bg: 'bg-[#C77DFF]/10' },
          { title: 'Novos Usuários', value: stats?.topCustomers?.length || 0, icon: Users, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={stat.bg + " p-3 rounded-xl"}>
                <stat.icon className={stat.color + " w-6 h-6"} />
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3" /> +12%
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Plugins */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Plugins Populares</h3>
            <Link to="/admin/plugins" className="text-sm text-[#C77DFF] hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-4">
            {stats?.topPlugins?.map((plugin: any) => (
              <div key={plugin.id} className="flex items-center justify-between p-4 bg-[#0B0B0F]/40 rounded-xl border border-[#7B2CBF]/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#7B2CBF]/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-[#C77DFF]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{plugin.name}</div>
                    <div className="text-xs text-gray-500">/{plugin.slug}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{plugin.sales} vendas</div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Alta demanda</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Principais Clientes</h3>
            <Link to="/admin/users" className="text-sm text-[#C77DFF] hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-4">
            {stats?.topCustomers?.map((customer: any) => (
              <div key={customer.id} className="flex items-center justify-between p-4 bg-[#0B0B0F]/40 rounded-xl border border-[#7B2CBF]/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF] flex items-center justify-center text-white font-bold">
                    {customer.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{customer.pluginCount} plugins</div>
                  <div className="text-[10px] text-[#C77DFF] font-bold uppercase tracking-wider">VIP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
