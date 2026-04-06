import { Plus, Save, Trash2, FileText, Search, Layout, BookOpen, ExternalLink, ChevronRight, Eye, Edit3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { adminCreateDocArticle, adminDeleteDocArticle, adminListDocArticles, adminUpdateDocArticle, type DocArticle } from '../../lib/api';
import { useAuth } from '../../lib/auth';

export function AdminDocsPage() {
  const { state } = useAuth();
  const token = state.status === 'authenticated' ? state.token : null;

  const [articles, setArticles] = useState<DocArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingArticle, setEditingArticle] = useState<Partial<DocArticle> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    adminListDocArticles(token)
      .then(res => setArticles(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingArticle) return;
    setSaving(true);
    try {
      if (editingArticle.id) {
        const updated = await adminUpdateDocArticle(token, editingArticle.id, editingArticle);
        setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await adminCreateDocArticle(token, editingArticle);
        setArticles(prev => [...prev, created]);
      }
      setEditingArticle(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar artigo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Excluir este artigo permanentemente?')) return;
    try {
      await adminDeleteDocArticle(token, id);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(articles.map(a => a.category)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documentação</h1>
          <p className="text-gray-400">Gerencie os artigos, guias e tutoriais do site.</p>
        </div>
        <button
          onClick={() => setEditingArticle({ title: '', slug: '', category: 'Geral', content: '', order: 0 })}
          className="px-6 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Artigo
        </button>
      </div>

      <div className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-[#7B2CBF]/10 bg-[#7B2CBF]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título ou categoria..."
              className="w-full pl-10 pr-4 py-2 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-sm text-white focus:border-[#7B2CBF] outline-none"
            />
          </div>
          <div className="flex gap-2">
            {categories.map(c => (
              <button 
                key={c}
                onClick={() => setSearch(c)}
                className="px-3 py-1 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white hover:border-[#7B2CBF]/50 transition-all uppercase tracking-wider"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[#7B2CBF]/5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            filteredArticles.map(article => (
              <div key={article.id} className="p-4 flex items-center justify-between hover:bg-[#7B2CBF]/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#7B2CBF]/10 flex items-center justify-center text-[#C77DFF]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#C77DFF] transition-colors">{article.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>/{article.slug}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <a 
                    href={`/docs/${article.slug}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => setEditingArticle(article)}
                    className="p-2 text-gray-400 hover:text-[#C77DFF] hover:bg-[#7B2CBF]/10 rounded-lg transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(article.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
          {!loading && filteredArticles.length === 0 && (
            <div className="py-20 text-center text-gray-500">Nenhum artigo encontrado.</div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingArticle(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-[#13131A] border border-[#7B2CBF]/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#7B2CBF]/10">
                <h3 className="text-xl text-white font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#C77DFF]" />
                  {editingArticle.id ? 'Editar Artigo' : 'Novo Artigo'}
                </h3>
                <button onClick={() => setEditingArticle(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest ml-1">Título do Artigo</label>
                    <input
                      required
                      value={editingArticle.title}
                      onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="Ex: Como instalar o plugin"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest ml-1">Slug (URL)</label>
                    <input
                      required
                      value={editingArticle.slug}
                      onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all font-mono"
                      placeholder="ex-como-instalar"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest ml-1">Categoria</label>
                    <input
                      required
                      value={editingArticle.category}
                      onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                      placeholder="Ex: Instalação"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest ml-1">Ordem</label>
                    <input
                      type="number"
                      value={editingArticle.order}
                      onChange={(e) => setEditingArticle({ ...editingArticle, order: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-widest ml-1">Conteúdo (HTML)</label>
                    <span className="text-[10px] text-[#7B2CBF] font-bold">DICA: Use tags HTML para formatação</span>
                  </div>
                  <textarea
                    required
                    value={editingArticle.content}
                    onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0B0B0F]/60 border border-[#7B2CBF]/20 rounded-xl text-white focus:border-[#7B2CBF] outline-none transition-all min-h-[300px] font-mono text-sm"
                    placeholder="<p>Escreva seu conteúdo aqui...</p>"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingArticle(null)}
                    className="flex-1 py-4 bg-[#1A1A22] text-white rounded-xl font-medium border border-[#7B2CBF]/20 hover:bg-[#7B2CBF]/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#7B2CBF]/30 transition-all disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar Artigo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
