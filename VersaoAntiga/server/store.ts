import { Plugin, Order, User, CreatePluginRequest, PluginRelease, License } from "@shared/api";
import crypto from "crypto";
import fs from "fs";
import path from "path";

let plugins: Plugin[] = [
  {
    id: "plugin-1",
    name: "AdvancedShops",
    description:
      "Advanced shop system with custom GUI and economy integration",
    category: "Utility",
    price: 12.99,
    rating: 4.8,
    downloads: 2500,
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: "https://picsum.photos/seed/advancedshops/800/400",
    longDescriptionHtml:
      "<p>Crie lojas avançadas com <strong>GUI customizada</strong>, integração com economia e filtros.</p><ul><li>Suporte a múltiplas moedas</li><li>Logs de transações</li><li>Permissões por grupo</li></ul>",
  },
  {
    id: "plugin-2",
    name: "LuckyBlock",
    description:
      "Add lucky blocks with random rewards throughout your world",
    category: "Gameplay",
    price: 9.99,
    rating: 4.9,
    downloads: 3200,
    version: "1.2.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: "https://picsum.photos/seed/luckyblock/800/400",
    longDescriptionHtml:
      "<p>Adicione <em>Lucky Blocks</em> com recompensas aleatórias e eventos.</p><p>Configure probabilidades e tabelas de loot via arquivo YAML.</p>",
  },
  {
    id: "plugin-3",
    name: "ProTeleport",
    description: "Advanced teleportation system with homes and warps",
    category: "Utility",
    price: 7.99,
    rating: 4.7,
    downloads: 1800,
    version: "1.1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: "https://picsum.photos/seed/proteleport/800/400",
    longDescriptionHtml:
      "<p>Sistema de teleporte com <strong>homes</strong>, <strong>warps</strong>, cooldown e permissões.</p>",
  },
  {
    id: "plugin-4",
    name: "CustomMobs",
    description:
      "Create and customize unique mob types with special abilities",
    category: "Gameplay",
    price: 14.99,
    rating: 4.6,
    downloads: 2100,
    version: "2.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: "https://picsum.photos/seed/custommobs/800/400",
    longDescriptionHtml:
      "<p>Crie mobs com habilidades exclusivas, IA customizada e drops especiais.</p>",
  },
];

let orders: Order[] = [];
let licenses: License[] = [];

let users: User[] = [
  {
    id: "user-1",
    email: "demo@example.com",
    username: "demo",
    role: "customer",
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-admin-1",
    email: "admin@example.com",
    username: "admin",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

type Credential = { userId: string; email: string; passwordHash: string };
let credentials: Credential[] = [
  {
    userId: "user-1",
    email: "demo@example.com",
    passwordHash: crypto.createHash("sha256").update("demo123").digest("hex"),
  },
  {
    userId: "user-admin-1",
    email: "admin@example.com",
    passwordHash: crypto.createHash("sha256").update("admin123").digest("hex"),
  },
];

const DATA_FILE = path.join(import.meta.dirname, "data.json");
const UPLOADS_DIR = path.join(import.meta.dirname, "../uploads");
const SITE_ASSETS_DIR = path.join(import.meta.dirname, "../uploads/site-assets");
const HIGHLIGHTS_DIR = path.join(SITE_ASSETS_DIR, "highlights");
type LogEntry = { id: string; type: string; message: string; createdAt: string };
let logs: LogEntry[] = [];
let categories: string[] = ["Utility", "Gameplay"];
let siteAssets: Record<string, string> = {};
type SiteHighlight = { id: string; path: string; fileName: string; uploadedAt: string };
let siteHighlights: SiteHighlight[] = [];
type PaymentSettings = { mercadoPagoAccessToken?: string; publicBaseUrl?: string };
type Settings = { payments?: PaymentSettings };
let settings: Settings = {};

function saveData() {
  try {
    const payload = { plugins, orders, users, credentials, logs, categories, siteAssets, siteHighlights, licenses, settings };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
  } catch {}
}

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData();
      return;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
  const data = JSON.parse(raw) as {
      plugins?: Plugin[];
      orders?: Order[];
      users?: User[];
      credentials?: Credential[];
      logs?: LogEntry[];
      categories?: string[];
      siteAssets?: Record<string, string>;
      siteHighlights?: SiteHighlight[];
      licenses?: License[];
      settings?: Settings;
    };
    if (Array.isArray(data.plugins)) plugins = data.plugins;
    if (Array.isArray(data.orders)) orders = data.orders;
    if (Array.isArray(data.users)) users = data.users;
    if (Array.isArray(data.credentials)) credentials = data.credentials;
    if (Array.isArray(data.logs)) logs = data.logs;
    if (Array.isArray(data.categories)) categories = data.categories;
    if (data.siteAssets && typeof data.siteAssets === "object") siteAssets = data.siteAssets;
    if (Array.isArray(data.siteHighlights)) siteHighlights = data.siteHighlights;
    if (Array.isArray(data.licenses)) licenses = data.licenses;
    if (data.settings && typeof data.settings === "object") settings = data.settings;
  } catch {}
}

