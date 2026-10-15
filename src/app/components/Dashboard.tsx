import { Bell, CreditCard, Download, Key, Package, Settings, Shield, Trash2, X, Plus, Server, Globe, Check, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { getMyLicenses, resendVerification, getMySettings, updateMyProfile, updateMyPassword, getMyNotifications, getPluginConfig, listMyServers, createServer, updateServer, deleteServer, assignPluginToServer, unassignPluginFromServer, getPlans, type PurchasedPlugin, type ServerRecord } from '../lib/api';
import { useAuth } from '../lib/auth';

export function Dashboard() {
  const navigate = useNavigate();
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const user = state.status === 'authenticated' ? state.user : null;

  const [licenses, setLicenses] = useState<PurchasedPlugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
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

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    getPlans()
      .then(data => setAvailablePlans(data.items))
      .catch(console.error);
  }, []);

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

    if (status || orderId) {
      navigate(`/account/orders${orderId ? `?order=${encodeURIComponent(orderId)}` : ''}`, { replace: true });
    }
  }, [navigate]);

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
    setLoadError('');
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
        setProfileData({
          avatarUrl: settingsRes.avatarUrl || '',
          bio: settingsRes.bio || '',
          discordId: settingsRes.discordId || '',
          githubUrl: settingsRes.githubUrl || '',
          twitterUrl: settingsRes.twitterUrl || ''
        });
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar sua conta.');
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
    } catch (e) {
      console.error(e);
    } finally {
      setModalLoading(false);
    }
  };

  if (state.status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-[#0b1715] pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="overflow-hidden rounded-[2rem] border border-[#b7efbd] bg-[#e9f9e8] text-[#11291b] sm:grid sm:grid-cols-[1fr_230px]">
            <div className="p-8 sm:p-10"><p className="sf-eyebrow !text-[#147a58]">Seu espaço Starfin</p><h1 className="mt-3 mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Minha Conta</h1>
            <p className="mb-8 text-base leading-7 text-[#4e6955]">Entre para gerenciar suas licenças, plugins e servidores em um só lugar.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="sf-button-primary"
            >
              Entrar
            </motion.button>
            </div>
            <div className="relative hidden min-h-65 bg-[#bcefd0] sm:block"><img src="/voxel/engineer.webp" alt="Personagem voxel apresentando a área da conta" className="absolute inset-x-0 -bottom-5 h-[115%] w-full object-contain object-bottom" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1715] pt-27 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-8 min-h-[470px] overflow-hidden rounded-[2rem] bg-[linear-gradient(115deg,#dcf9ce,#7ce5ce)] p-7 text-[#11291b] sm:min-h-[280px] sm:p-10">
          <div aria-hidden="true" className="sf-grid absolute inset-0 opacity-70" />
          <div className="relative z-10 max-w-full sm:max-w-[60%]">
            <p className="sf-eyebrow !text-[#126c53]">Painel do jogador</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Minha Conta</h1>
              <div className="flex gap-2">
                <span className="rounded-full border border-[#5bbd88] bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#13573a]">
                  {user?.plan || 'Free'}
                </span>
                {user?.role === 'admin' && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30 uppercase tracking-wider">
                    Administrador
                  </span>
                )}
              </div>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#385e49] sm:text-base">Bem-vindo de volta, {user?.name?.split(' ')[0]}. Seus plugins, licenças e servidores estão aqui.</p>
            <div className="mt-6 hidden text-xs font-semibold text-[#32624c] sm:block">{user?.email}</div>
          </div>
          <img src="/voxel/engineer.webp" alt="Personagem voxel mostrando a gestão da conta" className="absolute -right-4 bottom-0 h-[45%] w-[62%] object-contain object-bottom sm:right-2 sm:-bottom-10 sm:h-[105%] sm:w-[42%]" />
        </div>

        {user?.verified === false ? (
          <div className="mb-8 bg-[#172822]/60 border border-amber-500/30 rounded-2xl p-6">
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
                className="px-5 py-3 bg-white text-[#0B1715] rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                Reenviar verificação
              </motion.button>
            </div>
          </div>
        ) : null}

        <nav aria-label="Seções da conta" className="mb-8 flex flex-wrap gap-2 rounded-xl border border-[#315647] bg-[#152a22] p-2 text-sm">
          <Link to="/account/licenses" className="rounded-lg px-4 py-2 font-semibold text-[#d5f2df] hover:bg-[#2a4b37]">Licenças</Link>
          <a href="#servidores" className="rounded-lg px-4 py-2 font-semibold text-[#d5f2df] hover:bg-[#2a4b37]">Servidores</a>
          <a href="#plugins" className="rounded-lg px-4 py-2 font-semibold text-[#d5f2df] hover:bg-[#2a4b37]">Plugins</a>
          <Link to="/account/orders" className="rounded-lg px-4 py-2 font-semibold text-[#d5f2df] hover:bg-[#2a4b37]">Pedidos</Link>
          <button type="button" onClick={openSettings} className="rounded-lg px-4 py-2 font-semibold text-[#d5f2df] hover:bg-[#2a4b37]">Perfil</button>
        </nav>

        {loadError && <p role="alert" className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{loadError}</p>}

        {/* Stats Cards */}
        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Package, label: 'Plugins na conta', value: String(stats.pluginsCount), tone: 'bg-[#e8f8df]', onClick: () => document.getElementById('plugins')?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: Server, label: 'Servidores cadastrados', value: String(stats.serversCount), tone: 'bg-[#d9f4ee]', onClick: () => document.getElementById('servidores')?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: Key, label: 'Licenças ativas', value: String(stats.licensesActive), tone: 'bg-[#f3f8db]', onClick: () => navigate('/account/licenses') },
            { icon: Shield, label: user?.plan || 'Free', value: 'Plano', tone: 'bg-[#dceee4]', onClick: () => setActiveModal('plans') }
          ].map((stat, index) => (
            <button type="button"
              key={index}
              onClick={stat.onClick}
              className={`group relative overflow-hidden rounded-2xl border border-[#b8d9c2] p-5 text-left text-[#133326] transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#85ed65] ${stat.tone}`}
            >
              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1b714e] text-white">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="mb-1 text-3xl font-extrabold">{stat.value}</div>
                <div className="text-sm font-semibold text-[#4f6d59]">{stat.label}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mb-10 rounded-2xl border border-[#37694d] bg-[#174d39] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <h2 className="text-xl font-semibold">Licenças e acesso</h2>
              <p className="mt-2 text-sm text-muted-foreground">Consulte sua chave principal, os produtos autorizados e o IP global.</p>
            </div>
            <Link to="/account/licenses" className="sf-button-primary">Gerenciar licenças</Link>
          </div>
        </div>

        {/* Servers Management Section */}
        <div id="servidores" className="mb-12 scroll-mt-28">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-[#A6F3C8]" />
              <h2 className="text-2xl font-semibold text-white">Meus Servidores</h2>
            </div>
            <button
              onClick={() => openServerModal(null)}
              className="sf-button-primary"
            >
              <Plus className="w-4 h-4" />
              Novo Servidor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-[#172822]/60 border border-[#177F58]/20 rounded-2xl p-6 hover:border-[#177F58]/40 transition-all group"
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
                          <span key={i} className="px-2 py-1 bg-[#177F58]/10 border border-[#177F58]/20 rounded text-[10px] text-[#A6F3C8] font-mono">
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
              <div className="col-span-full grid overflow-hidden rounded-2xl border border-[#bee3c8] bg-[#e6f6e6] text-[#173526] sm:grid-cols-[1fr_230px]">
                <div className="p-8 sm:p-10"><Server className="mb-4 h-7 w-7 text-[#137f56]" /><h3 className="text-2xl font-extrabold">Seu primeiro servidor começa aqui.</h3><p className="mt-3 max-w-md text-sm leading-7 text-[#526d59]">Cadastre um servidor para organizar seus IPs autorizados e os plugins que pertencem a ele.</p>
                <button onClick={() => openServerModal(null)} className="sf-button-primary mt-6">Criar meu primeiro servidor <Plus size={17}/></button></div>
                <div className="relative hidden min-h-55 bg-[#bcebd3] sm:block"><img src="/voxel/engineer.webp" alt="Personagem voxel segurando um núcleo de servidor" loading="lazy" className="absolute inset-x-0 -bottom-6 h-[115%] w-full object-contain object-bottom" /></div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Plugins Comprados */}
            <div id="plugins" className="scroll-mt-28 bg-[#172822]/60 backdrop-blur-sm border border-[#177F58]/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl">Meus Plugins</h2>
                <Link
                  to="/plugins"
                  className="sf-button-primary"
                >
                  Explorar catálogo
                </Link>
              </div>

              <div className="space-y-4">
                {(loading ? [] : licenses).map((plugin) => (
                  <div
                    key={plugin.id}
                    className="p-5 bg-[#0B1715]/50 rounded-lg border border-[#177F58]/10 hover:border-[#177F58]/30 transition-all duration-300 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg text-white mb-1 group-hover:text-[#A6F3C8] transition-colors duration-300">
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
                          className="p-2 bg-[#177F58]/20 text-[#A6F3C8] rounded-lg hover:bg-[#177F58]/30 transition-all duration-300"
                          aria-label="Configurar plugin"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <Link
                          to={`/plugins/${plugin.pluginId}`}
                          className="p-2 bg-[#177F58]/20 text-[#A6F3C8] rounded-lg hover:bg-[#177F58]/30 transition-all duration-300"
                          aria-label="Ver detalhes"
                        >
                          <Download className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && licenses.length === 0 && !loadError && <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-[#bde5ce] bg-[#e7f8ee] p-6 text-[#173526]"><div><h3 className="text-lg font-extrabold">Sua coleção começa aqui</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#526d59]">Quando você adquirir um plugin publicado, ele aparecerá nesta área junto à sua licença.</p><Link to="/plugins" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#0d7550] hover:underline">Explorar catálogo →</Link></div><img src="/voxel/creator-avatar.webp" alt="Personagem voxel mostrando a coleção de plugins" loading="lazy" className="h-36 w-28 object-contain" /></div>}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-card p-6">
              <h2 className="text-xl font-semibold">Arquivos dos plugins</h2>
              <p className="mt-2 text-sm text-muted-foreground">Os arquivos ainda não estão disponíveis para download nesta plataforma. As licenças compradas aparecem acima.</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile */}
            <div className="bg-[#172822]/60 backdrop-blur-sm border border-[#177F58]/20 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#177F58] to-[#A6F3C8] flex items-center justify-center">
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
                  className="w-full flex items-center gap-3 p-3 bg-[#0B1715]/50 rounded-lg hover:bg-[#177F58]/10 transition-all duration-300 text-left group"
                >
                  <Settings className="w-5 h-5 text-gray-400 group-hover:text-[#A6F3C8] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Configurações
                  </span>
                </button>

                <Link
                  to="/account/orders"
                  className="w-full flex items-center gap-3 p-3 bg-[#0B1715]/50 rounded-lg hover:bg-[#177F58]/10 transition-all duration-300 text-left group"
                >
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-[#A6F3C8] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Meus pedidos
                  </span>
                </Link>

                <button
                  onClick={openNotifications}
                  className="w-full flex items-center gap-3 p-3 bg-[#0B1715]/50 rounded-lg hover:bg-[#177F58]/10 transition-all duration-300 text-left group"
                >
                  <Bell className="w-5 h-5 text-gray-400 group-hover:text-[#A6F3C8] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Notificações
                  </span>
                </button>

                <button
                  onClick={() => {
                    setPasswordForm({ current: '', new: '', confirm: '' });
                    setActiveModal('password');
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-[#0B1715]/50 rounded-lg hover:bg-[#177F58]/10 transition-all duration-300 text-left group"
                >
                  <Lock className="w-5 h-5 text-gray-400 group-hover:text-[#A6F3C8] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Mudar Senha
                  </span>
                </button>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-[#177F58]/20 to-[#22A874]/20 border border-[#177F58]/30 rounded-lg hover:from-[#177F58]/30 hover:to-[#22A874]/30 transition-all duration-300 text-left group"
                  >
                    <Shield className="w-5 h-5 text-[#A6F3C8] group-hover:text-white transition-colors duration-300" />
                    <span className="text-sm text-[#A6F3C8] group-hover:text-white transition-colors duration-300 font-medium">
                      Painel Admin
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#172822]/60 backdrop-blur-sm border border-[#177F58]/20 rounded-xl p-6">
              <h3 className="text-lg mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Link
                  to="/plugins"
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#177F58] to-[#22A874] text-white rounded-lg hover:shadow-lg hover:shadow-[#177F58]/50 transition-all duration-300 text-sm flex justify-center"
                >
                  Explorar Plugins
                </Link>
                <Link to="/support" className="block w-full px-4 py-3 bg-transparent border border-[#177F58]/40 text-white rounded-lg hover:bg-[#177F58]/10 transition-all duration-300 text-sm text-center">
                  Suporte
                </Link>
                <Link to="/docs" className="block w-full px-4 py-3 bg-transparent border border-[#177F58]/40 text-white rounded-lg hover:bg-[#177F58]/10 transition-all duration-300 text-sm text-center">
                  Documentação
                </Link>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-[#177F58]/20 to-[#0A4C43]/20 backdrop-blur-sm border border-[#177F58]/30 rounded-xl p-6">
              <div className="w-12 h-12 rounded-lg bg-[#177F58] flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg text-white mb-2">Precisa de Ajuda?</h3>
              <p className="text-sm text-gray-400 mb-4">
                Abra um chamado de suporte e acompanhe a resposta pela plataforma.
              </p>
              <Link to="/support" className="block w-full px-4 py-2 bg-white text-[#0B1715] rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm text-center">
                Abrir Ticket
              </Link>
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
              className="relative w-full max-w-2xl bg-[#10221d] border border-[#177F58]/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#177F58]/10">
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
                    <div className="w-8 h-8 border-4 border-[#177F58] border-t-transparent rounded-full animate-spin"></div>
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
                                ? 'bg-[#177F58]/10 border-[#177F58] ring-1 ring-[#177F58]'
                                : 'bg-[#172822]/40 border-[#177F58]/20 hover:border-[#177F58]/50'
                            }`}
                          >
                            {user?.plan === plan.name && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#177F58] text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg">
                                Plano Atual
                              </div>
                            )}
                            <div className="mb-4">
                              <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                              <div className="text-2xl font-bold text-[#A6F3C8]">{plan.price}</div>
                            </div>
                            <ul className="space-y-3 mb-8">
                              {plan.features.map((feature: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                              {plan.grantsAllPlugins && (
                                <li className="flex items-start gap-2 text-sm text-[#A6F3C8] font-medium">
                                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                  <span>Acesso a TODOS os plugins</span>
                                </li>
                              )}
                            </ul>
                            <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">{user?.plan === plan.name ? 'Plano atual' : 'Assinaturas indisponíveis até a homologação financeira.'}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeModal === 'settings' && modalData && (
                      <div className="space-y-6">
                        {/* Seção de Perfil */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-[#A6F3C8] uppercase tracking-wider">Perfil Público</h4>
                          <div className="flex gap-4 items-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-[#177F58]/20 border border-[#177F58]/40 flex items-center justify-center overflow-hidden">
                              {profileData.avatarUrl ? (
                                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <Globe className="w-8 h-8 text-[#A6F3C8]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">URL do Avatar</label>
                              <input
                                value={profileData.avatarUrl}
                                onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-3 py-2 bg-[#0B1715] border border-[#177F58]/20 rounded-lg text-xs text-white outline-none focus:border-[#177F58]"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Biografia</label>
                            <textarea
                              value={profileData.bio}
                              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                              placeholder="Conte um pouco sobre você..."
                              className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white text-sm focus:border-[#177F58] outline-none transition-all resize-none h-24"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Discord ID</label>
                              <input
                                value={profileData.discordId}
                                onChange={(e) => setProfileData({ ...profileData, discordId: e.target.value })}
                                placeholder="usuario#0000"
                                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white text-sm outline-none focus:border-[#177F58]"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">GitHub</label>
                              <input
                                value={profileData.githubUrl}
                                onChange={(e) => setProfileData({ ...profileData, githubUrl: e.target.value })}
                                placeholder="github.com/usuario"
                                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white text-sm outline-none focus:border-[#177F58]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Seção de Conta */}
                        <div className="space-y-4 pt-6 border-t border-[#177F58]/10">
                          <h4 className="text-sm font-semibold text-[#A6F3C8] uppercase tracking-wider">Dados da Conta</h4>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Nome de Exibição</label>
                            <input
                              defaultValue={modalData.name}
                              disabled
                              className="w-full px-4 py-3 bg-[#0B1715]/50 border border-[#177F58]/10 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Email</label>
                            <input
                              defaultValue={modalData.email}
                              disabled
                              className="w-full px-4 py-3 bg-[#0B1715]/50 border border-[#177F58]/10 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          <div className="flex items-center justify-between p-4 bg-[#0B1715] rounded-xl border border-[#177F58]/10">
                            <div>
                              <div className="text-white">Segurança (2FA)</div>
                              <div className="text-xs text-gray-400">Ative a autenticação em duas etapas</div>
                            </div>
                            <span className="text-xs text-gray-500">Indisponível</span>
                          </div>
                        </div>

                        <button
                          onClick={handleProfileUpdate}
                          disabled={profileSaving}
                          className="w-full py-4 bg-gradient-to-r from-[#177F58] to-[#22A874] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#177F58]/30 transition-all disabled:opacity-50"
                        >
                          {profileSaving ? 'Salvando...' : 'Salvar Todas as Alterações'}
                        </button>
                      </div>
                    )}

                    {activeModal === 'payments' && modalData && (
                      <div className="space-y-3">
                        {modalData.map((pay: any) => (
                          <div key={pay.id} className="p-4 bg-[#0B1715] rounded-xl border border-[#177F58]/10 flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium">{pay.pluginName}</div>
                              <div className="text-xs text-gray-500">{new Date(pay.dateISO).toLocaleDateString()} • {pay.method}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[#A6F3C8]">R$ {(pay.amountCents / 100).toFixed(2)}</div>
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
                          <div key={n.id} className="p-4 bg-[#0B1715] rounded-xl border border-[#177F58]/10">
                            <div className="flex items-center gap-3 mb-1">
                              <div className="w-2 h-2 rounded-full bg-[#177F58]"></div>
                              <div className="text-white font-medium">{n.title}</div>
                            </div>
                            <div className="text-sm text-gray-400 ml-5">{n.message}</div>
                            <div className="text-[10px] text-gray-600 ml-5 mt-2">{new Date(n.createdISO).toLocaleString()}</div>
                          </div>
                        ))}
                        {modalData.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Nenhuma notificação pessoal disponível.</p>}
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
                              className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">IPs Autorizados (Até 3, separados por vírgula)</label>
                            <input
                              value={newServerIps}
                              onChange={(e) => setNewServerIps(e.target.value)}
                              placeholder="Ex: 127.0.0.1, 192.168.1.1"
                              className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">O plugin só funcionará em requisições vindas destes IPs.</p>
                          </div>
                        </div>

                        {modalData.id && (
                          <div className="pt-6 border-t border-[#177F58]/10">
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
                                        : 'bg-[#0B1715] border-[#177F58]/10 text-gray-400 hover:border-[#177F58]/30'
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
                            className="w-full py-4 bg-gradient-to-r from-[#177F58] to-[#22A874] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#177F58]/30 transition-all disabled:opacity-50"
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
                              className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
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
                                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Confirmar Nova Senha</label>
                              <input
                                type="password"
                                value={passwordForm.confirm}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white focus:border-[#177F58] outline-none transition-all"
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
                            className="w-full py-4 bg-gradient-to-r from-[#177F58] to-[#22A874] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#177F58]/30 transition-all disabled:opacity-50"
                          >
                            {passwordSaving ? 'Alterando...' : 'Confirmar Alteração'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeModal === 'config' && modalData && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-white/10 p-4">
                          <div className="text-sm font-medium">Configuração do produto</div>
                          <div className="mt-1 text-xs text-gray-400">O vínculo e o IP dependem da instalação e das regras de licenciamento.</div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">HWID Vinculado</label>
                              <div className="flex gap-2">
                                <code className="flex-1 px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white font-mono text-sm overflow-hidden text-ellipsis">
                                  {modalData.hwid}
                                </code>
                              </div>
                            </div>
                            <div>
                              <div className="mb-2 text-sm text-gray-400">IP desta compra</div>
                              <code className="block rounded-xl border border-[#177F58]/20 bg-[#0B1715] px-4 py-3 text-sm">{modalData.allowedIp || 'Não definido'}</code>
                              <Link to="/account/licenses" onClick={() => setActiveModal(null)} className="mt-2 inline-block text-xs text-[#A6F3C8] hover:underline">Gerenciar IP global</Link>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Versão Atual</label>
                              <div className="px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white text-sm">
                                {modalData.version}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">ID do Plugin</label>
                              <div className="px-4 py-3 bg-[#0B1715] border border-[#177F58]/20 rounded-xl text-white text-sm">
                                #{modalData.pluginId}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#177F58]/10">
                            <p className="rounded-lg border border-white/10 p-4 text-sm text-muted-foreground">Download indisponível nesta plataforma. Consulte o <Link to="/support" className="text-[#A6F3C8] hover:underline">suporte</Link> se precisar de ajuda.</p>
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
