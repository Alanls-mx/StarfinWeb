import { useEffect, useState } from 'react';
import { Check, Shield } from 'lucide-react';
import { adminListPlans } from '../../lib/api';
import { useAuth } from '../../lib/auth';

type Plan = { id: string; name: string; price: string; features: string[]; active: boolean };

export function AdminPlansPage() {
  const { state } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (state.status !== 'authenticated') return;
    void adminListPlans(state.token).then(result => setPlans(result.items.filter((plan: Plan) =>
      ['spawn', 'craft', 'nexus'].includes(plan.id)))).catch(() => setError('Não foi possível carregar os planos.'));
  }, [state.status]);
  return <div className="space-y-8">
    <div><h1 className="text-3xl font-bold">Planos</h1>
      <p className="mt-2 text-gray-400">Regras e valores das assinaturas mensais. O lançamento de cada plugin pode ser ajustado em Plugins.</p></div>
    {error && <p role="alert" className="text-red-300">{error}</p>}
    <div className="grid gap-6 md:grid-cols-3">{plans.map(plan => <section key={plan.id} className="rounded-2xl border border-[#177F58]/20 bg-[#172822]/40 p-6">
      <Shield className="mb-4 text-[#A6F3C8]"/><h2 className="text-xl font-bold">{plan.name}</h2>
      <p className="mt-1 text-2xl font-bold text-[#A6F3C8]">{plan.price}</p>
      <ul className="mt-6 space-y-3">{plan.features.map(feature => <li key={feature} className="flex gap-2 text-sm text-gray-300"><Check size={16} className="shrink-0 text-emerald-400"/>{feature}</li>)}</ul>
      <p className="mt-6 text-xs text-gray-400">{plan.active ? 'Ativo' : 'Inativo'}</p>
    </section>)}</div>
  </div>;
}
