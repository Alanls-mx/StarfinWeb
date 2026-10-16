import { ArrowRight, ArrowUpRight, Box } from 'lucide-react';
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
    <section className="bg-[#edf5ed] px-5 py-16 text-[#11281c] sm:px-8 sm:py-20" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="featured-title" className="text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Produtos publicados</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#456252]">Consulte descrição, preço e compatibilidade dos produtos disponíveis.</p>
          </div>
          <Link to="/plugins" className="inline-flex items-center gap-2 text-sm font-bold text-[#146942] hover:underline">Ver catálogo completo <ArrowRight size={17}/></Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando plugins">
            {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-lg bg-[#d4e5d7]" />)}
          </div>
        ) : error || items.length === 0 ? (
          <div className="grid gap-8 border-y border-[#b8d3bf] py-8 md:grid-cols-[1fr_270px]">
            <div><p className="font-mono text-xs text-[#157251]">PROJETOS / 01</p><h3 className="mt-3 text-2xl font-bold">{error ? 'Catálogo temporariamente indisponível' : 'StarfinBans está em desenvolvimento'}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-[#456252]">{error ? 'Não foi possível consultar os produtos agora.' : 'Nosso projeto de moderação e punições ainda não tem versão comercial publicada. Acompanhe o desenvolvimento e consulte os detalhes quando houver lançamento.'}</p><Link to={error ? '/support' : '/changelog'} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#146942] hover:underline">{error ? 'Abrir suporte' : 'Acompanhar projeto'} <ArrowRight size={16}/></Link></div>
            <div className="flex flex-col justify-center border-l-2 border-[#1a9b69] bg-white p-5 font-mono text-sm"><p className="text-[#157251]">STARFINBANS</p><p className="mt-4 text-[#456252]">área: moderação</p><p className="mt-2 text-[#456252]">estado: em desenvolvimento</p><p className="mt-2 text-[#456252]">arquivo: ainda não publicado</p></div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 6).map((plugin) => (
              <Link key={plugin.id} to={`/plugins/${plugin.id}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#b8d3bf] bg-white p-6 text-[#11281c] transition-colors hover:border-[#1a9b69]">
                <div className="mb-8 flex items-start justify-between"><span className="flex h-13 w-13 items-center justify-center rounded-lg bg-[#d9ede0] text-[#146942]"><Box size={24}/></span><ArrowUpRight className="text-[#456252] group-hover:text-[#146942]" size={20}/></div>
                <p className="mb-2 font-mono text-xs text-[#157251]">{plugin.category}</p>
                <h3 className="text-xl font-extrabold tracking-tight">{plugin.name}</h3>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-[#456252]">{plugin.description}</p>
                <div className="mt-7 flex items-center justify-between border-t border-[#c9ddce] pt-5"><span className="font-mono text-xs text-[#456252]">{plugin.mcVersion || 'Compatibilidade no detalhe'}</span><span className="font-mono text-base font-bold">{plugin.priceDisplay}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
