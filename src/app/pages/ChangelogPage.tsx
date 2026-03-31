import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { getChangelog, type ChangelogEntry } from '../lib/api';

export function ChangelogPage() {
  const [items, setItems] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getChangelog();
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl mb-4">Changelog</h1>
          <p className="text-gray-400 text-lg">Novidades, melhorias e correções.</p>
        </div>

        <div className="space-y-4">
          {(loading ? Array.from({ length: 2 }).map(() => null) : items).map((item, idx) => {
            if (!item) {
              return (
                <div key={idx} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-[#0B0B0F]/30 rounded w-1/4 mb-3"></div>
                  <div className="h-3 bg-[#0B0B0F]/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#0B0B0F]/20 rounded w-2/3"></div>
                </div>
              );
            }

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.12) }}
                className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-2xl p-6 hover:border-[#7B2CBF]/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="text-white text-lg">
                    {item.version} — {item.title}
                  </div>
                  <div className="text-xs text-gray-500">{new Date(item.createdISO).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="text-sm text-gray-400 whitespace-pre-wrap">{item.body}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

