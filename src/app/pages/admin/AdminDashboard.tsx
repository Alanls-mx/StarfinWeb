import { Activity, Boxes, FileText, Hammer, KeyRound, Link2, ListOrdered, Mail, ScrollText, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useAuth } from '../../lib/auth';

export function AdminDashboard() {
  const { state } = useAuth();
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Painel Admin</h1>
          <p className="text-gray-400 text-lg">Gerencie plugins, categorias, documentação e suporte.</p>
          <div className="text-sm text-gray-500 mt-2">
            Token: {state.status === 'authenticated' ? 'autenticado' : 'não autenticado'} (use login com email contendo "admin")
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { to: '/admin/plugins', icon: Hammer, title: 'Plugins', desc: 'Criar, editar e excluir plugins' },
            { to: '/admin/categories', icon: ListOrdered, title: 'Categorias', desc: 'Gerenciar categorias' },
            { to: '/admin/docs', icon: FileText, title: 'Documentação', desc: 'Editar seções de docs' },
            { to: '/admin/support', icon: Boxes, title: 'Suporte', desc: 'Tickets de suporte' },
            { to: '/admin/purchases', icon: ShoppingBag, title: 'Compras', desc: 'Aprovar/cancelar compras e enviar emails' },
            { to: '/admin/smtp', icon: Mail, title: 'SMTP', desc: 'Configurar emails e testar envio' },
            { to: '/admin/integrations', icon: Link2, title: 'Integrações', desc: 'Configurar URLs e endpoints' },
            { to: '/admin/status', icon: Activity, title: 'Status', desc: 'Status do sistema (status page)' },
            { to: '/admin/changelog', icon: ScrollText, title: 'Changelog', desc: 'Gerenciar changelog do site' },
            { to: '/account', icon: KeyRound, title: 'Chaves de API', desc: 'Gerencie as chaves dos usuários' }
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.12) }}
              className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-7 hover:border-[#7B2CBF]/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center mb-4">
                <card.icon className="w-6 h-6 text-[#C77DFF]" />
              </div>
              <div className="text-xl text-white mb-2">{card.title}</div>
              <div className="text-sm text-gray-400 mb-6">{card.desc}</div>
              <Link
                to={card.to}
                className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-lg hover:shadow-[#7B2CBF]/40 transition-all duration-300 text-sm"
              >
                Abrir
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
