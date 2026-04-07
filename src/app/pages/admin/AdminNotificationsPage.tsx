import { Bell, Plus, Search, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminCreateNotification, adminDeleteNotification, adminListNotifications, type AdminNotification } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const typeLabel: Record<AdminNotification['type'], string> = {
  manual: 'Manual',
  sale: 'Vendas',
  support: 'Atendimento',
  raffle: 'Sorteio'
};

const typeClass: Record<AdminNotification['type'], string> = {
  manual: 'bg-[#7B2CBF]/15 text-[#C77DFF] border border-[#7B2CBF]/30',
  sale: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  support: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  raffle: 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
};

const priorityClass: Record<AdminNotification['priority'], string> = {
  low: 'text-gray-400',
  normal: 'text-gray-300',
  high: 'text-red-300'
};

export function AdminNotificationsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminListNotifications(token)
      .then((payload) => setNotifications(payload.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = notifications.filter((n) => {
    const text = `${n.title} ${n.message} ${n.source || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const created = await adminCreateNotification(token, {
        title: newNotification.title,
        message: newNotification.message,
        type: 'manual',
        source: 'admin_manual'
      });
      setNotifications((prev) => [created.item, ...prev]);
      setIsCreating(false);
      setNewNotification({ title: '', message: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Excluir esta notificação?')) return;
    try {
      await adminDeleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notificações do Admin</h1>
          <p className="text-gray-400">Acompanhe eventos automáticos de vendas e atendimento, e envie alertas manuais.</p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Notificação
        </button>
      </div>

      <div className="relative w-full md:w-[420px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, mensagem ou origem"
          className="w-full pl-11 pr-4 py-2.5 bg-[#1A1A22]/60 border border-[#7B2CBF]/10 rounded-xl text-sm text-white focus:border-[#7B2CBF]/50 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 backdrop-blur-sm group hover:border-[#7B2CBF]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#C77DFF]" />
                </div>
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${typeClass[notif.type]}`}>
                  {typeLabel[notif.type]}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${priorityClass[notif.priority]}`}>
                  {notif.priority}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{notif.title}</h3>
              <p className="text-sm text-gray-400 mb-5 line-clamp-3">{notif.message}</p>

              <div className="pt-4 border-t border-[#7B2CBF]/10 text-xs text-gray-500 flex items-center justify-between gap-3">
                <span className="truncate">{notif.source || 'sem origem'}</span>
                <span>{new Date(notif.createdISO).toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 bg-[#1A1A22]/20 border border-dashed border-[#7B2CBF]/10 rounded-2xl">
              Nenhuma notificação encontrada.
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#13131A] border border-[#7B2CBF]/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#7B2CBF]/10">
                <h3 className="text-xl text-white font-medium flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#C77DFF]" />
                  Nova Notificação Manual
                </h3>
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Título</label>
                  <input
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Mensagem</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-32"
                    required
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 bg-[#1A1A22] text-white rounded-xl font-medium border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Enviando...' : 'Enviar Agora'}
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
