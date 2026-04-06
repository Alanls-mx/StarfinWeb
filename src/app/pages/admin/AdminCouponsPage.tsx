import { Plus, Search, Ticket, Trash2, X, Check, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminCreateCoupon, adminDeleteCoupon, adminListCoupons, adminUpdateCoupon } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminCouponsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 10,
    minPurchase: 0,
    expiresAt: '',
    maxUses: 100,
    active: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminListCoupons(token)
      .then(res => setCoupons(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const created = await adminCreateCoupon(token, {
        ...newCoupon,
        expiresAt: newCoupon.expiresAt || null,
        minPurchase: newCoupon.minPurchase || null,
        maxUses: newCoupon.maxUses || null
      });
      setCoupons(prev => [created.item, ...prev]);
      setIsCreating(false);
      setNewCoupon({ code: '', discountType: 'percentage', discountValue: 10, minPurchase: 0, expiresAt: '', maxUses: 100, active: true });
    } catch (e) {
      console.error(e);
      alert('Erro ao criar cupom. Verifique os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Excluir este cupom?')) return;
    try {
      await adminDeleteCoupon(token, id);
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (coupon: any) => {
    if (!token) return;
    try {
      const updated = await adminUpdateCoupon(token, coupon.id, { active: !coupon.active });
      setCoupons(prev => prev.map(c => c.id === updated.item.id ? updated.item : c));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cupons de Desconto</h1>
          <p className="text-gray-400">Gerencie códigos promocionais e descontos para o checkout.</p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Cupom
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#7B2CBF]/10 bg-[#7B2CBF]/5">
                <th className="p-4 text-sm font-medium text-gray-400">Código</th>
                <th className="p-4 text-sm font-medium text-gray-400">Desconto</th>
                <th className="p-4 text-sm font-medium text-gray-400">Uso</th>
                <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="p-4 text-sm font-medium text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7B2CBF]/5">
              {coupons.map(coupon => (
                <tr key={coupon.id} className="hover:bg-[#7B2CBF]/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-[#C77DFF]" />
                      </div>
                      <div className="font-mono font-bold text-white tracking-wider">{coupon.code}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-white font-medium">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `R$ ${(coupon.discountValue/100).toFixed(2)}`}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-tighter">
                      Mínimo: R$ {(coupon.minPurchase/100 || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-white">{coupon.usedCount || 0} / {coupon.maxUses || '∞'}</div>
                    <div className="w-24 h-1 bg-[#0B0B0F] rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-[#7B2CBF]" 
                        style={{ width: `${Math.min(((coupon.usedCount || 0) / (coupon.maxUses || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleStatus(coupon)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 transition-all ${
                        coupon.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-gray-500">
                    Nenhum cupom cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                  <Ticket className="w-5 h-5 text-[#C77DFF]" />
                  Criar Novo Cupom
                </h3>
                <button onClick={() => setIsCreating(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Código do Cupom</label>
                  <input
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all font-mono uppercase font-bold"
                    placeholder="EX: STARFIN10"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tipo de Desconto</label>
                    <select
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (BRL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Valor do Desconto</label>
                    <input
                      type="number"
                      value={newCoupon.discountValue}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      required
                    />
                    <span className="text-[10px] text-gray-500">
                      {newCoupon.discountType === 'percentage' ? 'Valor entre 1 e 100' : 'Valor em centavos (ex: 1000 = R$ 10,00)'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Mínimo de Compra</label>
                    <input
                      type="number"
                      value={newCoupon.minPurchase}
                      onChange={(e) => setNewCoupon({ ...newCoupon, minPurchase: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Limite de Usos</label>
                    <input
                      type="number"
                      value={newCoupon.maxUses}
                      onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Expira em (Opcional)</label>
                  <input
                    type="date"
                    value={newCoupon.expiresAt}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
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
                    {saving ? 'Criando...' : 'Criar Cupom'}
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
