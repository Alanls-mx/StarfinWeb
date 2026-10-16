import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { plans } from '../lib/plans';

export function PlanDetailPage() {
  const { planId } = useParams();
  const plan = plans.find(item => item.id === planId);
  const { state } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<{ status: string; planId: string } | null>(null);

  useEffect(() => {
    if (state.status !== 'authenticated') return;
    void apiFetch<{ item: typeof subscription }>('/api/users/me/subscription', { token: state.token })
      .then(result => setSubscription(result.item)).catch(() => {});
  }, [state.status]);

  if (!plan) return <main className="mx-auto min-h-[70vh] max-w-5xl px-5 pt-36"><h1 className="text-3xl font-bold">Plano não encontrado</h1><Link to="/premium" className="mt-6 inline-block text-primary underline">Ver planos</Link></main>;

  async function subscribe() {
    if (!plan || plan.id === 'spawn') return;
    if (state.status !== 'authenticated') { navigate(`/login?next=/premium/${plan.id}`); return; }
    setBusy(true); setError('');
    try {
      const result = await apiFetch<{ checkoutUrl: string }>('/api/users/me/plans/subscribe', {
        method: 'POST', token: state.token, body: JSON.stringify({ planId: plan.id })
      });
      const url = new URL(result.checkoutUrl);
      if (url.protocol !== 'https:' || !['www.mercadopago.com.br', 'mercadopago.com.br'].includes(url.hostname))
        throw new Error('Endereço de pagamento inválido.');
      window.location.assign(url.toString());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a assinatura.'); setBusy(false); }
  }

  return <main className="min-h-[80vh] pb-24 pt-28 text-white">
    <div className="mx-auto max-w-7xl px-5 sm:px-8"><Link to="/premium" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16}/> Todos os planos</Link></div>
    <section className="mx-auto mt-7 grid max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-[#10251f] lg:grid-cols-2">
      <div className="relative min-h-[320px] overflow-hidden"><img src={plan.image} alt={`Arte do plano ${plan.name}`} className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-[#10251f] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#10251f]/30"/></div>
      <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16"><span className="text-xs font-bold uppercase tracking-[.2em] text-primary">{plan.eyebrow}</span>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl">{plan.name}</h1>
        <p className="mt-5 text-2xl font-bold text-primary">{plan.price}<span className="ml-2 text-sm font-medium text-muted-foreground">{plan.cadence}</span></p>
        <h2 className="mt-8 text-2xl font-semibold leading-snug">{plan.headline}</h2>
        <p className="mt-4 max-w-xl leading-7 text-muted-foreground">{plan.description}</p>
        {error && <p role="alert" className="mt-6 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
        <div className="mt-9 flex flex-wrap gap-3">{plan.id === 'spawn'
          ? <Link to="/plugins?tag=Free" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground">Explorar plugins Free <ArrowRight size={17}/></Link>
          : <button type="button" disabled={busy || subscription?.status === 'authorized'} onClick={() => void subscribe()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Preparando assinatura...' : subscription?.status === 'authorized' ? 'Assinatura ativa' : `Assinar ${plan.name}`} <ArrowRight size={17}/></button>}
          <Link to="/account/servers" className="rounded-lg border border-white/20 px-6 py-3 font-semibold">Minhas instalações</Link></div>
        {subscription?.status === 'pending' && subscription.planId === plan.id && <p className="mt-4 text-sm text-amber-200">Aguardando confirmação do pagamento pelo Mercado Pago.</p>}
      </div>
    </section>
    <div className="mx-auto mt-16 grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2"><section><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">O que você recebe</p><h2 className="mt-3 text-3xl font-bold">Benefícios do {plan.name}</h2><ul className="mt-7 grid gap-3">{plan.benefits.map(benefit => <li key={benefit} className="flex items-start gap-3 rounded-xl border border-white/10 bg-card p-4"><Check className="mt-0.5 shrink-0 text-primary" size={19}/><span>{benefit}</span></li>)}</ul></section>
      <section><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Como funciona</p><h2 className="mt-3 text-3xl font-bold">Da escolha à ativação</h2><ol className="mt-7 space-y-4">{plan.details.map((detail, index) => <li key={detail} className="flex gap-4 border-l-2 border-primary/40 pl-5"><span className="font-mono text-sm font-bold text-primary">0{index + 1}</span><p className="leading-7 text-muted-foreground">{detail}</p></li>)}</ol><div className="mt-9 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5"><ShieldCheck className="shrink-0 text-primary" size={22}/><p className="text-sm leading-6 text-muted-foreground">O StarfinCore consulta o site para saber quais plugins esta instalação pode usar. O acesso a produtos pagos acompanha as compras aprovadas ou a assinatura válida.</p></div></section></div>
    <div className="mx-auto mt-16 max-w-7xl border-t border-white/10 px-5 pt-9 sm:px-8"><h2 className="text-2xl font-bold">Compare antes de escolher</h2><div className="mt-5 flex flex-wrap gap-3">{plans.filter(item => item.id !== plan.id).map(item => <Link key={item.id} to={`/premium/${item.id}`} className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold hover:border-primary">Conhecer {item.name} · {item.price}</Link>)}</div></div>
  </main>;
}
