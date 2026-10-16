import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AccountNav } from '../components/AccountNav';
import { getMyLicenses, listMyServers, type PurchasedPlugin, type ServerRecord } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountLicensesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [licenses, setLicenses] = useState<PurchasedPlugin[]>([]);
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([getMyLicenses(token), listMyServers(token)])
      .then(([rights, installations]) => { if (active) { setLicenses(rights.items.filter(item => item.status === 'Ativo')); setServers(installations.items); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar licenças.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center">Verificando sessão...</main>;
  if (!token) return <main className="mx-auto min-h-screen max-w-5xl px-5 pt-32"><h1 className="text-3xl font-semibold">Minhas licenças</h1><Link to="/login?next=/account/licenses" className="mt-5 inline-block text-primary">Entrar para consultar →</Link></main>;
  const products = [...new Map(licenses.map(item => [item.pluginId, item])).values()];
  return <main className="mx-auto min-h-screen max-w-5xl px-5 pb-24 pt-32 text-white sm:px-8">
    <h1 className="text-4xl font-bold">Minhas licenças</h1>
    <p className="mt-3 text-sm text-[#bdd2c5]">Cada compra aprovada acrescenta uma ativação do produto. A instalação do StarfinCore é vinculada por código temporário na área de servidores.</p>
    <div className="mt-6"><AccountNav /></div>
    {error && <p role="alert" className="mt-6 border border-red-400/30 p-4 text-red-200">{error}</p>}
    {loading ? <p className="mt-8">Carregando licenças...</p> : products.length === 0 ? <section className="mt-8 border-l-2 border-[#85ed65] bg-[#14251e] p-7"><h2 className="text-lg font-semibold">Nenhuma licença ativa</h2><p className="mt-2 text-sm text-[#bdd2c5]">Produtos comprados e concessões administrativas aparecem aqui após aprovação.</p><Link to="/plugins" className="mt-4 inline-block text-[#a9f58e]">Ver produtos →</Link></section> : <ul className="mt-8 space-y-4">{products.map(product => {
      const quantity = servers[0]?.entitlements?.find(item => item.pluginId === product.pluginId);
      const purchased = licenses.filter(item => item.pluginId === product.pluginId).length;
      const linked = servers.filter(server => server.plugins.includes(product.pluginId));
      return <li key={product.pluginId} className="rounded-lg border border-white/15 bg-[#14251e] p-6"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="text-xl font-semibold">{product.name}</h2><p className="mt-2 text-sm text-[#bdd2c5]">{quantity?.purchased ?? purchased} adquirida(s) · {quantity?.used ?? linked.length} em uso · {quantity?.available ?? Math.max(0, purchased - linked.length)} disponível(is)</p><p className="mt-2 text-xs text-[#9cb8a6]">Instalações: {linked.length ? linked.map(server => server.name).join(', ') : 'nenhuma'}</p></div><Link to="/account/servers" className="text-sm text-[#a9f58e]">Gerenciar instalações →</Link></div></li>;
    })}</ul>}
  </main>;
}
