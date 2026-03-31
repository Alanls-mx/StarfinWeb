import { Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminSaveDocsSection, getDocs, type DocsSection } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminDocsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;
  const [items, setItems] = useState<DocsSection[]>([]);
  const [newId, setNewId] = useState('nova-secao');
  const [newTitle, setNewTitle] = useState('Nova seção');
  const [newBody, setNewBody] = useState('Conteúdo...');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getDocs();
      if (!cancelled) setItems(res.items);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center text-gray-400">Faça login como admin para acessar.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl mb-6">Documentação (Admin)</h1>

        <div className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="ID (slug)"
              className="px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
            />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título"
              className="px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                await adminSaveDocsSection(token, newId.trim(), { title: newTitle.trim(), body: newBody });
                const res = await getDocs();
                setItems(res.items);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300"
            >
              <Save className="w-4 h-4" />
              Salvar/Cria
            </motion.button>
          </div>
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            className="mt-4 w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white min-h-28"
          />
        </div>

        <div className="space-y-4">
          {items.map((d) => (
            <div key={d.id} className="bg-[#1A1A22]/60 border border-[#7B2CBF]/20 rounded-2xl p-6">
              <div className="text-xs text-gray-500 mb-2">id: {d.id}</div>
              <input
                defaultValue={d.title}
                onBlur={async (e) => {
                  const title = e.target.value.trim();
                  if (title && title !== d.title) {
                    await adminSaveDocsSection(token, d.id, { title, body: d.body });
                    const res = await getDocs();
                    setItems(res.items);
                  }
                }}
                className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white mb-3"
              />
              <textarea
                defaultValue={d.body}
                onBlur={async (e) => {
                  const body = e.target.value;
                  if (body && body !== d.body) {
                    await adminSaveDocsSection(token, d.id, { title: d.title, body });
                    const res = await getDocs();
                    setItems(res.items);
                  }
                }}
                className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-lg text-white min-h-28"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

