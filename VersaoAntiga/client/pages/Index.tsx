import { Link } from "react-router-dom";
import { Star, Download, ShoppingCart, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { GetPluginsResponse, Plugin } from "@shared/api";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";

function categoryEmoji(category: string) {
  const map: Record<string, string> = {
    Utility: "⚙️",
    Gameplay: "🎮",
  };
  return map[category] ?? "🧩";
}

function resolveImageUrl(u?: string, id?: string) {
  if (!u) return undefined;
  const s = u.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (id) return `/api/plugins/${id}/image`;
  if (typeof window !== "undefined") {
    if (s.startsWith("/")) return `${window.location.origin}${s}`;
    return `${window.location.origin}/${s.replace(/^\\+/, "")}`;
  }
  return s.startsWith("/") ? s : `/${s.replace(/^\\+/,'')}`;
}

export default function Index() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { addToCart } = useCart();
  const { data: pluginsData } = useQuery({
    queryKey: ["plugins"],
    queryFn: async (): Promise<GetPluginsResponse> => {
      const res = await fetch("/api/plugins");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: metricsData } = useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await fetch("/api/metrics");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const { data: highlightsData } = useQuery({
    queryKey: ["highlights"],
    queryFn: async () => {
      const res = await fetch("/api/highlights");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const highlights = (highlightsData?.items ?? []) as { id: string }[];
  const [hlIndex, setHlIndex] = useState(0);
  useEffect(() => {
    if (!highlights || highlights.length === 0) return;
    const t = setInterval(() => {
      setHlIndex((i) => (i + 1) % highlights.length);
    }, 5000);
    return () => clearInterval(t);
  }, [highlights?.length]);

  const plugins = (pluginsData?.plugins ?? []) as Plugin[];
  const featuredPlugins = [...plugins]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 4);
  return (
    <Layout>
      {highlights.length > 0 && (
        <section className="px-4 pt-4">
          <div className="mx-auto w-full max-w-[1920px] xl:max-w-[2560px] 2xl:max-w-[3840px]">
            <div className="rounded-xl overflow-hidden border border-border bg-card relative z-10 h-[220px] sm:h-[280px] md:h-[340px] lg:h-[420px] xl:h-[520px] 2xl:h-[600px]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={highlights[hlIndex].id}
                  src={`/api/highlights/${highlights[hlIndex].id}`}
                  alt="Destaque"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </AnimatePresence>
            
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
                {highlights.map((_, idx) => (
                  <span key={idx} className={`inline-block w-2 h-2 rounded-full ${idx === hlIndex ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-50" />
        <div className="relative container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Eleve Seu Servidor Minecraft
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descubra milhares de plugins premium para melhorar seu servidor
            Minecraft. De melhorias de gameplay a ferramentas administrativas,
            encontre exatamente o que você precisa.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/shop"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition flex items-center gap-2 font-semibold"
            >
              Explorar Plugins <ArrowRight size={20} />
            </Link>
            <Link
              to="/about"
              className="px-8 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition font-semibold"
            >
              Saiba Mais
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-card/50 animate-in fade-in">
        <div className="container mx-auto max-w-screen-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">
                {metricsData?.premiumPlugins ?? 0}
              </p>
              <p className="text-muted-foreground">Plugins Premium</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-accent mb-2">
                {metricsData?.activeUsers ?? 0}
              </p>
              <p className="text-muted-foreground">Usuários Ativos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">
                {metricsData?.totalDownloads ?? 0}
              </p>
              <p className="text-muted-foreground">Downloads</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Plugins */}
      <section className="py-20 px-4 animate-in fade-in">
        <div className="container mx-auto max-w-screen-xl">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">Plugins em Destaque</h2>
              <p className="text-muted-foreground">
                Confira nossos plugins mais populares e bem avaliados
              </p>
            </div>
            <Link
              to="/shop"
              className="text-primary hover:text-primary/80 transition flex items-center gap-2"
            >
              Ver Tudo <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPlugins.map((plugin) => (
              <Dialog key={plugin.id}>
                <div
                  className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition group animate-in fade-in zoom-in-95"
                >
                  {plugin.imageUrl ? (
                    <img src={resolveImageUrl(plugin.imageUrl, plugin.id)} alt={plugin.name} className="h-40 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-6xl">
                      {categoryEmoji(plugin.category)}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-2">
                      <h3 className="font-bold text-lg">{plugin.name}</h3>
                      <p className="text-xs text-muted-foreground">{plugin.category}</p>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {plugin.description}
                    </p>
                    {plugin.longDescriptionHtml && (
                      <div className="mb-4">
                        <DialogTrigger className="inline-flex items-center px-3 py-1 border border-border rounded-md text-sm text-primary hover:bg-primary/10">
                          Ver Mais
                        </DialogTrigger>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <Star size={16} className="fill-accent text-accent" />
                        <span className="text-sm font-semibold">
                          {plugin.rating}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {plugin.downloads} downloads
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {plugin.price > 0 ? `$${plugin.price}` : "Grátis"}
                      </span>
                      <button onClick={() => addToCart(plugin)} className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition group-hover:scale-110">
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                  <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl p-0">
                    <div className="p-4">
                      <DialogHeader>
                        <div className="flex items-start justify-between gap-3 pr-8">
                          <DialogTitle>{plugin.name}</DialogTitle>
                          <span className="text-xs text-muted-foreground">{plugin.category}</span>
                        </div>
                        <DialogDescription>
                          Detalhes do plugin
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-3">
                        {plugin.imageUrl ? (
                          <div className="bg-muted rounded-md">
                            <img
                          src={resolveImageUrl(plugin.imageUrl, plugin.id)}
                          alt={plugin.name}
                          className="w-full h-auto object-contain rounded-md"
                          style={{ maxHeight: "calc(40vh)" }}
                        />
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-3 max-h-[35vh] overflow-auto pr-2">
                        {plugin.longDescriptionHtml && (
                          <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: plugin.longDescriptionHtml }} />
                        )}
                        <div className="mt-4 space-y-2">
                          <h4 className="font-semibold">Versões</h4>
                          {Array.isArray(plugin.releases) && plugin.releases.length > 0 ? (
                            <div className="space-y-2">
                          {plugin.releases.map((r) => (
                            <div key={r.version} className="flex items-center justify-between border border-border rounded-md p-2">
                              <div className="text-sm">v{r.version}</div>
                              {plugin.price === 0 ? (
                                <a href={`/api/plugins/${plugin.id}/releases/${encodeURIComponent(r.version)}/jar`} className="px-3 py-1 border border-border rounded-md text-sm">Baixar .jar</a>
                              ) : (
                                <span className="text-xs text-muted-foreground">Disponível após compra</span>
                              )}
                            </div>
                          ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Nenhuma versão publicada</div>
                          )}
                        </div>
                        <div className="mt-4 space-y-2">
                          <h4 className="font-semibold">Comentários</h4>
                          <div className="text-sm text-muted-foreground">Sem comentários ainda</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button onClick={() => addToCart(plugin)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Adicionar ao carrinho</button>
                        <Link to="/cart" className="px-4 py-2 border border-border rounded-md">Ir para o carrinho</Link>
                      </div>
                    </div>
                  </DialogContent>
                </div>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto max-w-screen-xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para Melhorar Seu Servidor?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de administradores de servidores que usam
            StarfinPlugins para potencializar seus servidores Minecraft.
          </p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold"
          >
            Comece a Comprar Agora
          </Link>
        </div>
      </section>
    </Layout>
  );
}
