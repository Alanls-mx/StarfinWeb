import { Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminUpdateStatus, getSystemStatus, type StatusComponent } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminStatusPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<StatusComponent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getSystemStatus();
      if (!cancelled) setItems(res.items);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!token) {
    return (
      <div className="text-center text-gray-400 py-20">Faça login como admin para acessar.</div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Status do Sistema</h1>
        <p className="text-sm text-gray-400">Gerencie o estado operacional dos serviços do site.</p>
      </div>

      <div className="max-w-5xl">
        <div className="space-y-4">
          {items.map((s) => (
            <div key={s.id} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6">
              <div className="text-white text-lg mb-4">{s.name}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="text-sm text-gray-400">
                  Status
                  <select
                    value={s.status}
                    onChange={(e) => {
                      const next = items.map((x) => (x.id === s.id ? { ...x, status: e.target.value as any } : x));
                      setItems(next);
                    }}
                    className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                  >
                    <option value="operational">operational</option>
                    <option value="degraded">degraded</option>
                    <option value="down">down</option>
                  </select>
                </label>
                <label className="md:col-span-2 text-sm text-gray-400">
                  Mensagem
                  <input
                    value={s.message}
                    onChange={(e) => {
                      const next = items.map((x) => (x.id === s.id ? { ...x, message: e.target.value } : x));
                      setItems(next);
                    }}
                    className="mt-2 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                  />
                </label>
              </div>
              <div className="mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await adminUpdateStatus(token, s.id, { status: s.status, message: s.message });
                    const res = await getSystemStatus();
                    setItems(res.items);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

