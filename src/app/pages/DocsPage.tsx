import { Search, FileText, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { getDocArticle, getDocArticles, type DocArticle } from '../lib/api';
import { Link, useParams, useSearchParams } from 'react-router';

export function DocsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');

  const [articles, setArticles] = useState<DocArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getDocArticles()
      .then(res => setArticles(res.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (slug) {
      setLoadingArticle(true);
      getDocArticle(slug)
        .then(setSelectedArticle)
        .catch(console.error)
        .finally(() => setLoadingArticle(false));
    } else {
      setSelectedArticle(null);
    }
  }, [slug]);

  const categories = Array.from(new Set(articles.map(a => a.category)));
  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0B1715]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sidebar Navigation */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#A6F3C8]" />
                  Documentação
                </h1>
                {articles.length > 0 && <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#A6F3C8] transition-colors" />
                  <input
                    type="text"
                    placeholder="Pesquisar artigos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#172822]/60 border border-[#177F58]/10 rounded-xl text-sm text-white focus:border-[#177F58]/50 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>}
              </div>

              <nav className="space-y-8">
                {categories.map(category => (
                  <div key={category}>
                    <h3 className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {articles.filter(a => a.category === category).map(article => (
                        <Link
                          key={article.id}
                          to={`/docs/${article.slug}`}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all group ${
                            slug === article.slug
                              ? 'bg-[#177F58]/20 text-[#A6F3C8] border border-[#177F58]/20'
                              : 'text-gray-400 hover:bg-[#177F58]/5 hover:text-white'
                          }`}
                        >
                          <FileText className={`w-4 h-4 ${slug === article.slug ? 'text-[#A6F3C8]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                          <span className="line-clamp-1">{article.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {slug ? (
                <motion.div
                  key={slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#172822]/40 border border-[#177F58]/10 rounded-[2rem] p-8 md:p-12 backdrop-blur-sm shadow-2xl"
                >
                  {loadingArticle ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-10 h-10 border-4 border-[#177F58] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : selectedArticle ? (
                    <article className="prose prose-invert prose-emerald max-w-none">
                      <div className="flex items-center gap-3 text-[#A6F3C8] text-[10px] font-bold uppercase tracking-widest mb-4">
                        <span>{selectedArticle.category}</span>
                        <span className="text-gray-700">•</span>
                        <span className="text-gray-500 font-medium">Atualizado em {new Date(selectedArticle.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 !leading-tight">
                        {selectedArticle.title}
                      </h1>
                      <div
                        className="text-gray-300 leading-relaxed text-lg space-y-6"
                        dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                      />
                    </article>
                  ) : (
                    <div className="text-center py-20">
                      <h2 className="text-2xl font-bold text-white mb-2">Artigo não encontrado</h2>
                      <p className="text-gray-400">O conteúdo que você procura não existe ou foi movido.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-12"
                >
                  <div className="border-b border-[#315647] pb-7">
                    <h2 className="text-3xl font-bold text-white">Documentação</h2>
                    <p className="mt-3 text-gray-400">Artigos publicados sobre instalação, licenças e uso dos produtos.</p>
                  </div>

                  {loading ? <p className="text-sm text-gray-400">Carregando artigos...</p> : articles.length === 0 ? (
                    <div className="rounded-lg border border-[#315647] bg-[#12231d] p-8">
                      <h3 className="text-lg font-semibold text-white">Ainda não há artigos publicados</h3>
                      <p className="mt-2 text-sm text-gray-400">Se precisar de ajuda agora, abra um chamado com a equipe.</p>
                      <Link to="/support" className="mt-5 inline-flex rounded-md bg-[#85ed65] px-4 py-2 text-sm font-bold text-[#112516]">Ir para o suporte</Link>
                    </div>
                  ) : <div>
                    <h3 className="text-lg font-semibold text-white mb-5">Artigos</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {filteredArticles.filter(article => !initialCategory || article.category === initialCategory).map(article => (
                        <Link
                          key={article.id}
                          to={`/docs/${article.slug}`}
                          className="flex items-center justify-between p-6 bg-[#172822]/20 border border-[#177F58]/5 rounded-2xl hover:bg-[#177F58]/5 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{article.title}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-[#A6F3C8] transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
