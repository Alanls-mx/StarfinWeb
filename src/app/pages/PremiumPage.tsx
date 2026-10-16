import { useEffect, useState } from 'react';
import { ArrowRight, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/auth';

const tiers = [
  { id: 'spawn', name: 'Spawn', price: 'Grátis', features: ['Plugins marcados como Free', '1 instalação por plugin Free'] },
  { id: 'craft', name: 'Craft', price: 'R$ 39,90/mês', features: ['Todos os plugins, exceto lançamentos', '1 instalação por plugin', 'Renovação mensal'] },
  { id: 'nexus', name: 'Nexus', price: 'R$ 49,90/mês', features: ['Todos os plugins, incluindo lançamentos', '2 instalações por plugin', 'Renovação mensal'] }
] as const;

export function PremiumPage() {
  const { state, refresh } = useAuth();
  const navigate = useNavigate();
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

  async function subscribe(planId: 'craft' | 'nexus') {
    if (state.status !== 'authenticated') { navigate('/login?next=/premium'); return; }
    setBusy(planId); setError('');
    try {
      const result = await apiFetch<{ checkoutUrl: string }>('/api/users/me/plans/subscribe', {
        method: 'POST', token: state.token, body: JSON.stringify({ planId })
      });
      const url = new URL(result.checkoutUrl);
      if (url.protocol !== 'https:' || !['www.mercadopago.com.br', 'mercadopago.com.br'].includes(url.hostname)) throw new Error('Endereço de pagamento inválido.');
      window.location.assign(url.toString());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a assinatura.'); setBusy(null); }
  }

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
    <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">O Craft libera o catálogo após o período de lançamento de 60 dias. O Nexus inclui os lançamentos. Compras individuais continuam disponíveis no catálogo.</p>
    {state.status === 'authenticated' && <p className="mt-5 text-sm text-muted-foreground">Seu plano: <strong className="text-foreground">{state.user.plan}</strong>{state.user.planExpiresAt ? ` · acesso até ${new Date(state.user.planExpiresAt).toLocaleDateString('pt-BR')}` : ''}</p>}
    {subscription?.status === 'pending' && <p className="mt-4 text-sm text-amber-200">Assinatura pendente. O acesso será atualizado após a confirmação do pagamento.</p>}
    {error && <p role="alert" className="mt-6 rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
    <div className="mt-10 grid gap-5 md:grid-cols-3">{tiers.map(tier => <section key={tier.id} className="flex flex-col rounded-2xl border border-white/10 bg-card p-7">
      <h2 className="text-2xl font-semibold">{tier.name}</h2><p className="mt-3 text-2xl font-bold text-primary">{tier.price}</p>
      <ul className="mt-7 flex-1 space-y-3 text-sm leading-6 text-muted-foreground">{tier.features.map(feature => <li key={feature}>✓ {feature}</li>)}</ul>
      {tier.id === 'spawn' ? <Link to="/plugins" className="mt-8 rounded-lg border border-white/20 px-4 py-3 text-center text-sm font-semibold">Ver plugins Free</Link>
        : <button type="button" disabled={!!busy || subscription?.status === 'authorized'} onClick={() => void subscribe(tier.id)} className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy === tier.id ? 'Preparando...' : `Assinar ${tier.name}`} <ArrowRight size={16}/></button>}
    </section>)}</div>
    {subscription?.status === 'authorized' && <button type="button" disabled={!!busy} onClick={() => void cancel()} className="mt-7 text-sm text-muted-foreground underline">Cancelar renovação</button>}
  </main>;
}