loadData();

function ensureDir(p: string) {
  try {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  } catch {}
}

function ensureAdminUser(email: string) {
  const existing = findUserByEmail(email);
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      saveData();
    }
    return existing;
  }
  const username = email.split("@")[0];
  const user: User = {
    id: `user-${Date.now()}`,
    email,
    username,
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  addUser(user);
  const defaultPassword = "starfin123";
  credentials.push({ userId: user.id, email, passwordHash: hashPassword(defaultPassword) });
  saveData();
  return user;
}

// Promote the requested account to admin (create if missing)
ensureAdminUser("alan.luiz1620@gmail.com");

export function getPlugins(category?: string) {
  if (!category) return plugins;
  return plugins.filter(
    (p) => p.category.toLowerCase() === category.toLowerCase(),
  );
}

export function addPlugin(req: CreatePluginRequest): Plugin {
  const newPlugin: Plugin = {
    id: `plugin-${Date.now()}`,
    name: req.name,
    subtitle: req.subtitle,
    description: req.description,
    category: req.category,
    price: req.price,
    version: req.version,
    rating: 5.0,
    downloads: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: req.imageUrl,
    longDescriptionHtml: req.longDescriptionHtml,
    releases: [],
    licensePolicy: req.licensePolicy,
    dependencies: req.dependencies || [],
  };
  plugins.push(newPlugin);
  addLog("plugin:create", `Plugin ${newPlugin.name} criado`);
  saveData();
  return newPlugin;
}

export function findPluginById(id: string) {
  return plugins.find((p) => p.id === id);
}

