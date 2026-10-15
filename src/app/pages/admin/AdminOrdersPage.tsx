import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { adminListOrders, type AdminOrder } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

function statusLabel(status: string) {
  switch (status) {
    case 'completed': case 'approved': return ['Pago', 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20'];
    case 'pending': case 'processing': return ['Pendente', 'text-amber-200 bg-amber-400/10 border-amber-400/20'];
    case 'refunded': return ['Reembolsado', 'text-sky-200 bg-sky-400/10 border-sky-400/20'];
    case 'charged_back': return ['Estornado', 'text-rose-200 bg-rose-400/10 border-rose-400/20'];
    case 'rejected': return ['Recusado', 'text-rose-200 bg-rose-400/10 border-rose-400/20'];
    case 'cancelled': return ['Cancelado', 'text-zinc-300 bg-zinc-400/10 border-zinc-400/20'];
    default: return ['Em análise', 'text-zinc-300 bg-zinc-400/10 border-zinc-400/20'];
  }
}

export function AdminOrdersPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    if (!token) return;
    setLoading(true); setError('');
    try { setItems((await adminListOrders(token)).items); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar pedidos.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, [token]);
  const filtered = useMemo(() => items.filter(item => [item.id, item.customerName, item.customerEmail || '', ...item.pluginNames].some(value => value.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))), [items, search]);

  return <div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Comercial</p><h1 className="mt-2 text-3xl font-semibold">Pedidos</h1><p className="mt-2 text-sm text-muted-foreground">Histórico financeiro somente para consulta. A confirmação e a revogação dependem do provedor.</p></div><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={16}/> Atualizar</button></header>
    <div className="relative max-w-md"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"/><input aria-label="Buscar pedidos" value={search} onChange={event => setSearch(event.target.value)} placeholder="Pedido, cliente ou produto" className="w-full rounded-lg border border-white/15 bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"/></div>
    {error && <p role="alert" className="rounded-xl border border-destructive/40 p-5 text-destructive">{error}</p>}
    {loading ? <p role="status" className="text-muted-foreground">Carregando pedidos...</p> : !error && filtered.length === 0 ? <div className="rounded-xl border border-white/10 bg-card p-12 text-center"><ShoppingBag className="mx-auto text-primary"/><p className="mt-4 text-sm text-muted-foreground">{items.length === 0 ? 'Nenhum pedido registrado.' : 'Nenhum pedido corresponde à busca.'}</p></div> : !error && <div className="overflow-x-auto rounded-xl border border-white/10 bg-card"><table className="w-full min-w-[820px] border-collapse text-left text-sm"><thead className="bg-white/[.03] text-xs text-muted-foreground"><tr><th className="px-5 py-4 font-medium">Pedido</th><th className="px-5 py-4 font-medium">Cliente</th><th className="px-5 py-4 font-medium">Itens</th><th className="px-5 py-4 font-medium">Valor</th><th className="px-5 py-4 font-medium">Status</th></tr></thead><tbody className="divide-y divide-white/10">{filtered.map(item => { const [label, color] = statusLabel(item.status); return <tr key={item.id} className="align-top"><td className="px-5 py-5"><span className="font-mono text-xs">{item.id}</span><span className="mt-2 block text-xs text-muted-foreground">{new Date(item.createdISO).toLocaleString('pt-BR')}</span></td><td className="px-5 py-5"><strong className="font-medium">{item.customerName}</strong><span className="mt-1 block text-xs text-muted-foreground">{item.customerEmail || 'E-mail indisponível'}</span></td><td className="px-5 py-5 text-muted-foreground">{item.pluginNames.length ? item.pluginNames.join(', ') : item.planId || 'Sem itens identificados'}</td><td className="px-5 py-5 font-medium">{money(item.totalCents)}</td><td className="px-5 py-5"><span className={`inline-flex rounded-full border px-3 py-1 text-xs ${color}`}>{label}</span><span className="mt-2 block text-xs text-muted-foreground">{item.paymentProvider}</span></td></tr>; })}</tbody></table></div>}
  </div>;
}
