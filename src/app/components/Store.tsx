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
    <main className="min-h-screen bg-[#f4f8ef] text-[#12251d]">
      <section className="relative overflow-hidden bg-[#0d2822] px-5 pb-15 pt-32 text-white sm:px-8 sm:pt-38">
        <div aria-hidden="true" className="sf-grid absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-7 sm:grid-cols-[1fr_220px] lg:grid-cols-[1fr_290px]">
          <div><p className="sf-eyebrow mb-4">StarfinPlugins / catálogo</p><h1 className="max-w-2xl text-4xl font-extrabold tracking-[-.06em] sm:text-6xl">Plugins com propósito para o seu servidor.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-[#c9e2d4]">Descubra ferramentas próprias, confira compatibilidade e acompanhe o que está chegando à StarfinPlugins.</p></div>
          <div className="relative mx-auto hidden h-62 w-full max-w-70 overflow-hidden rounded-[1.5rem] bg-[linear-gradient(140deg,#c7f7a4,#63dad1)] sm:block"><img src="/voxel/guardian.webp" alt="Guardião voxel apresentando o catálogo" className="absolute inset-x-0 bottom-0 h-[110%] w-full object-contain object-bottom" /></div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <section className="relative -mt-5 rounded-2xl border border-[#c4ddcc] bg-white p-4 shadow-[0_14px_35px_rgba(16,57,39,.08)] sm:p-5" aria-label="Buscar e filtrar plugins">
          <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
            <label className="relative block"><span className="sr-only">Buscar plugins</span><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#3c8065]" size={19}/><input value={query} onChange={(event) => changeFilter('search', event.target.value)} className="h-13 w-full rounded-xl border border-[#c8dfce] bg-[#f6faf4] py-3 pl-12 pr-4 text-sm text-[#173526] outline-none placeholder:text-[#648272] focus:border-[#169767] focus:ring-2 focus:ring-[#85ed65]/30" type="search" placeholder="Nome ou funcionalidade" /></label>
            <label className="flex items-center gap-3 rounded-xl border border-[#c8dfce] bg-[#f6faf4] px-4"><span className="shrink-0 text-xs font-bold text-[#527362]">Ordenar</span><select value={sort} onChange={(event) => changeFilter('sort', event.target.value)} className="h-full min-h-12 w-full bg-transparent py-3 text-sm font-semibold text-[#173526] outline-none">{sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por categoria">{categories.map((item) => <button type="button" key={item} onClick={() => changeFilter('category', item)} aria-pressed={category === item} className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${category === item ? 'border-[#176d4b] bg-[#dcf6d6] text-[#125536]' : 'border-[#d7e7da] bg-white text-[#4d6f5c] hover:border-[#42a577]'}`}>{item}</button>)}</div>
        </section>

        <div className="mt-11 flex items-center justify-between border-b border-[#cddfce] pb-4"><p className="text-sm font-semibold text-[#536f5b]" role="status">{resultLabel}</p>{(query || category !== 'Todas') && <button type="button" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })} className="text-xs font-bold text-[#0b7850] hover:underline">Limpar filtros</button>}</div>

        {error ? <div className="mt-8 sf-soft-panel p-9 text-center"><PackageSearch size={30} className="mx-auto text-[#16805c]"/><h2 className="mt-4 text-xl font-extrabold">Não foi possível carregar os produtos</h2><p className="mt-2 text-sm text-[#547063]">Verifique sua conexão e tente novamente.</p><button type="button" onClick={() => setRetryKey((value) => value + 1)} className="mt-6 sf-button-primary">Tentar novamente</button></div>
        : loading ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Carregando catálogo">{[0, 1, 2, 3, 4, 5].map((id) => <div key={id} className="h-72 animate-pulse rounded-2xl bg-[#deeee0]"/>)}</div>
        : items.length === 0 ? <div className="mt-8 grid overflow-hidden sf-soft-panel md:grid-cols-[1fr_240px]"><div className="p-8 sm:p-10"><PackageSearch size={28} className="text-[#188462]"/><h2 className="mt-4 text-2xl font-extrabold">{query || category !== 'Todas' ? 'Nada por aqui ainda' : 'Novos plugins estão a caminho'}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[#547063]">{query || category !== 'Todas' ? 'Tente outra busca ou remova os filtros para ver todo o catálogo.' : 'Os produtos serão mostrados aqui quando forem publicados. Acompanhe as novidades e conheça nossa documentação.'}</p><Link to="/changelog" className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#0c7550] hover:underline">Ver atualizações <ArrowRight size={17}/></Link></div><div className="relative min-h-52 bg-[#c9efdc]"><img src="/voxel/engineer.webp" alt="Personagem voxel apresentando as próximas novidades" loading="lazy" className="absolute inset-x-0 -bottom-6 h-[120%] w-full object-contain object-bottom" /></div></div>
        : <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((plugin) => <article key={plugin.id} className="group flex flex-col rounded-2xl border border-[#d0e4d3] bg-white p-6 shadow-[0_7px_25px_rgba(17,73,41,.05)] transition-transform hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(17,73,41,.12)]"><div className="mb-8 flex items-start justify-between"><div className="flex h-13 w-13 items-center justify-center rounded-xl bg-[#dff5df] text-[#137b53]"><Box size={24}/></div><Link to={`/plugins/${plugin.id}`} aria-label={`Ver detalhes de ${plugin.name}`} className="rounded-lg p-2 text-[#4c8469] hover:bg-[#eaf6eb]"><ArrowUpRight size={19}/></Link></div><span className="mb-2 text-xs font-bold uppercase tracking-[.13em] text-[#1c865e]">{plugin.category}</span><h2 className="text-xl font-extrabold tracking-tight">{plugin.name}</h2><p className="mt-3 line-clamp-3 min-h-20 flex-1 text-sm leading-7 text-[#4e6c59]">{plugin.description}</p><p className="mt-5 text-xs text-[#5a7764]">Minecraft {plugin.mcVersion || 'Consulte a compatibilidade'}</p><div className="mt-5 flex items-center justify-between border-t border-[#d8e8d9] pt-5"><span className="text-xl font-extrabold">{plugin.priceDisplay}</span><div className="flex items-center gap-2"><button type="button" aria-label={`Adicionar ${plugin.name} ao carrinho`} onClick={() => addItem({ id: String(plugin.id), name: plugin.name, price: plugin.priceCents, slug: String(plugin.id), imageUrl: plugin.imageUrl })} className="rounded-lg border border-[#b5d4bb] p-2.5 text-[#0d7850] hover:bg-[#e8f7e8]"><ShoppingBag size={17}/></button><Link to={`/plugins/${plugin.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#85ed65] px-3 py-2.5 text-xs font-extrabold text-[#12251d] hover:bg-[#a8f298]">Detalhes <ArrowRight size={14}/></Link></div></div></article>)}</div>}
      </div>
    </main>
  );
}
