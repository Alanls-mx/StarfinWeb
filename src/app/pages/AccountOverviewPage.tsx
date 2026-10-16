import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AccountNav } from '../components/AccountNav';
import { getMyLicenses, getMyPayments, listMyServers } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AccountOverviewPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const userName = state.status === 'authenticated' ? state.user.name : '';
  const [summary, setSummary] = useState<{ plugins: number; licenses: number; servers: number; orders: number } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([getMyLicenses(token), listMyServers(token), getMyPayments(token)]).then(([licenses, servers, orders]) => {
      if (active) setSummary({ plugins: new Set(licenses.items.map(item => item.pluginId)).size, licenses: licenses.items.filter(item => item.status === 'Ativo').length, servers: servers.items.length, orders: orders.length });
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua conta.'); });
    return () => { active = false; };
  }, [token]);
  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center text-[#bdd2c5]">Verificando sessão...</main>;
  if (!token) return <main className="min-h-screen px-5 pt-32 text-center text-white"><h1 className="text-3xl font-bold">Minha conta</h1><p className="mt-3 text-[#bdd2c5]">Entre para consultar seus produtos, servidores e pedidos.</p><Link to="/login?next=%2Faccount" className="sf-button-primary mt-6">Entrar</Link></main>;
  return <main className="min-h-screen bg-[#0b1715] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-6xl space-y-8">
    <div><h1 className="text-3xl font-bold">Minha conta</h1><p className="mt-2 text-[#bdd2c5]">Olá, {userName}. Acesse suas ferramentas e acompanhe seus pedidos.</p></div>
    <AccountNav />
    {error && <p role="alert" className="border border-red-400/30 p-4 text-red-200">{error}</p>}
    {!summary && !error ? <p role="status" className="text-[#bdd2c5]">Carregando resumo...</p> : summary && <>
      <dl className="grid divide-y divide-white/10 border-y border-white/15 sm:grid-cols-4 sm:divide-x sm:divide-y-0">{[['Plugins', summary.plugins, '/account/plugins'], ['Produtos ativos', summary.licenses, '/account/plugins'], ['Servidores', summary.servers, '/account/servers'], ['Pedidos', summary.orders, '/account/orders']].map(([label, value, href]) => <div key={label} className="p-5"><dt className="text-sm text-[#bdd2c5]">{label}</dt><dd className="mt-2 font-mono text-3xl font-bold">{value}</dd><Link to={String(href)} className="mt-3 inline-block text-xs text-[#a9f58e]">Ver detalhes →</Link></div>)}</dl>
      <section className="grid gap-4 md:grid-cols-2"><div className="border-l-2 border-[#85ed65] bg-[#14251e] p-6"><h2 className="text-lg font-semibold">{summary.servers ? 'Gerenciar instalações' : 'Cadastre seu primeiro servidor'}</h2><p className="mt-2 text-sm text-[#bdd2c5]">Organize IPs autorizados e os produtos ligados a cada servidor.</p><Link to="/account/servers" className="mt-5 inline-block text-sm font-bold text-[#a9f58e]">Abrir servidores →</Link></div><div className="border-l-2 border-[#48c6bc] bg-[#14251e] p-6"><h2 className="text-lg font-semibold">{summary.plugins ? 'Consultar arquivos' : 'Conhecer os projetos'}</h2><p className="mt-2 text-sm text-[#bdd2c5]">Veja produtos adquiridos e versões publicadas para suas licenças.</p><Link to={summary.plugins ? '/account/plugins' : '/plugins'} className="mt-5 inline-block text-sm font-bold text-[#a9f58e]">{summary.plugins ? 'Meus plugins' : 'Abrir catálogo'} →</Link></div></section>
    </>}
  </div></main>;
}
