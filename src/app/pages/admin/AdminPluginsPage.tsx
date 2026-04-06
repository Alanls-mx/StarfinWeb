import { Plus, Save, Trash2, Package, Globe, Tag, DollarSign, Link, Layers, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';
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

  const handleUpdate = async (id: string, data: Partial<PluginSummary>) => {
    if (!token) return;
    try {
      await adminUpdatePlugin(token, id, data);
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
      toast.success('Plugin atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar plugin.');
    }
  };

  if (!token) {
    return (
      <div className="text-center text-gray-400 py-20">
        Faça login como admin para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Plugins</h1>
          <p className="text-sm text-gray-400">Crie, edite e gerencie os plugins do marketplace.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={creating}
          onClick={async () => {
            setCreating(true);
            try {
              const res = await adminCreatePlugin(token, {
                name: 'Novo Plugin',
                slug: 'novo-plugin-' + Math.floor(Math.random() * 1000),
                description: 'Descrição do novo plugin',
                category: categories[0] ?? 'Gameplay',
                price: 1990,
                platform: 'Bukkit',
                latestVersion: '1.0.0',
                imageUrl: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&h=300&fit=crop',
                featured: false
              });
              const pl = await adminListPlugins(token);
              setItems(pl.items);
            } finally {
              setCreating(false);
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all duration-300 text-sm"
        >
          <Plus className="w-5 h-5" />
          Novo Plugin
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {items.map((p) => (
            <div key={p.id} className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              {/* Header do Card */}
              <div className="p-6 border-b border-[#7B2CBF]/10 bg-[#7B2CBF]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-[#C77DFF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {p.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdate(p.id, { featured: !p.featured })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                      p.featured ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                    }`}
                  >
                    {p.featured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    DESTAQUE
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Excluir este plugin permanentemente?')) return;
                      await adminDeletePlugin(token, p.id);
                      setItems(prev => prev.filter(item => item.id !== p.id));
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Corpo do Card */}
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna 1: Informações Básicas */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[#C77DFF] text-xs font-bold uppercase tracking-wider mb-4">
                    <Globe className="w-4 h-4" /> Informações Básicas
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 ml-1">Nome do Plugin (Exibição)</label>
                    <input
                      defaultValue={p.name}
                      onBlur={(e) => handleUpdate(p.id, { name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 ml-1">Nome para Licença (StarfinLicense)</label>
                    <input
                      defaultValue={p.licenseName || ''}
                      placeholder="Ex: StarfinEconomy"
                      onBlur={(e) => handleUpdate(p.id, { licenseName: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 ml-1">Slug (URL)</label>
                    <input
                      defaultValue={p.slug}
                      onBlur={(e) => handleUpdate(p.id, { slug: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 ml-1">Categoria</label>
                      <select
                        defaultValue={p.category}
                        onChange={(e) => handleUpdate(p.id, { category: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 ml-1">Plataforma</label>
                      <select
                        defaultValue={p.platform || 'Bukkit'}
                        onChange={(e) => handleUpdate(p.id, { platform: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      >
                        <option value="Bukkit">Bukkit/Spigot</option>
                        <option value="Bungee">BungeeCord</option>
                        <option value="Velocity">Velocity</option>
                        <option value="Universal">Universal</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Arquivos e Versões */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[#C77DFF] text-xs font-bold uppercase tracking-wider mb-4">
                    <Tag className="w-4 h-4" /> Versão e Arquivos
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 ml-1">Versão Atual</label>
                      <input
                        defaultValue={p.latestVersion || ''}
                        placeholder="Ex: 1.5.2"
                        onBlur={(e) => handleUpdate(p.id, { latestVersion: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-gray-500 ml-1">Preço (Cents)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          defaultValue={p.price}
                          onBlur={(e) => handleUpdate(p.id, { price: Number(e.target.value) })}
                          className="w-full pl-9 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 ml-1">JAR URL (Download Direto)</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        defaultValue={p.jarUrl || ''}
                        placeholder="https://..."
                        onBlur={(e) => handleUpdate(p.id, { jarUrl: e.target.value })}
                        className="w-full pl-9 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 ml-1">Dependências (JSON Array)</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                      <textarea
                        defaultValue={JSON.stringify(p.dependencies)}
                        onBlur={(e) => {
                          try {
                            const deps = JSON.parse(e.target.value);
                            if (Array.isArray(deps)) handleUpdate(p.id, { dependencies: deps });
                          } catch (err) {
                            alert('Formato de dependências inválido. Use ["dep1", "dep2"]');
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all font-mono text-xs min-h-[85px]"
                        placeholder='["Vault", "PlaceholderAPI"]'
                      />
                    </div>
                  </div>
                </div>

                {/* Coluna 3: Visual e Descrição */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-[#C77DFF] text-xs font-bold uppercase tracking-wider mb-4">
                    <Package className="w-4 h-4" /> Visual e Conteúdo
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 ml-1">Imagem Principal (Banner)</label>
                    <input
                      defaultValue={p.imageUrl || ''}
                      onBlur={(e) => handleUpdate(p.id, { imageUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 ml-1">Descrição do Plugin</label>
                    <textarea
                      defaultValue={p.description}
                      onBlur={(e) => handleUpdate(p.id, { description: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-[145px] text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="py-20 text-center text-gray-500 bg-[#1A1A22]/20 border border-dashed border-[#7B2CBF]/20 rounded-2xl">
              Nenhum plugin encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

