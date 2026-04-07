import { Edit2, PackagePlus, Search, User, X, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  adminAssignPluginToUser,
  adminListPlans,
  adminListPlugins,
  adminListUserPlugins,
  adminRemovePluginFromUser,
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  type AdminUserPluginAssignment,
  type UserProfile
} from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';

type AdminUserDraft = Partial<UserProfile> & {
  password?: string;
  planDurationDays?: number | null;
};

function getRemainingPlanDays(planExpiresAt?: string | null): number | null {
  if (!planExpiresAt) return null;
  const target = new Date(planExpiresAt).getTime();
  if (!Number.isFinite(target)) return null;
  const diff = target - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function AdminUsersPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUserDraft | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState<AdminUserDraft>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    plan: 'Free',
    permissions: []
  });
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [plugins, setPlugins] = useState<{ id: number; name: string }[]>([]);
  const [managingUser, setManagingUser] = useState<UserProfile | null>(null);
  const [userPlugins, setUserPlugins] = useState<AdminUserPluginAssignment[]>([]);
  const [pluginsLoading, setPluginsLoading] = useState(false);
  const [assignPluginId, setAssignPluginId] = useState('');
  const [assigningPlugin, setAssigningPlugin] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    // Load users and plans in parallel
    Promise.all([
      getAdminUsers(token),
      adminListPlans(token),
      adminListPlugins(token)
    ]).then(([usersRes, plansRes, pluginsRes]) => {
      setUsers(usersRes.items || []);
      setPlans(plansRes.items || []);
      setPlugins((pluginsRes.items || []).map((p) => ({ id: Number(p.id), name: String(p.name) })).filter((p) => Number.isFinite(p.id)));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;
    setSaving(true);
    try {
      const normalizedDurationDays =
        editingUser.planDurationDays === null || editingUser.planDurationDays === undefined
          ? undefined
          : Number(editingUser.planDurationDays);

      const dataToSave: AdminUserDraft = {
        ...editingUser,
        permissions: editingUser.permissions || [],
        planDurationDays: Number.isFinite(normalizedDurationDays as number)
          ? Math.max(0, Math.floor(normalizedDurationDays as number))
          : undefined
      };
      const updated = await updateAdminUser(token, editingUser.id, dataToSave);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      toast.success('Usuário atualizado com sucesso!');
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const normalizedDurationDays =
        newUser.planDurationDays === null || newUser.planDurationDays === undefined
          ? undefined
          : Number(newUser.planDurationDays);

      const payload: AdminUserDraft = {
        ...newUser,
        planDurationDays: Number.isFinite(normalizedDurationDays as number)
          ? Math.max(0, Math.floor(normalizedDurationDays as number))
          : undefined
      };

      const created = await createAdminUser(token, payload);
      setUsers(prev => [created, ...prev]);
      toast.success('Usuário criado com sucesso!');
      setIsCreating(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', plan: 'Free', permissions: [] });
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await deleteAdminUser(token, id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuário excluído com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir usuário.');
    }
  };

  const openPluginManager = async (user: UserProfile) => {
    if (!token) return;
    setManagingUser(user);
    setAssignPluginId('');
    setPluginsLoading(true);
    try {
      const payload = await adminListUserPlugins(token, user.id);
      setUserPlugins(payload.items || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar plugins do usuário.');
    } finally {
      setPluginsLoading(false);
    }
  };

  const handleAssignPlugin = async () => {
    if (!token || !managingUser) return;
    const pluginId = Number(assignPluginId);
    if (!Number.isFinite(pluginId) || pluginId <= 0) {
      toast.error('Selecione um plugin válido.');
      return;
    }

    setAssigningPlugin(true);
    try {
      const payload = await adminAssignPluginToUser(token, managingUser.id, pluginId);
      setUserPlugins((prev) => {
        const exists = prev.some((p) => p.pluginId === payload.item.pluginId);
        return exists ? prev.map((p) => (p.pluginId === payload.item.pluginId ? payload.item : p)) : [payload.item, ...prev];
      });
      setAssignPluginId('');
      toast.success('Plugin atribuído com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atribuir plugin.');
    } finally {
      setAssigningPlugin(false);
    }
  };

  const handleRemovePlugin = async (pluginId: number) => {
    if (!token || !managingUser) return;
    if (!window.confirm('Remover este plugin do usuário?')) return;
    try {
      await adminRemovePluginFromUser(token, managingUser.id, pluginId);
      setUserPlugins((prev) => prev.filter((p) => p.pluginId !== pluginId));
      toast.success('Plugin removido com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover plugin.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Usuários</h1>
          <p className="text-gray-400">Gerencie permissões, cargos e dados dos usuários do sistema.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Usuário
          </button>
        </div>
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
                  <th className="p-4 text-sm font-medium text-gray-400">Usuário</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Cargo</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Plano</th>
                  <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="p-4 text-sm font-medium text-gray-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#7B2CBF]/5">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[#7B2CBF]/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF] flex items-center justify-center text-white font-bold">
                          {(user.name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium flex items-center">
                            {user.name}
                            {(user as any).banned && (
                              <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded border border-red-500/20 uppercase tracking-tighter">
                                Banido
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                          {user.phone && <div className="text-[10px] text-gray-600">{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                        user.role === 'staff' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                        user.role === 'premium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/10'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.plan === 'Premium' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {user.verified ? (
                        <span className="text-emerald-400 text-xs flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Verificado
                        </span>
                      ) : (
                        <span className="text-amber-400 text-xs flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
	                        <button 
	                          onClick={() => openPluginManager(user)}
	                          className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
	                          title="Gerenciar plugins do usuário"
	                        >
	                          <PackagePlus className="w-4 h-4" />
	                        </button>
	                        <button 
	                          onClick={() =>
	                            setEditingUser({
	                              ...user,
                              planDurationDays: getRemainingPlanDays(user.planExpiresAt)
                            })
                          }
                          className="p-2 text-gray-400 hover:text-[#C77DFF] hover:bg-[#7B2CBF]/10 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <AnimatePresence>       {(editingUser || isCreating) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setEditingUser(null); setIsCreating(false); }}
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
                  {isCreating ? <Plus className="w-5 h-5 text-[#C77DFF]" /> : <User className="w-5 h-5 text-[#C77DFF]" />}
                  {isCreating ? 'Novo Usuário' : 'Editar Usuário'}
                </h3>
                <button onClick={() => { setEditingUser(null); setIsCreating(false); }} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={isCreating ? handleCreate : handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nome Completo</label>
                    <input
                      value={isCreating ? newUser.name : editingUser?.name}
                      onChange={(e) => isCreating ? setNewUser({ ...newUser, name: e.target.value }) : setEditingUser({ ...editingUser!, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      value={isCreating ? newUser.email : editingUser?.email}
                      onChange={(e) => isCreating ? setNewUser({ ...newUser, email: e.target.value }) : setEditingUser({ ...editingUser!, email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {isCreating && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Senha Provisória</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                    <input
                      value={(isCreating ? newUser.phone : editingUser?.phone) || ''}
                      placeholder="(00) 00000-0000"
                      onChange={(e) => isCreating ? setNewUser({ ...newUser, phone: e.target.value }) : setEditingUser({ ...editingUser!, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Cargo / Role</label>
                    <select
                      value={isCreating ? newUser.role : editingUser?.role || 'user'}
                      onChange={(e) => isCreating ? setNewUser({ ...newUser, role: e.target.value as any }) : setEditingUser({ ...editingUser!, role: e.target.value as any })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    >
                      <option value="user">Usuário Comum</option>
                      <option value="premium">Premium</option>
                      <option value="staff">Staff / Equipe</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Plano</label>
                    <select
                      value={isCreating ? newUser.plan : editingUser?.plan}
                      onChange={(e) => isCreating ? setNewUser({ ...newUser, plan: e.target.value as any }) : setEditingUser({ ...editingUser!, plan: e.target.value as any })}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    >
                      <option value="Free">Gratuito (Free)</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Expiração do Plano</label>
                    <input
                      type="date"
                      value={(isCreating ? newUser.planExpiresAt : editingUser?.planExpiresAt)?.toString().slice(0, 10) || ''}
                      onChange={(e) => {
                        const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                        if (isCreating) {
                          setNewUser({ ...newUser, planExpiresAt: val as any, planDurationDays: undefined });
                        } else {
                          setEditingUser({ ...editingUser!, planExpiresAt: val as any, planDurationDays: undefined });
                        }
                      }}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Duracao (dias)</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ex: 30"
                      value={isCreating ? (newUser.planDurationDays ?? '') : (editingUser?.planDurationDays ?? '')}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) {
                          if (isCreating) {
                            setNewUser({ ...newUser, planDurationDays: undefined });
                          } else {
                            setEditingUser({ ...editingUser!, planDurationDays: undefined });
                          }
                          return;
                        }

                        const days = Math.max(0, Math.floor(Number(raw)));
                        if (isCreating) {
                          setNewUser({ ...newUser, planDurationDays: days, planExpiresAt: null });
                        } else {
                          setEditingUser({ ...editingUser!, planDurationDays: days, planExpiresAt: null });
                        }
                      }}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
                    <p className="mt-2 text-xs text-gray-500">Ao preencher os dias, a expiracao e calculada automaticamente.</p>
                  </div>
                </div>

                {!isCreating && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <input
                      type="checkbox"
                      id="banned"
                      checked={editingUser?.banned || false}
                      onChange={(e) => setEditingUser({ ...editingUser!, banned: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 bg-[#0B0B0F]"
                    />
                    <label htmlFor="banned" className="text-sm font-medium text-red-400 cursor-pointer">
                      Banir conta (O usuário não poderá fazer login)
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Permissões (Separadas por vírgula)</label>
                  <input
                    value={(isCreating ? newUser.permissions?.join(', ') : editingUser?.permissions?.join(', ')) || ''}
                    placeholder="*, read:all, write:docs"
                    onChange={(e) => {
                      const perms = e.target.value.split(',').map(p => p.trim()).filter(Boolean);
                      isCreating ? setNewUser({ ...newUser, permissions: perms }) : setEditingUser({ ...editingUser!, permissions: perms });
                    }}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditingUser(null); setIsCreating(false); }}
                    className="flex-1 py-3 bg-[#1A1A22] text-white rounded-xl font-medium border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : isCreating ? 'Criar Usuário' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {managingUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManagingUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#13131A] border border-[#7B2CBF]/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#7B2CBF]/10">
                <div>
                  <h3 className="text-xl text-white font-medium flex items-center gap-2">
                    <PackagePlus className="w-5 h-5 text-[#C77DFF]" />
                    Plugins do Usuário
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{managingUser.name} • {managingUser.email}</p>
                </div>
                <button onClick={() => setManagingUser(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <select
                    value={assignPluginId}
                    onChange={(e) => setAssignPluginId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                  >
                    <option value="">Selecione um plugin para atribuir</option>
                    {plugins.map((plugin) => (
                      <option key={plugin.id} value={String(plugin.id)}>
                        {plugin.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignPlugin}
                    disabled={assigningPlugin || !assignPluginId}
                    className="px-5 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                  >
                    {assigningPlugin ? 'Atribuindo...' : 'Atribuir plugin'}
                  </button>
                </div>

                <div className="bg-[#0B0B0F]/60 border border-[#7B2CBF]/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#7B2CBF]/10 text-sm text-gray-400">
                    Plugins já atribuídos ({userPlugins.length})
                  </div>
                  {pluginsLoading ? (
                    <div className="p-6 text-sm text-gray-500">Carregando plugins do usuário...</div>
                  ) : userPlugins.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">Nenhum plugin atribuído manualmente.</div>
                  ) : (
                    <div className="divide-y divide-[#7B2CBF]/10">
                      {userPlugins.map((item) => (
                        <div key={`${item.pluginId}-${item.purchaseId}`} className="px-4 py-3 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm text-white font-medium">{item.pluginName}</div>
                            <div className="text-[11px] text-gray-500">
                              Licença: {item.licenseKey || 'Pendente'} • Status: {item.status}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePlugin(item.pluginId)}
                            className="px-3 py-2 text-xs bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg hover:bg-red-500/20 transition-all"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