export function findPluginByName(name: string) {
  return plugins.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

export function ensureStarfinPlugin(): Plugin {
  let p = findPluginByName("StarfinLicense");
  if (p) return p;
  const now = new Date().toISOString();
  p = {
    id: "starfin-license",
    name: "StarfinLicense",
    description: "Licença central para validação e posse de plugins",
    category: "Core",
    price: 0,
    rating: 5.0,
    downloads: 0,
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    longDescriptionHtml: "<p>Licença vitalícia usada para validar a posse de plugins.</p>",
    licensePolicy: { type: "infinite" },
  } as Plugin;
  plugins.push(p);
  addLog("plugin:create", `Plugin central ${p.name} criado`);
  saveData();
  return p;
}

export function incrementPluginDownloads(pluginId: string, quantity: number) {
  const plugin = findPluginById(pluginId);
  if (plugin) {
    plugin.downloads += quantity;
    plugin.updatedAt = new Date().toISOString();
    saveData();
  }
}

export function updatePluginInStore(id: string, updates: Partial<Plugin>) {
  const idx = plugins.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const next: Plugin = {
    ...plugins[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  } as Plugin;
  plugins[idx] = next;
  addLog("plugin:update", `Plugin ${next.name} atualizado`);
  saveData();
  return next;
}

export function deletePluginFromStore(id: string) {
  const idx = plugins.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  plugins.splice(idx, 1);
  // Remove related orders if any
  orders = orders.filter((o) => o.pluginId !== id);
  addLog("plugin:delete", `Plugin ${id} removido`);
  saveData();
  return true;
}

export function addReleaseToPlugin(
  pluginId: string,
  version: string,
  fileName: string,
  jarBase64: string,
  releaseNotes?: string,
) {
  const plugin = findPluginById(pluginId);
  if (!plugin) return { error: "Plugin not found" } as const;
  ensureDir(UPLOADS_DIR);
  const pluginDir = path.join(UPLOADS_DIR, pluginId);
  ensureDir(pluginDir);
  const target = path.join(pluginDir, `${version}.jar`);
  try {
    const data = Buffer.from(jarBase64, "base64");
    fs.writeFileSync(target, data);
    const rel: PluginRelease = {
      version,
      jarPath: target,
      releaseNotes,
      uploadedAt: new Date().toISOString(),
    };
    if (!plugin.releases) plugin.releases = [];
    // Replace if exists
    const idx = plugin.releases.findIndex((r) => r.version === version);
    if (idx >= 0) plugin.releases[idx] = rel;
    else plugin.releases.push(rel);
    plugin.updatedAt = new Date().toISOString();
    addLog("release:upload", `Release v${version} enviada para ${plugin.name}`);
    saveData();
    return { release: rel } as const;
  } catch (e) {
    return { error: "Write failed" } as const;
  }
}

export function listReleases(pluginId: string) {
  const plugin = findPluginById(pluginId);
  if (!plugin) return null;
  return plugin.releases ?? [];
}

export function getOfficialJarHashByPluginName(name: string) {
  const plugin = findPluginByName(name);
  if (!plugin) return null;
  const releases = plugin.releases ?? [];
  if (releases.length === 0) return null;
  const latest = releases.slice().sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
  if (!latest.jarPath || !fs.existsSync(latest.jarPath)) return null;
  try {
    const buf = fs.readFileSync(latest.jarPath);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    return hash;
  } catch {
    return null;
  }
}

export function getOfficialJarHashesByPluginId(pluginId: string) {
  const plugin = findPluginById(pluginId);
  if (!plugin) return [] as { version: string; hash: string }[];
  const releases = plugin.releases ?? [];
  const out: { version: string; hash: string }[] = [];
  for (const r of releases) {
    if (!r.jarPath) continue;
    if (!fs.existsSync(r.jarPath)) continue;
    try {
      const buf = fs.readFileSync(r.jarPath);
      const hash = crypto.createHash("sha256").update(buf).digest("hex");
      out.push({ version: r.version, hash });
    } catch {}
  }
  return out;
}

export function deleteRelease(pluginId: string, version: string) {
  const plugin = findPluginById(pluginId);
  if (!plugin) return false;
  const idx = (plugin.releases ?? []).findIndex((r) => r.version === version);
  if (idx === -1) return false;
  const rel = plugin.releases![idx];
  try { if (rel.jarPath && fs.existsSync(rel.jarPath)) fs.unlinkSync(rel.jarPath); } catch {}
  plugin.releases!.splice(idx, 1);
  plugin.updatedAt = new Date().toISOString();
  addLog("release:delete", `Release v${version} removida de ${plugin.name}`);
  saveData();
  return true;
}

export function addOrder(order: Order) {
  orders.push(order);
  addLog("order:create", `Pedido ${order.id} criado para plugin ${order.pluginId}`);
  saveData();
}

export function getOrdersForUser(userId?: string) {
  if (!userId) return orders;
  return orders.filter((o) => o.userId === userId);
}

export function updateOrderStatus(id: string, status: Order["status"]) {
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx].status = status;
  addLog("order:update", `Status do pedido ${id} alterado para ${status}`);
  saveData();
  return orders[idx];
}

export function deleteOrderById(id: string) {
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return false;
  const removed = orders[idx];
  orders.splice(idx, 1);
  // Remove licença associada
  const licIdx = licenses.findIndex((l) => l.orderId === id);
  if (licIdx >= 0) licenses.splice(licIdx, 1);
  addLog("order:delete", `Pedido ${id} removido`);
  saveData();
  return true;
}

export function reassignOrderUser(id: string, userId: string) {
  const o = orders.find((oo) => oo.id === id);
  if (!o) return null;
  o.userId = userId;
  // Atualiza licença vinculada
  const lic = licenses.find((l) => l.orderId === id);
  if (lic) lic.userId = userId;
  addLog("order:reassign", `Pedido ${id} atribuído ao usuário ${userId}`);
  saveData();
  return o;
}

export function regenerateLicenseForOrderId(orderId: string) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  // Remove licença antiga
  const licIdx = licenses.findIndex((l) => l.orderId === orderId);
  if (licIdx >= 0) licenses.splice(licIdx, 1);
  // Cria nova licença com política atual do plugin
  const lic = createLicenseForOrder(order);
  addLog("license:regenerate", `Licença regenerada para pedido ${orderId}`);
  saveData();
  return lic;
}

export function findOrderById(id: string) {
  return orders.find((o) => o.id === id);
}

function generateLicenseKey(): string {
  const bytes = crypto.randomBytes(16).toString("hex").toUpperCase();
  return bytes.match(/.{1,4}/g)?.join("-") ?? bytes;
}

