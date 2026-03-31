import { Star, Download, ShoppingCart, Heart, Shield, Zap, Award, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router';
import { createPurchase, getPlugin, postReview, type PluginDetail as PluginDetailType } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useCart } from '../lib/cart';

export function PluginDetail() {
  const { id } = useParams();
  const pluginId = Number(id);
  const navigate = useNavigate();
  const { state } = useAuth();
  const { addItem } = useCart();
  const token = state.status === 'authenticated' ? state.token : null;
  const [plugin, setPlugin] = useState<PluginDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'gallery' | 'docs' | 'reviews'>('description');
  const [reviewUser, setReviewUser] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSent, setReviewSent] = useState<null | { user: string; rating: number; dateISO: string; comment: string }>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPlugin(null);
    (async () => {
      try {
        const data = await getPlugin(pluginId);
        if (!cancelled) setPlugin(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pluginId]);

  const features = [
    { icon: Shield, title: 'Seguro e Confiável', description: 'Código auditado e testado' },
    { icon: Zap, title: 'Alto Desempenho', description: 'Otimizado para servidores grandes' },
    { icon: Award, title: 'Suporte Premium', description: 'Suporte dedicado 24/7' }
  ];

  const resolvedPlugin = plugin;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-[#C77DFF] transition-colors duration-300">
            Início
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/plugins" className="hover:text-[#C77DFF] transition-colors duration-300">
            Plugins
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">{resolvedPlugin?.name ?? 'Carregando...'}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image/Banner */}
            <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-[#7B2CBF]/30 to-[#3C096C]/30 border border-[#7B2CBF]/20">
              <img
                src={resolvedPlugin?.screenshots?.[0] ?? resolvedPlugin?.imageUrl ?? ''}
                alt={resolvedPlugin?.name ?? 'Plugin'}
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-transparent to-transparent"></div>
              <button className="absolute top-4 right-4 p-3 bg-[#1A1A22]/80 backdrop-blur-sm rounded-full hover:bg-[#7B2CBF]/50 transition-all duration-300 group">
                <Heart className="w-6 h-6 text-white group-hover:fill-white transition-all duration-300" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#7B2CBF]/20">
              <div className="flex gap-8">
                {[
                  { id: 'description' as const, label: 'Descrição' },
                  { id: 'gallery' as const, label: 'Galeria' },
                  { id: 'docs' as const, label: 'Documentação' },
                  { id: 'reviews' as const, label: 'Avaliações' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-4 relative transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-[#C77DFF]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C77DFF] to-transparent"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-8">
              {activeTab === 'description' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl mb-4">Sobre o Plugin</h3>
                    <p className="text-gray-400 leading-relaxed mb-4">{resolvedPlugin?.tagline || '—'}</p>
                    <p className="text-gray-400 leading-relaxed">{resolvedPlugin?.description || '—'}</p>
                  </div>

                  <div>
                    <h4 className="text-xl mb-4">Recursos Principais</h4>
                    <ul className="space-y-3">
                      {(resolvedPlugin?.features?.length ? resolvedPlugin.features.map((f) => f.title) : []).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C77DFF] mt-2 flex-shrink-0"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {resolvedPlugin?.features?.length ? (
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resolvedPlugin.features.slice(0, 4).map((f) => (
                          <div
                            key={f.title}
                            className="p-4 bg-[#0B0B0F]/40 rounded-lg border border-[#7B2CBF]/10"
                          >
                            <div className="text-white mb-1">{f.title}</div>
                            <div className="text-sm text-gray-400">{f.description}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="grid grid-cols-2 gap-4">
                  {(resolvedPlugin?.screenshots?.length ? resolvedPlugin.screenshots : []).map((url, i) => (
                    <div
                      key={`${url}_${i}`}
                      className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#7B2CBF]/20 to-[#3C096C]/20 border border-[#7B2CBF]/20 hover:border-[#7B2CBF]/50 transition-all duration-300 cursor-pointer group"
                    >
                      <img
                        src={url}
                        alt={`Screenshot ${i + 1}`}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl mb-4">Documentação</h3>
                    <p className="text-gray-400 mb-6">
                      Guias e seções oficiais do plugin.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {(resolvedPlugin?.docsSections ?? []).map((doc, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center justify-between p-4 bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10 hover:border-[#7B2CBF]/30 hover:bg-[#7B2CBF]/5 transition-all duration-300 group"
                      >
                        <div className="text-left">
                          <div className="text-white mb-1 group-hover:text-[#C77DFF] transition-colors duration-300">
                            {doc.title}
                          </div>
                          <div className="text-sm text-gray-400">{doc.description}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#C77DFF] group-hover:translate-x-1 transition-all duration-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl">Avaliações</h3>
                    <div className="text-sm text-gray-400">
                      {resolvedPlugin?.reviewsCount ?? 0} avaliações
                    </div>
                  </div>

                  <div className="p-5 bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        value={reviewUser}
                        onChange={(e) => setReviewUser(e.target.value)}
                        placeholder="Seu nome"
                        className="px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] transition-all duration-300"
                      />
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white focus:outline-none focus:border-[#7B2CBF] transition-all duration-300"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} estrelas
                          </option>
                        ))}
                      </select>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={reviewSubmitting || loading || !resolvedPlugin}
                        onClick={async () => {
                          if (!resolvedPlugin) return;
                          setReviewSubmitting(true);
                          try {
                            const res = await postReview(resolvedPlugin.id, {
                              user: reviewUser,
                              rating: reviewRating,
                              comment: reviewComment
                            });
                            setReviewSent(res.review);
                            setReviewComment('');
                          } finally {
                            setReviewSubmitting(false);
                          }
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-lg hover:shadow-lg hover:shadow-[#7B2CBF]/50 transition-all duration-300 disabled:opacity-60"
                      >
                        Enviar
                      </motion.button>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Escreva sua avaliação..."
                      className="w-full px-4 py-3 bg-[#1A1A22] border border-[#7B2CBF]/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#7B2CBF] focus:ring-2 focus:ring-[#7B2CBF]/20 transition-all duration-300 min-h-28"
                    />
                    {reviewSent ? (
                      <div className="text-sm text-emerald-400">
                        Avaliação enviada ({reviewSent.dateISO})
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    {(reviewSent ? [reviewSent, ...(resolvedPlugin?.reviews ?? [])] : resolvedPlugin?.reviews ?? []).map((review, index) => (
                      <div
                        key={index}
                        className="p-6 bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-white mb-1">{review.user}</div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{review.dateISO}</span>
                        </div>
                        <p className="text-gray-400">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Purchase Card */}
              <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6 space-y-6">
                <div>
                  <h2 className="text-3xl mb-2">{resolvedPlugin?.name ?? '—'}</h2>
                  <p className="text-gray-400 text-sm">{resolvedPlugin?.tagline ?? '—'}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl text-[#C77DFF]">{resolvedPlugin?.priceDisplay ?? '—'}</span>
                  <span className="text-gray-500 line-through">R$ 79,90</span>
                </div>

                <button
                  onClick={() => {
                    if (!resolvedPlugin) return;
                    addItem({
                      id: resolvedPlugin.id,
                      name: resolvedPlugin.name,
                      price: resolvedPlugin.priceCents || 0,
                      slug: resolvedPlugin.slug,
                      imageUrl: resolvedPlugin.imageUrl
                    });
                    navigate('/cart');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white rounded-xl hover:shadow-xl hover:shadow-[#7B2CBF]/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Adicionar ao Carrinho
                </button>
                {purchaseMessage ? <div className="text-sm text-gray-400">{purchaseMessage}</div> : null}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-white">{resolvedPlugin?.rating ?? '—'}</span>
                    </div>
                    <div className="text-gray-500 text-xs">{resolvedPlugin?.reviewsCount ?? 0} avaliações</div>
                  </div>
                  <div className="p-3 bg-[#0B0B0F]/50 rounded-lg border border-[#7B2CBF]/10">
                    <div className="flex items-center gap-1 mb-1">
                      <Download className="w-4 h-4 text-[#C77DFF]" />
                      <span className="text-white">{resolvedPlugin?.downloadsDisplay ?? '—'}</span>
                    </div>
                    <div className="text-gray-500 text-xs">Downloads</div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6 space-y-4">
                <h3 className="text-lg mb-4">Informações</h3>
                {[
                  { label: 'Versão', value: resolvedPlugin?.version ?? '—' },
                  { label: 'Minecraft', value: resolvedPlugin?.mcVersion ?? '—' },
                  { label: 'Desenvolvedor', value: resolvedPlugin?.author ?? '—' },
                  { label: 'Última Atualização', value: resolvedPlugin?.lastUpdateISO ?? '—' }
                ].map((info, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{info.label}</span>
                    <span className="text-white">{info.value}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="bg-[#1A1A22]/60 backdrop-blur-sm border border-[#7B2CBF]/20 rounded-xl p-6 space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#7B2CBF]/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-[#C77DFF]" />
                    </div>
                    <div>
                      <div className="text-white mb-1">{feature.title}</div>
                      <div className="text-sm text-gray-400">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-[#7B2CBF]/15 to-[#3C096C]/10 backdrop-blur-sm border border-[#7B2CBF]/25 rounded-xl p-6 space-y-3">
                <h3 className="text-lg text-white">Integração & API</h3>
                <p className="text-sm text-gray-400">
                  Para conectar o plugin ao seu servidor, gere uma chave de API na sua conta e valide a licença via
                  endpoint.
                </p>
                <Link
                  to="/docs#api"
                  className="inline-flex items-center justify-center w-full px-4 py-3 bg-white text-[#0B0B0F] rounded-lg hover:bg-gray-100 transition-all duration-300 text-sm"
                >
                  Ver Documentação da API
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
