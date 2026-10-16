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
    <section className="bg-[#0b1715] px-5 py-20 text-white sm:px-8 sm:py-25" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="featured-title" className="text-4xl font-extrabold tracking-[-.025em] sm:text-5xl">Produtos publicados</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#bed3c7]">Consulte descrição, preço e compatibilidade dos produtos disponíveis.</p>
          </div>
          <Link to="/plugins" className="inline-flex items-center gap-2 text-sm font-bold text-[#99f1a0] hover:text-white">Ver catálogo completo <ArrowRight size={17}/></Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando plugins">
            {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-[#1c322a]" />)}
          </div>
        ) : error || items.length === 0 ? (
          <div className="grid gap-8 border-y border-white/15 py-8 md:grid-cols-[1fr_270px]">
            <div><h3 className="text-2xl font-bold">{error ? 'Catálogo indisponível' : 'Nenhum produto publicado ainda'}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-[#bed3c7]">{error ? 'Não foi possível consultar os produtos agora.' : 'StarfinBans está em desenvolvimento. Os produtos aparecerão aqui quando os arquivos e detalhes estiverem prontos.'}</p><Link to={error ? '/docs' : '/changelog'} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#a9f58e] hover:underline">{error ? 'Abrir documentação' : 'Acompanhar atualizações'} <ArrowRight size={16}/></Link></div>
            <div className="border-l-2 border-[#85ed65] bg-[#14251e] p-5 font-mono text-sm"><p className="text-[#9ae8ce]">StarfinBans</p><p className="mt-4 text-[#bed3c7]">status: em desenvolvimento</p><p className="mt-2 text-[#bed3c7]">arquivo: não publicado</p></div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.slice(0, 6).map((plugin) => (
              <Link key={plugin.id} to={`/plugins/${plugin.id}`} className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/15 bg-[#14251e] p-6 text-white transition-colors hover:border-[#85ed65]/60">
                <div className="mb-8 flex items-start justify-between"><span className="flex h-13 w-13 items-center justify-center rounded-lg bg-[#203d2c] text-[#a9f58e]"><Box size={24}/></span><ArrowUpRight className="text-[#9dbbaa] group-hover:text-[#a9f58e]" size={20}/></div>
                <p className="mb-2 font-mono text-xs text-[#9ae8ce]">{plugin.category}</p>
                <h3 className="text-xl font-extrabold tracking-tight">{plugin.name}</h3>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-[#bed3c7]">{plugin.description}</p>
                <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-5"><span className="font-mono text-xs text-[#9dbbaa]">{plugin.mcVersion || 'Compatibilidade no detalhe'}</span><span className="font-mono text-base font-bold">{plugin.priceDisplay}</span></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