export function createLicenseForOrder(order: Order): License {
  const lic: License = {
    id: `lic-${Date.now()}`,
    orderId: order.id,
    userId: order.userId,
    pluginId: order.pluginId,
    key: generateLicenseKey(),
    status: "active",
    createdAt: new Date().toISOString(),
  };
  const plugin = findPluginById(order.pluginId);
  const policy = plugin?.licensePolicy;
  if (policy) {
    if (policy.type === "duration") {
      const d = new Date();
      d.setMonth(d.getMonth() + (policy.months || 0));
      lic.expiresAt = d.toISOString();
    } else if (policy.type === "date") {
      const d = new Date(policy.expiresAt);
      lic.expiresAt = d.toISOString();
    } else {
      // infinite: no expiresAt
    }
  }
  licenses.push(lic);
  addLog("license:create", `Licença ${lic.id} criada para pedido ${order.id}`);
  saveData();
  return lic;
}

export function listLicensesForUser(userId?: string) {
  if (!userId) return licenses;
  return licenses.filter((l) => l.userId === userId);
}

export function findLicenseByKey(key: string) {
  return licenses.find((l) => l.key === key);
}

export function validateLicense(params: { key?: string; licenseId?: string; pluginId?: string; userId?: string; ipAddress?: string }) {
  const { key, licenseId, pluginId, userId, ipAddress } = params;
  let lic = licenses.find((l) => (key ? l.key === key : true) && (licenseId ? l.id === licenseId : true));
  if (!lic) return { valid: false, message: "Licença não encontrada" } as const;
  if (lic.status !== "active") return { valid: false, message: "Licença inválida" } as const;
  if (pluginId && lic.pluginId !== pluginId) return { valid: false, message: "Produto não corresponde" } as const;
  if (userId && lic.userId !== userId) return { valid: false, message: "Usuário não corresponde" } as const;
  if (lic.ipAddress) {
    if (!ipAddress) return { valid: false, message: "IP requerido" } as const;
    if (lic.ipAddress !== ipAddress) return { valid: false, message: "IP não corresponde" } as const;
  }
  return { valid: true, license: lic } as const;
}

export function ensureStarfinLicenseForUser(userId: string) {
  const starfin = ensureStarfinPlugin();
  if (!starfin) return null;
  const existing = licenses.find((l) => l.userId === userId && l.pluginId === starfin.id);
  if (existing) return existing;
  const lic: License = {
    id: `lic-${Date.now()}`,
    userId,
    pluginId: starfin.id,
    key: generateLicenseKey(),
    status: "active",
    createdAt: new Date().toISOString(),
  } as License;
  // StarfinLicense é sempre vitalícia: não define expiresAt
  licenses.push(lic);
  addLog("license:create", `Licença StarfinLicense criada para usuário ${userId}`);
  saveData();
  return lic;
}

export function doesUserOwnPlugin(userId: string, pluginId: string) {
  return orders.some((o) => {
    if (o.userId !== userId || o.pluginId !== pluginId || o.status !== "completed") return false;
    const pol = (o as any).ownershipPolicy as import("@shared/api").LicensePolicy | undefined;
    if (!pol) return true; // compat: pedidos antigos sem política são considerados vitalícios
    if (pol.type === "infinite") return true;
    if (pol.type === "duration") {
      const months = pol.months || 0;
      const d = new Date(o.createdAt);
      d.setMonth(d.getMonth() + months);
      return Date.now() < d.getTime();
    }
    if (pol.type === "date") {
      return Date.now() < new Date(pol.expiresAt).getTime();
    }
    return false;
  });
}

export function revokeLicense(id: string) {
  const lic = licenses.find((l) => l.id === id);
  if (!lic) return null;
  lic.status = "revoked";
  addLog("license:revoke", `Licença ${id} revogada`);
  saveData();
  return lic;
}

export function renewLicense(id: string, expiresAt?: string) {
  const lic = licenses.find((l) => l.id === id);
  if (!lic) return null;
  // Default renewal: +12 meses se não for passado expiresAt
  if (!expiresAt) {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    lic.expiresAt = d.toISOString();
  } else {
    lic.expiresAt = new Date(expiresAt).toISOString();
  }
  lic.status = "active";
  addLog("license:renew", `Licença ${id} renovada até ${lic.expiresAt}`);
  saveData();
  return lic;
}

