import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getCategories, type PluginCategory } from '../lib/api';

export function CategoriesPage() {
  const [items, setItems] = useState<PluginCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCategories();
        if (!cancelled) setItems(res.items);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Categorias</h1>
          <p className="text-gray-400 text-lg">Explore por tema e encontre o plugin ideal para seu servidor.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(loading ? Array.from({ length: 7 }).map(() => null) : items).map((c, index) => {
            if (!c) {
              return (
                <div
                  key={index}
                  className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-7 animate-pulse"
                >
                  <div className="h-5 bg-[#0B0B0F]/30 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-[#0B0B0F]/20 rounded w-4/5"></div>
                </div>
              );
            }

            return (
              <motion.div
                key={c}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.18) }}
                className="group relative bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-7 overflow-hidden hover:border-[#7B2CBF]/50 transition-all duration-300"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#7B2CBF] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#C77DFF] rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-300"></div>

                <div className="relative">
                  <div className="text-white text-xl mb-2">{c}</div>
                  <div className="text-sm text-gray-400 mb-6">
                    Plugins selecionados para {c.toLowerCase()} com foco em qualidade e performance.
                  </div>
                  <Link
                    to={`/plugins?category=${encodeURIComponent(c)}`}
                    className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-lg hover:shadow-[#7B2CBF]/40 transition-all duration-300 text-sm"
                  >
                    Ver plugins
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
