import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export function CheckoutPage() {
  const { items, removeItem, total, planItem } = useCart();
  const { state } = useAuth();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const payable = Math.max(0, total - (coupon?.discountCents || 0));

  async function validateCoupon() {
    setError(''); setCoupon(null);
    if (!couponInput.trim()) return;
    try {
      const result = await apiFetch<{ code: string; discountCents: number }>('/api/commerce/coupon/validate', {
        method: 'POST',
        token: state.status === 'authenticated' ? state.token : null,
        body: JSON.stringify({ code: couponInput.trim(), totalCents: total })
      });
      setCoupon(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Cupom indisponível.'); }
  }

  async function continueToPayment() {
    if (state.status !== 'authenticated') { navigate('/login?next=/checkout'); return; }
    if (planItem) { navigate('/premium'); return; }
    setBusy(true); setError('');
    try {
      const result = await apiFetch<{ orderId: string; checkoutUrl: string }>('/api/commerce/checkout', {
        method: 'POST', token: state.token,
        body: JSON.stringify({ pluginIds: items.map(item => item.id), couponCode: coupon?.code || null })
      });
      const paymentUrl = new URL(result.checkoutUrl);
      const allowedDomains = ['mercadopago.com', 'mercadopago.com.br', 'mercadopago.com.mx', 'mercadopago.com.ar', 'mercadopago.cl', 'mercadopago.com.co'];
      if (paymentUrl.protocol !== 'https:' || !allowedDomains.some(domain => paymentUrl.hostname === domain || paymentUrl.hostname.endsWith(`.${domain}`))) throw new Error('O provedor retornou um endereço de pagamento inesperado.');
      window.location.assign(paymentUrl.toString());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar o pagamento.'); setBusy(false); }
  }

  return <main className="mx-auto min-h-[75vh] max-w-7xl px-5 pb-24 pt-32 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Loja / Pedido</p>
    <h1 className="mt-3 text-4xl font-semibold tracking-tight">Seu carrinho</h1>
    <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Confira os produtos antes de seguir para o provedor de pagamento. A licença será liberada após a confirmação do pedido.</p>
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-label="Produtos no carrinho" className="overflow-hidden rounded-xl border border-white/10 bg-card">
        {items.length === 0 ? <div className="px-7 py-16 text-center"><ShoppingBag size={32} className="mx-auto text-primary"/><h2 className="mt-4 text-xl font-semibold">Carrinho vazio</h2><p className="mt-2 text-sm text-muted-foreground">Explore o catálogo para escolher seus plugins.</p><Link to="/plugins" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Ver catálogo <ArrowRight size={16}/></Link></div> :
          <ul className="divide-y divide-white/10">{items.map(item => <li key={item.id} className="flex items-center gap-5 p-5 sm:p-7"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-secondary">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover"/> : <ShoppingBag size={22} className="text-primary"/>}</div><div className="min-w-0 flex-1"><h2 className="font-semibold">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{item.type === 'plan' ? 'Plano' : 'Plugin'}</p></div><div className="text-right"><strong className="block whitespace-nowrap">{money(item.price)}</strong><button type="button" onClick={() => { removeItem(item.id); setCoupon(null); }} className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive" aria-label={`Remover ${item.name}`}><Trash2 size={13}/> Remover</button></div></li>)}</ul>}
      </section>
      <aside className="h-fit rounded-xl border border-white/10 bg-card p-6 sm:p-7"><h2 className="text-xl font-semibold">Resumo do pedido</h2><dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(total)}</dd></div>{coupon && <div className="flex justify-between text-emerald-300"><dt>Cupom {coupon.code}</dt><dd>− {money(coupon.discountCents)}</dd></div>}<div className="flex justify-between border-t border-white/10 pt-4 text-lg font-semibold"><dt>Total estimado</dt><dd>{money(payable)}</dd></div></dl>
        {items.length > 0 && <div className="mt-7"><label htmlFor="coupon" className="text-xs font-medium text-muted-foreground">Cupom de desconto</label><div className="mt-2 flex gap-2"><input id="coupon" value={couponInput} onChange={event => { setCouponInput(event.target.value); setCoupon(null); }} className="min-w-0 flex-1 rounded-lg border border-input bg-input-background px-3 py-2.5 text-sm" placeholder="Código"/><button type="button" onClick={validateCoupon} className="rounded-lg border border-white/20 px-3 text-sm">Aplicar</button></div></div>}
        {planItem && <p className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">As assinaturas são renovadas mensalmente. Escolha o plano na página de planos.</p>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
        <button type="button" disabled={items.length === 0 || busy} onClick={continueToPayment} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Preparando pagamento...' : planItem ? 'Escolher assinatura' : 'Continuar para pagamento'} <ArrowRight size={16}/></button>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">O valor final é confirmado pelo servidor antes do redirecionamento. A criação do pedido não confirma o pagamento.</p>
      </aside>
    </div>
  </main>;
}
