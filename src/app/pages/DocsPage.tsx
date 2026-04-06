import { Search, FileText, ChevronRight, BookOpen, Layers, Zap, Shield, HelpCircle, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen pt-24 pb-16 bg-[#0B0B0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Navigation */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#C77DFF]" />
                  Documentação
                </h1>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#C77DFF] transition-colors" />
                  <input
                    type="text"
                    placeholder="Pesquisar artigos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#1A1A22]/60 border border-[#7B2CBF]/10 rounded-xl text-sm text-white focus:border-[#7B2CBF]/50 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
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
                              ? 'bg-[#7B2CBF]/20 text-[#C77DFF] border border-[#7B2CBF]/20' 
                              : 'text-gray-400 hover:bg-[#7B2CBF]/5 hover:text-white'
                          }`}
                        >
                          <FileText className={`w-4 h-4 ${slug === article.slug ? 'text-[#C77DFF]' : 'text-gray-600 group-hover:text-gray-400'}`} />
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
                  className="bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-[2rem] p-8 md:p-12 backdrop-blur-sm shadow-2xl"
                >
                  {loadingArticle ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-10 h-10 border-4 border-[#7B2CBF] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : selectedArticle ? (
                    <article className="prose prose-invert prose-purple max-w-none">
                      <div className="flex items-center gap-3 text-[#C77DFF] text-[10px] font-bold uppercase tracking-widest mb-4">
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
                  <div className="bg-gradient-to-br from-[#7B2CBF]/20 to-transparent border border-[#7B2CBF]/20 rounded-[2rem] p-12 relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-4xl font-bold text-white mb-4">Como podemos ajudar?</h2>
                      <p className="text-gray-400 text-lg max-w-xl">
                        Explore nossos guias detalhados, tutoriais de instalação e documentação técnica para todos os plugins Starfin.
                      </p>
                    </div>
                    <BookOpen className="absolute -right-8 -bottom-8 w-64 h-64 text-[#7B2CBF]/5 -rotate-12" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { icon: Zap, title: 'Início Rápido', desc: 'Aprenda a instalar e configurar seu primeiro plugin em minutos.' },
                      { icon: Shield, title: 'Licenciamento', desc: 'Tudo sobre como gerenciar suas chaves e o StarfinLicense.' },
                      { icon: Layers, title: 'Integrações', desc: 'Como conectar nossos plugins com outros sistemas e APIs.' },
                      { icon: HelpCircle, title: 'FAQ', desc: 'Respostas para as perguntas mais frequentes da comunidade.' }
                    ].map((card, i) => (
                      <div key={i} className="p-8 bg-[#1A1A22]/40 border border-[#7B2CBF]/10 rounded-2xl hover:border-[#7B2CBF]/30 transition-all group cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-[#7B2CBF]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <card.icon className="w-6 h-6 text-[#C77DFF]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Artigos Populares</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {articles.slice(0, 5).map(article => (
                        <Link
                          key={article.id}
                          to={`/docs/${article.slug}`}
                          className="flex items-center justify-between p-6 bg-[#1A1A22]/20 border border-[#7B2CBF]/5 rounded-2xl hover:bg-[#7B2CBF]/5 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{article.title}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-[#C77DFF] transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
