
import { Plus, Trash2, Edit2, Shield, Check, X, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { adminListPlans, adminCreatePlan, adminUpdatePlan, adminDeletePlan } from '../../lib/api';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  active: boolean;
  grantsAllPlugins: boolean;
}

export function AdminPlansPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: '',
    price: '',
    features: [],
    active: true,
    grantsAllPlugins: false
  });
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    if (!token) return;
    try {
      const res = await adminListPlans(token);
      setPlans(res.items || []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar planos');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPlan) return;
    setSaving(true);
    try {
      await adminUpdatePlan(token, editingPlan.id, editingPlan);
      toast.success('Plano atualizado com sucesso!');
      fetchPlans();
      setEditingPlan(null);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await adminCreatePlan(token, newPlan);
      toast.success('Plano criado com sucesso!');
      fetchPlans();
      setIsCreating(false);
      setNewPlan({ name: '', price: '', features: [], active: true, grantsAllPlugins: false });
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      await adminDeletePlan(token, id);
      toast.success('Plano excluído com sucesso!');
      fetchPlans();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir plano');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Planos</h1>
          <p className="text-gray-400">Gerencie os planos de assinatura disponíveis para os usuários.</p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/40 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#C77DFF]" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="p-2 text-gray-400 hover:text-[#C77DFF] hover:bg-[#7B2CBF]/10 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
            <div className="text-2xl font-bold text-[#C77DFF] mb-4">{plan.price}</div>

            <div className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#7B2CBF]/10 flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${plan.active ? 'text-emerald-400' : 'text-red-400'}`}>
                {plan.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(editingPlan || isCreating) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setEditingPlan(null); setIsCreating(false); }}
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
                  <CreditCard className="w-5 h-5 text-[#C77DFF]" />
                  {isCreating ? 'Novo Plano' : 'Editar Plano'}
                </h3>
                <button onClick={() => { setEditingPlan(null); setIsCreating(false); }} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={isCreating ? handleCreate : handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nome do Plano</label>
                  <input
                    value={isCreating ? newPlan.name : editingPlan?.name}
                    onChange={(e) => isCreating ? setNewPlan({ ...newPlan, name: e.target.value }) : setEditingPlan({ ...editingPlan!, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Preço (Ex: R$ 49,90/mês)</label>
                  <input
                    value={isCreating ? newPlan.price : editingPlan?.price}
                    onChange={(e) => isCreating ? setNewPlan({ ...newPlan, price: e.target.value }) : setEditingPlan({ ...editingPlan!, price: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Vantagens (Uma por linha)</label>
                  <textarea
                    value={isCreating ? (newPlan.features || []).join('\n') : (editingPlan?.features || []).join('\n')}
                    onChange={(e) => {
                      const features = e.target.value.split('\n').filter(f => f.trim());
                      isCreating ? setNewPlan({ ...newPlan, features }) : setEditingPlan({ ...editingPlan!, features });
                    }}
                    rows={5}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all resize-none"
                    placeholder="Vantagem 1&#10;Vantagem 2..."
                    required
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="planActive"
                    checked={isCreating ? newPlan.active : editingPlan?.active}
                    onChange={(e) => isCreating ? setNewPlan({ ...newPlan, active: e.target.checked }) : setEditingPlan({ ...editingPlan!, active: e.target.checked })}
                    className="w-5 h-5 rounded border-[#7B2CBF]/30 text-[#7B2CBF] focus:ring-[#7B2CBF] bg-[#0B0B0F]"
                  />
                  <label htmlFor="planActive" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Plano Ativo (Disponível para seleção)
                  </label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-[#7B2CBF]/5 border border-[#7B2CBF]/20 rounded-xl">
                  <input
                    type="checkbox"
                    id="grantsAllPlugins"
                    checked={isCreating ? newPlan.grantsAllPlugins : editingPlan?.grantsAllPlugins}
                    onChange={(e) => isCreating ? setNewPlan({ ...newPlan, grantsAllPlugins: e.target.checked }) : setEditingPlan({ ...editingPlan!, grantsAllPlugins: e.target.checked })}
                    className="w-5 h-5 rounded border-[#7B2CBF]/30 text-[#7B2CBF] focus:ring-[#7B2CBF] bg-[#0B0B0F]"
                  />
                  <label htmlFor="grantsAllPlugins" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Concede acesso a TODOS os plugins automaticamente
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditingPlan(null); setIsCreating(false); }}
                    className="flex-1 py-3 bg-[#1A1A22] text-white rounded-xl font-medium border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : isCreating ? 'Criar Plano' : 'Salvar Alterações'}
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
