import Layout from "@/components/Layout";
import { Lock, Check, Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { GetPluginsResponse, GetOrdersResponse, Plugin, Order, GetLicensesResponse, License } from "@shared/api";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";

export default function CustomerArea() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname === "/minha-conta" && profileRef.current) {
      profileRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.pathname]);

  const pluginsQuery = useQuery({
    queryKey: ["plugins"],
    queryFn: async (): Promise<GetPluginsResponse> => {
      const res = await fetch("/api/plugins");
      return res.json();
    },
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<GetOrdersResponse> => {
      const res = await fetch(`/api/orders?userId=${encodeURIComponent(user!.id)}`);
      return res.json();
    },
    refetchInterval: 5000,
  });

  const licensesQuery = useQuery({
    queryKey: ["licenses", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<GetLicensesResponse> => {
      const res = await fetch(`/api/licenses?userId=${encodeURIComponent(user!.id)}`);
      return res.json();
    },
    refetchInterval: 10000,
  });

  const plugins = (pluginsQuery.data?.plugins ?? []) as Plugin[];
  const orders = (ordersQuery.data?.orders ?? []) as Order[];
  const licenses = (licensesQuery.data?.licenses ?? []) as License[];
  const starfin = plugins.find((p) => p.name.toLowerCase() === "starfinlicense");
  const starfinLic = licenses.find((l) => starfin && l.pluginId === starfin.id);
  const isStarfinActive = (() => {
    if (!starfinLic) return false;
    if (starfinLic.status !== "active") return false;
    return true; // vitalícia
  })();
  const isOrderActive = (o: Order, plugin?: Plugin) => {
    const pol = (o as any).ownershipPolicy as Plugin["licensePolicy"] | undefined;
    const p = pol ?? plugin?.licensePolicy;
    if (!p) return true;
    if (p.type === "infinite") return true;
    if (p.type === "duration") {
      const d = new Date(o.createdAt);
      d.setMonth(d.getMonth() + (p.months || 0));
      return Date.now() < d.getTime();
    }
    if (p.type === "date") {
      return Date.now() < new Date(p.expiresAt).getTime();
    }
    return true;
  };
  const orderExpiresAt = (o: Order, plugin?: Plugin): string | null => {
    const pol = (o as any).ownershipPolicy as Plugin["licensePolicy"] | undefined;
    const p = pol ?? plugin?.licensePolicy;
    if (!p) return null;
    if (p.type === "infinite") return null;
    if (p.type === "duration") {
      const d = new Date(o.createdAt);
      d.setMonth(d.getMonth() + (p.months || 0));
      return d.toISOString();
    }
    if (p.type === "date") return p.expiresAt;
    return null;
  };
  const [showLic, setShowLic] = useState<Record<string, boolean>>({});
  const [ipDraft, setIpDraft] = useState<Record<string, string>>({});
  const [savingIp, setSavingIp] = useState<Record<string, boolean>>({});
  const [ipStatus, setIpStatus] = useState<Record<string, "success" | "error" | null>>({});
  const [ipStatusMsg, setIpStatusMsg] = useState<Record<string, string | null>>({});
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPwd, setResetPwd] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const { authFetch } = useAuth();
  const submitReset = async () => {
    setResetMsg(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword: resetPwd }),
      });
      const d = await res.json();
      if (!d.success) setResetMsg(d.message || "Erro ao redefinir senha");
      else setResetMsg("Senha redefinida! Você já pode fazer login.");
    } catch {
      setResetMsg("Falha na requisição");
    }
  };
  const bindLicenseIpReq = async (id: string) => {
    setSavingIp((p) => ({ ...p, [id]: true }));
    setIpStatusMsg((p) => ({ ...p, [id]: null }));
    setIpStatus((p) => ({ ...p, [id]: null }));
    try {
      const res = await authFetch(`/api/licenses/${id}/ip`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: ipDraft[id] }),
      });
      const d = await res.json();
      if (!d.success) {
        setIpStatus((p) => ({ ...p, [id]: "error" }));
        setIpStatusMsg((p) => ({ ...p, [id]: d.message || "Falha ao salvar IP" }));
        toast({ title: "Erro", description: d.message || "Falha ao salvar IP" });
      } else {
        setIpStatus((p) => ({ ...p, [id]: "success" }));
        setIpStatusMsg((p) => ({ ...p, [id]: "IP salvo com sucesso" }));
        toast({ title: "Sucesso", description: "IP salvo com sucesso" });
        licensesQuery.refetch();
        setTimeout(() => {
          setIpStatus((p) => ({ ...p, [id]: null }));
          setIpStatusMsg((p) => ({ ...p, [id]: null }));
        }, 2500);
      }
    } catch {
      setIpStatus((p) => ({ ...p, [id]: "error" }));
      setIpStatusMsg((p) => ({ ...p, [id]: "Falha na requisição" }));
      toast({ title: "Erro", description: "Falha na requisição" });
    } finally {
      setSavingIp((p) => ({ ...p, [id]: false }));
    }
  };

  const saveProfile = async () => {
    setProfileMsg(null);
    try {
      const res = await authFetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });
      const d = await res.json();
      if (!d.success) setProfileMsg(d.message || "Erro ao atualizar perfil");
      else setProfileMsg("Perfil atualizado!");
    } catch {
      setProfileMsg("Falha na requisição");
    }
  };

  if (initialized && !user) {
    navigate("/login");
  }

  return (
    <Layout>
      <div className="min-h-screen py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {user ? (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold">Área do Cliente</h1>
                <p className="text-muted-foreground">Bem-vindo, {user.username} — {user.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-sm text-muted-foreground">Pedidos</div>
                  <div className="text-3xl font-bold">{orders.length}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-sm text-muted-foreground">Downloads</div>
                  <div className="text-3xl font-bold">{orders.length}</div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-sm text-muted-foreground">Plugins</div>
                  <div className="text-3xl font-bold">{plugins.length}</div>
                </div>
              </div>

              <div ref={profileRef} className="bg-card border border-border rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Editar Perfil</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Nome de usuário</label>
                    <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-md" />
                  </div>
                </div>
                <button onClick={saveProfile} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg">Salvar</button>
                {profileMsg && <p className="text-sm text-muted-foreground mt-2">{profileMsg}</p>}
              </div>

              <div className="bg-card border border-border rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Minha Licença</h2>
                {starfinLic ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Produto:</span> <span className="font-semibold">StarfinLicense</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span> {isStarfinActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/30">Ativo • Vitalícia</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/30">Inativa</span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Licença:</span> {showLic[starfinLic.id] ? (
                        <span className="font-mono">{starfinLic.key}</span>
                      ) : (
                        <span className="text-muted-foreground">Oculta</span>
                      )}
                      <button onClick={() => setShowLic((p) => ({ ...p, [starfinLic.id]: !p[starfinLic.id] }))} className="ml-2 px-2 py-1 border border-border rounded text-xs">
                        {showLic[starfinLic.id] ? "Ocultar" : "Ver licença"}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        placeholder="IP da máquina"
                        value={ipDraft[starfinLic.id] ?? (starfinLic as any).ipAddress ?? ""}
                        onChange={(e) => setIpDraft((prev) => ({ ...prev, [starfinLic.id]: e.target.value }))}
                        className={`px-2 py-1 bg-input border rounded text-xs transition-all ${ipStatus[starfinLic.id] === "success" ? "border-green-500 ring-2 ring-green-400" : ipStatus[starfinLic.id] === "error" ? "border-red-500 ring-2 ring-red-400" : "border-border"}`}
                      />
                      <button
                        onClick={() => bindLicenseIpReq(starfinLic.id)}
                        disabled={!!savingIp[starfinLic.id]}
                        className={`px-2 py-1 border rounded text-xs transition-colors ${ipStatus[starfinLic.id] === "success" ? "border-green-500 text-green-600" : ipStatus[starfinLic.id] === "error" ? "border-red-500 text-red-600" : "border-border"} ${savingIp[starfinLic.id] ? "opacity-70" : ""}`}
                      >
                        {savingIp[starfinLic.id] ? (
                          <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</span>
                        ) : ipStatus[starfinLic.id] === "success" ? (
                          <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Salvo</span>
                        ) : (
                          "Salvar IP"
                        )}
                      </button>
                      {ipStatusMsg[starfinLic.id] && (
                        <span className={`text-xs ${ipStatus[starfinLic.id] === "success" ? "text-green-600" : "text-red-600"}`}>{ipStatusMsg[starfinLic.id]}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">Nenhuma licença encontrada. Ela será criada automaticamente na sua primeira compra ou download gratuito.</div>
                )}
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Meus Pedidos</h2>
                {orders.length === 0 ? (
                  <div className="text-muted-foreground">Nenhum pedido encontrado</div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => {
                      const plugin = plugins.find((p) => p.id === o.pluginId);
                      return (
                        <div key={o.id} className="flex items-center justify-between border border-border rounded-lg p-4">
                          <div>
                            <div className="font-semibold">{plugin?.name ?? o.pluginId}</div>
                            <div className="text-sm text-muted-foreground">{plugin?.category ?? ""}</div>
                            <div className="mt-1 text-xs">
                              <span className="text-muted-foreground">Status:</span>
                              {isOrderActive(o, plugin) ? (
                                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/30">Ativo</span>
                              ) : (
                                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/30">Expirado</span>
                              )}
                              {(() => { const ex = orderExpiresAt(o, plugin); return ex ? (
                                <span className="ml-2 text-muted-foreground">{new Date(ex).toLocaleDateString()}</span>
                              ) : null; })()}
                            </div>
                            {starfinLic ? (
                              <div className="mt-2 flex items-center gap-2 text-xs">
                                <input
                                  placeholder="IPs da máquina (produto) — separados por ';', até 4"
                                  value={(() => {
                                    const draft = ipDraft[o.pluginId];
                                    if (typeof draft === "string") return draft;
                                    const entry = (starfinLic as any).productIps?.[o.pluginId];
                                    return Array.isArray(entry) ? entry.join("; ") : (entry ?? "");
                                  })()}
                                  onChange={(e) => setIpDraft((prev) => ({ ...prev, [o.pluginId]: e.target.value }))}
                                  className={`px-2 py-1 bg-input border rounded text-xs transition-all ${ipStatus[o.pluginId] === "success" ? "border-green-500 ring-2 ring-green-400" : ipStatus[o.pluginId] === "error" ? "border-red-500 ring-2 ring-red-400" : "border-border"}`}
                                />
                                <button
                                  onClick={async () => {
                                    setSavingIp((p) => ({ ...p, [o.pluginId]: true }));
                                    setIpStatusMsg((p) => ({ ...p, [o.pluginId]: null }));
                                    setIpStatus((p) => ({ ...p, [o.pluginId]: null }));
                                    try {
                                      const res = await authFetch(`/api/licenses/${starfinLic.id}/product-ip`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ pluginId: o.pluginId, ips: String(ipDraft[o.pluginId] || "").split(/[;]+/).map((s) => s.trim()).filter((s) => !!s).slice(0, 4) }),
                                      });
                                      const d = await res.json();
                                      if (!d.success) {
                                        setIpStatus((p) => ({ ...p, [o.pluginId]: "error" }));
                                        setIpStatusMsg((p) => ({ ...p, [o.pluginId]: d.message || "Falha ao salvar IP" }));
                                        toast({ title: "Erro", description: d.message || "Falha ao salvar IP" });
                                      } else {
                                        setIpStatus((p) => ({ ...p, [o.pluginId]: "success" }));
                                        setIpStatusMsg((p) => ({ ...p, [o.pluginId]: "IP salvo com sucesso" }));
                                        toast({ title: "Sucesso", description: "IP salvo com sucesso" });
                                        licensesQuery.refetch();
                                        setTimeout(() => {
                                          setIpStatus((p) => ({ ...p, [o.pluginId]: null }));
                                          setIpStatusMsg((p) => ({ ...p, [o.pluginId]: null }));
                                        }, 2500);
                                      }
                                    } catch {
                                      setIpStatus((p) => ({ ...p, [o.pluginId]: "error" }));
                                      setIpStatusMsg((p) => ({ ...p, [o.pluginId]: "Falha na requisição" }));
                                      toast({ title: "Erro", description: "Falha na requisição" });
                                    } finally {
                                      setSavingIp((p) => ({ ...p, [o.pluginId]: false }));
                                    }
                                  }}
                                  disabled={!!savingIp[o.pluginId]}
                                  className={`px-2 py-1 border rounded text-xs transition-colors ${ipStatus[o.pluginId] === "success" ? "border-green-500 text-green-600" : ipStatus[o.pluginId] === "error" ? "border-red-500 text-red-600" : "border-border"} ${savingIp[o.pluginId] ? "opacity-70" : ""}`}
                                >
                                  {savingIp[o.pluginId] ? (
                                    <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Salvando…</span>
                                  ) : ipStatus[o.pluginId] === "success" ? (
                                    <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Salvo</span>
                                  ) : (
                                    "Salvar IPs"
                                  )}
                                </button>
                                <span className="text-muted-foreground">Ex: 192.168.0.10; 203.0.113.5; 10.0.0.3</span>
                                {ipStatusMsg[o.pluginId] && (
                                  <span className={`text-xs ${ipStatus[o.pluginId] === "success" ? "text-green-600" : "text-red-600"}`}>{ipStatusMsg[o.pluginId]}</span>
                                )}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${o.price.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Lock size={64} className="mx-auto mb-6 text-primary" />
              <h1 className="text-4xl font-bold mb-4">Área do Cliente</h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
                Faça login para acessar suas compras, downloads e configurações de conta.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Entrar
              </Link>
              <div className="mt-6 max-w-md mx-auto text-left">
                <button onClick={() => setShowReset((v) => !v)} className="text-sm text-primary hover:underline">
                  Esqueci minha senha
                </button>
                {showReset && (
                  <div className="mt-3 border border-border rounded-lg p-4 bg-card">
                    <label className="block text-sm mb-1">Email</label>
                    <input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
                    <label className="block text-sm mt-3 mb-1">Nova senha</label>
                    <input type="password" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm" />
                    <button onClick={submitReset} className="mt-3 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">Redefinir senha</button>
                    {resetMsg && <p className="mt-2 text-xs text-muted-foreground">{resetMsg}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
