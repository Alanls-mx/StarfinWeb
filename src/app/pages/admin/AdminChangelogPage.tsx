import { Plus, Save, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  adminCreateChangelog,
  adminDeleteChangelog,
  adminUpdateChangelog,
  getChangelog,
  type ChangelogEntry
} from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminChangelogPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<ChangelogEntry[]>([]);
  const [version, setVersion] = useState('0.1.1');
  const [title, setTitle] = useState('Atualização');
  const [body, setBody] = useState('Detalhes da atualização...');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getChangelog();
      if (!cancelled) setItems(res.items);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!token) {
    return (
      <div className="text-center text-gray-400 py-20">Faça login como admin para acessar.</div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Changelog</h1>
        <p className="text-sm text-gray-400">Gerencie o histórico de atualizações e novidades do site.</p>
      </div>

      <div className="max-w-5xl">

        <div className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Versão"
              className="px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                await adminCreateChangelog(token, { version: version.trim(), title: title.trim(), body: body.trim() });
                const res = await getChangelog();
                setItems(res.items);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              Criar
            </motion.button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Conteúdo"
            className="mt-4 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white min-h-28"
          />
        </div>

        <div className="space-y-4">
          {items.map((c) => (
            <div key={c.id} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  defaultValue={c.version}
                  onBlur={async (e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.version) {
                      await adminUpdateChangelog(token, c.id, { version: v });
                    }
                  }}
                  className="px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
                <input
                  defaultValue={c.title}
                  onBlur={async (e) => {
                    const v = e.target.value.trim();
                    if (v && v !== c.title) {
                      await adminUpdateChangelog(token, c.id, { title: v });
                    }
                  }}
                  className="px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      await adminUpdateChangelog(token, c.id, {});
                      const res = await getChangelog();
                      setItems(res.items);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#0B0B0F] rounded-lg hover:bg-gray-100 transition-all duration-300"
                  >
                    <Save className="w-4 h-4" />
                    Sync
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      await adminDeleteChangelog(token, c.id);
                      const res = await getChangelog();
                      setItems(res.items);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-red-500/40 text-white rounded-lg hover:bg-red-500/10 transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <textarea
                defaultValue={c.body}
                onBlur={async (e) => {
                  const v = e.target.value.trim();
                  if (v && v !== c.body) {
                    await adminUpdateChangelog(token, c.id, { body: v });
                    const res = await getChangelog();
                    setItems(res.items);
                  }
                }}
                className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white min-h-24"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

