import { Plus, Save, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import {
  adminCreatePlugin,
  adminDeletePlugin,
  adminListCategories,
  adminListPlugins,
  adminUpdatePlugin,
  type PluginCategory,
  type PluginSummary
} from '../../lib/api';

export function AdminPluginsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<PluginSummary[]>([]);
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      setLoading(true);
      try {
        const [pl, cat] = await Promise.all([adminListPlugins(token), adminListCategories(token)]);
        if (cancelled) return;
        setItems(pl.items);
        setCategories(cat.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl">Plugins</h1>
            <p className="text-sm text-gray-400">Crie, edite e exclua plugins</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={creating}
            onClick={async () => {
              setCreating(true);
              try {
                const detail = await adminCreatePlugin(token, {
                  name: 'Novo Plugin',
                  description: 'Descrição do novo plugin',
                  category: categories[0] ?? 'Gameplay',
                  tags: ['Novo'],
                  mcVersion: '1.20.x',
                  imageUrl:
                    'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&h=300&fit=crop',
                  priceDisplay: 'R$ 19,90'
                });
                const pl = await adminListPlugins(token);
                setItems(pl.items);
              } finally {
                setCreating(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Plugin
          </motion.button>
        </div>

        <div className="space-y-6">
          {(loading ? [] : items).map((p) => (
            <div key={p.id} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Nome</label>
                  <input
                    defaultValue={p.name}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (value && value !== p.name) {
                        await adminUpdatePlugin(token, p.id, { name: value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Categoria</label>
                  <select
                    defaultValue={p.category}
                    onChange={async (e) => {
                      await adminUpdatePlugin(token, p.id, { category: e.target.value as any });
                    }}
                    className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm text-gray-400">Descrição</label>
                  <textarea
                    defaultValue={p.description}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (value && value !== p.description) {
                        await adminUpdatePlugin(token, p.id, { description: value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white min-h-24"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Imagem (URL)</label>
                  <input
                    defaultValue={p.imageUrl}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (value && value !== p.imageUrl) {
                        await adminUpdatePlugin(token, p.id, { imageUrl: value, screenshots: [value] });
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Preço</label>
                  <input
                    defaultValue={p.priceDisplay}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (value && value !== p.priceDisplay) {
                        await adminUpdatePlugin(token, p.id, { priceDisplay: value });
                      }
                    }}
                    className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await adminUpdatePlugin(token, p.id, { lastUpdateISO: new Date().toISOString() });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#0B0B0F] rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Salvar meta
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await adminDeletePlugin(token, p.id);
                    const pl = await adminListPlugins(token);
                    setItems(pl.items);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-500/40 text-white rounded-lg hover:bg-red-500/10 transition-all duration-300 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

