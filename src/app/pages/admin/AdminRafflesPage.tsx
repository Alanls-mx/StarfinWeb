import { Gift, Loader2, Plus, Shuffle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  adminCreateRaffle,
  adminDeleteRaffle,
  adminDrawRaffle,
  adminListRaffles,
  adminUpdateRaffle,
  type AdminRaffle
} from '../../lib/api';
import { useAuth } from '../../lib/auth';

const eligibilityLabel: Record<AdminRaffle['eligibility'], string> = {
  all_users: 'Todos os usuários',
  approved_buyers: 'Compradores aprovados',
  premium_users: 'Usuários premium'
};

export function AdminRafflesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<AdminRaffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawingId, setDrawingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    prize: '',
    eligibility: 'approved_buyers' as AdminRaffle['eligibility']
  });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminListRaffles(token)
      .then((res) => setItems(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const res = await adminCreateRaffle(token, form);
      setItems((prev) => [res.item, ...prev]);
      setForm({ title: '', description: '', prize: '', eligibility: 'approved_buyers' });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(item: AdminRaffle) {
    if (!token || item.status === 'drawn') return;
    const nextStatus: AdminRaffle['status'] = item.status === 'open' ? 'closed' : 'open';
    try {
      const res = await adminUpdateRaffle(token, item.id, { status: nextStatus });
      setItems((prev) => prev.map((r) => (r.id === item.id ? res.item : r)));
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !window.confirm('Excluir sorteio?')) return;
    try {
      await adminDeleteRaffle(token, id);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDraw(id: string) {
    if (!token) return;
    setDrawingId(id);
    try {
      const res = await adminDrawRaffle(token, id);
      alert(`Vencedor: ${res.winner?.name || 'Não encontrado'} (${res.winner?.email || '-'})`);
      setItems((prev) => prev.map((r) => (r.id === id ? res.raffle : r)));
    } catch (error: any) {
      alert(error?.message || 'Falha ao sortear');
    } finally {
      setDrawingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sistema de Sorteio</h1>
        <p className="text-gray-400">Crie sorteios, defina elegibilidade e realize o sorteio de forma auditável no painel.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Título</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Prêmio</label>
          <input
            value={form.prize}
            onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))}
            className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Elegibilidade</label>
          <select
            value={form.eligibility}
            onChange={(e) => setForm((f) => ({ ...f, eligibility: e.target.value as AdminRaffle['eligibility'] }))}
            className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF]"
          >
            <option value="approved_buyers">Compradores aprovados</option>
            <option value="premium_users">Usuários premium</option>
            <option value="all_users">Todos os usuários</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-400 mb-2">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white outline-none focus:border-[#7B2CBF] min-h-24"
          />
        </div>
        <div className="md:col-span-2">
          <button
            disabled={saving}
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar Sorteio
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#C77DFF]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description || 'Sem descrição'}</p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                    item.status === 'drawn'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : item.status === 'open'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#0B0B0F]/50 rounded-lg p-3">
                  <p className="text-gray-500 mb-1">Prêmio</p>
                  <p className="font-medium">{item.prize || '-'}</p>
                </div>
                <div className="bg-[#0B0B0F]/50 rounded-lg p-3">
                  <p className="text-gray-500 mb-1">Participantes</p>
                  <p className="font-medium">{item.entrantsCount}</p>
                </div>
                <div className="bg-[#0B0B0F]/50 rounded-lg p-3 col-span-2">
                  <p className="text-gray-500 mb-1">Elegibilidade</p>
                  <p className="font-medium">{eligibilityLabel[item.eligibility]}</p>
                </div>
                <div className="bg-[#0B0B0F]/50 rounded-lg p-3 col-span-2">
                  <p className="text-gray-500 mb-1">Vencedor</p>
                  <p className="font-medium">{item.winnerName || '-'}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(item)}
                  disabled={item.status === 'drawn'}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#7B2CBF]/15 border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/25 disabled:opacity-50"
                >
                  {item.status === 'open' ? 'Fechar sorteio' : 'Reabrir sorteio'}
                </button>
                <button
                  onClick={() => handleDraw(item.id)}
                  disabled={item.status !== 'open' || drawingId === item.id}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500/25 disabled:opacity-50"
                >
                  {drawingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shuffle className="w-3 h-3" />}
                  Sortear vencedor
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-500/20 hover:bg-red-500/25"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full bg-[#1A1A22]/20 border border-dashed border-[#7B2CBF]/15 rounded-2xl p-16 text-center text-gray-500">
              <Gift className="w-8 h-8 mx-auto mb-3 text-[#C77DFF]" />
              Nenhum sorteio criado até o momento.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
