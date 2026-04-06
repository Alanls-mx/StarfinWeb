import { Bell, CreditCard, Download, Key, Package, Settings, Shield, Trash2, X, Plus, Server, Globe, Check, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getMyLicenses, resendVerification, getMySettings, updateMySettings, updateMyProfile, updateMyPassword, getMyNotifications, readAllNotifications, getMyPayments, getPluginConfig, updatePluginConfig, updateMyAllowedIp, regenerateMyLicense, listMyServers, createServer, updateServer, deleteServer, assignPluginToServer, unassignPluginFromServer, getPlans, type PurchasedPlugin, type ServerRecord } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export function Dashboard() {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { addItem } = useCart();
  const token = state.status === 'authenticated' ? state.token : null;
  const user = state.status === 'authenticated' ? state.user : null;

  const [licenses, setLicenses] = useState<PurchasedPlugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Servidores
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [serverCreating, setServerCreating] = useState(false);
  const [serverName, setServerName] = useState('');
  const [newServerIps, setNewServerIps] = useState('');

  // Estados para Modais
  const [activeModal, setActiveModal] = useState<'settings' | 'payments' | 'notifications' | 'config' | 'server' | 'plans' | 'password' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [subscribing, setSubscribing] = useState(false);
  const [tempIp, setTempIp] = useState('');
  const [ipSaving, setIpSaving] = useState(false);
  const [globalLicenseKey, setGlobalLicenseKey] = useState('');

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    getPlans()
      .then(data => setAvailablePlans(data.items))
      .catch(console.error);
  }, []);

  const handleSubscribe = async (plan: any) => {
    if (!token) return;
    
    addItem({
      id: plan.id,
      name: plan.name,
      price: plan.priceCents || 4990, // Use priceCents from plan or fallback
      slug: plan.id,
      type: 'plan'
    });
    
    toast.success(`Plano ${plan.name} adicionado ao carrinho!`);
    navigate('/checkout');
  };
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    avatarUrl: '',
    bio: '',
    discordId: '',
    githubUrl: '',
    twitterUrl: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get('status');
    const orderId = searchParams.get('order');

    if (status === 'success') {
      toast.success('Pagamento realizado com sucesso! Suas licenças já estão disponíveis.');
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'pending') {
      toast.info('Seu pagamento está em processamento.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const openServerModal = (server: ServerRecord | null) => {
    setActiveModal('server');
    setModalData(server || { id: '', name: '', ips: [], plugins: [] });
    setServerName(server?.name || '');
    setNewServerIps(server?.ips.join(', ') || '');
  };

  const saveServer = async () => {
    if (!token) return;
    setModalLoading(true);
    try {
      const ips = newServerIps.split(',').map(s => s.trim()).filter(Boolean);
      if (modalData.id) {
        await updateServer(token, modalData.id, { name: serverName, ips });
        toast.success('Servidor atualizado com sucesso!');
      } else {
        await createServer(token, { name: serverName, ips });
        toast.success('Servidor criado com sucesso!');
      }
      const updated = await listMyServers(token);
      setServers(updated.items);
      setActiveModal(null);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar servidor.');
    } finally {
      setModalLoading(false);
    }
  };

  const deleteServerClick = async (id: string) => {
    if (!token || !confirm('Tem certeza que deseja excluir este servidor?')) return;
    setLoading(true);
    try {
      await deleteServer(token, id);
      const updated = await listMyServers(token);
      setServers(updated.items);
      toast.success('Servidor excluído com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir servidor.');
    } finally {
      setLoading(false);
    }
  };

  const togglePluginOnServer = async (serverId: string, pluginId: number, currentStatus: boolean) => {
    if (!token) return;
    setModalLoading(true);
    try {
      if (currentStatus) {
        await unassignPluginFromServer(token, serverId, pluginId);
        toast.success('Plugin removido do servidor!');
      } else {
        await assignPluginToServer(token, serverId, pluginId);
        toast.success('Plugin atribuído ao servidor!');
      }
      const updated = await listMyServers(token);
      setServers(updated.items);
      const updatedServer = updated.items.find(s => s.id === serverId);
      if (updatedServer) setModalData(updatedServer);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar plugin no servidor.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!token) return;
    setProfileSaving(true);
    try {
      await updateMyProfile(token, profileData);
      toast.success('Perfil atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const stats = useMemo(() => {
    const pluginsCount = licenses.length;
    const licensesActive = licenses.filter((l) => l.status === 'Ativo').length;
    const serversCount = servers.length;
    return { pluginsCount, licensesActive, serversCount };
  }, [licenses, servers]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [licRes, settingsRes, serversRes] = await Promise.all([
          getMyLicenses(token), 
          getMySettings(token),
          listMyServers(token)
        ]);
        if (cancelled) return;
        setLicenses(licRes.items);
        setServers(serversRes.items);
        setTempIp(settingsRes.allowedIp || '');
        setGlobalLicenseKey(settingsRes.licenseKey || '');
        setProfileData({
          avatarUrl: settingsRes.avatarUrl || '',
          bio: settingsRes.bio || '',
          discordId: settingsRes.discordId || '',
          githubUrl: settingsRes.githubUrl || '',
          twitterUrl: settingsRes.twitterUrl || ''
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const openSettings = async () => {
    if (!token) return;
    setActiveModal('settings');
    setModalLoading(true);
    try {
      const settings = await getMySettings(token);
      setModalData(settings);
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const openPayments = async () => {
    if (!token) return;
    setActiveModal('payments');
    setModalLoading(true);
    try {
      const payments = await getMyPayments(token);
      setModalData(payments);
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const openNotifications = async () => {
    if (!token) return;
    setActiveModal('notifications');
    setModalLoading(true);
    try {
      const notifs = await getMyNotifications(token);
      setModalData(notifs);
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  const openConfig = async (pluginId: number) => {
    if (!token) return;
    setActiveModal('config');
    setModalLoading(true);
    try {
      const config = await getPluginConfig(token, pluginId);
      setModalData(config);
      setTempIp(config.allowedIp || '');
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  if (state.status !== 'authenticated') {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-10 text-center">
            <h1 className="text-4xl sm:text-5xl mb-4">Minha Conta</h1>
            <p className="text-gray-400 text-lg mb-8">Entre para gerenciar suas licenças, downloads e chaves de API.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-xl hover:shadow-[#7B2CBF]/50 transition-all duration-300"
            >
              Entrar
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl sm:text-5xl">Minha Conta</h1>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[#7B2CBF]/20 text-[#C77DFF] text-xs font-bold rounded-full border border-[#7B2CBF]/30 uppercase tracking-wider">
                  {user?.plan || 'Free'}
                </span>
                {user?.role === 'admin' && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30 uppercase tracking-wider">
                    Administrador
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-lg">
              Gerencie seus plugins, licenças, integrações e configurações
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-white font-medium">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {user?.verified === false ? (
          <div className="mb-8 bg-[#1A1A22]/60 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-white mb-1">Confirme seu email</div>
                <div className="text-sm text-gray-400">
                  Para liberar compras e integrações, confirme seu email.
                </div>
                {verificationSent ? <div className="text-sm text-emerald-400 mt-2">Email enviado.</div> : null}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    await resendVerification(user.email);
                    setVerificationSent(true);
                    toast.success('E-mail de verificação enviado!');
                  } catch (e) {
                    console.error(e);
                    toast.error('Erro ao reenviar e-mail.');
                  }
                }}
                className="px-5 py-3 bg-white text-[#0B0B0F] rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                Reenviar verificação
              </motion.button>
            </div>
          </div>
        ) : null}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Package, label: 'Plugins Comprados', value: String(stats.pluginsCount), color: 'from-[#7B2CBF] to-[#9D4EDD]' },
            { icon: Server, label: 'Servidores Ativos', value: String(stats.serversCount), color: 'from-[#9D4EDD] to-[#C77DFF]' },
            { icon: Key, label: 'Licenças Ativas', value: String(stats.licensesActive), color: 'from-[#5A189A] to-[#7B2CBF]' },
            { 
              icon: Shield, 
              label: user?.plan || 'Free', 
              value: 'Plano', 
              color: 'from-[#3C096C] to-[#5A189A]',
              onClick: () => setActiveModal('plans')
            }
          ].map((stat, index) => (
            <div
              key={index}
              onClick={stat.onClick}
              className={`relative bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6 hover:border-[#7B2CBF]/50 transition-all duration-300 overflow-hidden group ${stat.onClick ? 'cursor-pointer' : ''}`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300 rounded-full`}></div>
              <div className="relative">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Global License Section */}
        <div className="mb-12 bg-gradient-to-r from-[#7B2CBF]/10 to-[#9D4EDD]/10 border border-[#7B2CBF]/30 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Key className="w-6 h-6 text-[#C77DFF]" />
                <h2 className="text-2xl font-semibold text-white">Chave de Licença Principal</h2>
              </div>
              <p className="text-gray-400 mb-6 max-w-2xl">
                Esta é a sua chave global. Use-a em seus plugins para validação automática. 
                Você pode configurar IPs específicos para cada servidor abaixo.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-auto flex-1 max-w-md">
                  <div className="relative group">
                    <code className="block w-full px-6 py-4 bg-[#0B0B0F]/80 border border-[#7B2CBF]/30 rounded-xl text-[#C77DFF] font-mono text-lg shadow-inner group-hover:border-[#7B2CBF]/60 transition-all">
                      {globalLicenseKey || 'Gerando...'}
                    </code>
                    <button 
                      onClick={() => {
                        if (globalLicenseKey) {
                          navigator.clipboard.writeText(globalLicenseKey);
                        }
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
                      title="Copiar"
                    >
                      <Download className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (!token || !confirm('Tem certeza? Suas chaves antigas pararão de funcionar imediatamente.')) return;
                    try {
                      const res = await regenerateMyLicense(token);
                      setGlobalLicenseKey(res.licenseKey);
                      setLicenses(prev => prev.map(l => ({ ...l, licenseKey: res.licenseKey })));
                      toast.success('Chave de licença regenerada com sucesso!');
                    } catch (e) {
                      console.error(e);
                      toast.error('Erro ao regenerar chave.');
                    }
                  }}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all text-sm font-medium"
                >
                  Regenerar Chave
                </button>
              </div>
            </div>

            <div className="lg:w-72 p-6 bg-[#0B0B0F]/40 rounded-xl border border-[#7B2CBF]/20">
              <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold mb-3">IP Global (Opcional)</label>
              <div className="space-y-3">
                <input 
                  value={tempIp}
                  onChange={(e) => setTempIp(e.target.value)}
                  placeholder="0.0.0.0"
                  className="w-full px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white font-mono text-sm focus:border-[#7B2CBF] outline-none transition-all"
                />
                <button 
                  disabled={ipSaving}
                  onClick={async () => {
                    if (!token) return;
                    setIpSaving(true);
                    try {
                      await updateMyAllowedIp(token, tempIp || null);
                      toast.success('IP global atualizado!');
                    } catch (e) {
                      console.error(e);
                      toast.error('Erro ao salvar IP.');
                    } finally {
                      setIpSaving(false);
                    }
                  }}
                  className="w-full py-3 bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                  {ipSaving ? 'Salvando...' : 'Salvar IP'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Servers Management Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-[#C77DFF]" />
              <h2 className="text-2xl font-semibold text-white">Meus Servidores</h2>
            </div>
            <button
              onClick={() => openServerModal(null)}
              className="px-4 py-2 bg-[#7B2CBF] hover:bg-[#9D4EDD] text-white rounded-lg flex items-center gap-2 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Novo Servidor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6 hover:border-[#7B2CBF]/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">{server.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openServerModal(server)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteServerClick(server.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">IPs Autorizados ({server.ips.length}/3)</label>
                    <div className="flex flex-wrap gap-2">
                      {server.ips.length > 0 ? (
                        server.ips.map((ip, i) => (
                          <span key={i} className="px-2 py-1 bg-[#7B2CBF]/10 border border-[#7B2CBF]/20 rounded text-[10px] text-[#C77DFF] font-mono">
                            {ip}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-600 italic">Nenhum IP configurado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-1">Plugins Atribuídos</label>
                    <div className="flex flex-wrap gap-2">
                      {server.plugins.length > 0 ? (
                        server.plugins.map((pid) => {
                          const plugin = licenses.find(l => l.pluginId === pid);
                          return (
                            <span key={pid} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400">
                              {plugin?.name || `Plugin #${pid}`}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-gray-600 italic">Nenhum plugin atribuído</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {servers.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-[#7B2CBF]/10 rounded-2xl">
                <Server className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400">Você ainda não criou nenhum servidor.</p>
                <button
                  onClick={() => openServerModal(null)}
                  className="mt-4 text-[#C77DFF] hover:text-white transition-colors text-sm font-medium"
                >
                  Criar meu primeiro servidor
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Plugins Comprados */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">Meus Plugins</h2>
                <Link
                  to="/plugins"
                  className="px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 text-sm"
                >
                  Comprar Mais
                </Link>
              </div>

              <div className="space-y-4">
                {(loading ? [] : licenses).map((plugin) => (
                  <div
                    key={plugin.id}
                    className="p-5 bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10 hover:border-[#7B2CBF]/30 transition-all duration-300 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg text-white mb-1 group-hover:text-[#C77DFF] transition-colors duration-300">
                          {plugin.name}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                          <span>Versão {plugin.version}</span>
                          <span>•</span>
                          <span>Comprado em {new Date(plugin.purchaseDateISO).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/40">
                          {plugin.status}
                        </span>
                        <button
                          onClick={() => openConfig(plugin.pluginId)}
                          className="p-2 bg-[#7B2CBF]/20 text-[#C77DFF] rounded-lg hover:bg-[#7B2CBF]/30 transition-all duration-300"
                          aria-label="Configurar plugin"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <Link
                          to={`/plugins/${plugin.pluginId}`}
                          className="p-2 bg-[#7B2CBF]/20 text-[#C77DFF] rounded-lg hover:bg-[#7B2CBF]/30 transition-all duration-300"
                          aria-label="Ver detalhes"
                        >
                          <Download className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Downloads Recentes */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <h2 className="text-2xl mb-6">Downloads Recentes</h2>

              <div className="space-y-3">
                {licenses.length > 0 ? (
                  licenses.slice(0, 5).map((plugin) => (
                    <div
                      key={plugin.id}
                      className="flex items-center justify-between p-4 bg-[#0B0B0F]/30 rounded-lg border border-[#7B2CBF]/10 hover:border-[#7B2CBF]/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{plugin.name}</div>
                          <div className="text-[10px] text-gray-500">Versão {plugin.version} • {new Date(plugin.purchaseDateISO).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500">2.4 MB</span>
                        <Link
                          to={`/download/${plugin.pluginId}`}
                          className="p-2 bg-[#7B2CBF]/10 text-[#C77DFF] rounded-lg hover:bg-[#7B2CBF]/20 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 italic text-sm">
                    Nenhum download disponível. Adquira plugins para vê-los aqui.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#C77DFF] flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="text-lg text-white mb-1">{user?.name}</h3>
                  <p className="text-sm text-gray-400">{user?.plan === 'Premium' ? 'Premium Member' : 'Free Member'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={openSettings}
                  className="w-full flex items-center gap-3 p-3 bg-[#0B0B0F]/50 rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-left group"
                >
                  <Settings className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Configurações
                  </span>
                </button>

                <button
                  onClick={openPayments}
                  className="w-full flex items-center gap-3 p-3 bg-[#0B0B0F]/50 rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-left group"
                >
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Pagamento
                  </span>
                </button>

                <button
                  onClick={openNotifications}
                  className="w-full flex items-center gap-3 p-3 bg-[#0B0B0F]/50 rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-left group"
                >
                  <Bell className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Notificações
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPasswordForm({ current: '', new: '', confirm: '' });
                    setActiveModal('password');
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-[#0B0B0F]/50 rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-left group"
                >
                  <Lock className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Mudar Senha
                  </span>
                </button>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-[#7B2CBF]/20 to-[#9D4EDD]/20 border border-[#7B2CBF]/30 rounded-lg hover:from-[#7B2CBF]/30 hover:to-[#9D4EDD]/30 transition-all duration-300 text-left group"
                  >
                    <Shield className="w-5 h-5 text-[#C77DFF] group-hover:text-white transition-colors duration-300" />
                    <span className="text-sm text-[#C77DFF] group-hover:text-white transition-colors duration-300 font-medium">
                      Painel Admin
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <h3 className="text-lg mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Link
                  to="/plugins"
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 text-sm flex justify-center"
                >
                  Explorar Plugins
                </Link>
                <button className="w-full px-4 py-3 bg-transparent border border-[#7B2CBF]/40 text-white rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-sm">
                  Suporte
                </button>
                <button className="w-full px-4 py-3 bg-transparent border border-[#7B2CBF]/40 text-white rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-sm">
                  Documentação
                </button>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-[#7B2CBF]/20 to-[#3C096C]/20 backdrop-blur-sm border border-[#7B2CBF]/30 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-[#7B2CBF] flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg text-white mb-2">Precisa de Ajuda?</h3>
              <p className="text-sm text-gray-400 mb-4">
                Nossa equipe está disponível 24/7 para ajudar você
              </p>
              <button className="w-full px-4 py-2 bg-white text-[#0B0B0F] rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm">
                Abrir Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Genérico */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#13131A] border border-[#7B2CBF]/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#7B2CBF]/10">
                <h3 className="text-xl text-white font-medium capitalize">
                  {activeModal === 'settings' ? 'Configurações da Conta' :
                   activeModal === 'payments' ? 'Histórico de Pagamentos' :
                   activeModal === 'notifications' ? 'Notificações' : 
                   activeModal === 'server' ? 'Gerenciar Servidor' : 
                   activeModal === 'password' ? 'Alterar Senha' : 'Configuração do Plugin'}
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {modalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeModal === 'plans' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {availablePlans.map((plan) => (
                          <div 
                            key={plan.id}
                            className={`relative p-6 rounded-2xl border transition-all ${
                              user?.plan === plan.name 
                                ? 'bg-[#7B2CBF]/10 border-[#7B2CBF] ring-1 ring-[#7B2CBF]' 
                                : 'bg-[#1A1A22]/40 border-[#7B2CBF]/20 hover:border-[#7B2CBF]/50'
                            }`}
                          >
                            {user?.plan === plan.name && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#7B2CBF] text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                                Plano Atual
                              </div>
                            )}
                            <div className="mb-4">
                              <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                              <div className="text-2xl font-bold text-[#C77DFF]">{plan.price}</div>
                            </div>
                            <ul className="space-y-3 mb-8">
                              {plan.features.map((feature: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                              {plan.grantsAllPlugins && (
                                <li className="flex items-start gap-2 text-sm text-[#C77DFF] font-medium">
                                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <span>Acesso a TODOS os plugins</span>
                                </li>
                              )}
                            </ul>
                            <button
                              disabled={user?.plan === plan.name || subscribing}
                              onClick={() => handleSubscribe(plan.id)}
                              className={`w-full py-3 rounded-xl font-bold transition-all ${
                                user?.plan === plan.name
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                  : 'bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white hover:shadow-lg hover:shadow-[#7B2CBF]/30'
                              } disabled:opacity-50`}
                            >
                              {user?.plan === plan.name ? 'Ativo' : subscribing ? 'Processando...' : 'Assinar Agora'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeModal === 'settings' && modalData && (
                      <div className="space-y-6">
                        {/* Seção de Perfil */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-[#C77DFF] uppercase tracking-wider">Perfil Público</h4>
                          <div className="flex gap-4 items-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-[#7B2CBF]/20 border border-[#7B2CBF]/40 flex items-center justify-center overflow-hidden">
                              {profileData.avatarUrl ? (
                                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <Globe className="w-8 h-8 text-[#C77DFF]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">URL do Avatar</label>
                              <input
                                value={profileData.avatarUrl}
                                onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-3 py-2 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-lg text-xs text-white outline-none focus:border-[#7B2CBF]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Biografia</label>
                            <textarea
                              value={profileData.bio}
                              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                              placeholder="Conte um pouco sobre você..."
                              className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white text-sm focus:border-[#7B2CBF] outline-none transition-all resize-none h-24"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Discord ID</label>
                              <input
                                value={profileData.discordId}
                                onChange={(e) => setProfileData({ ...profileData, discordId: e.target.value })}
                                placeholder="usuario#0000"
                                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white text-sm outline-none focus:border-[#7B2CBF]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">GitHub</label>
                              <input
                                value={profileData.githubUrl}
                                onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                                placeholder="github.com/usuario"
                                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white text-sm outline-none focus:border-[#7B2CBF]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Seção de Conta */}
                        <div className="space-y-4 pt-6 border-t border-[#7B2CBF]/10">
                          <h4 className="text-sm font-semibold text-[#C77DFF] uppercase tracking-wider">Dados da Conta</h4>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Nome de Exibição</label>
                            <input
                              defaultValue={modalData.name}
                              className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Email</label>
                            <input
                              defaultValue={modalData.email}
                              disabled
                              className="w-full px-4 py-3 bg-[#0B0B0F]/50 border border-[#7B2CBF]/10 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-[#0B0B0F] rounded-xl border border-[#7B2CBF]/10">
                            <div>
                              <div className="text-white">Segurança (2FA)</div>
                              <div className="text-xs text-gray-400">Ative a autenticação em duas etapas</div>
                            </div>
                            <button className="px-4 py-2 bg-[#7B2CBF]/20 text-[#C77DFF] rounded-lg text-sm">Ativar</button>
                          </div>
                        </div>

                        <button 
                          onClick={handleProfileUpdate}
                          disabled={profileSaving}
                          className="w-full py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                        >
                          {profileSaving ? 'Salvando...' : 'Salvar Todas as Alterações'}
                        </button>
                      </div>
                    )}

                    {activeModal === 'payments' && modalData && (
                      <div className="space-y-3">
                        {modalData.map((pay: any) => (
                          <div key={pay.id} className="p-4 bg-[#0B0B0F] rounded-xl border border-[#7B2CBF]/10 flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium">{pay.pluginName}</div>
                              <div className="text-xs text-gray-500">{new Date(pay.dateISO).toLocaleDateString()} • {pay.method}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[#C77DFF]">R$ {(pay.amountCents / 100).toFixed(2)}</div>
                              <div className="text-[10px] text-emerald-400 uppercase tracking-wider">{pay.status}</div>
                            </div>
                          </div>
                        ))}
                        {modalData.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum pagamento encontrado.</p>}
                      </div>
                    )}

                    {activeModal === 'notifications' && modalData && (
                      <div className="space-y-3">
                        {modalData.map((n: any) => (
                          <div key={n.id} className="p-4 bg-[#0B0B0F] rounded-xl border border-[#7B2CBF]/10">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-2 h-2 rounded-full bg-[#7B2CBF]"></div>
                              <div className="text-white font-medium">{n.title}</div>
                            </div>
                            <div className="text-sm text-gray-400 ml-5">{n.message}</div>
                            <div className="text-[10px] text-gray-600 ml-5 mt-2">{new Date(n.createdISO).toLocaleString()}</div>
                          </div>
                        ))}
                        <button
                          onClick={async () => {
                            if (!token) return;
                            try {
                              await readAllNotifications(token);
                              toast.success('Todas as notificações foram lidas.');
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setActiveModal(null);
                            }
                          }}
                          className="w-full py-3 border border-[#7B2CBF]/30 text-white rounded-xl text-sm hover:bg-[#7B2CBF]/10 transition-all"
                        >
                          Marcar todas como lidas
                        </button>
                      </div>
                    )}

                    {activeModal === 'server' && modalData && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Nome do Servidor</label>
                            <input
                              value={serverName}
                              onChange={(e) => setServerName(e.target.value)}
                              placeholder="Ex: Servidor de Survival"
                              className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">IPs Autorizados (Até 3, separados por vírgula)</label>
                            <input
                              value={newServerIps}
                              onChange={(e) => setNewServerIps(e.target.value)}
                              placeholder="Ex: 127.0.0.1, 192.168.1.1"
                              className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">O plugin só funcionará em requisições vindas destes IPs.</p>
                          </div>
                        </div>

                        {modalData.id && (
                          <div className="pt-6 border-t border-[#7B2CBF]/10">
                            <label className="block text-sm text-gray-400 mb-4">Gerenciar Plugins do Servidor</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {licenses.map((license) => {
                                const isAssigned = modalData.plugins.includes(license.pluginId);
                                return (
                                  <button
                                    key={license.pluginId}
                                    onClick={() => togglePluginOnServer(modalData.id, license.pluginId, isAssigned)}
                                    className={`p-4 rounded-xl border flex items-center justify-between transition-all group ${
                                      isAssigned 
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white' 
                                        : 'bg-[#0B0B0F] border-[#7B2CBF]/10 text-gray-400 hover:border-[#7B2CBF]/30'
                                    }`}
                                  >
                                    <div className="flex flex-col items-start">
                                      <span className="text-sm font-medium">{license.name}</span>
                                      <span className="text-[10px] opacity-60">ID #{license.pluginId}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isAssigned ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'
                                    }`}>
                                      {isAssigned && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {licenses.length === 0 && (
                              <p className="text-center text-gray-500 text-sm py-4 italic">Você não possui plugins comprados.</p>
                            )}
                          </div>
                        )}

                        <div className="pt-6">
                          <button
                            onClick={saveServer}
                            disabled={!serverName.trim()}
                            className="w-full py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                          >
                            {modalData.id ? 'Salvar Alterações' : 'Criar Servidor'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeModal === 'password' && (
                      <div className="space-y-6">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3">
                          <Shield className="w-5 h-5 text-blue-400 shrink-0" />
                          <div className="text-xs text-blue-300 leading-relaxed">
                            Para sua segurança, escolha uma senha forte com pelo menos 8 caracteres, incluindo letras e números.
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Senha Atual</label>
                            <input
                              type="password"
                              value={passwordForm.current}
                              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                              placeholder="••••••••"
                              className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Nova Senha</label>
                              <input
                                type="password"
                                value={passwordForm.new}
                                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Confirmar Nova Senha</label>
                              <input
                                type="password"
                                value={passwordForm.confirm}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            disabled={passwordSaving || !passwordForm.new || passwordForm.new !== passwordForm.confirm || passwordForm.new.length < 8}
                            onClick={async () => {
                              if (!token) return;
                              setPasswordSaving(true);
                              try {
                                await updateMyPassword(token, {
                                  currentPassword: passwordForm.current,
                                  newPassword: passwordForm.new
                                });
                                toast.success('Senha alterada com sucesso!');
                                setActiveModal(null);
                              } catch (e: any) {
                                toast.error(e.message || 'Erro ao alterar senha.');
                              } finally {
                                setPasswordSaving(false);
                              }
                            }}
                            className="w-full py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                          >
                            {passwordSaving ? 'Alterando...' : 'Confirmar Alteração'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeModal === 'config' && modalData && (
                      <div className="space-y-6">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <div className="text-emerald-400 text-sm font-medium mb-1">Download Seguro</div>
                          <div className="text-xs text-gray-400">Sua licença está ativa e vinculada ao seu HWID e IP.</div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">HWID Vinculado</label>
                              <div className="flex gap-2">
                                <code className="flex-1 px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white font-mono text-sm overflow-hidden text-ellipsis">
                                  {modalData.hwid}
                                </code>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">IP Autorizado</label>
                              <div className="flex gap-2">
                                <input
                                  value={tempIp}
                                  onChange={(e) => setTempIp(e.target.value)}
                                  placeholder="0.0.0.0"
                                  className="flex-1 px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white font-mono text-sm outline-none focus:border-[#7B2CBF] transition-all"
                                />
                                <button
                                  disabled={ipSaving || tempIp === modalData.allowedIp}
                                  onClick={async () => {
                                    if (!token) return;
                                    setIpSaving(true);
                                    try {
                                      await updateMyAllowedIp(token, tempIp || null);
                                      setModalData({ ...modalData, allowedIp: tempIp });
                                      toast.success('IP do plugin atualizado!');
                                    } catch (e) {
                                      console.error(e);
                                      toast.error('Erro ao salvar IP.');
                                    } finally {
                                      setIpSaving(false);
                                    }
                                  }}
                                  className="px-4 py-2 bg-[#7B2CBF]/20 text-[#C77DFF] rounded-xl text-sm hover:bg-[#7B2CBF]/30 transition-all disabled:opacity-50"
                                >
                                  {ipSaving ? '...' : 'Salvar'}
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1">O plugin só funcionará requisições vindas deste IP.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Versão Atual</label>
                              <div className="px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white text-sm">
                                {modalData.version}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">ID do Plugin</label>
                              <div className="px-4 py-3 bg-[#0B0B0F] border border-[#7B2CBF]/20 rounded-xl text-white text-sm">
                                #{modalData.pluginId}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#7B2CBF]/10">
                            <a
                              href={modalData.jarUrl}
                              className="w-full py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all"
                            >
                              <Download className="w-5 h-5" />
                              Baixar .JAR (v{modalData.version})
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
