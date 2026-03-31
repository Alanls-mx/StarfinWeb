import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { adminAddCategory, adminDeleteCategory, adminListCategories, type PluginCategory } from '../../lib/api';

export function AdminCategoriesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<PluginCategory[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const res = await adminListCategories(token);
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-6">Categorias</h1>

        <div className="flex items-center gap-3 mb-6">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nova categoria"
            className="flex-1 px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!newName.trim()}
            onClick={async () => {
              await adminAddCategory(token, newName.trim() as any);
              const res = await adminListCategories(token);
              setItems(res.items);
              setNewName('');
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </motion.button>
        </div>

        <div className="space-y-3">
          {items.map((c) => (
            <div key={c} className="flex items-center justify-between p-4 bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-lg">
              <div className="text-white">{c}</div>
              <button
                onClick={async () => {
                  await adminDeleteCategory(token, c);
                  const res = await adminListCategories(token);
                  setItems(res.items);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-500/40 text-white rounded-lg hover:bg-red-500/10 transition-all duration-300 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