export function deleteLicense(id: string) {
  const idx = licenses.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  const removed = licenses[idx];
  licenses.splice(idx, 1);
  addLog("license:delete", `Licença ${removed.id} removida`);
  saveData();
  return true;
}

export function assignLicense(id: string, userId: string) {
  const lic = licenses.find((l) => l.id === id);
  if (!lic) return null;
  lic.userId = userId;
  addLog("license:assign", `Licença ${id} atribuída ao usuário ${userId}`);
  saveData();
  return lic;
}

export function findLicenseById(id: string) {
  return licenses.find((l) => l.id === id);
}

export function updateLicenseIp(id: string, ipAddress: string) {
  const lic = licenses.find((l) => l.id === id);
  if (!lic) return null;
  lic.ipAddress = ipAddress;
  lic.ipBoundAt = new Date().toISOString();
  addLog("license:ip:set", `Licença ${id} vinculada ao IP ${ipAddress}`);
  saveData();
  return lic;
}

export function updateLicenseProductIp(id: string, pluginId: string, ipOrIps: string | string[]) {
  const lic = licenses.find((l) => l.id === id);
  if (!lic) return null;
  const map = (lic as any).productIps || {};
  const toArray = Array.isArray(ipOrIps)
    ? ipOrIps
    : String(ipOrIps || "")
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter((s) => !!s);
  const unique = Array.from(new Set(toArray)).slice(0, 4);
  map[pluginId] = unique;
  (lic as any).productIps = map;
  lic.ipBoundAt = new Date().toISOString();
  addLog("license:ip:set", `Licença ${id} vinculou IP(s) ${unique.join(", ")} ao produto ${pluginId}`);
  saveData();
  return lic as any;
}

export function addUser(user: User) {
  users.push(user);
  saveData();
}

export function getUserById(id: string) {
  return users.find((u) => u.id === id);
}

export function getCurrentMockUser() {
  return users[0];
}

export function updateUserInStore(id: string, updates: Partial<User>) {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates } as User;
  saveData();
  return users[idx];
}

export function getMetrics() {
  const totalDownloads = plugins.reduce((sum, p) => sum + p.downloads, 0);
  const activeUsers = users.length;
  const premiumPlugins = plugins.filter((p) => p.price > 0).length;
  return { totalDownloads, activeUsers, premiumPlugins };
}

export function listUsers() {
  return users;
}

export function deleteUser(id: string) {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  const removed = users[idx];
  users.splice(idx, 1);
  credentials = credentials.filter((c) => c.userId !== id);
  orders = orders.filter((o) => o.userId !== id);
  licenses = licenses.filter((l) => l.userId !== id);
  addLog("user:delete", `Usuário ${removed.id} removido`);
  saveData();
  return true;
}

export function getCategories() {
  return categories;
}

export function addCategory(name: string) {
  if (!name) return false;
  const exists = categories.find((c) => c.toLowerCase() === name.toLowerCase());
  if (exists) return false;
  categories.push(name);
  addLog("category:create", `Categoria ${name} criada`);
  saveData();
  return true;
}

export function deleteCategory(name: string) {
  const idx = categories.findIndex((c) => c.toLowerCase() === name.toLowerCase());
  if (idx === -1) return false;
  categories.splice(idx, 1);
  addLog("category:delete", `Categoria ${name} removida`);
  saveData();
  return true;
}

export function addLog(type: string, message: string) {
  const entry: LogEntry = { id: `log-${Date.now()}`, type, message, createdAt: new Date().toISOString() };
  logs.push(entry);
  if (logs.length > 1000) logs.shift();
}

export function listLogs() {
  return logs.slice().reverse();
}

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function updateUserPassword(userId: string, newPassword: string) {
  const credIdx = credentials.findIndex((c) => c.userId === userId);
  const user = getUserById(userId);
  if (!user) return false;
  const hash = hashPassword(newPassword);
  if (credIdx >= 0) {
    credentials[credIdx].passwordHash = hash;
  } else {
    credentials.push({ userId, email: user.email, passwordHash: hash });
  }
  addLog("user:password:update", `Senha atualizada para usuário ${userId}`);
  saveData();
  return true;
}

export function getPaymentAccessToken() {
  const env1 = process.env.MERCADO_PAGO_ACCESS_TOKEN as string | undefined;
  const env2 = process.env.MP_ACCESS_TOKEN as string | undefined;
  return (settings.payments?.mercadoPagoAccessToken || env1 || env2 || "");
}

