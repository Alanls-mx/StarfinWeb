import { CheckCircle, Clock, Edit2, Search, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminListPurchases, adminUpdatePurchase } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminPurchasesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const res = await adminListPurchases(token);
      if (!cancelled) setItems(res.items);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const filtered = items.filter(i => 
    i.id.toLowerCase().includes(search.toLowerCase()) || 
    i.userId.toLowerCase().includes(search.toLowerCase()) ||
    i.licenseKey?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingItem) return;
    setSaving(true);
    try {
      await adminUpdatePurchase(token, editingItem.id, editingItem);
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...editingItem } : i));
      setEditingItem(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center text-gray-400 py-20">Faça login como admin para acessar.</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vendas e Licenças</h1>
          <p className="text-gray-400">Gerencie pedidos, chaves de licença e IPs autorizados.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por ID, Usuário ou Chave..."
            className="w-full pl-12 pr-4 py-3 bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF] transition-all"
          />
        </div>
      </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl overflow-x-auto backdrop-blur-sm">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#7B2CBF]/5 border-b border-[#7B2CBF]/10">
                  <th className="p-4 text-sm font-medium text-gray-400">ID / Data</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Usuário / Plugin</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Chave de Licença</th>
                  <th className="p-4 text-sm font-medium text-gray-400">IP Autorizado</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="p-4 text-sm font-medium text-gray-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7B2CBF]/5">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-[#7B2CBF]/5 transition-colors">
                    <td className="p-4">
                      <div className="text-white text-xs font-mono">{item.id}</div>
                      <div className="text-[10px] text-gray-500">{new Date(item.createdISO).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white text-sm">{item.userId}</div>
                      <div className="text-xs text-[#C77DFF]">Plugin #{item.pluginId}</div>
                    </td>
                    <td className="p-4">
                      <code className="text-xs text-gray-400 bg-[#0B0B0F] px-2 py-1 rounded">{item.licenseKey || '---'}</code>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-400">{item.allowedIp || 'Não vinculado'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : 
                         item.status === 'cancelled' ? <XCircle className="w-3 h-3" /> : 
                         <Clock className="w-3 h-3" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-2 text-gray-400 hover:text-[#C77DFF] hover:bg-[#7B2CBF]/10 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <AnimatePresence>       {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#13131A] border border-[#7B2CBF]/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#7B2CBF]/10">
                <h3 className="text-xl text-white font-medium">Editar Licença</h3>
                <button onClick={() => setEditingItem(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Status da Compra</label>
                  <select
                    value={editingItem.status}
                    onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none"
                  >
                    <option value="pending">Pendente</option>
                    <option value="approved">Aprovada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Chave de Licença</label>
                  <input
                    value={editingItem.licenseKey || ''}
                    onChange={e => setEditingItem({ ...editingItem, licenseKey: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white font-mono text-sm focus:border-[#7B2CBF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">IP Autorizado (Deixe vazio para qualquer IP)</label>
                  <input
                    value={editingItem.allowedIp || ''}
                    placeholder="Ex: 192.168.1.1"
                    onChange={e => setEditingItem({ ...editingItem, allowedIp: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white font-mono text-sm focus:border-[#7B2CBF] outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-2">O plugin só iniciará se o IP do servidor coincidir com este valor.</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">HWID Vinculado</label>
                  <div className="flex gap-2">
                    <input
                      value={editingItem.hwid || ''}
                      disabled
                      className="flex-1 px-4 py-3 bg-[#0B0B0F]/50 border border-[#7B2CBF]/10 rounded-xl text-gray-500 font-mono text-xs"
                    />
                    <button 
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, hwid: null })}
                      className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs hover:bg-red-500/20 transition-all"
                    >
                      Resetar
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-3 bg-[#1A1A22] text-white rounded-xl font-medium border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

