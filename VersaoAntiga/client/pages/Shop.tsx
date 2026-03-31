import { useMemo, useState } from "react";
import { Star, ShoppingCart, Filter, X } from "lucide-react";
import Layout from "@/components/Layout";
import { useCart } from "@/context/CartContext";
import { useQuery } from "@tanstack/react-query";
import { Plugin, GetPluginsResponse } from "@shared/api";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
function categoryEmoji(category: string) {
  const map: Record<string, string> = {
    Utility: "⚙️",
    Gameplay: "🎮",
  };
  return map[category] ?? "🧩";
}

export default function Shop() {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const categories = ["Pagos", "Gratuitos"];

  const { data, isLoading } = useQuery({
    queryKey: ["plugins", selectedCategory],
    queryFn: async (): Promise<GetPluginsResponse> => {
      const isFilterByPrice = selectedCategory === "Pagos" || selectedCategory === "Gratuitos";
      const url = isFilterByPrice || !selectedCategory
        ? "/api/plugins"
        : `/api/plugins?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      return res.json();
    },
    refetchInterval: 5000,
  });

  const allPlugins = (data?.plugins ?? []) as Plugin[];

  const filteredPlugins = useMemo(() => {
    if (!selectedCategory) return allPlugins;
    if (selectedCategory === "Pagos") return allPlugins.filter((p) => p.price > 0);
    if (selectedCategory === "Gratuitos") return allPlugins.filter((p) => p.price === 0);
    return allPlugins;
  }, [allPlugins, selectedCategory]);

  return (
    <Layout>
      <div className="min-h-screen py-16 md:py-20 px-3 md:px-4">
        <div className="container mx-auto max-w-screen-xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Loja de Plugins</h1>
            <p className="text-muted-foreground">
              Navegue por nossa coleção de {allPlugins.length} plugins
            </p>
          </div>

          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Sidebar - Filters */}
            <div className="lg:w-64">
              <div className="sticky top-20">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden w-full flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-lg mb-4"
                >
                  <Filter size={20} />
                  <span>Filtros</span>
                </button>

                {(showFilters || window.innerWidth >= 1024) && (
                  <div className="bg-card border border-border rounded-lg p-6 animate-in fade-in slide-in-from-left-2">
                    <h3 className="font-bold text-lg mb-4 flex items-center justify-between">
                      Categorias
                      {showFilters && (
                        <button
                          onClick={() => setShowFilters(false)}
                          className="lg:hidden"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </h3>

                    <div className="space-y-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${
                          selectedCategory === null
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-card-foreground/10"
                        }`}
                      >
                        Todos os Plugins
                      </button>

                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-4 py-2 rounded-lg transition ${
                            selectedCategory === category
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-card-foreground/10"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading && (
                  <div className="col-span-full text-center text-muted-foreground">Carregando...</div>
                )}
                {filteredPlugins.map((plugin) => (
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
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button onClick={() => addToCart(plugin)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Adicionar ao carrinho</button>
                      </div>
                    </div>
                  </DialogContent>
                  </Dialog>
                ))}
              </div>

              {filteredPlugins.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    Nenhum plugin encontrado nesta categoria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
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
