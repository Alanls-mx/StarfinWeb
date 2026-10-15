import { ArrowRight, ArrowUpRight, Box, PackageSearch } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getFeaturedPlugins, type PluginSummary } from '../lib/api';

export function FeaturedPlugins() {
  const [items, setItems] = useState<PluginSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getFeaturedPlugins()
      .then((data) => { if (!cancelled) setItems(data.items); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="bg-[#10141c] px-5 py-20 sm:px-8 sm:py-24" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#aab0fa]">O catálogo</p>
            <h2 id="featured-title" className="text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Conheça nossos plugins</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#a7afbf]">Produtos e ferramentas da StarfinPlugins. Confira a compatibilidade e a documentação antes de instalar.</p>
          </div>
          <Link to="/plugins" className="inline-flex items-center gap-2 text-sm font-semibold text-[#c5c7ff] transition-colors hover:text-white">Ver catálogo completo <ArrowRight size={16}/></Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando plugins">
            {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-xl border border-white/10 bg-[#1a1f29]" />)}
          </div>
        ) : error || items.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-[#181d26] p-9">
            <PackageSearch size={28} className="text-[#b8bafb]" />
            <h3 className="text-lg font-semibold text-white">{error ? 'Não foi possível carregar o catálogo' : 'Novidades em preparação'}</h3>
            <p className="max-w-xl text-sm leading-7 text-[#a7afbf]">{error ? 'Tente novamente em instantes ou acesse a página de plugins.' : 'Os produtos aparecerão aqui quando forem disponibilizados no catálogo.'}</p>
            <Link to="/plugins" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#c5c7ff]">Abrir catálogo <ArrowRight size={16}/></Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 6).map((plugin) => (
              <Link key={plugin.id} to={`/plugins/${plugin.id}`} className="group flex h-full flex-col rounded-xl border border-white/10 bg-[#191e28] p-6 transition-colors hover:border-[#b8bafb]/45 hover:bg-[#1d2330] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8bafb]">
                <div className="mb-8 flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-[#242b38] text-[#c9cbff]"><Box size={23}/></span>
                  <ArrowUpRight className="text-[#717b8e] transition-colors group-hover:text-white" size={20}/>
                </div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#a8b0c0]">{plugin.category}</p>
                <h3 className="text-xl font-semibold tracking-tight text-white">{plugin.name}</h3>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-[#aeb6c4]">{plugin.description}</p>
                <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-sm text-[#9ea8b9]">{plugin.mcVersion || 'Compatibilidade no detalhe'}</span>
                  <span className="text-base font-semibold text-white">{plugin.priceDisplay}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
