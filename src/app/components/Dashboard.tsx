import { Bell, CreditCard, Download, Key, Package, Settings, Shield, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  createMyApiKey,
  getMyLicenses,
  listMyApiKeys,
  resendVerification,
  revokeMyApiKey,
  type ApiKey,
  type ApiKeyCreated,
  type PurchasedPlugin
} from '../lib/api';
import { useAuth } from '../lib/auth';

export function Dashboard() {
  const navigate = useNavigate();
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const user = state.status === 'authenticated' ? state.user : null;

  const [licenses, setLicenses] = useState<PurchasedPlugin[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKeyCreating, setApiKeyCreating] = useState(false);
  const [apiKeyCreated, setApiKeyCreated] = useState<ApiKeyCreated | null>(null);
  const [apiKeyName, setApiKeyName] = useState('Servidor Principal');
  const [apiKeyPluginId, setApiKeyPluginId] = useState<number | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const stats = useMemo(() => {
    const pluginsCount = licenses.length;
    const licensesActive = licenses.filter((l) => l.status === 'Ativo').length;
    return { pluginsCount, licensesActive };
  }, [licenses]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [licRes, keysRes] = await Promise.all([getMyLicenses(token), listMyApiKeys(token)]);
        if (cancelled) return;
        setLicenses(licRes.items);
        setApiKeys(keysRes.items);
        setApiKeyPluginId((prev) => prev ?? licRes.items[0]?.pluginId ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4">Minha Conta</h1>
          <p className="text-gray-400 text-lg">
            Gerencie seus plugins, licenças, integrações e configurações
          </p>
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
                  await resendVerification(user.email);
                  setVerificationSent(true);
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
            { icon: Download, label: 'Downloads', value: String(licenses.length * 4), color: 'from-[#9D4EDD] to-[#C77DFF]' },
            { icon: Key, label: 'Licenças Ativas', value: String(stats.licensesActive), color: 'from-[#5A189A] to-[#7B2CBF]' },
            { icon: Shield, label: 'Suporte Ativo', value: 'Sim', color: 'from-[#3C096C] to-[#5A189A]' }
          ].map((stat, index) => (
            <div
              key={index}
              className="relative bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6 hover:border-[#7B2CBF]/50 transition-all duration-300 overflow-hidden group"
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
                        <Link
                          to={`/plugins/${plugin.pluginId}`}
                          className="p-2 bg-[#7B2CBF]/20 text-[#C77DFF] rounded-lg hover:bg-[#7B2CBF]/30 transition-all duration-300"
                          aria-label="Abrir plugin"
                        >
                          <Download className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Licenças */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <h2 className="text-2xl mb-6">Minhas Licenças</h2>

              <div className="space-y-4">
                {licenses.map((plugin) => (
                  <div
                    key={plugin.id}
                    className="p-5 bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white">{plugin.name}</h3>
                      <button className="text-[#C77DFF] text-sm hover:text-[#9D4EDD] transition-colors duration-300">
                        Renovar
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-gray-400" />
                      <code className="text-sm text-gray-400 bg-[#0B0B0F]/80 px-3 py-1 rounded font-mono">
                        {plugin.licenseKey}
                      </code>
                    </div>
                    <div className="text-xs text-gray-500">
                      Compra: {new Date(plugin.purchaseDateISO).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl">Chaves de API</h2>
                  <p className="text-sm text-gray-400">
                    Use estas chaves para conectar seus plugins ao seu servidor e validar licenças via API.
                  </p>
                </div>
              </div>

              <div className="bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10 p-5 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={apiKeyPluginId ?? ''}
                    onChange={(e) => setApiKeyPluginId(Number(e.target.value))}
                    className="px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white focus:outline-none focus:border-[#7B2CBF] transition-all duration-300"
                  >
                    {licenses.map((l) => (
                      <option key={l.pluginId} value={l.pluginId}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    placeholder="Nome da chave"
                    className="px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] transition-all duration-300"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={apiKeyCreating || !token || !apiKeyPluginId || !apiKeyName.trim()}
                    onClick={async () => {
                      if (!token || !apiKeyPluginId) return;
                      setApiKeyCreating(true);
                      try {
                        const created = await createMyApiKey(token, {
                          pluginId: apiKeyPluginId,
                          name: apiKeyName.trim()
                        });
                        setApiKeyCreated(created);
                        const updated = await listMyApiKeys(token);
                        setApiKeys(updated.items);
                      } finally {
                        setApiKeyCreating(false);
                      }
                    }}
                    className="px-4 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 disabled:opacity-60"
                  >
                    Gerar Chave
                  </motion.button>
                </div>

                {apiKeyCreated ? (
                  <div className="mt-4 p-4 bg-[#1A1A22]/60 rounded-lg border border-[#7B2CBF]/20">
                    <div className="text-sm text-gray-400 mb-2">Copie agora. Por segurança, exibimos uma vez.</div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <code className="flex-1 text-sm text-white bg-[#0B0B0F]/70 px-3 py-2 rounded font-mono break-all">
                        {apiKeyCreated.key}
                      </code>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(apiKeyCreated.key);
                        }}
                        className="px-4 py-2 bg-white text-[#0B0B0F] rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#0B0B0F]/30 rounded-lg border border-[#7B2CBF]/10"
                  >
                    <div className="min-w-0">
                      <div className="text-white">{k.name}</div>
                      <div className="text-xs text-gray-500 break-all">
                        {k.keyPrefix} • criado {new Date(k.createdISO).toLocaleDateString('pt-BR')}
                        {k.lastUsedISO ? ` • usado ${new Date(k.lastUsedISO).toLocaleDateString('pt-BR')}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!token) return;
                        await revokeMyApiKey(token, k.id);
                        const updated = await listMyApiKeys(token);
                        setApiKeys(updated.items);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-transparent border border-red-500/40 text-white rounded-lg hover:bg-red-500/10 transition-all duration-300 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Revogar
                    </button>
                  </div>
                ))}
                {!apiKeys.length ? (
                  <div className="text-sm text-gray-400">Nenhuma chave criada ainda.</div>
                ) : null}
              </div>
            </div>

            {/* Downloads Recentes */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <h2 className="text-2xl mb-6">Downloads Recentes</h2>

              <div className="space-y-3">
                {[
                  { plugin: 'EconomyPlus Pro', version: '2.5.1', date: '20 Mar 2026', size: '2.4 MB' },
                  { plugin: 'EconomyPlus Pro', version: '2.5.0', date: '15 Mar 2026', size: '2.3 MB' },
                  { plugin: 'WorldGuard Elite', version: '3.1.0', date: '10 Mar 2026', size: '1.8 MB' },
                  { plugin: 'ChatManager Pro', version: '1.8.2', date: '5 Mar 2026', size: '1.2 MB' }
                ].map((download, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#0B0B0F]/30 rounded-lg border border-[#7B2CBF]/5 hover:border-[#7B2CBF]/20 transition-all duration-300"
                  >
                    <div>
                      <div className="text-white text-sm mb-1">
                        {download.plugin} v{download.version}
                      </div>
                      <div className="text-xs text-gray-500">
                        {download.date} • {download.size}
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-[#C77DFF] transition-colors duration-300">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
                <button className="w-full flex items-center gap-3 p-3 bg-[#0B0B0F]/50 rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-left group">
                  <Settings className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Configurações
                  </span>
                </button>

                <button className="w-full flex items-center gap-3 p-3 bg-[#0B0B0F]/50 rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-left group">
                  <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Pagamento
                  </span>
                </button>

                <button className="w-full flex items-center gap-3 p-3 bg-[#0B0B0F]/50 rounded-lg hover:bg-[#7B2CBF]/10 transition-all duration-300 text-left group">
                  <Bell className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] transition-colors duration-300" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-300">
                    Notificações
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6">
              <h3 className="text-lg mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Link
                  to="/plugins"
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 text-sm"
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
    </div>
  );
}
