import { ArrowRight, Crown } from 'lucide-react';
import { Link } from 'react-router';

export function PremiumPage() {
  return <main className="mx-auto min-h-[75vh] max-w-5xl px-5 pb-24 pt-32 sm:px-8">
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[.15em] text-amber-200"><Crown size={14}/> Planos</div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Planos StarfinPlugins</h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">A contratação de planos está indisponível enquanto o fluxo de assinatura passa por homologação financeira. As licenças de plugins individuais continuam no catálogo.</p>
      <div className="mt-9 flex flex-wrap gap-3"><Link to="/plugins" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Explorar plugins <ArrowRight size={16}/></Link><Link to="/account/licenses" className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold">Minhas licenças</Link></div>
    </div>
  </main>;
}
