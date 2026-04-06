import { Edit2, Search, Shield, User, X, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { getAdminUsers, updateAdminUser, deleteAdminUser, createAdminUser, adminListPlans, type UserProfile } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { toast } from 'sonner';

export function AdminUsersPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserProfile> & { password?: string }>({
    name: '',
    email: '',
    password: '',
    role: 'user',
    plan: 'Free',
    permissions: []
  });
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    // Load users and plans in parallel
    Promise.all([
      getAdminUsers(token),
      adminListPlans(token)
    ]).then(([usersRes, plansRes]) => {
      setUsers(usersRes.items || []);
      setPlans(plansRes.items || []);
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
      // Create a shallow copy and remove undefined/null fields if necessary, 
      // but ensure permissions is a proper array
      const dataToSave = {
        ...editingUser,
        permissions: editingUser.permissions || []
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
      const created = await createAdminUser(token, newUser);
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
                          onClick={() => setEditingUser(user)}
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
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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
                        isCreating ? setNewUser({ ...newUser, planExpiresAt: val as any }) : setEditingUser({ ...editingUser!, planExpiresAt: val as any });
                      }}
                      className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
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
    </div>
  );
}
