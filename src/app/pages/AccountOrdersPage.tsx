import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { RefreshCw } from 'lucide-react';
import { type CustomerOrder, getMyPayments } from '../lib/api';
import { useAuth } from '../lib/auth';
import { AccountNav } from '../components/AccountNav';

const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

function orderStatus(status: string) {
  switch (status) {
    case 'completed': case 'approved': return { label: 'Pago', className: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' };
    case 'pending': case 'processing': return { label: 'Aguardando confirmação', className: 'text-amber-200 bg-amber-400/10 border-amber-400/20' };
    case 'refunded': return { label: 'Reembolsado', className: 'text-sky-200 bg-sky-400/10 border-sky-400/20' };
    case 'charged_back': return { label: 'Estornado', className: 'text-rose-200 bg-rose-400/10 border-rose-400/20' };
    case 'rejected': return { label: 'Recusado', className: 'text-rose-200 bg-rose-400/10 border-rose-400/20' };
    case 'cancelled': return { label: 'Cancelado', className: 'text-zinc-300 bg-zinc-400/10 border-zinc-400/20' };
    default: return { label: 'Em análise', className: 'text-zinc-300 bg-zinc-400/10 border-zinc-400/20' };
  }
}

export function AccountOrdersPage() {
  const { state } = useAuth();
  const [params] = useSearchParams();
  const returnedOrderId = params.get('order');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    if (state.status !== 'authenticated') return;
    setLoading(true);
    setError('');
    try {
      setOrders(await getMyPayments(state.token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível consultar os pedidos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [state.status === 'authenticated' ? state.token : null]);

  if (state.status === 'loading') return <main className="min-h-screen pt-32 text-center text-[#bdd2c5]">Verificando sessão...</main>;
  if (state.status !== 'authenticated') return <main className="mx-auto min-h-[65vh] max-w-5xl px-5 pt-32"><h1 className="text-3xl font-semibold">Meus pedidos</h1><p className="mt-4 text-muted-foreground">Entre para consultar seus pedidos.</p><Link to="/login?next=/account/orders" className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">Entrar</Link></main>;

  const returnedOrder = orders.find(order => order.id === returnedOrderId);
  return <main className="mx-auto min-h-[75vh] max-w-5xl px-5 pb-24 pt-32 sm:px-8">
    <Link to="/account" className="text-sm text-primary hover:underline">← Minha conta</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-white/15 bg-[#10221b] p-7 text-white sm:p-9"><div><h1 className="text-4xl font-extrabold tracking-[-.025em]">Meus pedidos</h1><p className="mt-3 text-sm leading-7 text-[#bdd2c5]">O status pode mudar após a confirmação do provedor.</p></div><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-bold disabled:opacity-50"><RefreshCw size={16} /> Atualizar</button></div>
    <div className="mt-6"><AccountNav /></div>
    {returnedOrderId && !loading && !error && <div role="status" className="mt-8 rounded-xl border border-primary/30 bg-primary/10 p-5"><p className="font-semibold">Retorno do pagamento</p><p className="mt-1 text-sm text-muted-foreground">{returnedOrder ? `Pedido ${returnedOrder.id}: ${orderStatus(returnedOrder.status).label}.` : 'Não foi possível localizar este pedido nesta conta.'} Consulte o status atualizado abaixo.</p></div>}
    {error && <p role="alert" className="mt-8 rounded-xl border border-destructive/40 p-5 text-destructive">{error}</p>}
    {loading ? <p role="status" className="mt-10 text-muted-foreground">Carregando pedidos...</p> : !error && orders.length === 0 ? <div className="mt-10 border-l-2 border-[#85ed65] bg-[#14251e] p-7 text-white"><h2 className="text-xl font-bold">Nenhum pedido ainda</h2><p className="mt-2 text-sm leading-7 text-[#bdd2c5]">Quando você iniciar uma compra, ela aparecerá aqui.</p><Link to="/plugins" className="mt-5 inline-flex font-bold text-[#a9f58e] hover:underline">Ver produtos publicados →</Link></div> : !error && <ul className="mt-8 divide-y divide-white/10 border-y border-white/15">{orders.map(order => { const status = orderStatus(order.status); return <li key={order.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs text-muted-foreground">Pedido {order.id}</p><h2 className="mt-2 text-lg font-semibold">{order.pluginName || 'Pedido de plano'}</h2><p className="mt-2 text-sm text-muted-foreground">{new Date(order.dateISO).toLocaleString('pt-BR')} · {order.method || 'Método não informado'}</p></div><div className="text-right"><p className="font-mono text-lg font-semibold">{money(order.amountCents)}</p><span className={`mt-2 inline-block rounded-md border px-3 py-1 text-xs ${status.className}`}>{status.label}</span></div></div></li>; })}</ul>}
  </main>;
}
