import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminListPurchases, adminUpdatePurchase, type Purchase } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminPurchasesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<Purchase[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const res = await adminListPurchases(token);
      if (!cancelled) setItems(res.items);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center text-gray-400">Faça login como admin para acessar.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl mb-6">Compras</h1>
        <div className="space-y-4">
          {items.map((p) => (
            <div key={p.id} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-white">Compra {p.id}</div>
                  <div className="text-sm text-gray-400">
                    userId: {p.userId} • pluginId: {p.pluginId}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(p.createdISO).toLocaleString('pt-BR')} • status: {p.status}
                    {p.licenseKey ? ` • licença: ${p.licenseKey}` : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      await adminUpdatePurchase(token, p.id, 'approved');
                      const res = await adminListPurchases(token);
                      setItems(res.items);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprovar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      await adminUpdatePurchase(token, p.id, 'cancelled');
                      const res = await adminListPurchases(token);
                      setItems(res.items);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-500/40 text-white rounded-lg hover:bg-red-500/10 transition-all duration-300 text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </motion.button>
                </div>
              </div>
            </div>
          ))}
          {!items.length ? <div className="text-sm text-gray-500">Nenhuma compra ainda.</div> : null}
        </div>
      </div>
    </div>
  );
}

