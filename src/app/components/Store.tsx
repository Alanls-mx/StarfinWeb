import { Download, Filter, Search, SlidersHorizontal, Star, TrendingUp, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getCategories, getPlugins, type PluginCategory, type PluginSummary } from '../lib/api';

export function Store() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Array<PluginCategory | 'Todas'>>(['Todas']);
  const [items, setItems] = useState<PluginSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get('search') ?? '';
  const selectedCategory = searchParams.get('category') ?? 'Todas';
  const sort = (searchParams.get('sort') ?? 'popular') as
    | 'popular'
    | 'rating'
    | 'recent'
    | 'price_asc'
    | 'price_desc';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getCategories();
      if (cancelled) return;
      setCategories(['Todas', ...res.items]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getPlugins({
          search: searchQuery || undefined,
          category: selectedCategory === 'Todas' ? undefined : selectedCategory,
          sort,
          limit: 48
        });
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, selectedCategory, sort]);

  const getTagStyles = (tag: string) => {
    switch (tag) {
      case 'Popular':
        return 'bg-[#7B2CBF]/20 text-[#C77DFF] border-[#7B2CBF]/40';
      case 'Novo':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Premium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Popular':
        return <TrendingUp className="w-3 h-3" />;
      case 'Premium':
        return <Crown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const visibleCountText = useMemo(() => {
    if (loading) return 'Carregando...';
    if (total === 0) return '0 plugins encontrados';
    return `${total} ${total === 1 ? 'plugin encontrado' : 'plugins encontrados'}`;
  }, [loading, total]);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl mb-4">Loja de Plugins</h1>
          <p className="text-gray-400 text-lg">
            Encontre o plugin perfeito para seu servidor Minecraft
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar plugins..."
              value={searchQuery}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                const value = e.target.value;
                if (value) next.set('search', value);
                else next.delete('search');
                setSearchParams(next, { replace: true });
              }}
              className="w-full pl-12 pr-4 py-4 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-xl text-white hover:border-[#7B2CBF]/50 transition-all duration-300"
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:block w-full lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-[#C77DFF]" />
                <h3 className="text-lg">Filtros</h3>
              </div>

              {/* Categories */}
              <div className="space-y-2 mb-6">
                <h4 className="text-sm text-gray-400 mb-3">Categorias</h4>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      if (category === 'Todas') next.delete('category');
                      else next.set('category', category);
                      setSearchParams(next, { replace: true });
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-[#7B2CBF]/20 text-[#C77DFF] border border-[#7B2CBF]/40'
                        : 'text-gray-400 hover:bg-[#7B2CBF]/10 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-3">Faixa de Preço</h4>
                <div className="space-y-2">
                  {['Grátis', 'R$ 0 - R$ 30', 'R$ 30 - R$ 60', 'R$ 60+'].map((range) => (
                    <label key={range} className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors duration-300">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#7B2CBF]/40 bg-transparent checked:bg-[#7B2CBF]" />
                      <span className="text-sm">{range}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-sm text-gray-400 mb-3">Avaliação</h4>
                <div className="space-y-2">
                  {[5, 4, 3].map((rating) => (
                    <label key={rating} className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors duration-300">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#7B2CBF]/40 bg-transparent checked:bg-[#7B2CBF]" />
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm">{rating}+ estrelas</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Plugin Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-400">
                {visibleCountText}
              </p>
              <select
                value={sort}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('sort', e.target.value);
                  setSearchParams(next, { replace: true });
                }}
                className="px-4 py-2 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[#7B2CBF] transition-all duration-300"
              >
                <option value="popular">Mais Populares</option>
                <option value="rating">Maior Avaliação</option>
                <option value="recent">Mais Recentes</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(loading ? Array.from({ length: 9 }).map(() => null) : items).map((plugin, index) => {
                if (!plugin) {
                  return (
                    <div
                      key={index}
                      className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-5 animate-pulse"
                    >
                      <div className="h-4 bg-[#0B0B0F]/30 rounded w-2/3 mb-3"></div>
                      <div className="h-3 bg-[#0B0B0F]/20 rounded mb-2"></div>
                      <div className="h-3 bg-[#0B0B0F]/20 rounded w-4/5 mb-4"></div>
                      <div className="h-10 bg-[#0B0B0F]/20 rounded"></div>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={plugin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.015, 0.2) }}
                    className="group bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-5 hover:border-[#7B2CBF]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#7B2CBF]/10"
                  >
                    <div className="relative h-36 rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-[#7B2CBF]/15 to-[#3C096C]/15 border border-[#7B2CBF]/10">
                      <img
                        src={plugin.imageUrl}
                        alt={plugin.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A22] via-transparent to-transparent opacity-70"></div>
                      <div className="absolute top-3 left-3 flex gap-2">
                        {plugin.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-full backdrop-blur-sm ${getTagStyles(tag)}`}
                          >
                            {getTagIcon(tag)}
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="text-xl mb-2 text-white group-hover:text-[#C77DFF] transition-colors duration-300">
                      {plugin.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{plugin.description}</p>

                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                      <span>{plugin.category}</span>
                      <span>•</span>
                      <span>{plugin.mcVersion}</span>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-gray-300">{plugin.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Download className="w-4 h-4" />
                        <span>{plugin.downloadsDisplay}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#7B2CBF]/20">
                      <span className="text-xl text-[#C77DFF]">{plugin.priceDisplay}</span>
                      <Link
                        to={`/plugins/${plugin.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white text-sm rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
                      >
                        Ver Mais
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {!loading && items.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-500 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhum plugin encontrado</p>
                  <p className="text-sm">Tente ajustar seus filtros ou busca</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
