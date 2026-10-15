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
    <section className="bg-[#0b1715] px-5 py-20 text-white sm:px-8 sm:py-25" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="sf-eyebrow mb-3">O catálogo Starfin</p>
            <h2 id="featured-title" className="text-4xl font-extrabold tracking-[-.055em] sm:text-5xl">Ferramentas feitas para jogar melhor.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#bed3c7]">Cada produto publicado traz informações de compatibilidade e documentação para você decidir com clareza.</p>
          </div>
          <Link to="/plugins" className="inline-flex items-center gap-2 text-sm font-bold text-[#99f1a0] hover:text-white">Ver catálogo completo <ArrowRight size={17}/></Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando plugins">
            {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-[#1c322a]" />)}
          </div>
        ) : error || items.length === 0 ? (
          <div className="grid overflow-hidden rounded-[1.8rem] border border-[#b5ecc1]/25 bg-[#ecf8e9] text-[#12291d] md:grid-cols-[minmax(0,1fr)_300px]">
            <div className="p-8 sm:p-11">
              <PackageSearch size={30} className="text-[#138156]" />
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight">{error ? 'O catálogo está temporariamente indisponível' : 'A próxima novidade está na forja'}</h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#4a6554]">{error ? 'Tente novamente em alguns instantes. Enquanto isso, consulte nossos guias.' : 'Os produtos aparecerão aqui quando forem publicados. Acompanhe as atualizações da StarfinPlugins.'}</p>
              <Link to={error ? '/docs' : '/changelog'} className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#096b48] hover:underline">{error ? 'Abrir documentação' : 'Acompanhar atualizações'} <ArrowRight size={16}/></Link>
            </div>
            <div className="relative min-h-50 overflow-hidden bg-[#c7efcc] md:min-h-70"><div aria-hidden="true" className="sf-grid absolute inset-0"/><img src="/voxel/creator-avatar.webp" alt="Personagem voxel aguardando novidades do catálogo" loading="lazy" className="absolute inset-x-0 -bottom-8 mx-auto h-[120%] w-full object-contain object-bottom" /></div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 6).map((plugin) => (
              <Link key={plugin.id} to={`/plugins/${plugin.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#b6eac1]/25 bg-[#f4f8ef] p-6 text-[#142b20] transition-transform hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#85ed65]">
                <div className="mb-8 flex items-start justify-between"><span className="flex h-13 w-13 items-center justify-center rounded-xl bg-[#ccebd4] text-[#0e7750]"><Box size={24}/></span><ArrowUpRight className="text-[#58806c] group-hover:text-[#0e7750]" size={20}/></div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#328361]">{plugin.category}</p>
                <h3 className="text-xl font-extrabold tracking-tight">{plugin.name}</h3>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-[#4d6556]">{plugin.description}</p>
                <div className="mt-7 flex items-center justify-between border-t border-[#cde0d0] pt-5"><span className="text-sm text-[#547462]">{plugin.mcVersion || 'Compatibilidade no detalhe'}</span><span className="text-base font-extrabold">{plugin.priceDisplay}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
