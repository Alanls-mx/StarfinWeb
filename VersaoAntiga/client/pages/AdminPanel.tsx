import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Shield, Save, Users, Package, BarChart2, ClipboardList, Edit, Trash2, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GetPluginsResponse, Plugin, Order, User, License, GetLicensesResponse } from "@shared/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

export default function AdminPanel() {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [longDescriptionHtml, setLongDescriptionHtml] = useState("");
  const [category, setCategory] = useState("Utility");
  const [price, setPrice] = useState(0);
  const [version, setVersion] = useState("1.0.0");
  const [isFree, setIsFree] = useState(false);
  const [dependenciesText, setDependenciesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [roleDraft, setRoleDraft] = useState<Record<string, User["role"]>>({});
  const [profileDraft, setProfileDraft] = useState<Record<string, { username: string; email: string; cpf?: string }>>({});
  const { user, authFetch, initialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && (!user || user.role !== "admin")) navigate("/login");
  }, [initialized, user, navigate]);

  const pluginsQuery = useQuery({
    queryKey: ["plugins"],
    queryFn: async (): Promise<GetPluginsResponse> => {
      const res = await fetch("/api/plugins");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<{ success: boolean; orders: Order[] }> => {
      const res = await fetch("/api/orders");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<{ success: boolean; users: any[] }> => {
      const res = await authFetch("/api/users");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<{ success: boolean; categories: string[] }> => {
      const res = await fetch("/api/categories");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: async (): Promise<{ success: boolean; logs: { id: string; type: string; message: string; createdAt: string }[] }> => {
      const res = await authFetch("/api/logs");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const licensesQuery = useQuery({
    queryKey: ["licenses"],
    queryFn: async (): Promise<GetLicensesResponse> => {
      const res = await authFetch("/api/licenses");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const [renewDraft, setRenewDraft] = useState<Record<string, string>>({});
  const [assignDraft, setAssignDraft] = useState<Record<string, string>>({});
  const [licenseReveal, setLicenseReveal] = useState<Record<string, boolean>>({});
  const [ipDraft, setIpDraft] = useState<Record<string, string>>({});
  const [orderStatusDraft, setOrderStatusDraft] = useState<Record<string, Order["status"]>>({});
  const [orderUserDraft, setOrderUserDraft] = useState<Record<string, string>>({});

  const assetsQuery = useQuery({
    queryKey: ["site-assets"],
    queryFn: async (): Promise<{ success: boolean; assets: string[] }> => {
      const res = await authFetch("/api/assets");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments-settings"],
    queryFn: async (): Promise<{ success: boolean; settings: { hasMercadoPago: boolean; mercadoPagoAccessTokenMasked: string; publicBaseUrl: string } }> => {
      const res = await authFetch("/api/settings/payments");
      return res.json();
    },
    refetchInterval: 10000,
  });
  const [mpTokenDraft, setMpTokenDraft] = useState("");
  const [baseUrlDraft, setBaseUrlDraft] = useState("");
  const savePayments = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch("/api/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mercadoPagoAccessToken: mpTokenDraft, publicBaseUrl: baseUrlDraft }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao salvar configurações");
      else { setMessage("Configurações salvas!"); paymentsQuery.refetch(); setMpTokenDraft(""); setBaseUrlDraft(""); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const [newCategory, setNewCategory] = useState("");
  const addCategoryReq = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao criar categoria");
      else {
        setMessage("Categoria criada!");
        setNewCategory("");
        refreshCategories();
        refreshLogs();
      }
    } catch {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };
  const deleteCategoryReq = async (name: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao excluir categoria");
      else {
        setMessage("Categoria excluída!");
        refreshCategories();
        refreshLogs();
      }
    } catch {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const refreshPlugins = () => pluginsQuery.refetch();
  const refreshUsers = () => usersQuery.refetch();
  const refreshCategories = () => categoriesQuery.refetch();
  const refreshLogs = () => logsQuery.refetch();
  const refreshLicenses = () => licensesQuery.refetch();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      let imageBase64: string | undefined;
      let imageFileName: string | undefined;
      if (imageFile) {
        imageBase64 = await readFileAsBase64(imageFile);
        imageFileName = imageFile.name;
      }
      const res = await authFetch("/api/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subtitle,
          description,
          category,
          price: isFree ? 0 : price,
          version,
          imageUrl,
          imageBase64,
          imageFileName,
          longDescriptionHtml,
          dependencies: dependenciesText.split(/[,;\n]/).map((s) => s.trim()).filter((s) => !!s),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.message || "Erro ao criar plugin");
      } else {
        setMessage("Plugin criado com sucesso!");
        setName("");
        setSubtitle("");
        setDescription("");
        setImageUrl("");
        setImageFile(null);
        setLongDescriptionHtml("");
        setCategory("Utility");
        setIsFree(false);
        setPrice(0);
        setVersion("1.0.0");
        setDependenciesText("");
        refreshPlugins();
      }
    } catch (err) {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p: Plugin) => {
    setEditingPlugin({ ...p });
  };

  const cancelEdit = () => setEditingPlugin(null);

  const saveEdit = async () => {
    if (!editingPlugin) return;
    setLoading(true);
    setMessage(null);
    try {
      let imageBase64: string | undefined;
      let imageFileName: string | undefined;
      if (editImageFile) {
        imageBase64 = await readFileAsBase64(editImageFile);
        imageFileName = editImageFile.name;
      }
      const res = await authFetch(`/api/plugins/${editingPlugin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingPlugin.name,
          description: editingPlugin.description,
          category: editingPlugin.category,
          price: editingPlugin.price,
          version: editingPlugin.version,
          imageUrl: editingPlugin.imageUrl,
          imageBase64,
          imageFileName,
          longDescriptionHtml: editingPlugin.longDescriptionHtml,
          licensePolicy: editingPlugin.licensePolicy,
          dependencies: editingPlugin.dependencies || [],
        }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao atualizar plugin");
      else {
        setMessage("Plugin atualizado com sucesso!");
        setEditingPlugin(null);
        setEditImageFile(null);
        refreshPlugins();
      }
    } catch {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const deletePlugin = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/plugins/${id}` , { method: "DELETE" });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao excluir plugin");
      else {
        setMessage("Plugin excluído com sucesso!");
        refreshPlugins();
      }
    } catch {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const saveUserRole = async (u: User) => {
    const role = roleDraft[u.id] ?? u.role;
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao atualizar usuário");
      else {
        setMessage("Usuário atualizado!");
        refreshUsers();
      }
    } catch {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async (u: User) => {
    const draft = profileDraft[u.id] ?? { username: u.username, email: u.email, cpf: (u as any).cpf };
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: draft.username, email: draft.email, cpf: draft.cpf }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao atualizar usuário");
      else {
        setMessage("Usuário atualizado!");
        refreshUsers();
      }
    } catch {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const saveUserPassword = async (u: User, newPassword: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao atualizar senha");
      else {
        setMessage("Senha atualizada!");
        refreshUsers();
      }
    } catch {
      setMessage("Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const deleteUserReq = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao excluir usuário");
      else { setMessage("Usuário excluído!"); refreshUsers(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const revokeLicenseReq = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/licenses/${id}/revoke`, { method: "PUT" });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao bloquear licença");
      else { setMessage("Licença bloqueada!"); refreshLicenses(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const renewLicenseReq = async (id: string) => {
    const expiresAt = renewDraft[id];
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/licenses/${id}/renew`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao renovar licença");
      else { setMessage("Licença renovada!"); refreshLicenses(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const assignLicenseReq = async (id: string) => {
    const userId = assignDraft[id];
    if (!userId) { setMessage("Informe o usuário"); return; }
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/licenses/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao atribuir licença");
      else { setMessage("Licença atribuída!"); refreshLicenses(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const deleteLicenseReq = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/licenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao excluir licença");
      else { setMessage("Licença excluída!"); refreshLicenses(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const bindLicenseIpReq = async (id: string) => {
    const ipAddress = ipDraft[id];
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/licenses/${id}/ip`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao atualizar IP da licença");
      else { setMessage("IP atualizado!"); refreshLicenses(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const updateOrderReq = async (id: string) => {
    const status = orderStatusDraft[id];
    if (!status) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao atualizar pedido");
      else { setMessage("Pedido atualizado!"); ordersQuery.refetch(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const deleteOrderReq = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao excluir pedido");
      else { setMessage("Pedido excluído!"); ordersQuery.refetch(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const reassignOrderReq = async (id: string) => {
    const userId = orderUserDraft[id];
    if (!userId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/orders/${id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao reatribuir pedido");
      else { setMessage("Pedido reatribuído!"); ordersQuery.refetch(); refreshLicenses(); refreshLogs(); }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  const regenerateOrderLicenseReq = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch(`/api/orders/${id}/regenerate-license`, { method: "POST" });
      const data = await res.json();
      if (!data.success) setMessage(data.message || "Erro ao regenerar licença");
      else {
        setMessage("Licença regenerada!");
        const key = (data.license as License)?.key;
        if (key) {
          toast({ title: "StarfinLicense regenerada", description: `Nova chave: ${key}` });
        }
        refreshLicenses();
        refreshLogs();
      }
    } catch { setMessage("Falha na requisição"); } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="min-h-screen py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border border-border rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Painel de Administração</h1>
                <p className="text-sm text-muted-foreground">Gerencie plugins, pedidos, usuários e conteúdo do site</p>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition hover:border-primary/40">
              <BarChart2 className="text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Plugins</div>
                <div className="text-2xl font-bold">{(pluginsQuery.data?.plugins ?? []).length}</div>
              </div>
            </div>
            <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition hover:border-primary/40">
              <ClipboardList className="text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Pedidos</div>
                <div className="text-2xl font-bold">{(ordersQuery.data?.orders ?? []).length}</div>
              </div>
            </div>
            <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition hover:border-primary/40">
              <Users className="text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Usuários</div>
                <div className="text-2xl font-bold">{(usersQuery.data?.users ?? []).length}</div>
              </div>
            </div>
            <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition hover:border-primary/40">
              <Package className="text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Downloads</div>
                <div className="text-2xl font-bold">{(pluginsQuery.data?.plugins ?? []).reduce((sum: number, p: Plugin) => sum + (p.downloads ?? 0), 0)}</div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="plugins" className="mt-2">
            <TabsList className="mb-6 bg-card border border-border rounded-xl p-1 flex flex-wrap gap-2">
              <TabsTrigger value="plugins" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Plugins</TabsTrigger>
              <TabsTrigger value="categorias" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Categorias</TabsTrigger>
              <TabsTrigger value="pedidos" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pedidos</TabsTrigger>
              <TabsTrigger value="usuarios" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Usuários</TabsTrigger>
              <TabsTrigger value="licencas" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Licenças</TabsTrigger>
              <TabsTrigger value="assets" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Assets</TabsTrigger>
              <TabsTrigger value="destaques" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Destaques</TabsTrigger>
              <TabsTrigger value="logs" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Logs</TabsTrigger>
              <TabsTrigger value="pagamentos" className="px-4 py-1.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pagamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="plugins">
              <div className="bg-card border border-border rounded-lg p-6 animate-in fade-in">
                <h2 className="text-xl font-semibold mb-4">Criar novo Plugin</h2>
                <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-md"
                  placeholder="Ex: AdvancedShops"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Subtítulo</label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-md"
                  placeholder="Breve subtítulo abaixo do nome"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-md"
                  placeholder="Breve descrição do plugin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Imagem do Plugin</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-input border border-border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Descrição (Editor HTML)</label>
                <div
                  contentEditable
                  onInput={(e) => setLongDescriptionHtml((e.currentTarget as HTMLDivElement).innerHTML)}
                  dangerouslySetInnerHTML={{ __html: longDescriptionHtml || "" }}
                  className="w-full px-3 py-2 bg-input rounded-md border border-border min-h-32"
                />
                <p className="text-xs text-muted-foreground mt-1">Use formatação HTML básica. O conteúdo será salvo como HTML.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border rounded-md"
                  >
                    {((categoriesQuery.data?.categories ?? []) as string[]).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {((categoriesQuery.data?.categories ?? []) as string[]).length === 0 && (
                      <>
                        <option value="Utility">Utility</option>
                        <option value="Gameplay">Gameplay</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Tipo</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                      Gratuito
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-input border border-border rounded-md"
                    disabled={isFree}
                  />
                </div>
                        <div>
                          <label className="block text-sm mb-1">Versão</label>
                          <input
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Dependências (IDs separados por vírgula)</label>
                          <input
                            value={dependenciesText}
                            onChange={(e) => setDependenciesText(e.target.value)}
                            className="w-full px-4 py-3 bg-input border border-border rounded-md"
                            placeholder="plugin-123, plugin-456"
                          />
                        </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
              >
                <Save size={18} /> {loading ? "Salvando..." : "Salvar"}
              </button>
              </form>
              {message && (
                <p className="mt-4 text-sm text-muted-foreground">{message}</p>
              )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Plugins</h2>
                  <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
                    {(pluginsQuery.data?.plugins ?? []).map((p: Plugin) => (
                      <div key={p.id} className="border border-border rounded-lg p-4">
                        {editingPlugin?.id === p.id ? (
                      <div className="space-y-4">
                        <input
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          value={editingPlugin.name}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, name: e.target.value })}
                        />
                        <input
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          placeholder="Subtítulo"
                          value={editingPlugin.subtitle || ""}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, subtitle: e.target.value })}
                        />
                        <input
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          value={editingPlugin.version}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, version: e.target.value })}
                        />
                        <input
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          value={editingPlugin.category}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, category: e.target.value })}
                        />
                        <input
                          type="number"
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          value={editingPlugin.price}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, price: Number(e.target.value) })}
                        />
                        <textarea
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          value={editingPlugin.description}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, description: e.target.value })}
                        />
                        <input
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          placeholder="Dependências (IDs separados por vírgula)"
                          value={(editingPlugin.dependencies || []).join(", ")}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, dependencies: e.target.value.split(/[,;\n]/).map((s) => s.trim()).filter((s) => !!s) })}
                        />
                        <input
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                          placeholder="URL da imagem"
                          value={editingPlugin.imageUrl || ""}
                          onChange={(e) => setEditingPlugin({ ...editingPlugin, imageUrl: e.target.value })}
                        />
                        {editImageFile && (
                          <img
                            src={URL.createObjectURL(editImageFile)}
                            alt="Prévia da imagem"
                            className="w-full h-40 object-contain rounded-md border border-border"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                          className="w-full px-4 py-3 bg-input border border-border rounded-md"
                        />
                        <div>
                          <label className="block text-sm mb-1">Descrição (Editor HTML)</label>
                          <div
                            contentEditable
                            onInput={(e) => setEditingPlugin({ ...editingPlugin, longDescriptionHtml: (e.currentTarget as HTMLDivElement).innerHTML })}
                            dangerouslySetInnerHTML={{ __html: editingPlugin.longDescriptionHtml || "" }}
                            className="w-full px-4 py-3 bg-input border border-border rounded-md min-h-24"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm mb-1">Expiração</label>
                            <select
                              value={editingPlugin.licensePolicy?.type || "infinite"}
                              onChange={(e) => {
                                const t = e.target.value as "infinite" | "duration" | "date";
                                let lp: any = { type: t };
                                if (t === "duration") lp = { type: t, months: editingPlugin.licensePolicy?.type === "duration" ? (editingPlugin.licensePolicy as any).months ?? 12 : 12 };
                                if (t === "date") lp = { type: t, expiresAt: editingPlugin.licensePolicy?.type === "date" ? (editingPlugin.licensePolicy as any).expiresAt ?? new Date().toISOString() : new Date().toISOString() };
                                setEditingPlugin({ ...editingPlugin, licensePolicy: lp });
                              }}
                              className="w-full px-4 py-3 bg-input border border-border rounded-md"
                            >
                              <option value="infinite">Sem expiração</option>
                              <option value="duration">Por duração (meses)</option>
                              <option value="date">Data específica</option>
                            </select>
                          </div>
                          {editingPlugin.licensePolicy?.type === "duration" && (
                            <div>
                              <label className="block text-sm mb-1">Meses</label>
                              <input
                                type="number"
                                min={1}
                                value={(editingPlugin.licensePolicy as any).months ?? 12}
                                onChange={(e) => setEditingPlugin({ ...editingPlugin, licensePolicy: { type: "duration", months: parseInt(e.target.value || "0", 10) } as any })}
                                className="w-full px-4 py-3 bg-input border border-border rounded-md"
                              />
                            </div>
                          )}
                          {editingPlugin.licensePolicy?.type === "date" && (
                            <div>
                              <label className="block text-sm mb-1">Data</label>
                              <input
                                type="date"
                                value={(() => { const iso = (editingPlugin.licensePolicy as any).expiresAt as string | undefined; if (!iso) return ""; const d = new Date(iso); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; })()}
                                onChange={(e) => setEditingPlugin({ ...editingPlugin, licensePolicy: { type: "date", expiresAt: new Date(e.target.value).toISOString() } as any })}
                                className="w-full px-4 py-3 bg-input border border-border rounded-md"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={saveEdit} className="px-3 py-1 bg-primary text-primary-foreground rounded flex items-center gap-1">
                            <Check size={16} /> Salvar
                          </button>
                          <button onClick={cancelEdit} className="px-3 py-1 border border-border rounded flex items-center gap-1">
                            <X size={16} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            {p.subtitle && (
                              <div className="text-sm text-muted-foreground">{p.subtitle}</div>
                            )}
                            <div className="text-sm text-muted-foreground">{p.category} • v{p.version}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEdit(p)} className="px-3 py-1 border border-border rounded flex items-center gap-1 text-sm min-w-[88px]">
                              <Edit size={16} /> Editar
                            </button>
                            <button onClick={() => deletePlugin(p.id)} className="px-3 py-1 border border-destructive text-destructive rounded flex items-center gap-1 text-sm min-w-[88px]">
                              <Trash2 size={16} /> Excluir
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 border-t border-border pt-4">
                          <h3 className="font-semibold mb-2">Lançamentos</h3>
                          <ReleasesManager plugin={p} onChanged={refreshPlugins} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="categorias">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Categorias</h2>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 px-4 py-3 bg-input border border-border rounded-md"
                    placeholder="Nova categoria"
                  />
                  <button onClick={addCategoryReq} className="px-4 py-3 bg-primary text-primary-foreground rounded-md">Criar</button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-auto pr-2">
                  {((categoriesQuery.data?.categories ?? []) as string[]).map((c) => (
                    <div key={c} className="flex items-center justify-between border border-border rounded-lg p-3">
                      <span className="font-semibold">{c}</span>
                      <button onClick={() => deleteCategoryReq(c)} className="px-3 py-2 border border-destructive text-destructive rounded-md text-sm">Excluir</button>
                    </div>
                  ))}
                  {((categoriesQuery.data?.categories ?? []) as string[]).length === 0 && (
                    <div className="text-sm text-muted-foreground">Nenhuma categoria cadastrada</div>
                  )}
                </div>
                {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
              </div>
            </TabsContent>

            <TabsContent value="pedidos">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Pedidos</h2>
                <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                  {(ordersQuery.data?.orders ?? []).map((o: Order) => {
                    const plugin = ((pluginsQuery.data?.plugins ?? []) as Plugin[]).find((p) => p.id === o.pluginId);
                    const user = ((usersQuery.data?.users ?? []) as User[]).find((u) => u.id === o.userId);
                    return (
                    <div key={o.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-border rounded-lg p-3 items-center">
                      <div className="md:col-span-2">
                        <div className="font-semibold">{plugin?.name ?? o.pluginId}</div>
                        <div className="text-xs text-muted-foreground">ID: {o.id}</div>
                        <div className="text-xs text-muted-foreground">Data: {new Date(o.createdAt).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Cliente: {user?.username ?? o.userId}</div>
                        <div className="text-xs text-muted-foreground">Preço: R$ {o.price.toFixed(2)} • Status: {o.status}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select value={orderStatusDraft[o.id] ?? o.status} onChange={(e) => setOrderStatusDraft((p) => ({ ...p, [o.id]: e.target.value as Order["status"] }))} className="px-2 py-1 bg-input border border-border rounded text-sm">
                          <option value="completed">Concluído</option>
                          <option value="pending">Pendente</option>
                          <option value="failed">Falhou</option>
                        </select>
                        <button onClick={() => updateOrderReq(o.id)} className="px-3 py-1 border border-border rounded-md text-sm whitespace-nowrap">Salvar</button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select value={orderUserDraft[o.id] ?? o.userId} onChange={(e) => setOrderUserDraft((p) => ({ ...p, [o.id]: e.target.value }))} className="px-2 py-1 bg-input border border-border rounded text-sm">
                          {((usersQuery.data?.users ?? []) as User[]).map((u) => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                        <button onClick={() => reassignOrderReq(o.id)} className="px-3 py-1 border border-border rounded-md text-sm whitespace-nowrap">Reatribuir</button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => regenerateOrderLicenseReq(o.id)} className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm whitespace-nowrap">Regenerar Licença</button>
                        <button onClick={() => deleteOrderReq(o.id)} className="px-3 py-1 border border-destructive text-destructive rounded-md text-sm whitespace-nowrap">Excluir</button>
                      </div>
                    </div>
                  )})}
                  {(ordersQuery.data?.orders ?? []).length === 0 && (
                    <div className="text-sm text-muted-foreground">Nenhum pedido encontrado</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usuarios">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Usuários</h2>
                <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
                  {(usersQuery.data?.users ?? []).map((u: User) => (
                    <div key={u.id} className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 shadow-sm hover:shadow-md transition">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                            {u.username?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{u.username}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Nome</label>
                          <input
                            defaultValue={u.username}
                            onChange={(e) => setProfileDraft((p) => ({ ...p, [u.id]: { ...(p[u.id] ?? { username: u.username, email: u.email }), username: e.target.value } }))}
                            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
                          />
                          <label className="block text-xs mt-3 mb-1">Email</label>
                          <input
                            defaultValue={u.email}
                            onChange={(e) => setProfileDraft((p) => ({ ...p, [u.id]: { ...(p[u.id] ?? { username: u.username, email: u.email, cpf: (u as any).cpf }), email: e.target.value } }))}
                            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
                          />
                          <label className="block text-xs mt-3 mb-1">CPF</label>
                          <input
                            defaultValue={(u as any).cpf || ""}
                            onChange={(e) => setProfileDraft((p) => ({ ...p, [u.id]: { ...(p[u.id] ?? { username: u.username, email: u.email, cpf: (u as any).cpf }), cpf: e.target.value } }))}
                            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Cargo</label>
                          <select
                            value={roleDraft[u.id] ?? u.role}
                            onChange={(e) => setRoleDraft((prev) => ({ ...prev, [u.id]: e.target.value as User["role"] }))}
                            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
                          >
                            <option value="customer">Cliente</option>
                            <option value="developer">Desenvolvedor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                          <button onClick={() => saveUserProfile(u)} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition flex items-center gap-1 whitespace-nowrap">
                            <Save size={14} /> Salvar Perfil
                          </button>
                          <button onClick={() => saveUserRole(u)} className="px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-card-foreground/5 transition flex items-center gap-1 whitespace-nowrap">
                            <Save size={14} /> Salvar Cargo
                          </button>
                          <PasswordSetter onSave={(pwd) => saveUserPassword(u, pwd)} />
                          <button onClick={() => deleteUserReq(u.id)} className="px-3 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10 transition flex items-center gap-1 whitespace-nowrap">
                            <Trash2 size={14} /> Excluir Usuário
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="licencas">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Licenças</h2>
                <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                  {(() => {
                    const plugins = (pluginsQuery.data?.plugins ?? []) as Plugin[];
                    const starfin = plugins.find((p) => p.name.toLowerCase() === "starfinlicense");
                    const items = ((licensesQuery.data?.licenses ?? []) as License[]).filter((l) => !!starfin && l.pluginId === starfin.id);
                    return items;
                  })().map((l) => (
                    <div key={l.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-border rounded-lg p-3 items-center">
                      <div className="md:col-span-2">
                        <div className="font-semibold">
                          Licença: {licenseReveal[l.id] ? (
                            <span className="font-mono">{l.key}</span>
                          ) : (
                            <span className="text-muted-foreground">Oculta</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Status: {l.status}{l.expiresAt ? ` • expira em ${new Date(l.expiresAt).toLocaleDateString()}` : ""}</div>
                        <button
                          onClick={() => setLicenseReveal((prev) => ({ ...prev, [l.id]: !prev[l.id] }))}
                          className="mt-2 px-3 py-1 border border-border rounded-md text-xs whitespace-nowrap"
                        >
                          {licenseReveal[l.id] ? "Ocultar licença" : "Visualizar licença"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => revokeLicenseReq(l.id)} className="px-3 py-1 border border-destructive text-destructive rounded-md text-sm whitespace-nowrap">Bloquear</button>
                        <button onClick={() => deleteLicenseReq(l.id)} className="px-3 py-1 border border-destructive text-destructive rounded-md text-sm whitespace-nowrap">Excluir</button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="date" value={renewDraft[l.id] ?? ""} onChange={(e) => setRenewDraft((prev) => ({ ...prev, [l.id]: e.target.value }))} className="px-2 py-1 bg-input border border-border rounded text-sm" />
                        <button onClick={() => renewLicenseReq(l.id)} className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm whitespace-nowrap">Renovar</button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select value={assignDraft[l.id] ?? ""} onChange={(e) => setAssignDraft((prev) => ({ ...prev, [l.id]: e.target.value }))} className="px-2 py-1 bg-input border border-border rounded text-sm">
                          <option value="">Selecione usuário</option>
                          {((usersQuery.data?.users ?? []) as User[]).map((u) => (
                            <option key={u.id} value={u.id}>{u.username}</option>
                          ))}
                        </select>
                        <button onClick={() => assignLicenseReq(l.id)} className="px-3 py-1 border border-border rounded-md text-sm whitespace-nowrap">Atribuir</button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          placeholder="IP da máquina"
                          value={ipDraft[l.id] ?? (l as any).ipAddress ?? ""}
                          onChange={(e) => setIpDraft((prev) => ({ ...prev, [l.id]: e.target.value }))}
                          className="px-2 py-1 bg-input border border-border rounded text-sm w-full md:w-auto"
                        />
                        <button onClick={() => bindLicenseIpReq(l.id)} className="px-3 py-1 border border-border rounded-md text-sm whitespace-nowrap">Salvar IP</button>
                      </div>
                    </div>
                  ))}
                  {(() => {
                    const plugins = (pluginsQuery.data?.plugins ?? []) as Plugin[];
                    const starfin = plugins.find((p) => p.name.toLowerCase() === "starfinlicense");
                    const items = ((licensesQuery.data?.licenses ?? []) as License[]).filter((l) => !!starfin && l.pluginId === starfin.id);
                    return items.length === 0;
                  })() && (
                    <div className="text-sm text-muted-foreground">Nenhuma licença encontrada</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Logs</h2>
                <div className="space-y-2 max-h-[60vh] overflow-auto pr-2">
                  {(logsQuery.data?.logs ?? []).map((l) => (
                    <div key={l.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 border border-border rounded-lg p-3">
                      <span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
                      <span className="font-mono text-xs md:col-span-1">{l.type}</span>
                      <span className="md:col-span-2">{l.message}</span>
                    </div>
                  ))}
                  {(logsQuery.data?.logs ?? []).length === 0 && (
                    <div className="text-sm text-muted-foreground">Nenhum log registrado</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assets">
              <AssetsManager />
            </TabsContent>
              <TabsContent value="destaques">
              <HighlightsManager />
            </TabsContent>
            <TabsContent value="pagamentos">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Configurações de Pagamento</h2>
                <div className="space-y-4 max-w-xl">
                  <div>
                    <div className="text-sm text-muted-foreground">Mercado Pago</div>
                    <div className="text-xs text-muted-foreground">Token atual: {(paymentsQuery.data?.settings?.mercadoPagoAccessTokenMasked ?? "") || "não configurado"}</div>
                    <div className="text-xs text-muted-foreground">URL pública: {(paymentsQuery.data?.settings?.publicBaseUrl ?? "") || "não configurada"}</div>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Access Token</label>
                    <input
                      type="password"
                      value={mpTokenDraft}
                      onChange={(e) => setMpTokenDraft(e.target.value)}
                      placeholder="INSIRA O ACCESS TOKEN"
                      className="w-full px-4 py-3 bg-input border border-border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">URL pública do site</label>
                    <input
                      type="text"
                      value={baseUrlDraft}
                      onChange={(e) => setBaseUrlDraft(e.target.value)}
                      placeholder="https://seusite.com"
                      className="w-full px-4 py-3 bg-input border border-border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Usada nas back_urls do Mercado Pago. Ex.: https://meudominio.com</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={savePayments} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Salvar</button>
                    {message && <span className="text-sm text-muted-foreground">{message}</span>}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

function PasswordSetter({ onSave }: { onSave: (pwd: string) => void }) {
  const [pwd, setPwd] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        placeholder="Nova senha"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        className="px-3 py-2 bg-input border border-border rounded-md text-sm w-40"
      />
      <button
        onClick={() => onSave(pwd)}
        className="px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-card-foreground/5 transition whitespace-nowrap"
      >
        Salvar Senha
      </button>
    </div>
  );
}

function HighlightsManager() {
  const { authFetch } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["site-highlights"],
    queryFn: async (): Promise<{ success: boolean; items: { id: string; fileName: string; uploadedAt: string }[] }> => {
      const res = await authFetch("/api/highlights");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const upload = async () => {
    if (!file) { setMsg("Selecione um arquivo"); return; }
    setBusy(true);
    setMsg(null);
    try {
      const base64 = await readFileAsBase64(file);
      const res = await authFetch(`/api/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, imageBase64: base64 }),
      });
      const d = await res.json();
      if (!d.success) setMsg(d.message || "Erro ao enviar destaque");
      else { setMsg("Destaque adicionado!"); setFile(null); refetch(); }
    } catch {
      setMsg("Falha na requisição");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await authFetch(`/api/highlights/${encodeURIComponent(id)}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) setMsg(d.message || "Erro ao remover destaque");
      else { setMsg("Destaque removido!"); refetch(); }
    } finally { setBusy(false); }
  };

  const items = (data?.items ?? []) as { id: string; fileName: string; uploadedAt: string }[];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Destaques</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <label className="block text-sm mb-1">Imagem de Destaque</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 bg-input border border-border rounded-md" />
          <button onClick={upload} disabled={busy} className="px-4 py-3 bg-primary text-primary-foreground rounded-md">Adicionar Destaque</button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold">Atuais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhum destaque cadastrado</div>
            )}
            {items.map((i) => (
              <div key={i.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{i.fileName}</div>
                    <div className="text-xs text-muted-foreground">{new Date(i.uploadedAt).toLocaleString()}</div>
                  </div>
                  <button onClick={() => remove(i.id)} className="px-3 py-1 border border-destructive text-destructive rounded-md text-sm">Remover</button>
                </div>
                <div className="bg-muted rounded-md overflow-hidden">
                  <img src={`/api/highlights/${encodeURIComponent(i.id)}`} alt={i.fileName} className="w-full h-40 object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ReleasesManager({ plugin, onChanged }: { plugin: Plugin; onChanged: () => void }) {
  const { authFetch } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const upload = async () => {
    if (!file || !version) { setMsg("Selecione o arquivo e versão"); return; }
    setBusy(true);
    setMsg(null);
    try {
      const jarBase64 = await readFileAsBase64(file);
      const res = await authFetch(`/api/plugins/${plugin.id}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, releaseNotes: notes, fileName: file.name, jarBase64 }),
      });
      const data = await res.json();
      if (!data.success) setMsg(data.message || "Erro ao enviar release");
      else {
        setMsg("Release enviada!");
        setFile(null); setVersion(""); setNotes("");
        onChanged();
      }
    } catch (e) {
      setMsg("Falha na requisição");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (v: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await authFetch(`/api/plugins/${plugin.id}/releases/${encodeURIComponent(v)}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) setMsg(data.message || "Erro ao remover release");
      else { setMsg("Release removida!"); onChanged(); }
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="px-4 py-3 bg-input border border-border rounded-md" placeholder="Versão (ex: 1.2.0)" value={version} onChange={(e) => setVersion(e.target.value)} />
          <input type="file" accept=".jar" onChange={(e) => setFile(e.target.files?.[0] || null)} className="px-4 py-3 bg-input border border-border rounded-md md:col-span-2" />
          <button onClick={upload} disabled={busy} className="px-4 py-3 bg-primary text-primary-foreground rounded-md">Enviar .jar</button>
        </div>
        <textarea className="w-full px-4 py-3 bg-input border border-border rounded-md" placeholder="Notas de atualização" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </div>
      <div className="space-y-3">
        {(plugin.releases ?? []).length === 0 && <div className="text-sm text-muted-foreground">Nenhum lançamento</div>}
        {(plugin.releases ?? []).map((r) => (
          <div key={r.version} className="flex items-center justify-between border border-border rounded-lg p-3">
            <div>
              <div className="font-semibold">v{r.version} • {new Date(r.uploadedAt).toLocaleString()}</div>
              {r.releaseNotes && <div className="text-sm text-muted-foreground">{r.releaseNotes.slice(0, 120)}{(r.releaseNotes || "").length > 120 ? "..." : ""}</div>}
            </div>
            <div className="flex items-center gap-2">
              <a href={`/api/plugins/${plugin.id}/releases/${encodeURIComponent(r.version)}/jar`} className="px-3 py-2 border border-border rounded-md text-sm">Baixar .jar</a>
              <button onClick={() => remove(r.version)} className="px-3 py-2 border border-destructive text-destructive rounded-md text-sm">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetsManager() {
  const { authFetch } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("banner");

  const { data, refetch } = useQuery({
    queryKey: ["site-assets"],
    queryFn: async (): Promise<{ success: boolean; assets: string[] }> => {
      const res = await authFetch("/api/assets");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const upload = async () => {
    if (!file) { setMsg("Selecione um arquivo"); return; }
    setBusy(true);
    setMsg(null);
    try {
      const base64 = await readFileAsBase64(file);
      const res = await authFetch(`/api/assets/${encodeURIComponent(name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, imageBase64: base64 }),
      });
      const d = await res.json();
      if (!d.success) setMsg(d.message || "Erro ao enviar asset");
      else { setMsg("Asset atualizado!"); setFile(null); refetch(); }
    } catch {
      setMsg("Falha na requisição");
    } finally { setBusy(false); }
  };

  const remove = async (n: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await authFetch(`/api/assets/${encodeURIComponent(n)}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) setMsg(d.message || "Erro ao remover asset");
      else { setMsg("Asset removido!"); refetch(); }
    } finally { setBusy(false); }
  };

  const assets = (data?.assets ?? []) as string[];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Assets do Site</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <label className="block text-sm mb-1">Tipo de Asset</label>
          <select value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-md">
            <option value="banner">Banner</option>
            <option value="logo">Logo</option>
            <option value="icon">Ícone (favicon)</option>
            <option value="header">Header</option>
          </select>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 bg-input border border-border rounded-md" />
          <button onClick={upload} disabled={busy} className="px-4 py-3 bg-primary text-primary-foreground rounded-md">Salvar Asset</button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold">Atuais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.length === 0 && (
              <div className="text-sm text-muted-foreground">Nenhum asset cadastrado</div>
            )}
            {assets.map((n) => (
              <div key={n} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{n}</div>
                  <button onClick={() => remove(n)} className="px-3 py-1 border border-destructive text-destructive rounded-md text-sm">Remover</button>
                </div>
                <div className="bg-muted rounded-md overflow-hidden">
                  <img src={`/api/assets/${encodeURIComponent(n)}`} alt={n} className="w-full h-40 object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
