import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AccountNav } from '../components/AccountNav';
import { AccountPluginFiles } from '../components/AccountPluginFiles';
import { getMyLicenses, type PurchasedPlugin } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountPluginsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<PurchasedPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyLicenses(token).then(result => { if (active) setItems(result.items); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar produtos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center">Verificando sessão...</main>;
  if (!token) return <main className="min-h-screen px-5 pt-32"><Link to="/login?next=%2Faccount%2Fplugins">Entrar para ver seus plugins →</Link></main>;
  return <main className="min-h-screen bg-[#0b1715] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-6xl space-y-8"><div><h1 className="text-3xl font-bold">Meus plugins</h1><p className="mt-2 text-sm text-[#bdd2c5]">Compras e concessões aprovadas dão direito a ativações por instalação.</p></div><AccountNav />{error && <p role="alert" className="text-red-200">{error}</p>}{loading ? <p>Carregando produtos...</p> : items.length === 0 ? <div className="border-l-2 border-[#85ed65] bg-[#14251e] p-7"><h2 className="text-xl font-semibold">Nenhum plugin na conta</h2><Link to="/plugins" className="mt-5 inline-block text-[#a9f58e]">Ver catálogo →</Link></div> : <><ul className="divide-y divide-white/10 border-y border-white/15">{items.map(item => <li key={`${item.id}-${item.pluginId}`} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><strong>{item.name}</strong><p className="mt-1 text-xs text-[#bdd2c5]">Versão {item.version} · {item.status}</p></div><div className="flex items-center gap-4"><Link to="/account/servers" className="text-sm text-[#a9f58e]">Gerenciar instalação</Link><Link to={`/plugins/${item.pluginId}`} className="text-sm text-[#a9f58e]">Ver produto</Link></div></li>)}</ul><AccountPluginFiles token={token} licenses={items}/></>}</div></main>;
}
