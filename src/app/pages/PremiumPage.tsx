import { useEffect, useState } from 'react';
import { ArrowRight, Crown } from 'lucide-react';
import { Link } from 'react-router';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';
import { plans } from '../lib/plans';

export function PremiumPage() {
  const { state, refresh } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<{ status: string; planId: string; paidThroughISO: string | null } | null>(null);

  useEffect(() => {
    if (state.status === 'authenticated') void apiFetch<{ item: typeof subscription }>('/api/users/me/subscription', { token: state.token })
      .then(result => setSubscription(result.item)).catch(() => {});
  }, [state.status]);

  useEffect(() => {
    if (state.status !== 'authenticated' || subscription?.status !== 'pending') return;
    const timer = window.setInterval(() => {
      void apiFetch<{ item: typeof subscription }>('/api/users/me/subscription', { token: state.token })
        .then(result => { setSubscription(result.item); if (result.item?.status === 'authorized') void refresh(); }).catch(() => {});
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [state.status, subscription?.status]);

  async function cancel() {
    if (state.status !== 'authenticated') return;
    if (!window.confirm('Cancelar a renovação desta assinatura?')) return;
    setBusy('cancel'); setError('');
    try {
      await apiFetch('/api/users/me/subscription/cancel', { method: 'POST', token: state.token });
      setSubscription(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar.'); }
    finally { setBusy(null); }
  }

  return <main className="mx-auto min-h-[75vh] max-w-6xl px-5 pb-24 pt-32 sm:px-8">
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[.15em] text-primary"><Crown size={14}/> Planos</div>
    <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Escolha seu plano</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">Comece com plugins Free e instalações ilimitadas. Craft e Nexus ampliam seu acesso ao catálogo conforme sua assinatura.</p>
    {state.status === 'authenticated' && <p className="mt-5 text-sm text-muted-foreground">Seu plano: <strong className="text-foreground">{state.user.plan}</strong>{state.user.planExpiresAt ? ` · acesso até ${new Date(state.user.planExpiresAt).toLocaleDateString('pt-BR')}` : ''}</p>}
    {subscription?.status === 'pending' && <p className="mt-4 text-sm text-amber-200">Assinatura pendente. O acesso será atualizado após a confirmação do pagamento.</p>}
    {error && <p role="alert" className="mt-6 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
    <div className="mt-10 grid gap-5 md:grid-cols-3">{plans.map(plan => <Link key={plan.id} to={`/premium/${plan.id}`} aria-label={`Conhecer o plano ${plan.name}`} className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card transition-colors hover:border-primary/50">
      <div className="block overflow-hidden"><img src={plan.image} alt={`Arte do plano ${plan.name}`} className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /></div>
      <div className="flex flex-1 flex-col p-7"><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">{plan.eyebrow}</p><h2 className="mt-2 text-2xl font-semibold">{plan.name}</h2><p className="mt-3 text-2xl font-bold text-primary">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">{plan.cadence}</span></p>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{plan.description}</p>
      <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-muted-foreground">{plan.benefits.slice(0, 3).map(feature => <li key={feature}>✓ {feature}</li>)}</ul>
      <span className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Conhecer {plan.name} <ArrowRight size={16}/></span></div>
    </Link>)}</div>
    {subscription?.status === 'authorized' && <button type="button" disabled={!!busy} onClick={() => void cancel()} className="mt-7 text-sm text-muted-foreground underline">Cancelar renovação</button>}
  </main>;
}
