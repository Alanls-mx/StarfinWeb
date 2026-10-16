export type PlanId = 'spawn' | 'craft' | 'nexus';

export const plans: Array<{
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  image: string;
  eyebrow: string;
  headline: string;
  description: string;
  benefits: string[];
  details: string[];
}> = [
  {
    id: 'spawn', name: 'Spawn', price: 'Grátis', cadence: 'para sempre', image: '/images/plans/spawn.webp',
    eyebrow: 'Seu ponto de partida', headline: 'Comece a criar sem limite de instalações Free.',
    description: 'Acesse todos os plugins marcados como Free e instale cada um em quantos servidores quiser.',
    benefits: ['Plugins marcados como Free', 'Instalações ilimitadas por plugin Free', 'Sem cobrança mensal'],
    details: ['Crie sua conta e vincule seus servidores pelo StarfinCore.', 'Os plugins Free podem ser usados em IPs públicos diferentes sem consumir licenças.', 'Plugins pagos continuam disponíveis para compra individual.']
  },
  {
    id: 'craft', name: 'Craft', price: 'R$ 39,90', cadence: 'por mês', image: '/images/plans/craft.webp',
    eyebrow: 'Construa mais', headline: 'Seu catálogo de plugins para construir sem parar.',
    description: 'Use todos os plugins do catálogo, exceto os que ainda estão no período de lançamento.',
    benefits: ['1 instalação por plugin do catálogo', 'Acesso aos plugins após 60 dias do lançamento', 'Plugins Free com instalações ilimitadas', 'Renovação mensal pelo Mercado Pago'],
    details: ['Um lançamento fica fora do Craft nos primeiros 60 dias após sua primeira publicação, salvo ajuste manual do administrador.', 'O acesso aos plugins do plano acompanha a validade da assinatura.', 'Compras individuais continuam valendo pelas próprias regras de IP e instalação.']
  },
  {
    id: 'nexus', name: 'Nexus', price: 'R$ 49,90', cadence: 'por mês', image: '/images/plans/nexus.webp',
    eyebrow: 'Tudo conectado', headline: 'Todo o catálogo, inclusive os lançamentos.',
    description: 'Tenha acesso aos plugins desde a publicação e ative dois servidores por plugin.',
    benefits: ['2 instalações por plugin do catálogo', 'Lançamentos incluídos', 'Plugins Free com instalações ilimitadas', 'Renovação mensal pelo Mercado Pago'],
    details: ['Os plugins marcados como Free permanecem ilimitados.', 'O acesso aos demais plugins do plano acompanha a validade da assinatura.', 'Compras individuais continuam valendo pelas próprias regras de IP e instalação.']
  }
];
