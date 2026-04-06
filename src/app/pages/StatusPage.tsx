import { ShieldAlert, ShieldCheck, ShieldMinus } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { getSystemStatus, type StatusComponent } from '../lib/api';

function StatusIcon({ status }: { status: StatusComponent['status'] }) {
  if (status === 'operational') return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
  if (status === 'degraded') return <ShieldMinus className="w-5 h-5 text-amber-400" />;
  return <ShieldAlert className="w-5 h-5 text-red-400" />;
}

export function StatusPage() {
  const [items, setItems] = useState<StatusComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSystemStatus();
        if (!cancelled) setItems(res.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Status do Sistema</h1>
          <p className="text-gray-400 text-lg">Disponibilidade do site, API e autenticação.</p>
        </div>

        <div className="space-y-4">
          {(loading ? Array.from({ length: 3 }).map(() => null) : items).map((item, idx) => {
            if (!item) {
              return (
                <div key={idx} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-[#0B0B0F]/30 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-[#0B0B0F]/20 rounded w-2/3"></div>
                </div>
              );
            }

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.12) }}
                className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-6 hover:border-[#7B2CBF]/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon status={item.status} />
                      <div className="text-white text-lg">{item.name}</div>
                    </div>
                    <div className="text-sm text-gray-400">{item.message}</div>
                  </div>
                  <div className="text-xs text-gray-500">{new Date(item.updatedISO).toLocaleString('pt-BR')}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

