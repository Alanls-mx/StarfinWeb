import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AccountNav } from '../components/AccountNav';
import { AccountPluginFiles } from '../components/AccountPluginFiles';
import { getMyLicenses, getPluginConfig, type PurchasedPlugin } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountPluginsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<PurchasedPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConfig, setSelectedConfig] = useState<Awaited<ReturnType<typeof getPluginConfig>> | null>(null);
  const [configError, setConfigError] = useState('');
  useEffect(() => { if (!token) return; let active = true; getMyLicenses(token).then(result => { if (active) setItems(result.items); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar plugins.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [token]);
  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center text-[#bdd2c5]">Verificando sessão...</main>;
  if (!token) return <main className="min-h-screen px-5 pt-32 text-white"><Link to="/login?next=%2Faccount%2Fplugins" className="text-[#a9f58e]">Entrar para ver seus plugins →</Link></main>;
  return <main className="min-h-screen bg-[#0b1715] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-6xl space-y-8"><div><h1 className="text-3xl font-bold">Meus plugins</h1><p className="mt-2 text-sm text-[#bdd2c5]">Produtos autorizados para sua conta e arquivos publicados.</p></div><AccountNav />{error && <p role="alert" className="text-red-200">{error}</p>}{loading ? <p role="status">Carregando produtos...</p> : items.length === 0 ? <div className="border-l-2 border-[#85ed65] bg-[#14251e] p-7"><h2 className="text-xl font-semibold">Nenhum plugin na conta</h2><p className="mt-2 text-[#bdd2c5]">Quando uma compra for aprovada, o produto aparecerá aqui.</p><Link to="/plugins" className="mt-5 inline-block text-[#a9f58e]">Ver catálogo →</Link></div> : <><ul className="divide-y divide-white/10 border-y border-white/15">{items.map(item => <li key={`${item.id}-${item.pluginId}`} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><strong>{item.name}</strong><p className="mt-1 font-mono text-xs text-[#bdd2c5]">Versão {item.version} · {item.status}</p></div><div className="flex items-center gap-4"><button type="button" onClick={() => { setConfigError(''); setSelectedConfig(null); getPluginConfig(token, item.pluginId).then(setSelectedConfig).catch(cause => setConfigError(cause instanceof Error ? cause.message : 'Falha ao consultar configuração.')); }} className="text-sm text-[#a9f58e] hover:underline">Configuração</button><Link to={`/plugins/${item.pluginId}`} className="text-sm text-[#a9f58e]">Ver produto →</Link></div></li>)}</ul>{configError && <p role="alert" className="text-red-200">{configError}</p>}{selectedConfig && <section className="border-l-2 border-[#48c6bc] bg-[#14251e] p-6"><h2 className="text-lg font-semibold">Configuração do plugin #{selectedConfig.pluginId}</h2><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-[#bdd2c5]">Versão</dt><dd className="mt-1">{selectedConfig.version}</dd></div><div><dt className="text-[#bdd2c5]">HWID vinculado</dt><dd className="mt-1 break-all font-mono">{selectedConfig.hwid || 'Ainda não vinculado'}</dd></div><div><dt className="text-[#bdd2c5]">IP autorizado</dt><dd className="mt-1 font-mono">{selectedConfig.allowedIp || 'Não definido'}</dd></div></dl><Link to="/account/licenses" className="mt-5 inline-block text-sm text-[#a9f58e]">Gerenciar licença e IP →</Link></section>}<AccountPluginFiles token={token} licenses={items}/></>}</div></main>;
}
