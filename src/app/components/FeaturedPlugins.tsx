import { Star, Download, TrendingUp, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getFeaturedPlugins, type PluginSummary } from '../lib/api';

export function FeaturedPlugins() {
  const [items, setItems] = useState<PluginSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getFeaturedPlugins();
        if (!cancelled) setItems(res.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0F] via-[#1A1A22]/50 to-[#0B0B0F] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl mb-4">
            Plugins em Destaque
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore os plugins mais populares e bem avaliados da nossa plataforma
          </p>
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {(loading ? Array.from({ length: 6 }).map(() => null) : items).map((plugin, index) => {
            if (!plugin) {
              return (
                <div
                  key={index}
                  className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="h-48 bg-[#0B0B0F]/40"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-[#0B0B0F]/40 rounded"></div>
                    <div className="h-4 bg-[#0B0B0F]/30 rounded"></div>
                    <div className="h-4 bg-[#0B0B0F]/30 rounded w-2/3"></div>
                    <div className="h-10 bg-[#0B0B0F]/20 rounded"></div>
                  </div>
                </div>
              );
            }

            return (
              <motion.div
                key={plugin.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.18) }}
                className="group relative bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl overflow-hidden hover:border-[#7B2CBF]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#7B2CBF]/10"
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#7B2CBF]/20 to-[#3C096C]/20">
                  <img
                    src={plugin.imageUrl}
                    alt={plugin.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A22] via-transparent to-transparent opacity-60"></div>

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

                <div className="p-5">
                  <h3 className="text-xl mb-2 text-white group-hover:text-[#C77DFF] transition-colors duration-300">
                    {plugin.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{plugin.description}</p>

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

                  <div className="flex items-center justify-between">
                    <span className="text-2xl text-[#C77DFF]">{plugin.priceDisplay}</span>
                    <Link
                      to={`/plugins/${plugin.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white text-sm rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#7B2CBF]/10 to-[#C77DFF]/10 blur-xl"></div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/plugins"
            className="group inline-flex items-center gap-2 px-8 py-3 bg-transparent border-2 border-[#7B2CBF] text-white rounded-xl hover:bg-[#7B2CBF]/10 hover:border-[#C77DFF] hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all duration-300"
          >
            Ver Todos os Plugins
            <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
}
