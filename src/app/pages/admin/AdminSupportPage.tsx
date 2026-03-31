import { CheckCircle2, Clock, Mail, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { adminListTickets, adminUpdateTicket } from '../../lib/api';

export function AdminSupportPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<
    Array<{ id: string; email: string; subject: string; message: string; status: string; createdISO: string; updatedISO: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const res = await adminListTickets(token);
      if (!cancelled) setItems(res.items);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center text-gray-400">
          Faça login como admin para acessar esta página.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl mb-6">Tickets de Suporte</h1>
        <div className="space-y-4">
          {items.map((t) => (
            <div key={t.id} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="text-white">{t.email}</div>
                </div>
                <div className="text-xs text-gray-500">
                  criado {new Date(t.createdISO).toLocaleString('pt-BR')} • atualizado {new Date(t.updatedISO).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <div className="text-white">{t.subject}</div>
              </div>
              <div className="text-sm text-gray-400 mb-4">{t.message}</div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await adminUpdateTicket(token, t.id, 'em_andamento');
                    const res = await adminListTickets(token);
                    setItems(res.items);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#0B0B0F] rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm"
                >
                  <Clock className="w-4 h-4" />
                  Em andamento
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await adminUpdateTicket(token, t.id, 'resolvido');
                    const res = await adminListTickets(token);
                    setItems(res.items);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Marcar como resolvido
                </motion.button>
              </div>
            </div>
          ))}
          {!items.length ? <div className="text-sm text-gray-500">Nenhum ticket no momento.</div> : null}
        </div>
      </div>
    </div>
  );
}

