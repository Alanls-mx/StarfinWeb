import { ArrowRight, ArrowUpRight, Box, PackageSearch, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getCategories, getPlugins, type PluginCategory, type PluginSummary } from '../lib/api';
import { useCart } from '../lib/cart';

type Sort = 'popular' | 'rating' | 'recent' | 'price_asc' | 'price_desc';
const sorts: Array<{ value: Sort; label: string }> = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'popular', label: 'Destaques' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' }
];

export function Store() {
  const { addItem } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Array<PluginCategory | 'Todas'>>(['Todas']);
  const [items, setItems] = useState<PluginSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const query = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'Todas';
  const sortValue = searchParams.get('sort') || 'recent';
  const sort: Sort = sorts.some((s) => s.value === sortValue) ? sortValue as Sort : 'recent';

  const changeFilter = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || (name === 'category' && value === 'Todas')) next.delete(name);
    else next.set(name, value);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((res) => { if (!cancelled) setCategories(['Todas', ...res.items]); })
      .catch(() => { if (!cancelled) setCategories(['Todas']); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getPlugins({
      search: query || undefined,
      category: category === 'Todas' ? undefined : category,
      sort,
      limit: 48
    }).then((res) => {
      if (cancelled) return;
      setItems(res.items);
      setTotal(res.total);
    }).catch(() => { if (!cancelled) { setError(true); setItems([]); setTotal(0); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, category, sort]);

  const resultLabel = useMemo(() => {
    if (loading) return 'Carregando produtos…';
    if (error) return 'Catálogo indisponível';
    return `${total} ${total === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
  }, [loading, error, total]);

  return (
    <main className="min-h-screen bg-[#10141c] px-5 pb-24 pt-32 text-white sm:px-8 sm:pt-36">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-white/10 pb-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.2em] text-[#b8bafb]">StarfinPlugins / Catálogo</p>
          <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Plugins para o seu servidor</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#aab3c2]">Explore o catálogo, confira versões e requisitos e encontre as ferramentas adequadas à sua rede.</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_240px]">
          <label className="relative block">
            <span className="sr-only">Buscar plugins</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8b95a7]" size={19}/>
            <input value={query} onChange={(event) => changeFilter('search', event.target.value)}
              className="h-13 w-full rounded-lg border border-white/15 bg-[#1a202a] py-3 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#8791a3] focus:border-[#b8bafb]"
              type="search" placeholder="Buscar por nome ou funcionalidade" />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-white/15 bg-[#1a202a] px-4">
            <span className="shrink-0 text-xs text-[#9fa8b8]">Ordenar</span>
            <select value={sort} onChange={(event) => changeFilter('sort', event.target.value)} className="h-full min-h-12 w-full bg-transparent py-3 text-sm text-white outline-none">
              {sorts.map((s) => <option key={s.value} value={s.value} className="bg-[#1a202a]">{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-7 flex flex-wrap gap-2" aria-label="Filtrar por categoria">
          {categories.map((item) => <button type="button" key={item} onClick={() => changeFilter('category', item)}
            aria-pressed={category === item}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${category === item ? 'border-[#b8bafb] bg-[#b8bafb]/15 text-[#d0d2ff]' : 'border-white/10 bg-[#1a202a] text-[#aab3c2] hover:border-white/25 hover:text-white'}`}>
            {item}
          </button>)}
        </div>
        <div className="mt-10 flex items-center justify-between border-b border-white/10 pb-4">
          <p className="text-sm text-[#aeb7c6]" role="status">{resultLabel}</p>
          {(query || category !== 'Todas') && <button type="button" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })} className="text-xs font-semibold text-[#c3c5ff] hover:underline">Limpar filtros</button>}
        </div>

        {error ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-[#1a202a] p-10 text-center">
            <PackageSearch size={28} className="mx-auto text-[#b8bafb]"/>
            <p className="mt-4 text-lg font-semibold">Não foi possível carregar os produtos</p>
            <p className="mt-2 text-sm text-[#aab3c2]">Verifique sua conexão e tente novamente.</p>
            <button type="button" onClick={() => changeFilter('sort', sort === 'recent' ? 'popular' : 'recent')} className="mt-5 rounded-lg border border-white/20 px-4 py-2 text-sm">Tentar novamente</button>
          </div>
        ) : loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando catálogo">
            {[0, 1, 2, 3, 4, 5].map((id) => <div key={id} className="h-72 animate-pulse rounded-xl border border-white/10 bg-[#1a202a]"/>)}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-xl border border-white/10 bg-[#1a202a] px-5 py-16 text-center">
            <PackageSearch size={30} className="text-[#b8bafb]"/>
            <p className="mt-4 text-lg font-semibold">Nenhum plugin encontrado</p>
            <p className="mt-2 text-sm text-[#aab3c2]">Experimente outra pesquisa ou categoria.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((plugin) => (
              <article key={plugin.id} className="group flex flex-col rounded-xl border border-white/10 bg-[#191e28] p-6 transition-colors hover:border-[#b8bafb]/40 hover:bg-[#1d2330]">
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-[#272d3b] text-[#c3c5ff]"><Box size={24}/></div>
                  <Link to={`/plugins/${plugin.id}`} aria-label={`Ver detalhes de ${plugin.name}`} className="rounded-lg p-2 text-[#808c9f] hover:text-white"><ArrowUpRight size={19}/></Link>
                </div>
                <span className="mb-2 text-xs font-medium uppercase tracking-[.13em] text-[#aab4c4]">{plugin.category}</span>
                <h2 className="text-xl font-semibold tracking-tight">{plugin.name}</h2>
                <p className="mt-3 line-clamp-3 min-h-20 flex-1 text-sm leading-7 text-[#acb5c3]">{plugin.description}</p>
                <p className="mt-5 text-xs text-[#8996a8]">Minecraft {plugin.mcVersion || 'Consulte a compatibilidade'}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-xl font-semibold">{plugin.priceDisplay}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label={`Adicionar ${plugin.name} ao carrinho`} onClick={() => addItem({
                      id: String(plugin.id),
                      name: plugin.name,
                      price: plugin.priceCents,
                      slug: String(plugin.id),
                      imageUrl: plugin.imageUrl
                    })} className="rounded-lg border border-white/15 p-2.5 text-[#c2c4ff] hover:border-[#b8bafb] hover:bg-white/[.05]"><ShoppingBag size={17}/></button>
                    <Link to={`/plugins/${plugin.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2.5 text-xs font-semibold text-white hover:border-[#b8bafb]">Detalhes <ArrowRight size={14}/></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
