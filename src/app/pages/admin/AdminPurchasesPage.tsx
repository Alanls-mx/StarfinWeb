import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { adminListPurchases, type AdminPurchase } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminPurchasesPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<AdminPurchase[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!token) return;
    let active = true;
    adminListPurchases(token).then(result => { if (active) setItems(result.items); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao consultar compras.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  if (!token) return <p className="py-16 text-center">Faça login como administrador.</p>;
  const filtered = items.filter(item => [item.id, item.userId, String(item.pluginId)].some(value => value.toLowerCase().includes(search.toLowerCase())));
  return <div className="space-y-6 text-white"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">Compras e concessões</h1><p className="mt-2 text-sm text-[#bdd2c5]">Aprovações e concessões definem a quantidade de ativações. IP e produtos atribuídos são gerenciados por instalação.</p></div><Link to="/admin/installations" className="text-sm text-[#a9f58e]">Gerenciar instalações →</Link></div>
    <input aria-label="Buscar compras" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar ID, usuário ou produto" className="w-full max-w-lg rounded border border-white/20 bg-[#10221b] p-3" />
    {error && <p role="alert" className="border border-red-400/30 p-4 text-red-200">{error}</p>}
    {loading ? <p>Carregando compras...</p> : <div className="overflow-x-auto rounded-lg border border-white/15"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-[#14251e] text-[#bdd2c5]"><tr><th className="p-4">ID / data</th><th className="p-4">Cliente</th><th className="p-4">Produto</th><th className="p-4">Origem</th><th className="p-4">Estado</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="border-t border-white/10"><td className="p-4 font-mono text-xs">{item.id}<br />{new Date(item.createdISO).toLocaleString('pt-BR')}</td><td className="p-4">{item.userId}</td><td className="p-4">#{item.pluginId}</td><td className="p-4">{item.grantSource === 'admin_grant' ? 'Concessão manual' : 'Compra'}</td><td className="p-4">{item.status}</td></tr>)}</tbody></table>{!filtered.length && <p className="p-6 text-sm text-[#bdd2c5]">Nenhum registro encontrado.</p>}</div>}
  </div>;
}