export function getPublicBaseUrl() {
  const env = (process.env.APP_BASE_URL as string | undefined) || (process.env.PUBLIC_BASE_URL as string | undefined);
  return (settings.payments?.publicBaseUrl || env || "");
}

export function getPaymentSettings() {
  const token = settings.payments?.mercadoPagoAccessToken || "";
  const masked = token ? `${token.slice(0, 3)}...${token.slice(-4)}` : "";
  return { hasMercadoPago: !!token, mercadoPagoAccessTokenMasked: masked, publicBaseUrl: settings.payments?.publicBaseUrl || "" };
}

export function updatePaymentSettings(updates: { mercadoPagoAccessToken?: string; publicBaseUrl?: string }) {
  settings.payments = { ...(settings.payments || {}), ...updates };
  saveData();
  return getPaymentSettings();
}

export function findUserByEmail(email: string) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function resetPasswordByEmail(email: string, newPassword: string) {
  const user = findUserByEmail(email);
  if (!user) return false;
  const ok = updateUserPassword(user.id, newPassword);
  if (ok) addLog("user:password:reset", `Senha redefinida para usuário ${user.id}`);
  return ok;
}

export function registerUser(email: string, password: string, username: string) {
  const existing = findUserByEmail(email);
  if (existing) return { error: "Email já registrado" } as const;

  const user: User = {
    id: `user-${Date.now()}`,
    email,
    username,
    role: "customer",
    createdAt: new Date().toISOString(),
  };
  addUser(user);
  credentials.push({ userId: user.id, email, passwordHash: hashPassword(password) });
  saveData();
  return { user } as const;
}

export function authenticate(email: string, password: string) {
  const cred = credentials.find(
    (c) => c.email.toLowerCase() === email.toLowerCase(),
  );
  if (!cred) return null;
  const ok = cred.passwordHash === hashPassword(password);
  if (!ok) return null;
  return getUserById(cred.userId) ?? null;
}

export function setSiteAsset(name: string, fileName: string, base64: string) {
  ensureDir(UPLOADS_DIR);
  ensureDir(SITE_ASSETS_DIR);
  const ext = path.extname(fileName) || ".png";
  const target = path.join(SITE_ASSETS_DIR, `${name}${ext}`);
  try {
    const data = Buffer.from(base64, "base64");
    fs.writeFileSync(target, data);
    siteAssets[name] = target;
    addLog("asset:upload", `Asset ${name} atualizado`);
    saveData();
    return { path: target } as const;
  } catch {
    return { error: "Write failed" } as const;
  }
}

export function getSiteAssetPath(name: string) {
  const p = siteAssets[name];
  if (p && fs.existsSync(p)) return p;
  return null;
}

export function deleteSiteAsset(name: string) {
  const p = siteAssets[name];
  if (!p) return false;
  try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  delete siteAssets[name];
  addLog("asset:delete", `Asset ${name} removido`);
  saveData();
  return true;
}

export function listSiteAssets() {
  return Object.keys(siteAssets);
}

export function addSiteHighlight(fileName: string, base64: string) {
  ensureDir(UPLOADS_DIR);
  ensureDir(SITE_ASSETS_DIR);
  ensureDir(HIGHLIGHTS_DIR);
  const id = `hl-${Date.now()}`;
  const ext = path.extname(fileName) || ".png";
  const target = path.join(HIGHLIGHTS_DIR, `${id}${ext}`);
  try {
    const data = Buffer.from(base64, "base64");
    fs.writeFileSync(target, data);
    const item: SiteHighlight = { id, path: target, fileName, uploadedAt: new Date().toISOString() };
    siteHighlights.push(item);
    addLog("highlight:upload", `Highlight ${fileName} adicionado`);
    saveData();
    return { item } as const;
  } catch {
    return { error: "Write failed" } as const;
  }
}

export function listSiteHighlights() {
  return siteHighlights;
}

export function getSiteHighlightPath(id: string) {
  const h = siteHighlights.find((i) => i.id === id);
  if (h && fs.existsSync(h.path)) return h.path;
  return null;
}

export function deleteSiteHighlight(id: string) {
  const idx = siteHighlights.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  const h = siteHighlights[idx];
  try { if (h.path && fs.existsSync(h.path)) fs.unlinkSync(h.path); } catch {}
  siteHighlights.splice(idx, 1);
  addLog("highlight:delete", `Highlight ${id} removido`);
  saveData();
  return true;
}

