import { useEffect, useMemo, useState } from 'react';
import { adminListAudit, type AdminAuditEntry } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminAuditPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<AdminAuditEntry[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let active = true;
    adminListAudit(token)
      .then(result => { if (active) setItems(result.items); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a auditoria.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const filtered = useMemo(() => items.filter(item =>
    [item.action, item.actorUserId, item.resourceType, item.resourceId].some(value => value.toLowerCase().includes(search.toLowerCase()))
  ), [items, search]);

  return <div className="mx-auto max-w-7xl space-y-7">
    <header><p className="sf-eyebrow">Sistema / segurança</p><h1 className="mt-2 text-3xl font-extrabold">Auditoria administrativa</h1><p className="mt-2 text-sm text-muted-foreground">Histórico persistido de alterações administrativas sensíveis. A lista exibe os 200 eventos mais recentes.</p></header>
    <label className="block max-w-lg text-sm">Buscar evento, responsável ou recurso<input value={search} onChange={event => setSearch(event.target.value)} className="mt-2 w-full rounded-xl border border-[#37604b] bg-card px-4 py-3 text-white" placeholder="Ex.: license.manual_grant" /></label>
    {error && <p role="alert" className="rounded-xl border border-red-500/40 p-4 text-red-200">{error}</p>}
    {loading ? <p role="status" className="text-muted-foreground">Carregando eventos...</p> : !error && filtered.length === 0 ? <p className="rounded-xl border border-white/15 bg-card p-8 text-muted-foreground">Nenhum evento encontrado.</p> : !error && <div className="overflow-x-auto rounded-xl border border-white/15 bg-card"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-muted-foreground"><tr><th className="p-4">Data</th><th className="p-4">Operação</th><th className="p-4">Responsável</th><th className="p-4">Recurso</th><th className="p-4">Resultado</th></tr></thead><tbody className="divide-y divide-white/10">{filtered.map(item => <tr key={item.id}><td className="whitespace-nowrap p-4 text-muted-foreground">{new Date(item.createdISO).toLocaleString('pt-BR')}</td><td className="p-4 font-mono text-xs text-[#a9f58e]">{item.action}</td><td className="p-4 font-mono text-xs">{item.actorUserId}</td><td className="p-4"><span className="text-muted-foreground">{item.resourceType}</span><span className="block font-mono text-xs">{item.resourceId}</span></td><td className="p-4">{item.outcome === 'success' ? 'Concluído' : item.outcome}</td></tr>)}</tbody></table></div>}
  </div>;
}
