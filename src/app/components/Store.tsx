import { ArrowRight, ArrowUpRight, PackageSearch, Search, ShoppingBag } from 'lucide-react';
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
  const [retryKey, setRetryKey] = useState(0);

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
    getPlugins({ search: query || undefined, category: category === 'Todas' ? undefined : category, sort, limit: 48 })
      .then((res) => { if (!cancelled) { setItems(res.items); setTotal(res.total); } })
      .catch(() => { if (!cancelled) { setError(true); setItems([]); setTotal(0); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, category, sort, retryKey]);

  const resultLabel = useMemo(() => {
    if (loading) return 'Carregando produtos…';
    if (error) return 'Catálogo indisponível';
    return `${total} ${total === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
  }, [loading, error, total]);

  return (
    <main className="min-h-screen bg-[#0b1715] text-white">
      <section className="relative overflow-hidden bg-[#0d2822] px-5 pb-15 pt-32 text-white sm:px-8 sm:pt-38">
        <div aria-hidden="true" className="sf-grid absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl">
          <div><h1 className="max-w-2xl text-4xl font-extrabold tracking-[-.025em] sm:text-6xl">Plugins Starfin</h1><p className="mt-5 max-w-2xl text-base leading-8 text-[#c9e2d4]">Consulte produtos publicados, versões e informações de compatibilidade antes de comprar.</p></div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        {!loading && (total > 0 || query || category !== 'Todas') && <section className="relative -mt-5 rounded-lg border border-white/15 bg-[#14251e] p-4 sm:p-5" aria-label="Buscar e filtrar plugins">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <label className="relative block"><span className="sr-only">Buscar plugins</span><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a9c1b8]" size={19}/><input value={query} onChange={(event) => changeFilter('search', event.target.value)} className="h-13 w-full rounded-lg border border-white/20 bg-[#0b1715] py-3 pl-12 pr-4 text-sm text-white placeholder:text-[#9cb8a6]" type="search" placeholder="Nome ou funcionalidade" /></label>
            <label className="flex items-center gap-3 rounded-lg border border-white/20 bg-[#0b1715] px-4"><span className="shrink-0 text-xs font-bold text-[#a9c1b8]">Ordenar</span><select value={sort} onChange={(event) => changeFilter('sort', event.target.value)} className="h-full min-h-12 w-full bg-transparent py-3 text-sm font-semibold text-white">{sorts.map((s) => <option key={s.value} value={s.value} className="bg-[#0b1715]">{s.label}</option>)}</select></label>
          </div>
          {categories.length > 1 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por categoria">{categories.map((item) => <button type="button" key={item} onClick={() => changeFilter('category', item)} aria-pressed={category === item} className={`rounded-md border px-4 py-2 text-sm font-bold transition-colors ${category === item ? 'border-[#85ed65] bg-[#85ed65]/10 text-[#a9f58e]' : 'border-white/20 text-[#c6d9ca] hover:border-white/50'}`}>{item}</button>)}</div>}
        </section>}

        <div className="mt-11 flex items-center justify-between border-b border-white/15 pb-4"><p className="font-mono text-xs text-[#a9c1b8]" role="status">{resultLabel}</p>{(query || category !== 'Todas') && <button type="button" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })} className="text-xs font-bold text-[#a9f58e] hover:underline">Limpar filtros</button>}</div>

        {error ? <div className="mt-8 sf-soft-panel p-9 text-center"><PackageSearch size={30} className="mx-auto text-[#16805c]"/><h2 className="mt-4 text-xl font-extrabold">Não foi possível carregar os produtos</h2><p className="mt-2 text-sm text-[#547063]">Verifique sua conexão e tente novamente.</p><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-6 sf-button-primary">Tentar novamente</button></div>
        : loading ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando catálogo">{[0, 1, 2, 3, 4, 5].map((id) => <div key={id} className="h-72 animate-pulse rounded-2xl bg-[#deeee0]"/>)}</div>
        : items.length === 0 ? <div className="mt-8 grid gap-8 border-y border-white/15 py-8 md:grid-cols-[1fr_250px]"><div><h2 className="text-2xl font-bold">{query || category !== 'Todas' ? 'Nenhum resultado' : 'Nenhum plugin publicado ainda'}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[#bdd2c5]">{query || category !== 'Todas' ? 'Tente outra busca ou limpe os filtros.' : 'StarfinBans está em desenvolvimento. Os filtros aparecerão com o primeiro produto publicado.'}</p><Link to="/changelog" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#a9f58e] hover:underline">Acompanhar atualizações <ArrowRight size={17}/></Link></div><div className="border-l-2 border-[#85ed65] bg-[#14251e] p-5 font-mono text-sm"><p className="text-[#9ae8ce]">StarfinBans</p><p className="mt-4 text-[#bdd2c5]">status: em desenvolvimento</p><p className="mt-2 text-[#bdd2c5]">arquivo: não publicado</p></div></div>
        : <div className="mt-6 divide-y divide-white/10 border-y border-white/15">{items.map((plugin) => <article key={plugin.id} className="grid gap-5 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><p className="font-mono text-xs text-[#9ae8ce]">{plugin.category}{plugin.mcVersion ? ` / Minecraft ${plugin.mcVersion}` : ''}</p><Link to={`/plugins/${plugin.id}`} className="mt-2 inline-flex items-center gap-2 text-xl font-bold hover:text-[#a9f58e]">{plugin.name}<ArrowUpRight size={18}/></Link><p className="mt-2 max-w-2xl text-sm leading-6 text-[#bdd2c5]">{plugin.description}</p></div><div className="flex items-center gap-3 md:justify-end"><strong className="mr-2 whitespace-nowrap font-mono text-sm">{plugin.priceDisplay}</strong><Link to={`/plugins/${plugin.id}`} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold hover:border-[#85ed65]">Detalhes</Link><button type="button" aria-label={`Adicionar ${plugin.name} ao carrinho`} onClick={() => addItem({ id: String(plugin.id), name: plugin.name, price: plugin.priceCents, slug: String(plugin.id), imageUrl: plugin.imageUrl })} className="rounded-lg bg-[#85ed65] p-2.5 text-[#102014] hover:bg-[#a7f28c]"><ShoppingBag size={17}/></button></div></article>)}</div>}
      </div>
    </main>
  );
}
