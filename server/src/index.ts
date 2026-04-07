import cors from 'cors';
import express from 'express';
import multer from 'multer';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  auth,
  categories,
  createApiKeyForUser,
  createEmailVerificationToken,
  createPurchase,
  createSession,
  createUser,
  demoUser,
  docsSections,
  findApiKey,
  findSession,
  findUserByEmail,
  findUserById,
  getPluginDetail,
  getLicensesForUser,
  integrationConfig,
  notifications,
  outbox,
  randomToken,
  saveSmtpConfig,
  saveIntegrationConfig,
  smtpConfig,
  statusComponents,
  changelog,
  clearNotifications,
  deleteNotification,
  addNotification,
  createReview,
  listAllReviews,
  deleteReview,
  updateUserSettings,
  getUserSettings,
  updateDocsSection,
  listDocArticles,
  getDocArticleBySlug,
  adminCreateDocArticle,
  adminUpdateDocArticle,
  adminDeleteDocArticle,
  createCategory,
  deleteCategory,
  updateCategory,
  deleteUserAdmin,
  createUserAdmin,
  listAllUsers,
  updateUserAdmin,
  updateUserPassword,
  updateUserProfile,
  regenerateUserLicense,
  updateUserAllowedIp,
  bindUserLicenseHwid,
  resetUserLicenseHwid,
  findUserByLicenseKey,
  listSupportTickets,
  listSupportTicketsForUser,
  getSupportTicketById,
  addSupportTicketMessage,
  closeSupportTicket,
  updateSupportTicketStatus,
  createSupportTicket,
  createSupportTicketForUser,
  createCareerApplication,
  getAdminSettings,
  saveAdminSettings,
  subscribeNewsletter,
  listNewsletterSubscribers,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  findCouponByCode,
  listPlans,
  findPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  listServersForUser,
  createServer,
  findServerById,
  updateServer,
  deleteServer,
  assignPluginToServer,
  unassignPluginFromServer,
  listPluginsForServer,
  findServerByLicenseKey,
  createOrder,
  updateOrderStatus,
  listAllOrders,
  findOrderById,
  users,
  verifyEmailToken,
  verifyPassword,
  updatePurchaseStatus,
  updatePurchaseAdmin,
  listAllPurchases,
  findPurchaseByLicenseKey,
  updatePurchaseTelemetry,
  listRaffles,
  findRaffleById,
  createRaffle,
  updateRaffle,
  deleteRaffle,
  drawRaffleWinner,
  createPlugin,
  updatePlugin,
  deletePlugin,
  listApiKeysForUser,
  pluginSummaries,
  type PluginCategory,
  type PluginTag,
  purchasedPlugins,
  revokeApiKeyForUser
} from './data.js';
import { sendEmail, testSmtp, getVerificationEmailHtml, getPasswordResetEmailHtml, getOrderConfirmationHtml, EMAIL_LAYOUT } from './email.js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

function getMpCredentials() {
  const settings = getAdminSettings();
  const accessToken = (settings.mercadopagoAccessToken || process.env.MP_ACCESS_TOKEN || '').trim();
  
  if (!accessToken || (!accessToken.startsWith('APP_USR-') && !accessToken.startsWith('TEST-'))) {
    return { accessToken: null, client: null };
  }

  return {
    accessToken,
    client: new MercadoPagoConfig({ accessToken })
  };
}

function parseIntParam(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseFloatParam(value: unknown, fallback: number): number {
  if (typeof value !== 'string') return fallback;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseStringParam(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  return s.length > 0 ? s : null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function getAuthToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function getAuthContext(req: express.Request): { token: string; userId: string; role: 'user' | 'admin' | 'staff' | 'premium' } | null {
  const token = getAuthToken(req);
  if (!token) return null;

  const session = findSession(token);
  if (session) {
    const user = findUserById(session.userId);
    if (user?.banned) return null;
    return { token, userId: session.userId, role: (user?.role || 'user') as any };
  }
  return null;
}

function normalizeIp(ip: string | undefined | null): string {
  if (!ip) return '';

  let clean = ip.trim();
  if (!clean) return '';

  if (clean.includes(',')) {
    clean = clean.split(',')[0]?.trim() ?? '';
  }

  clean = clean.replace(/^"+|"+$/g, '');

  const bracketIpv6 = clean.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketIpv6?.[1]) {
    clean = bracketIpv6[1];
  } else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(clean)) {
    clean = clean.split(':')[0] ?? clean;
  }

  if (clean.startsWith('::ffff:')) clean = clean.slice(7);
  if (clean === '::1' || clean.toLowerCase() === 'localhost') return '127.0.0.1';

  const zoneIndex = clean.indexOf('%');
  if (zoneIndex > -1) {
    clean = clean.slice(0, zoneIndex);
  }

  clean = clean.toLowerCase();
  return net.isIP(clean) ? clean : '';
}

function normalizeHwid(value: unknown): string {
  if (typeof value !== 'string') return '';
  const clean = value.trim();
  if (!clean) return '';
  if (clean.length > 255) return clean.slice(0, 255);
  return clean;
}

function readHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return typeof value === 'string' ? value : '';
}

function getObservedRequestIp(req: express.Request): string {
  const candidates: string[] = [
    readHeaderValue(req.headers['cf-connecting-ip']),
    readHeaderValue(req.headers['x-real-ip']),
    readHeaderValue(req.headers['x-forwarded-for']),
    req.ip || '',
    req.socket.remoteAddress || ''
  ];

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip) return ip;
  }
  return '';
}

function getDeclaredRequestIp(req: express.Request): string {
  const body = req.body as Record<string, unknown> | undefined;
  const raw =
    (typeof body?.serverIp === 'string' ? body.serverIp : undefined) ||
    (typeof body?.serverip === 'string' ? body.serverip : undefined) ||
    (typeof body?.ip === 'string' ? body.ip : undefined) ||
    (typeof body?.hostIp === 'string' ? body.hostIp : undefined) ||
    (typeof body?.hostip === 'string' ? body.hostip : undefined);

  return normalizeIp(raw ?? '');
}

function resolveEffectiveRequestIp(req: express.Request): {
  ok: boolean;
  observedIp: string;
  declaredIp: string;
  effectiveIp: string;
  reason?: string;
} {
  const observedIp = getObservedRequestIp(req);
  const declaredIp = getDeclaredRequestIp(req);

  if (declaredIp && observedIp && declaredIp !== observedIp) {
    return {
      ok: false,
      observedIp,
      declaredIp,
      effectiveIp: '',
      reason: `IP informado (${declaredIp}) nao confere com o IP de origem (${observedIp}).`
    };
  }

  const effectiveIp = observedIp || declaredIp;
  if (!effectiveIp) {
    return {
      ok: false,
      observedIp,
      declaredIp,
      effectiveIp: '',
      reason: 'Nao foi possivel identificar o IP de origem.'
    };
  }

  return {
    ok: true,
    observedIp,
    declaredIp,
    effectiveIp
  };
}

function toUserPlan(planName: string): 'Free' | 'Premium' {
  return /premium/i.test(planName) ? 'Premium' : 'Free';
}

function hasValidAuthHeader(req: express.Request): boolean {
  return getAuthContext(req) !== null;
}

const isAdmin = (req: express.Request): boolean => {
  return getAuthContext(req)?.role === 'admin';
};

// Multer config for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use PNG, JPG, WEBP ou SVG.'));
    }
  }
});

const app = express();
app.disable('x-powered-by');

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((x) => x.trim()) : true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Upload endpoint
app.post('/api/admin/upload', (req, res, next) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'admin token requerido' });
  }
  next();
}, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'nenhum arquivo enviado' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'starfin-api',
    timeISO: new Date().toISOString()
  });
});

app.get('/api/public/plans', (_req, res) => {
  const plans = listPlans();
  res.json({ items: plans.filter(p => p.active) });
});

app.post('/api/users/me/plans/subscribe', (req, res) => {
  if (!hasValidAuthHeader(req)) return res.status(401).json({ error: 'não autorizado' });
  const ctx = getAuthContext(req)!;
  const planId = typeof req.body?.planId === 'string' ? req.body.planId : '';
  
  const allPlans = listPlans();
  const plan = allPlans.find(p => p.id === planId && p.active);
  if (!plan) return res.status(404).json({ error: 'plano não encontrado ou inativo' });

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

  const updated = updateUserAdmin(ctx.userId, { 
    plan: toUserPlan(plan.name),
    planExpiresAt: expiresAt.toISOString(),
    role: plan.grantsAllPlugins ? 'premium' : 'user'
  });

  if (!updated) return res.status(500).json({ error: 'erro ao atualizar plano' });
  
  res.json({ ok: true, plan: updated.plan, planExpiresAt: updated.planExpiresAt });
});

app.all('/v1/license/check', (req, res, next) => {
  const observedIp = getObservedRequestIp(req) || req.ip;
  console.log(`[License Check] [${req.method}] from ${observedIp}`);

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, reason: 'Método não permitido. Use POST.' });
  }
  next();
});

app.post('/v1/license/check', (req, res) => {
  // Handle various field name casings from different plugin implementations
  const licenseKey = req.body?.licenseKey || req.body?.licensekey || req.body?.LicenseKey || req.body?.key;
  const hwid = req.body?.hwid || req.body?.HWID || req.body?.serverId;
  const serverPort = req.body?.serverPort || req.body?.port;
  const serverName = req.body?.serverName || req.body?.name;
  const platform = req.body?.platform || req.body?.os;
  const performance = req.body?.performance || req.body?.perf;
  const normalizedHwid = normalizeHwid(hwid);
  const normalizedServerPort = Number.isFinite(Number(serverPort)) ? Number(serverPort) : 0;
  const normalizedServerName = parseStringParam(serverName) || 'Unknown';
  const normalizedPlatform = parseStringParam(platform) || 'unknown';
  const normalizedPerformance = typeof performance === 'string' ? performance : JSON.stringify(performance ?? {});
  const bootstrapPluginName = 'StarfinLicense';
  const requestedPluginNameRaw =
    parseStringParam(req.body?.pluginName) ||
    parseStringParam(req.body?.plugin) ||
    parseStringParam(req.body?.plugin_name);
  const requestedPluginIdRaw = Number(req.body?.pluginId ?? req.body?.pluginid ?? req.body?.id);
  const requestedPluginNameById = Number.isFinite(requestedPluginIdRaw)
    ? getPluginDetail(requestedPluginIdRaw)?.name ?? null
    : null;
  const requestedPluginNames = [requestedPluginNameRaw, requestedPluginNameById]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toLowerCase());
  const bootstrapPluginAliases = new Set(['starfinlicense', 'starfin-license']);
  const isBootstrapRequest = requestedPluginNames.some((name) => bootstrapPluginAliases.has(name));
  const pluginByLowerName = new Map(pluginSummaries.map((p) => [p.name.toLowerCase(), p] as const));
  const withBootstrapPlugin = (plugins: string[]) => {
    return Array.from(new Set([bootstrapPluginName, ...plugins.filter(Boolean)]));
  };
  const buildUpdates = (allowedPlugins: string[]) => {
    const entries: Array<[string, string]> = [];
    for (const pluginName of allowedPlugins) {
      const plugin = pluginByLowerName.get(pluginName.toLowerCase());
      if (!plugin) continue;
      entries.push([pluginName, `https://starfinplugins.com/download/${plugin.id}/latest.jar`]);
    }
    return Object.fromEntries(entries);
  };
  const isRequestedPluginAllowed = (allowedPlugins: string[]) => {
    // Backward compatibility: old StarfinLicense bootstrap may not send plugin name/id.
    if (requestedPluginNames.length === 0) return true;
    // Bootstrap plugin itself is an auth loader, not a licensable marketplace plugin.
    if (isBootstrapRequest) return true;
    const allowedSet = new Set(allowedPlugins.map((name) => name.toLowerCase()));
    return requestedPluginNames.some((name) => allowedSet.has(name));
  };

  if (!licenseKey) {
    const errorBody = { 
      valid: false, 
      ok: false,
      reason: 'Chave de licença não fornecida.', 
      message: 'Chave de licença não fornecida.',
      licenseOwner: 'Desconhecido', 
      plan: 'Nenhum' 
    };
    res.status(400).json(errorBody);
    return;
  }
  if (!normalizedHwid) {
    return res.status(200).json({
      valid: false,
      ok: false,
      reason: 'HWID nao informado.'
    });
  }
  const ipResolution = resolveEffectiveRequestIp(req);
  if (!ipResolution.ok) {
    return res.status(200).json({
      valid: false,
      ok: false,
      reason: ipResolution.reason
    });
  }
  const incomingIp = ipResolution.effectiveIp;
  const auditPrefix = `[License Check] [${licenseKey}]`;

  // 1. Try finding User by Global License Key (New Auto-IP Detection)
  const user = findUserByLicenseKey(licenseKey);
  if (user) {
    if (user.banned) {
      return res.status(200).json({ valid: false, ok: false, reason: 'Sua conta esta banida.' });
    }
    const userServers = listServersForUser(user.id);
    const matchingServer = userServers.find(s => s.ips.map(normalizeIp).includes(incomingIp));
    const globalAllowedIp = normalizeIp(user.allowedIp || '');
    if (!matchingServer && globalAllowedIp && globalAllowedIp !== incomingIp) {
      return res.status(200).json({
        valid: false,
        ok: false,
        reason: `IP ${incomingIp} nao autorizado. Configure este IP ou crie um servidor no painel.`,
        licenseOwner: user.name,
        plan: user.plan
      });
    }

    // Check if user has a plan that grants all plugins
    const allPlans = listPlans();
    const userPlan = allPlans.find(p => p.name === user.plan && p.active);
    const hasActivePlan = !user.planExpiresAt || new Date(user.planExpiresAt).getTime() > Date.now();
    const hasGlobalAccess = Boolean(user.role === 'admin' || (hasActivePlan && userPlan?.grantsAllPlugins));
    const storedUserHwid = normalizeHwid(user.licenseHwid || '');
    if (!storedUserHwid) {
      bindUserLicenseHwid(user.id, normalizedHwid);
      console.log(`${auditPrefix} Global HWID bound on first activation. user=${user.id} hwid=${normalizedHwid} ip=${incomingIp}`);
    } else if (storedUserHwid !== normalizedHwid) {
      console.warn(`${auditPrefix} Global HWID mismatch. user=${user.id} expected=${storedUserHwid} received=${normalizedHwid} ip=${incomingIp}`);
      addNotification(
        'Tentativa de uso indevido de licença',
        `HWID divergente para a licença global de ${user.email}.`,
        {
          type: 'sale',
          priority: 'high',
          source: 'license_hwid_mismatch',
          metadata: { userId: user.id, expectedHwid: storedUserHwid, receivedHwid: normalizedHwid, ip: incomingIp }
        }
      );
      return res.status(200).json({
        valid: false,
        ok: false,
        reason: 'HWID nao autorizado. Licenca ja ativa em outro servidor.',
        licenseOwner: user.name,
        plan: user.plan
      });
    }

    if (matchingServer) {
      // Server-specific assignment found for this IP
      const assignedPluginIds = listPluginsForServer(matchingServer.id);
      let allowedPlugins = pluginSummaries
        .filter(p => assignedPluginIds.includes(p.id))
        .map(p => p.name);

      if (hasGlobalAccess) {
        allowedPlugins = pluginSummaries.map(p => p.name);
      }
      allowedPlugins = withBootstrapPlugin(allowedPlugins);
      if (!isRequestedPluginAllowed(allowedPlugins)) {
        return res.status(200).json({
          valid: false,
          ok: false,
          reason: 'Plugin solicitado nao autorizado para esta licenca.',
          licenseOwner: user.name,
          plan: user.plan
        });
      }
      console.log(`${auditPrefix} Validated via server assignment. user=${user.id} server=${matchingServer.id} hwid=${normalizedHwid} ip=${incomingIp}`);

      return res.status(200).json({
        valid: true,
        ok: true,
        reason: `Licenca validada para o servidor: ${matchingServer.name}`,
        licenseOwner: user.name,
        plan: user.plan,
        serverName: matchingServer.name,
        allowedPlugins,
        updates: buildUpdates(allowedPlugins)
      });
    }

    // Global access (fallback)
    const userLicenses = getLicensesForUser(user.id);
    let allowedPlugins = userLicenses.filter(l => l.status === 'Ativo').map(l => l.name);

    if (hasGlobalAccess) {
      allowedPlugins = pluginSummaries.map(p => p.name);
    }
    allowedPlugins = withBootstrapPlugin(allowedPlugins);
    if (!isRequestedPluginAllowed(allowedPlugins)) {
      return res.status(200).json({
        valid: false,
        ok: false,
        reason: 'Plugin solicitado nao autorizado para esta licenca.',
        licenseOwner: user.name,
        plan: user.plan
      });
    }
    console.log(`${auditPrefix} Validated via global license. user=${user.id} hwid=${normalizedHwid} ip=${incomingIp}`);

    return res.status(200).json({
      valid: true,
      ok: true,
      reason: 'Licenca global validada!',
      licenseOwner: user.name,
      plan: user.plan,
      allowedPlugins,
      updates: buildUpdates(allowedPlugins)
    });
  }

  // 2. Fallback to Server-Specific License Key
  const server = findServerByLicenseKey(licenseKey);
  if (server) {
    const owner = findUserById(server.userId);
    if (!owner) return res.status(200).json({ valid: false, ok: false, reason: 'Dono do servidor nao encontrado.' });
    if (owner.banned) return res.status(200).json({ valid: false, ok: false, reason: 'Dono do servidor esta banido.' });

    const serverIps = server.ips.map(normalizeIp);
    if (serverIps.length > 0 && !serverIps.includes(incomingIp)) {
      return res.status(200).json({ valid: false, ok: false, reason: `IP ${incomingIp} nao autorizado para este servidor.` });
    }

    const assignedPluginIds = listPluginsForServer(server.id);
    const allowedPlugins = withBootstrapPlugin(pluginSummaries.filter(p => assignedPluginIds.includes(p.id)).map(p => p.name));
    if (!isRequestedPluginAllowed(allowedPlugins)) {
      return res.status(200).json({ valid: false, ok: false, reason: 'Plugin solicitado nao autorizado para esta licenca de servidor.' });
    }

    return res.status(200).json({
      valid: true,
      ok: true,
      reason: 'Licenca de servidor validada!',
      licenseOwner: owner.name,
      plan: owner.plan,
      allowedPlugins,
      updates: buildUpdates(allowedPlugins)
    });
  }

  // 3. Fallback to Legacy Purchase Key
  const purchase = findPurchaseByLicenseKey(licenseKey);
  if (purchase) {
    if (purchase.status !== 'approved') {
      return res.status(200).json({
        valid: false,
        ok: false,
        reason: 'Licenca vinculada a compra nao aprovada.'
      });
    }
    const owner = findUserById(purchase.userId);
    if (owner?.banned) return res.status(200).json({ valid: false, ok: false, reason: 'Sua conta esta banida.' });
    const plugin = getPluginDetail(purchase.pluginId);
    const storedPurchaseHwid = normalizeHwid(purchase.hwid || '');
    if (!storedPurchaseHwid) {
      updatePurchaseTelemetry(purchase.id, {
        hwid: normalizedHwid,
        allowedIp: incomingIp,
        ip: incomingIp,
        port: normalizedServerPort,
        serverName: normalizedServerName,
        platform: normalizedPlatform,
        performance: normalizedPerformance
      });
      console.log(`${auditPrefix} Purchase HWID bound on first activation. purchase=${purchase.id} hwid=${normalizedHwid} ip=${incomingIp}`);
    } else if (storedPurchaseHwid !== normalizedHwid) {
      console.warn(`${auditPrefix} Purchase HWID mismatch. purchase=${purchase.id} expected=${storedPurchaseHwid} received=${normalizedHwid} ip=${incomingIp}`);
      addNotification(
        'Tentativa de uso indevido de licença',
        `HWID divergente para a licença ${purchase.id}.`,
        {
          type: 'sale',
          priority: 'high',
          source: 'license_hwid_mismatch',
          metadata: { purchaseId: purchase.id, userId: purchase.userId, expectedHwid: storedPurchaseHwid, receivedHwid: normalizedHwid, ip: incomingIp }
        }
      );
      return res.status(200).json({
        valid: false,
        ok: false,
        reason: 'HWID nao autorizado. Licenca ja ativa em outro servidor.'
      });
    } else {
      updatePurchaseTelemetry(purchase.id, {
        hwid: normalizedHwid,
        allowedIp: incomingIp,
        ip: incomingIp,
        port: normalizedServerPort,
        serverName: normalizedServerName,
        platform: normalizedPlatform,
        performance: normalizedPerformance
      });
    }
    if (requestedPluginNames.length > 0 && plugin?.name && !requestedPluginNames.includes(plugin.name.toLowerCase())) {
      return res.status(200).json({
        valid: false,
        ok: false,
        reason: 'Plugin solicitado nao autorizado para esta licenca.'
      });
    }
    const allowedPlugins = withBootstrapPlugin(plugin?.name ? [plugin.name] : []);
    console.log(`${auditPrefix} Validated via purchase license. purchase=${purchase.id} hwid=${normalizedHwid} ip=${incomingIp}`);
    return res.status(200).json({
      valid: true,
      ok: true,
      reason: 'Licenca legada validada!',
      licenseOwner: owner?.name || 'Cliente',
      plan: owner?.plan || 'Free',
      allowedPlugins,
      updates: buildUpdates(allowedPlugins)
    });
  }

  return res.status(200).json({ 
    valid: false, 
    ok: false, 
    reason: 'Chave de licenca invalida.', 
    licenseOwner: 'Desconhecido', 
    plan: 'Nenhum' 
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'StarfinPlugins API',
    timeISO: new Date().toISOString()
  });
});

app.get('/api/categories', (_req, res) => {
  res.json({
    items: categories
  });
});

app.get('/api/plugins/featured', (_req, res) => {
  const featured = pluginSummaries
    .filter((p) => p.tags.includes('Popular') || p.tags.includes('Premium'))
    .slice(0, 6);
  res.json({ items: featured });
});

app.get('/api/plugins/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }

  const detail = getPluginDetail(id);
  if (!detail) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }

  res.json(detail);
});

app.get('/api/plugins', (req, res) => {
  const search = parseStringParam(req.query.search);
  const category = parseStringParam(req.query.category);
  const tag = parseStringParam(req.query.tag);
  const ratingMin = parseFloatParam(req.query.ratingMin, 0);
  const sort = parseStringParam(req.query.sort) ?? 'popular';
  const page = clamp(parseIntParam(req.query.page, 1), 1, 10_000);
  const limit = clamp(parseIntParam(req.query.limit, 24), 1, 100);

  let items = pluginSummaries.slice();

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'Todas') {
    items = items.filter((p) => p.category === (category as PluginCategory));
  }

  if (tag) {
    items = items.filter((p) => p.tags.includes(tag as PluginTag));
  }

  if (ratingMin > 0) {
    items = items.filter((p) => p.rating >= ratingMin);
  }

  switch (sort) {
    case 'rating':
      items.sort((a, b) => b.rating - a.rating);
      break;
    case 'price_asc':
      items.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case 'price_desc':
      items.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case 'recent':
      items.sort((a, b) => b.id - a.id);
      break;
    case 'popular':
    default:
      items.sort((a, b) => b.downloads - a.downloads);
      break;
  }

  const total = items.length;
  const offset = (page - 1) * limit;
  const paged = items.slice(offset, offset + limit);

  res.json({
    items: paged,
    page,
    limit,
    total
  });
});

app.post('/api/auth/login', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'email e password são obrigatórios' });
    return;
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'credenciais inválidas' });
    return;
  }

  if (user.banned) {
    res.status(403).json({ error: 'Sua conta foi banida. Entre em contato com o suporte.' });
    return;
  }

  const session = createSession(user.id, user.role || 'user');
  res.json({
    token: session.token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, verified: user.verified, role: user.role }
  });
});

app.post('/api/auth/register', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name || !email || !email.includes('@') || !password || password.length < 6) {
    res.status(400).json({ error: 'name, email válido e password (mín 6) são obrigatórios' });
    return;
  }

  if (findUserByEmail(email)) {
    res.status(409).json({ error: 'email já cadastrado' });
    return;
  }

  const user = createUser({ name, email, password });
  if (!user) {
    res.status(500).json({ error: 'erro ao criar usuário' });
    return;
  }
  const session = createSession(user.id, 'user');
  const token = createEmailVerificationToken(user.id);
  const verifyUrl = `${integrationConfig.panelBaseUrl}/verify-email?token=${encodeURIComponent(token.token)}`;

  await sendEmail({
    to: user.email,
    subject: 'Confirme seu email - StarfinPlugins',
    html: getVerificationEmailHtml(user.name, verifyUrl)
  });

  res.status(201).json({
    token: session.token,
    user: { id: user.id, name: user.name, email: user.email, plan: user.plan, verified: user.verified, role: user.role },
    devVerificationUrl: verifyUrl
  });
});

app.post('/api/auth/verify', async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  if (!token) {
    res.status(400).json({ error: 'token obrigatório' });
    return;
  }
  const user = verifyEmailToken(token);
  if (!user) {
    res.status(400).json({ error: 'token inválido ou expirado' });
    return;
  }

  await sendEmail({
    to: user.email,
    subject: 'Email confirmado - StarfinPlugins',
    html: EMAIL_LAYOUT(`<p>Olá, ${user.name}.</p><p>Seu email foi confirmado com sucesso.</p>`)
  });

  res.json({ success: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email) {
    res.status(400).json({ error: 'email obrigatório' });
    return;
  }
  const user = findUserByEmail(email);
  if (user) {
    const token = randomToken('reset');
    // Em um sistema real, salvaríamos o token. Aqui apenas simulamos.
    const resetUrl = `${integrationConfig.panelBaseUrl}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: 'Recuperação de senha - StarfinPlugins',
      html: getPasswordResetEmailHtml(user.name, resetUrl)
    });
  }
  res.json({ success: true });
});

app.post('/api/auth/reset-password', (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!token || !password || password.length < 6) {
    res.status(400).json({ error: 'token e password (mín 6) são obrigatórios' });
    return;
  }
  
  // Como os tokens de reset não são persistidos nesta versão demo, 
  // simulamos a busca do usuário pelo prefixo do token ou apenas o demoUser.
  const user = demoUser; 
  updateUserPassword(user.id, password);
  
  res.json({ success: true });
});

app.post('/api/auth/resend-verification', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email) {
    res.status(400).json({ error: 'email obrigatório' });
    return;
  }
  const user = findUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  if (user.verified) {
    res.json({ ok: true });
    return;
  }

  const token = createEmailVerificationToken(user.id);
  const verifyUrl = `${integrationConfig.panelBaseUrl}/verify-email?token=${encodeURIComponent(token.token)}`;
  await sendEmail({
    to: user.email,
    subject: 'Confirme seu email - StarfinPlugins',
    html: getVerificationEmailHtml(user.name, verifyUrl)
  });
  res.json({ ok: true, devVerificationUrl: verifyUrl });
});

app.get('/api/users/me', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  
  const user = findUserById(ctx.userId);
  
  // Special case for admin token and demo token
  if (ctx.token === auth.adminToken && !user) {
    res.status(401).json({ error: 'nÃ£o autorizado' });
    return;
  }

  if (ctx.token === auth.demoToken && !user) {
    res.status(401).json({ error: 'nÃ£o autorizado' });
    return;
  }

  if (!user) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }

  // Se for o admin real (token de admin), garante cargo admin mas usa dados do banco se possível
  const responseRole = user.role || 'user';
  
  res.json({ 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    plan: user.plan, 
    verified: user.verified, 
    role: responseRole,
    avatarUrl: user.avatarUrl,
    licenseKey: user.licenseKey
  });
});

app.get('/api/users/me/licenses', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }

  const ctx = getAuthContext(req)!;
  res.json({
    items: getLicensesForUser(ctx.userId)
  });
});

app.get('/api/users/me/settings', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const user = findUserById(ctx.userId);
  if (!user) return res.status(401).json({ error: 'não autorizado' });
  
  const settings = getUserSettings(ctx.userId);
  res.json({
    email: user.email,
    name: user.name,
    twoFactorEnabled: settings.twoFactorEnabled || false,
    marketingEmails: settings.marketingEmails || false,
    securityAlerts: settings.securityAlerts || false,
    licenseKey: user.licenseKey,
    allowedIp: user.allowedIp,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    discordId: user.discordId,
    githubUrl: user.githubUrl,
    twitterUrl: user.twitterUrl
  });
});

app.patch('/api/users/me/settings', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const settings = updateUserSettings(ctx.userId, req.body);
  res.json({ success: true, settings });
});

app.patch('/api/users/me/password', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const { currentPassword, newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
    return;
  }

  const user = findUserById(ctx.userId);
  if (!user) return res.status(401).json({ error: 'não autorizado' });

  // Se o usuário tiver uma senha definida (não for login social inicial sem senha), valida a atual
  if (user.passwordHash && currentPassword) {
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Senha atual incorreta.' });
      return;
    }
  }

  updateUserPassword(ctx.userId, newPassword);
  res.json({ success: true });
});

app.patch('/api/users/me/profile', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const user = updateUserProfile(ctx.userId, req.body);
  res.json(user);
});

app.get('/api/users/me/notifications', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  // For demo, return global notifications
  res.json(notifications);
});

app.get('/api/users/me/payments', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const purchases = listAllPurchases().filter(p => p.userId === ctx.userId);
  res.json(purchases.map(p => ({
    id: p.id,
    date: p.createdISO,
    amount: 'R$ 0,00', // Mock
    status: p.status,
    pluginId: p.pluginId
  })));
});

app.get('/api/plugins/:id/config', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const id = Number(req.params.id);
  const ctx = getAuthContext(req)!;
  const purchase = listAllPurchases().find(p => p.userId === ctx.userId && p.pluginId === id);
  if (!purchase) return res.status(404).json({ error: 'licença não encontrada' });
  
  res.json({
    jarUrl: `https://starfinplugins.com/download/${id}/latest.jar`,
    version: '1.0.0',
    pluginId: id,
    hwid: purchase.hwid || '',
    allowedIp: purchase.allowedIp || ''
  });
});

app.patch('/api/plugins/:id/config', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const id = Number(req.params.id);
  const ctx = getAuthContext(req)!;
  const purchase = listAllPurchases().find(p => p.userId === ctx.userId && p.pluginId === id);
  if (!purchase) return res.status(404).json({ error: 'licença não encontrada' });
  
  updatePurchaseAdmin(purchase.id, req.body);
  res.json({ success: true });
});

app.post('/api/users/me/license/regenerate', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const licenseKey = regenerateUserLicense(ctx.userId);
  res.json({ licenseKey });
});

app.patch('/api/users/me/allowed-ip', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  updateUserAllowedIp(ctx.userId, req.body.allowedIp);
  res.json({ success: true });
});

app.post('/api/users/me/license/hwid/reset', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'nÃ£o autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const user = findUserById(ctx.userId);
  if (!user) {
    res.status(404).json({ error: 'usuÃ¡rio nÃ£o encontrado' });
    return;
  }

  const lastReset = user.licenseHwidResetISO ? new Date(user.licenseHwidResetISO).getTime() : 0;
  const cooldownMs = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (lastReset && now - lastReset < cooldownMs) {
    const retryAfterDays = Math.ceil((cooldownMs - (now - lastReset)) / (24 * 60 * 60 * 1000));
    return res.status(429).json({ error: `Reset de HWID disponivel em ${retryAfterDays} dia(s).` });
  }

  const updated = resetUserLicenseHwid(ctx.userId);
  if (!updated) {
    res.status(500).json({ error: 'falha ao resetar HWID' });
    return;
  }
  addNotification(
    'Reset de HWID solicitado',
    `UsuÃ¡rio ${updated.email} resetou o HWID da licenÃ§a global.`,
    {
      type: 'manual',
      priority: 'normal',
      source: 'user_hwid_reset',
      metadata: { userId: updated.id }
    }
  );
  res.json({ ok: true });
});

app.get('/api/users/me/servers', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const servers = listServersForUser(ctx.userId);
  const items = servers.map(s => ({
    ...s,
    plugins: listPluginsForServer(s.id)
  }));
  res.json({ items });
});

app.post('/api/users/me/servers', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const { name, ips } = req.body;
  const server = createServer(ctx.userId, name, ips);
  res.status(201).json({ ...server, plugins: [] });
});

app.patch('/api/users/me/servers/:id', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const id = req.params.id;
  const server = updateServer(id, req.body);
  if (!server) return res.status(404).json({ error: 'servidor não encontrado' });
  res.json({ ...server, plugins: listPluginsForServer(id) });
});

app.delete('/api/users/me/servers/:id', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  deleteServer(req.params.id);
  res.json({ ok: true });
});

app.post('/api/users/me/servers/:serverId/plugins', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const { serverId } = req.params;
  const { pluginId } = req.body;
  assignPluginToServer(serverId, pluginId);
  res.json({ ok: true });
});

app.delete('/api/users/me/servers/:serverId/plugins/:pluginId', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const { serverId, pluginId } = req.params;
  unassignPluginFromServer(serverId, Number(pluginId));
  res.json({ ok: true });
});

app.get('/api/users/me/api-keys', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }

  const ctx = getAuthContext(req)!;
  res.json({
    items: listApiKeysForUser(ctx.userId)
  });
});

app.post('/api/users/me/api-keys', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }

  const ctx = getAuthContext(req)!;
  const pluginId = typeof req.body?.pluginId === 'number' ? req.body.pluginId : Number(req.body?.pluginId);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!Number.isFinite(pluginId) || pluginId <= 0 || !name) {
    res.status(400).json({ error: 'pluginId e name são obrigatórios' });
    return;
  }

  const hasLicense = getLicensesForUser(ctx.userId).some((p) => p.pluginId === pluginId && p.status === 'Ativo');
  if (!hasLicense) {
    res.status(403).json({ error: 'licença não encontrada para este plugin' });
    return;
  }

  const created = createApiKeyForUser(ctx.userId, pluginId, name);
  res.status(201).json(created);
});

app.delete('/api/users/me/api-keys/:id', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }

  const ctx = getAuthContext(req)!;
  const id = req.params.id;
  const ok = revokeApiKeyForUser(ctx.userId, id);
  if (!ok) {
    res.status(404).json({ error: 'chave não encontrada' });
    return;
  }
  res.json({ ok: true });
});

app.post('/api/purchases', async (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const pluginId = typeof req.body?.pluginId === 'number' ? req.body.pluginId : Number(req.body?.pluginId);
  if (!Number.isFinite(pluginId) || pluginId <= 0) {
    res.status(400).json({ error: 'pluginId obrigatório' });
    return;
  }

  const user = ctx.token === auth.demoToken ? demoUser : findUserById(ctx.userId);
  if (!user) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  if (!user.verified && ctx.token !== auth.demoToken) {
    res.status(403).json({ error: 'confirme seu email antes de comprar' });
    return;
  }

  const purchase = createPurchase(user.id, pluginId);
  const plugin = getPluginDetail(pluginId);
  updatePurchaseStatus(purchase.id, 'approved'); // Simulação imediata
  
  await sendEmail({
    to: user.email,
    subject: 'Compra recebida - StarfinPlugins',
    html: getOrderConfirmationHtml(user.name, purchase.id, plugin?.name ?? 'Plugin', purchase.licenseKey ?? '')
  });
  res.status(201).json(purchase);
});

app.post('/api/commerce/coupon/validate', (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const totalCents = typeof req.body?.totalCents === 'number' ? req.body.totalCents : 0;
  
  // Hardcoded legacy support
  if (code === 'STARFIN10') {
    const discountCents = Math.round(totalCents * 0.1);
    res.json({ code, discountCents, finalCents: totalCents - discountCents });
    return;
  }

  const coupon = findCouponByCode(code);
  if (!coupon || !coupon.active) {
    res.status(404).json({ error: 'cupom inválido ou inativo' });
    return;
  }

  const now = new Date();
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    res.status(400).json({ error: 'cupom expirado' });
    return;
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    res.status(400).json({ error: 'cupom atingiu o limite de usos' });
    return;
  }

  if (coupon.minPurchase && totalCents < coupon.minPurchase) {
    res.status(400).json({ error: `este cupom requer uma compra mínima de R$ ${(coupon.minPurchase / 100).toFixed(2)}` });
    return;
  }

  let discountCents = 0;
  if (coupon.discountType === 'percentage') {
    discountCents = Math.floor((totalCents * coupon.discountValue) / 100);
  } else {
    discountCents = coupon.discountValue;
  }

  res.json({
    code,
    discountCents,
    finalCents: Math.max(0, totalCents - discountCents)
  });
});

app.get('/api/admin/coupons', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  res.json({ items: listCoupons() });
});

app.post('/api/admin/coupons', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const data = req.body;
  if (!data.code || !data.discountType || !data.discountValue) {
    res.status(400).json({ error: 'code, discountType e discountValue são obrigatórios' });
    return;
  }
  const item = createCoupon(data);
  res.status(201).json({ item });
});

app.patch('/api/admin/coupons', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const id = parseStringParam(req.query.id);
  if (!id) return res.status(400).json({ error: 'id requerido' });
  const item = updateCoupon(id, req.body);
  if (!item) return res.status(404).json({ error: 'cupom não encontrado' });
  res.json({ item });
});

app.delete('/api/admin/coupons', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const id = parseStringParam(req.query.id);
  if (!id) return res.status(400).json({ error: 'id requerido' });
  deleteCoupon(id);
  res.json({ ok: true });
});

app.get('/api/reviews', (req, res) => {
  const pluginId = parseIntParam(req.query.pluginId, 0);
  const limit = clamp(parseIntParam(req.query.limit, 10), 1, 50);
  
  let allReviews: any[] = [];
  if (pluginId) {
    const detail = getPluginDetail(pluginId);
    if (detail && detail.reviews) {
      allReviews = detail.reviews;
    }
  } else {
    // Global reviews from all plugins
    for (const p of pluginSummaries) {
      const detail = getPluginDetail(p.id);
      if (detail && detail.reviews) {
        allReviews.push(...detail.reviews.map(r => ({ ...r, pluginName: p.name, pluginId: p.id })));
      }
    }
  }
  
  res.json({ items: allReviews.slice(0, limit) });
});

app.get('/api/plans', (req, res) => {
  const all = listPlans();
  res.json({ items: all.filter(p => p.active) });
});

app.get('/api/docs/articles', (req, res) => {
  const category = parseStringParam(req.query.category);
  res.json({ items: listDocArticles(category) });
});

app.get('/api/docs/articles/:slug', (req, res) => {
  const article = getDocArticleBySlug(req.params.slug);
  if (!article) return res.status(404).json({ error: 'artigo não encontrado' });
  res.json(article);
});

app.get('/api/admin/docs/articles', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  res.json({ items: listDocArticles() });
});

app.post('/api/admin/docs/articles', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const item = adminCreateDocArticle(req.body);
  res.status(201).json(item);
});

app.put('/api/admin/docs/articles/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const item = adminUpdateDocArticle(req.params.id, req.body);
  if (!item) return res.status(404).json({ error: 'artigo não encontrado' });
  res.json(item);
});

app.delete('/api/admin/docs/articles/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  adminDeleteDocArticle(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/notifications', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  res.json({ items: notifications });
});

app.post('/api/admin/notifications', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!title || !message) {
    return res.status(400).json({ error: 'title e message são obrigatórios' });
  }
  const type =
    req.body?.type === 'sale' || req.body?.type === 'support' || req.body?.type === 'raffle'
      ? req.body.type
      : 'manual';
  const priority =
    req.body?.priority === 'low' || req.body?.priority === 'high'
      ? req.body.priority
      : 'normal';
  const source = typeof req.body?.source === 'string' ? req.body.source.trim() : null;
  const item = addNotification(title, message, { type, priority, source });
  res.status(201).json({ item });
});

app.delete('/api/admin/notifications', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const id = parseStringParam(req.query.id);
  if (id) {
    deleteNotification(id);
  } else {
    clearNotifications();
  }
  res.json({ ok: true });
});

app.get('/api/admin/raffles', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  res.json({ items: listRaffles() });
});

app.post('/api/admin/raffles', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const title = parseStringParam(req.body?.title) ?? '';
  const description = parseStringParam(req.body?.description);
  const prize = parseStringParam(req.body?.prize);
  const eligibility = parseStringParam(req.body?.eligibility) as 'all_users' | 'approved_buyers' | 'premium_users' | null;
  const rewardKind = parseStringParam(req.body?.rewardKind) as 'none' | 'plugin' | 'plan' | null;
  const rewardPluginIdRaw = Number(req.body?.rewardPluginId);
  const rewardPluginId = Number.isFinite(rewardPluginIdRaw) && rewardPluginIdRaw > 0 ? rewardPluginIdRaw : null;
  const rewardPlanId = parseStringParam(req.body?.rewardPlanId);
  const rewardPlanDaysRaw = Number(req.body?.rewardPlanDays);
  const rewardPlanDays = Number.isFinite(rewardPlanDaysRaw) && rewardPlanDaysRaw > 0 ? Math.floor(rewardPlanDaysRaw) : null;
  if (!title) {
    return res.status(400).json({ error: 'title é obrigatório' });
  }
  const normalizedRewardKind = rewardKind && ['none', 'plugin', 'plan'].includes(rewardKind) ? rewardKind : 'none';
  if (normalizedRewardKind === 'plugin' && !rewardPluginId) {
    return res.status(400).json({ error: 'rewardPluginId Ã© obrigatÃ³rio para recompensa de plugin' });
  }
  if (normalizedRewardKind === 'plan' && !rewardPlanId) {
    return res.status(400).json({ error: 'rewardPlanId Ã© obrigatÃ³rio para recompensa de plano' });
  }

  const withReward = createRaffle({
    title,
    description,
    prize,
    eligibility: eligibility && ['all_users', 'approved_buyers', 'premium_users'].includes(eligibility)
      ? eligibility
      : 'approved_buyers',
    rewardKind: normalizedRewardKind,
    rewardPluginId,
    rewardPlanId,
    rewardPlanDays
  });
  addNotification(
    'Novo sorteio criado',
    `Sorteio "${withReward.title}" criado no painel admin.`,
    {
      type: 'raffle',
      priority: 'normal',
      source: 'admin_raffle_create',
      metadata: { raffleId: withReward.id, eligibility: withReward.eligibility, rewardKind: withReward.rewardKind }
    }
  );
  res.status(201).json({ item: withReward });
});

app.put('/api/admin/raffles/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const id = req.params.id;
  const title = parseStringParam(req.body?.title);
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : undefined;
  const prize = typeof req.body?.prize === 'string' ? req.body.prize.trim() : undefined;
  const eligibility = parseStringParam(req.body?.eligibility) as 'all_users' | 'approved_buyers' | 'premium_users' | null;
  const status = parseStringParam(req.body?.status) as 'open' | 'closed' | 'drawn' | null;
  const rewardKind = parseStringParam(req.body?.rewardKind) as 'none' | 'plugin' | 'plan' | null;
  const rewardPluginIdRaw = Number(req.body?.rewardPluginId);
  const rewardPluginId = Number.isFinite(rewardPluginIdRaw) && rewardPluginIdRaw > 0 ? rewardPluginIdRaw : (req.body?.rewardPluginId === null ? null : undefined);
  const rewardPlanId = req.body?.rewardPlanId === null ? null : parseStringParam(req.body?.rewardPlanId);
  const rewardPlanDaysRaw = Number(req.body?.rewardPlanDays);
  const rewardPlanDays = Number.isFinite(rewardPlanDaysRaw) && rewardPlanDaysRaw > 0 ? Math.floor(rewardPlanDaysRaw) : (req.body?.rewardPlanDays === null ? null : undefined);
  const current = findRaffleById(id);
  if (!current) return res.status(404).json({ error: 'sorteio nÃ£o encontrado' });
  const normalizedRewardKind = rewardKind && ['none', 'plugin', 'plan'].includes(rewardKind) ? rewardKind : undefined;
  const nextRewardKind = normalizedRewardKind ?? current.rewardKind;
  const nextRewardPluginId = rewardPluginId !== undefined ? rewardPluginId : current.rewardPluginId;
  const nextRewardPlanId = rewardPlanId !== undefined ? rewardPlanId : current.rewardPlanId;
  if (nextRewardKind === 'plugin' && !nextRewardPluginId) {
    return res.status(400).json({ error: 'rewardPluginId e obrigatorio para recompensa de plugin' });
  }
  if (nextRewardKind === 'plan' && !nextRewardPlanId) {
    return res.status(400).json({ error: 'rewardPlanId e obrigatorio para recompensa de plano' });
  }

  const item = updateRaffle(id, {
    title: title ?? undefined,
    description: description !== undefined ? (description || null) : undefined,
    prize: prize !== undefined ? (prize || null) : undefined,
    eligibility: eligibility && ['all_users', 'approved_buyers', 'premium_users'].includes(eligibility) ? eligibility : undefined,
    rewardKind: normalizedRewardKind,
    rewardPluginId,
    rewardPlanId: rewardPlanId !== undefined ? rewardPlanId : undefined,
    rewardPlanDays,
    status: status && ['open', 'closed', 'drawn'].includes(status) ? status : undefined
  });
  if (!item) return res.status(404).json({ error: 'sorteio não encontrado' });
  res.json({ item });
});

app.delete('/api/admin/raffles/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const ok = deleteRaffle(req.params.id);
  if (!ok) return res.status(404).json({ error: 'sorteio não encontrado' });
  res.json({ ok: true });
});

app.post('/api/admin/raffles/:id/draw', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const id = req.params.id;
  const raffle = findRaffleById(id);
  if (!raffle) return res.status(404).json({ error: 'sorteio não encontrado' });

  const result = drawRaffleWinner(id);
  if (!result) {
    return res.status(400).json({ error: 'não foi possível sortear (sem participantes elegíveis ou sorteio fechado)' });
  }

  addNotification(
    'Sorteio concluído',
    `Vencedor do sorteio "${result.raffle.title}": ${result.winner?.name || 'N/A'}.`,
    {
      type: 'raffle',
      priority: 'high',
      source: 'admin_raffle_draw',
      metadata: { raffleId: result.raffle.id, winnerUserId: result.winner?.id || null }
    }
  );

  res.json(result);
});

app.post('/api/commerce/checkout', async (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const pluginIds = Array.isArray(req.body?.pluginIds) ? req.body.pluginIds.map(Number) : [];
  const planId = typeof req.body?.planId === 'string' ? req.body.planId : null;
  const couponCode = typeof req.body?.couponCode === 'string' ? req.body.couponCode : null;
  
  if (pluginIds.length === 0 && !planId) {
    res.status(400).json({ error: 'nenhum item selecionado' });
    return;
  }

  const user = ctx.token === auth.demoToken ? demoUser : findUserById(ctx.userId);
  if (!user) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }

  const settings = getAdminSettings();
  if (!settings.mercadopagoEnabled && ctx.token !== auth.demoToken) {
    res.status(400).json({ error: 'Pagamentos via Mercado Pago estão desativados no momento.' });
    return;
  }

  // Calculate total
  let totalCents = 0;
  const items: any[] = [];

  if (planId) {
    const plan = findPlanById(planId);
    if (plan && plan.active) {
      // Robust price parsing: handles "49", "49.90", "49,90", "R$ 49.90", etc.
      const rawPrice = String(plan.price || '0');
      const cleanPrice = rawPrice.replace(/[^\d.,]/g, '').replace(',', '.');
      const priceValue = parseFloat(cleanPrice);
      const priceCents = !isNaN(priceValue) ? Math.round(priceValue * 100) : 0;
      
      if (priceCents > 0) {
        totalCents += priceCents;
        items.push({
          id: String(plan.id),
          title: String(plan.name),
          quantity: 1,
          unit_price: Number((priceCents / 100).toFixed(2)),
          currency_id: 'BRL'
        });
      }
    }
  }

  for (const pid of pluginIds) {
    const plugin = getPluginDetail(pid);
    if (plugin) {
      const priceCents = Math.round(Number(plugin.priceCents) || 0);
      if (priceCents > 0) {
        totalCents += priceCents;
        items.push({
          id: String(plugin.id),
          title: String(plugin.name),
          quantity: 1,
          unit_price: Number((priceCents / 100).toFixed(2)),
          currency_id: 'BRL'
        });
      }
    }
  }

  // Apply coupon if any
  if (couponCode && items.length > 0 && totalCents > 0) {
    const coupon = findCouponByCode(couponCode);
    if (coupon && coupon.active) {
      let totalDiscountCents = 0;
      if (coupon.discountType === 'percentage') {
        totalDiscountCents = Math.floor((totalCents * coupon.discountValue) / 100);
      } else {
        totalDiscountCents = coupon.discountValue;
      }
      
      // Ensure we don't discount more than the total
      totalDiscountCents = Math.min(totalCents, totalDiscountCents);

      // Pro-rate discount across items to avoid negative prices and ensure total matches
      // Round prices to 2 decimals to ensure they are valid for MP
      const discountRatio = totalDiscountCents / totalCents;
      items.forEach(item => {
        const itemOriginalPrice = item.unit_price;
        const newPrice = Math.max(0, Number((itemOriginalPrice * (1 - discountRatio)).toFixed(2)));
        item.unit_price = newPrice;
      });
      
      totalCents = Math.max(0, totalCents - totalDiscountCents);
    }
  }

  // Create internal order
  const orderId = createOrder({
    userId: String(user.id),
    pluginIds: Array.isArray(pluginIds) ? pluginIds : [],
    planId: planId ? String(planId) : null,
    totalCents: Math.max(0, Math.round(Number(totalCents) || 0)),
    paymentProvider: 'mercadopago'
  });

  addNotification(
    'Nova venda pendente',
    `Pedido ${orderId} criado por ${user.email} no valor de R$ ${(totalCents / 100).toFixed(2)}.`,
    {
      type: 'sale',
      priority: 'normal',
      source: 'checkout',
      metadata: { orderId, userId: user.id, totalCents }
    }
  );

  try {
    const { accessToken, client } = getMpCredentials();
    
    // Check if we have valid credentials
    if (!accessToken || !client) {
      res.status(400).json({ 
        error: 'Pagamentos via Mercado Pago não configurados corretamente pelo administrador.',
        details: 'Missing or invalid Access Token'
      });
      return;
    }

    const preference = new Preference(client);
    
    // Mercado Pago requirements: unit_price must be > 0 and a number
    // We also trim titles and ensure only allowed fields are sent to avoid 400 errors
    const validItems = items
      .filter(item => item && Number(item.unit_price) > 0)
      .map((item, index) => ({
        id: String(`${item.id || 'item'}-${index}`).slice(0, 50),
        title: String(item.title || 'Item').slice(0, 250),
        quantity: 1,
        unit_price: Number(Number(item.unit_price).toFixed(2)),
        currency_id: 'BRL'
      }));
    
    if (items.length > 0 && validItems.length === 0) {
       res.status(400).json({ error: 'Nenhum item com valor válido para cobrança foi encontrado.' });
       return;
    }
    
    if (validItems.length === 0) {
      // If total is 0 (e.g. 100% discount), we can complete the order immediately
      updateOrderStatus(orderId, 'completed', 'FREE_BY_COUPON');
      addNotification(
        'Venda aprovada automaticamente',
        `Pedido ${orderId} concluído automaticamente por cupom/valor zero.`,
        {
          type: 'sale',
          priority: 'high',
          source: 'checkout',
          metadata: { orderId, paymentId: 'FREE_BY_COUPON', totalCents: 0 }
        }
      );
      
      let origin = req.headers.origin || req.headers.referer;
      if (origin) {
        origin = origin.replace(/\/$/, '');
      } else {
        origin = `${req.protocol}://${req.get('host')}`;
      }
      
      res.json({ orderId, checkoutUrl: `${origin}/account?order=${orderId}&status=success`, totalCents: 0 });
      return;
    }

    let origin = req.headers.origin || req.headers.referer || '';
    if (origin) {
      origin = origin.replace(/\/$/, '');
    }
    
    // Final fallback if origin/referer are missing
    if (!origin || origin === 'null' || origin === 'undefined') {
      const host = req.get('host') || 'localhost:3001';
      const protocol = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
      origin = protocol + '://' + host;
    }

    const preferenceData: any = {
      body: {
        items: validItems,
        back_urls: {
          success: `${origin}/account?order=${orderId}`,
          failure: `${origin}/checkout?order=${orderId}`,
          pending: `${origin}/account?order=${orderId}`,
        },
        external_reference: String(orderId),
        payer: {
          email: user.email,
        }
      }
    };

    // Only add notification_url if it's a valid HTTPS URL (MP requirement for production)
    const settingsMpWebhook = settings.mercadopagoWebhookUrl;
    const envApiUrl = process.env.API_URL;
    
    let webhookUrl = null;
    if (settingsMpWebhook && settingsMpWebhook.startsWith('https://')) {
      // If the user already provided the full webhook URL, use it. Otherwise, append the path.
      webhookUrl = settingsMpWebhook.includes('/api/webhooks/mercadopago')
        ? settingsMpWebhook
        : `${settingsMpWebhook.replace(/\/$/, '')}/api/webhooks/mercadopago`;
    } else if (envApiUrl && envApiUrl.startsWith('https://')) {
      webhookUrl = `${envApiUrl.replace(/\/$/, '')}/api/webhooks/mercadopago`;
    }

    // Double check webhookUrl is a valid URL string to avoid 400
    if (webhookUrl && webhookUrl.startsWith('https://')) {
      preferenceData.body.notification_url = webhookUrl;
    }

    const response = await preference.create(preferenceData);

    addNotification(
      'Pagamento iniciado',
      `Checkout Mercado Pago criado para o pedido ${orderId}.`,
      {
        type: 'sale',
        priority: 'normal',
        source: 'mercadopago',
        metadata: { orderId, checkoutUrl: response.init_point }
      }
    );

    res.json({
      orderId,
      checkoutUrl: response.init_point,
      totalCents
    });
  } catch (err: any) {
    // Super robust logging
    console.error('--- CHECKOUT ERROR START ---');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    if (err.status) console.error('Status:', err.status);
    if (err.api_response) {
      console.error('API Response Body:', JSON.stringify(err.api_response.body || err.api_response, null, 2));
    }
    console.error('--- CHECKOUT ERROR END ---');
    
    // Better error message for common issues
    let userErrorMessage = 'Erro ao gerar link de pagamento';
    let details = process.env.NODE_ENV === 'development' ? err.message : undefined;

    // SDK v2 error handling
    const apiResponse = err.api_response || (err.response && err.response.data);
    const body = apiResponse && (apiResponse.body || apiResponse);
    const status = err.status || (apiResponse && apiResponse.status) || (body && (body.status || body.error_status));
    const message = (body && (body.message || body.description || body.error)) || err.message;
    const causes = err.cause || (body && body.cause) || (apiResponse && apiResponse.cause);

    if (status === 401) {
      userErrorMessage = 'Erro de autenticação no Mercado Pago. Verifique o Access Token nas configurações do Admin.';
    } else if (status === 400) {
      let errorDetail = '';
      if (Array.isArray(causes)) {
        errorDetail = causes.map((c: any) => c.description || c.message || JSON.stringify(c)).join(', ');
      } else if (message) {
        errorDetail = message;
      }
      userErrorMessage = `Erro nos dados do pedido (400): ${errorDetail || 'Verifique os preços e itens.'}`;
      details = errorDetail || details;
    } else if (message) {
      userErrorMessage = `Erro no Mercado Pago (${status || 'API'}): ${message}`;
    }

    // Ensure we send a response and don't throw again
    try {
      res.status(500).json({ 
        error: userErrorMessage,
        details
      });
    } catch (sendErr) {
      console.error('Failed to send error response:', sendErr);
    }
  }
});

// Webhook for Mercado Pago
app.post('/api/webhooks/mercadopago', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const paymentId = data.id;
    try {
      const { accessToken } = getMpCredentials();
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const payment = (await response.json()) as { status?: string; external_reference?: string };
      
      const orderId = payment.external_reference;
      if (!orderId) return res.sendStatus(200);
      const order = findOrderById(orderId);
      if (!order) return res.sendStatus(200);

      const paymentStatus = String(payment.status || '').toLowerCase();
      const approvedStatuses = new Set(['approved']);
      const rejectedStatuses = new Set(['rejected', 'cancelled', 'canceled', 'refunded', 'charged_back']);

      if (approvedStatuses.has(paymentStatus)) {
        updateOrderStatus(orderId, 'completed', paymentId);

        // Grant items
        if (order.planId) {
          const plan = findPlanById(order.planId);
          if (plan) {
            updateUserAdmin(order.userId, { 
              plan: toUserPlan(plan.name),
              role: plan.grantsAllPlugins ? 'premium' : 'user'
            });
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1);
            updateUserAdmin(order.userId, { planExpiresAt: expiresAt.toISOString() });
          }
        }
        
        for (const pid of order.pluginIds) {
          const p = createPurchase(order.userId, pid);
          updatePurchaseStatus(p.id, 'approved');
        }

        addNotification(
          'Venda aprovada',
          `Pedido ${orderId} aprovado no Mercado Pago.`,
          {
            type: 'sale',
            priority: 'high',
            source: 'mercadopago_webhook',
            metadata: { orderId, paymentId, status: paymentStatus }
          }
        );
      } else if (rejectedStatuses.has(paymentStatus)) {
        updateOrderStatus(orderId, paymentStatus === 'rejected' ? 'rejected' : 'cancelled', paymentId);
        addNotification(
          'Pagamento recusado/cancelado',
          `Pedido ${orderId} retornou status ${paymentStatus}.`,
          {
            type: 'sale',
            priority: 'high',
            source: 'mercadopago_webhook',
            metadata: { orderId, paymentId, status: paymentStatus }
          }
        );
      }
    } catch (err) {
      console.error('Webhook Error:', err);
    }
  }
  
  res.sendStatus(200);
});

app.post('/api/plugin-auth/verify', (req, res) => {
  const pluginId = typeof req.body?.pluginId === 'number' ? req.body.pluginId : Number(req.body?.pluginId);
  const pluginName = typeof req.body?.pluginName === 'string' ? req.body.pluginName.trim() : null;
  const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';
  const licenseKey = typeof req.body?.licenseKey === 'string' ? req.body.licenseKey.trim() : '';
  const serverId = typeof req.body?.serverId === 'string' ? req.body.serverId.trim() : null;

  if (!Number.isFinite(pluginId) || pluginId <= 0 || !apiKey || !licenseKey) {
    res.status(400).json({ error: 'pluginId, apiKey e licenseKey são obrigatórios' });
    return;
  }

  const keyRecord = findApiKey(apiKey);
  if (!keyRecord) {
    res.status(401).json({ error: 'apiKey inválida' });
    return;
  }

  if (keyRecord.pluginId !== pluginId) {
    res.status(403).json({ error: 'apiKey não pertence a este plugin' });
    return;
  }

  // Optional: validate plugin name if provided
  if (pluginName) {
    const pluginData = getPluginDetail(pluginId);
    if (pluginData?.licenseName && pluginData.licenseName !== pluginName) {
      res.status(403).json({ error: 'pluginName inválido para este pluginId' });
      return;
    }
  }

  const user = findUserById(keyRecord.userId);
  if (!user) {
    res.status(404).json({ error: 'usuario nao encontrado' });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: 'usuario banido' });
    return;
  }
  const activePlans = listPlans().filter((p) => p.active);
  const userPlan = activePlans.find((p) => p.name === user.plan);
  const hasActivePlan = !user.planExpiresAt || new Date(user.planExpiresAt).getTime() > Date.now();
  const hasGlobalPlanAccess = Boolean(user.role === 'admin' || (hasActivePlan && userPlan?.grantsAllPlugins));

  let entitlementSource: 'purchase' | 'global_plan' | null = null;
  let license = getLicensesForUser(keyRecord.userId).find(
    (p) => p.pluginId === pluginId && p.licenseKey === licenseKey && p.status === 'Ativo'
  );
  if (license) {
    entitlementSource = 'purchase';
  }

  if (!license && hasGlobalPlanAccess && user.licenseKey === licenseKey) {
    license = {
      id: pluginId,
      pluginId,
      name: 'Plan Global Access',
      version: 'Latest',
      purchaseDateISO: new Date().toISOString(),
      licenseKey,
      status: 'Ativo'
    };
    entitlementSource = 'global_plan';
  }

  if (!license) {
    res.status(403).json({ error: 'licenseKey inválida' });
    return;
  }

  if (license.status !== 'Ativo') {
    res.status(403).json({ error: 'licença inativa' });
    return;
  }

  // Find actual purchase to check security
  const ipResolution = resolveEffectiveRequestIp(req);
  if (!ipResolution.ok) {
    res.status(403).json({ error: ipResolution.reason || 'IP invalido' });
    return;
  }
  const effectiveIp = ipResolution.effectiveIp;

  const normalizedUserAllowedIp = normalizeIp(user.allowedIp || '');
  if (normalizedUserAllowedIp && normalizedUserAllowedIp !== effectiveIp) {
    res.status(403).json({ error: 'IP mismatch (user.allowedIp)' });
    return;
  }

  const purchase = findPurchaseByLicenseKey(licenseKey);

  if (purchase) {
    if (purchase.userId !== keyRecord.userId || purchase.pluginId !== pluginId) {
      res.status(403).json({ error: 'licenseKey nao corresponde ao plugin/usuario informado' });
      return;
    }
    if (purchase.status !== 'approved') {
      res.status(403).json({ error: 'compra nao aprovada para esta licenca' });
      return;
    }
    if (purchase.hwid && purchase.hwid !== (serverId || '')) {
      res.status(403).json({ error: 'HWID mismatch' });
      return;
    }
    const normalizedPurchaseAllowedIp = normalizeIp(purchase.allowedIp || '');
    if (normalizedPurchaseAllowedIp && normalizedPurchaseAllowedIp !== effectiveIp) {
      res.status(403).json({ error: 'IP mismatch' });
      return;
    }
    
    // Bind if not bound
    updatePurchaseTelemetry(purchase.id, {
      hwid: serverId,
      allowedIp: effectiveIp,
      ip: effectiveIp,
      serverName: 'Auth API Verification',
      port: 0,
      platform: 'unknown',
      performance: '{}'
    });
  } else if (entitlementSource === 'purchase') {
    res.status(403).json({ error: 'compra nao encontrada para a licenseKey informada' });
    return;
  }

  res.json({
    ok: true,
    userId: keyRecord.userId,
    plan: user.plan,
    licenseStatus: license.status,
    entitlementSource,
    serverId
  });
});

app.post('/api/newsletter/subscribe', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'email inválido' });
    return;
  }

  subscribeNewsletter(email);
  const settings = getAdminSettings();
  const brand = settings.siteName || 'StarfinPlugins';
  sendEmail({
    to: email,
    subject: `Bem-vindo(a) à newsletter - ${brand}`,
    html: EMAIL_LAYOUT(`
      <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Você está inscrito(a)!</h2>
      <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Obrigado por se inscrever. Você vai receber promoções, novidades e atualizações importantes.
      </p>
      <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Dica</p>
        <p style="color: #ffffff; font-size: 14px; margin: 0;">Confira os plugins em destaque e novidades no site.</p>
      </div>
      <p style="color: #666666; font-size: 12px; margin: 0;">
        Se você não solicitou esta inscrição, ignore este email.
      </p>
    `)
  }).catch(() => null);

  res.json({
    ok: true
  });
});

app.post('/api/careers/apply', async (req, res) => {
  const name = parseStringParam(req.body?.name) ?? '';
  const email = parseStringParam(req.body?.email) ?? '';
  const role = parseStringParam(req.body?.role) ?? '';
  const message = parseStringParam(req.body?.message) ?? '';
  const phone = parseStringParam(req.body?.phone);
  const resumeUrl = parseStringParam(req.body?.resumeUrl);
  const portfolioUrl = parseStringParam(req.body?.portfolioUrl);
  const linkedinUrl = parseStringParam(req.body?.linkedinUrl);
  const githubUrl = parseStringParam(req.body?.githubUrl);

  if (!name || !email || !role || !message) {
    res.status(400).json({ error: 'name, email, role e message são obrigatórios' });
    return;
  }
  if (!email.includes('@')) {
    res.status(400).json({ error: 'email inválido' });
    return;
  }
  const settings = getAdminSettings();
  const publicRole = role.toLowerCase();
  const isTalentPool = publicRole === 'banco de talentos';
  const isActiveRole = settings.careersJobs.some((job) => job.enabled && job.title.toLowerCase() === publicRole);
  if (!isTalentPool && !isActiveRole) {
    res.status(400).json({ error: 'vaga indisponível' });
    return;
  }

  const linkFields: Array<[string, string | null]> = [
    ['resumeUrl', resumeUrl],
    ['portfolioUrl', portfolioUrl],
    ['linkedinUrl', linkedinUrl],
    ['githubUrl', githubUrl]
  ];

  for (const [fieldName, value] of linkFields) {
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('invalid protocol');
      }
    } catch {
      res.status(400).json({ error: `${fieldName} inválida` });
      return;
    }
  }

  const application = createCareerApplication({
    name,
    email,
    role,
    message,
    phone,
    resumeUrl,
    portfolioUrl,
    linkedinUrl,
    githubUrl
  });

  const brand = settings.siteName || 'StarfinPlugins';
  const supportEmail = settings.supportEmail?.trim();

  await sendEmail({
    to: email,
    subject: `Candidatura recebida - ${brand}`,
    html: EMAIL_LAYOUT(`
      <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Recebemos sua candidatura</h2>
      <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Obrigado por se candidatar para a vaga de <strong style="color: #ffffff;">${role}</strong>.
      </p>
      <p style="color: #a0a0a8; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
        Nossa equipe vai analisar seu perfil e entrar em contato caso faça sentido para a posição.
      </p>
      <p style="color: #666666; font-size: 12px; margin: 0;">ID da candidatura: ${application.id}</p>
    `)
  }).catch(() => null);

  if (supportEmail && supportEmail.includes('@')) {
    await sendEmail({
      to: supportEmail,
      subject: `Nova candidatura: ${role} (${name})`,
      html: EMAIL_LAYOUT(`
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Nova candidatura recebida</h2>
        <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Nome</p>
          <p style="color: #ffffff; margin: 0 0 12px 0;">${name}</p>
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Email</p>
          <p style="color: #ffffff; margin: 0 0 12px 0;">${email}</p>
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Vaga</p>
          <p style="color: #ffffff; margin: 0 0 12px 0;">${role}</p>
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Mensagem</p>
          <p style="color: #a0a0a8; margin: 0;">${message}</p>
        </div>
        <p style="color: #666666; font-size: 12px; margin: 0;">ID: ${application.id}</p>
      `)
    }).catch(() => null);
  }

  res.status(201).json({
    ok: true,
    application
  });
});

app.get('/api/public/settings', (_req, res) => {
  const s = getAdminSettings();
  res.json({
    siteName: s.siteName,
    logoUrl: s.logoUrl,
    footerText: s.footerText,
    discordUrl: s.discordUrl,
    supportEmail: s.supportEmail,
    homeStatsPlugins: s.homeStatsPlugins,
    homeStatsServers: s.homeStatsServers,
    homeStatsRating: s.homeStatsRating,
    homeStatsSupport: s.homeStatsSupport,
    careersJobs: s.careersJobs.filter((job) => job.enabled),
    aboutTeam: s.aboutTeam
  });
});

app.post('/api/support/tickets', async (req, res) => {
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const category = typeof req.body?.category === 'string' ? req.body.category.trim() : 'Geral';
  const priority = typeof req.body?.priority === 'string' ? req.body.priority.trim() : 'medium';

  if (hasValidAuthHeader(req)) {
    const ctx = getAuthContext(req);
    if (!ctx) {
      res.status(401).json({ error: 'não autorizado' });
      return;
    }
    if (!subject || !message) {
      res.status(400).json({ error: 'subject e message são obrigatórios' });
      return;
    }
    const ticket = createSupportTicketForUser(ctx.userId, {
      subject,
      category,
      priority: priority as any,
      message
    });
    addNotification(
      'Novo ticket de suporte',
      `Ticket ${ticket?.id || 'novo'} aberto por usuário autenticado: ${subject}.`,
      {
        type: 'support',
        priority: 'high',
        source: 'support_ticket',
        metadata: { ticketId: ticket?.id || null, category, priority, by: ctx.userId }
      }
    );
    res.status(201).json(ticket);
    return;
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!subject || !message || !email) {
    res.status(400).json({ error: 'subject, message e email são obrigatórios' });
    return;
  }

  const ticket = createSupportTicket({ email, subject, message });
  addNotification(
    'Novo ticket de suporte',
    `Ticket ${ticket?.id || 'novo'} aberto por ${email}: ${subject}.`,
    {
      type: 'support',
      priority: 'high',
      source: 'support_ticket',
      metadata: { ticketId: ticket?.id || null, category, priority, email }
    }
  );
  if (ticket?.email) {
    await sendEmail({
      to: ticket.email,
      subject: `Ticket recebido (${ticket.id}) - StarfinPlugins`,
      html: EMAIL_LAYOUT(`
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Ticket Recebido</h2>
        <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Olá, recebemos seu pedido de suporte e nossa equipe analisará o mais breve possível.
        </p>
        <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Assunto</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0 0 15px 0;">${subject}</p>
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Mensagem</p>
          <p style="color: #a0a0a8; font-size: 14px; margin: 0;">${message}</p>
        </div>
        <p style="color: #666666; font-size: 12px;">ID do Ticket: ${ticket.id}</p>
      `)
    });
  }

  res.status(201).json(ticket);
});

app.get('/api/users/me/tickets', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  res.json({ items: listSupportTicketsForUser(ctx.userId) });
});

app.get('/api/support/tickets/:id', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const id = req.params.id;
  const ticket = getSupportTicketById(id);
  if (!ticket) {
    res.status(404).json({ error: 'ticket não encontrado' });
    return;
  }
  if (ticket.userId !== ctx.userId && !isAdmin(req)) {
    res.status(403).json({ error: 'sem permissão' });
    return;
  }
  res.json(ticket);
});

app.post('/api/support/tickets/:id/messages', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const id = req.params.id;
  const ticket = getSupportTicketById(id);
  if (!ticket) {
    res.status(404).json({ error: 'ticket não encontrado' });
    return;
  }
  if (ticket.userId !== ctx.userId && !isAdmin(req)) {
    res.status(403).json({ error: 'sem permissão' });
    return;
  }
  if (ticket.status === 'closed' && !isAdmin(req)) {
    res.status(400).json({ error: 'ticket fechado' });
    return;
  }
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    res.status(400).json({ error: 'content obrigatório' });
    return;
  }
  const msg = addSupportTicketMessage(id, ctx.userId, content, isAdmin(req));
  if (!msg) {
    res.status(404).json({ error: 'ticket não encontrado' });
    return;
  }
  addNotification(
    isAdmin(req) ? 'Resposta do suporte enviada' : 'Nova resposta de cliente em ticket',
    `Ticket ${id} recebeu uma nova mensagem.`,
    {
      type: 'support',
      priority: 'normal',
      source: isAdmin(req) ? 'support_admin_reply' : 'support_user_reply',
      metadata: { ticketId: id, by: ctx.userId, isAdmin: isAdmin(req) }
    }
  );
  res.status(201).json(msg);
});

app.post('/api/support/tickets/:id/close', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const id = req.params.id;
  const ticket = getSupportTicketById(id);
  if (!ticket) {
    res.status(404).json({ error: 'ticket não encontrado' });
    return;
  }
  if (ticket.userId !== ctx.userId && !isAdmin(req)) {
    res.status(403).json({ error: 'sem permissão' });
    return;
  }
  closeSupportTicket(id);
  addNotification(
    'Ticket encerrado',
    `Ticket ${id} foi encerrado.`,
    {
      type: 'support',
      priority: 'low',
      source: 'support_ticket_close',
      metadata: { ticketId: id, by: ctx.userId }
    }
  );
  res.json({ ok: true });
});

app.post('/api/plugins/:id/reviews', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }

  const plugin = getPluginDetail(id);
  if (!plugin) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }

  const ctx = getAuthContext(req);
  const user = ctx?.token === auth.demoToken ? demoUser : (ctx ? findUserById(ctx.userId) : null);
  
  const rating = typeof req.body?.rating === 'number' ? req.body.rating : Number(req.body?.rating);
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';

  if (!user || !comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'usuário logado, rating (1-5) e comment são obrigatórios' });
    return;
  }

  const review = createReview({
    pluginId: id,
    userId: user.id,
    userName: user.name,
    rating,
    comment
  });

  res.status(201).json({
    ok: true,
    review
  });
});

// Admin routes
app.get('/api/admin/plugins', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: pluginSummaries });
});

app.post('/api/admin/plugins', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const body = req.body ?? {};
  const required = ['name', 'description', 'category', 'tags', 'mcVersion', 'imageUrl', 'priceDisplay'];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || (typeof body[k] === 'string' && !body[k].trim())) {
      res.status(400).json({ error: `campo obrigatório: ${k}` });
      return;
    }
  }
  const detail = createPlugin({
    name: String(body.name),
    description: String(body.description),
    category: String(body.category) as any,
    licenseName: body.licenseName ? String(body.licenseName) : undefined,
    tags: Array.isArray(body.tags) ? (body.tags as any) : [],
    mcVersion: String(body.mcVersion),
    imageUrl: String(body.imageUrl),
    priceDisplay: String(body.priceDisplay),
    rating: typeof body.rating === 'number' ? body.rating : undefined,
    downloadsDisplay: typeof body.downloadsDisplay === 'string' ? body.downloadsDisplay : undefined
  });

  // Notify newsletter subscribers about the new plugin
  const settings = getAdminSettings();
  if (settings.newsletterAutoEnabled) {
    const subscribers = listNewsletterSubscribers();
    const brand = settings.siteName || 'StarfinPlugins';
    const subject = `Novo Plugin: ${detail.name} - ${brand}`;
    const html = EMAIL_LAYOUT(`
      <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Novo lançamento!</h2>
      <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Acabamos de lançar o plugin <strong>${detail.name}</strong> na ${brand}.
      </p>
      <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <p style="color: #ffffff; font-size: 16px; margin-bottom: 8px;"><strong>${detail.name}</strong></p>
        <p style="color: #a0a0a8; font-size: 14px; margin-bottom: 16px;">${detail.description}</p>
        <a href="${integrationConfig.panelBaseUrl}/plugins/${detail.id}" style="display: inline-block; background: linear-gradient(to right, #7b2cbf, #9d4edd); color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ver no site</a>
      </div>
    `);
    
    for (const to of subscribers) {
      sendEmail({ to, subject, html }).catch(() => null);
    }
  }

  res.status(201).json(detail);
});

app.put('/api/admin/plugins/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  const next = updatePlugin(id, req.body ?? {});
  if (!next) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }
  res.json(next);
});

app.delete('/api/admin/plugins/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'id inválido' });
    return;
  }
  const ok = deletePlugin(id);
  if (!ok) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }
  res.json({ ok: true });
});

app.get('/api/admin/categories', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: categories });
});

app.post('/api/admin/categories', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    res.status(400).json({ error: 'name obrigatório' });
    return;
  }
  createCategory(name);
  res.status(201).json({ ok: true });
});

app.delete('/api/admin/categories', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  deleteCategory(name);
  res.json({ ok: true });
});

app.put('/api/admin/categories/:oldName', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const oldName = req.params.oldName;
  const newName = typeof req.body?.newName === 'string' ? req.body.newName.trim() : '';
  if (!newName) {
    res.status(400).json({ error: 'newName obrigatório' });
    return;
  }
  updateCategory(oldName, newName);
  res.json({ ok: true });
});

app.get('/api/admin/settings', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json(getAdminSettings());
});

app.post('/api/admin/settings', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const next = saveAdminSettings(req.body ?? {});
  res.json({ success: true, settings: next });
});

app.get('/api/admin/support/tickets', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: listSupportTickets() });
});

app.post('/api/admin/support/tickets/:id/messages', async (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    res.status(400).json({ error: 'content obrigatório' });
    return;
  }
  const ticket = getSupportTicketById(id);
  if (!ticket) {
    res.status(404).json({ error: 'ticket não encontrado' });
    return;
  }
  const ctx = getAuthContext(req);
  const msg = addSupportTicketMessage(id, ctx?.userId ?? null, content, true);
  if (!msg) {
    res.status(404).json({ error: 'ticket não encontrado' });
    return;
  }
  addNotification(
    'Resposta do suporte enviada',
    `Ticket ${id} recebeu resposta da equipe.`,
    {
      type: 'support',
      priority: 'normal',
      source: 'support_admin_reply',
      metadata: { ticketId: id, by: ctx?.userId ?? null }
    }
  );
  if (ticket.email) {
    await sendEmail({
      to: ticket.email,
      subject: `Resposta no ticket (${ticket.id}) - StarfinPlugins`,
      html: EMAIL_LAYOUT(`
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Resposta do Suporte</h2>
        <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Nossa equipe respondeu ao seu ticket.
        </p>
        <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Assunto</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0 0 15px 0;">${ticket.subject}</p>
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Mensagem</p>
          <p style="color: #a0a0a8; font-size: 14px; margin: 0;">${content}</p>
        </div>
        <p style="color: #666666; font-size: 12px;">ID do Ticket: ${ticket.id}</p>
      `)
    });
  }
  res.status(201).json(msg);
});

app.put('/api/admin/support/tickets/:id', async (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const status = String(req.body?.status ?? '').trim() as any;
  if (!['open', 'answered', 'closed'].includes(status)) {
    res.status(400).json({ error: 'status inválido' });
    return;
  }
  const ticket = updateSupportTicketStatus(id, status);
  if (!ticket) {
    res.status(404).json({ error: 'ticket não encontrado' });
    return;
  }
  addNotification(
    'Status de ticket atualizado',
    `Ticket ${id} alterado para ${status}.`,
    {
      type: 'support',
      priority: status === 'closed' ? 'low' : 'normal',
      source: 'support_status_update',
      metadata: { ticketId: id, status }
    }
  );
  if (ticket.email) {
    await sendEmail({
      to: ticket.email,
      subject: `Atualização do ticket (${ticket.id}) - StarfinPlugins`,
      html: EMAIL_LAYOUT(`
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Ticket Atualizado</h2>
        <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Seu ticket de suporte foi atualizado para um novo status.
        </p>
        <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Assunto</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0 0 15px 0;">${ticket.subject}</p>
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Novo Status</p>
          <p style="color: #c77dff; font-size: 14px; font-weight: bold; margin: 0;">${ticket.status.toUpperCase()}</p>
        </div>
        <p style="color: #666666; font-size: 12px;">ID do Ticket: ${ticket.id}</p>
      `)
    });
  }
  res.json({ ok: true, ticket });
});

app.patch('/api/admin/reviews', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ success: true });
});

app.delete('/api/admin/reviews', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/users/me/settings', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const user = findUserById(ctx.userId);
  if (!user) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  const settings = getUserSettings(ctx.userId);
  res.json({
    email: user.email,
    name: user.name,
    licenseKey: user.licenseKey,
    allowedIp: user.allowedIp,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    discordId: user.discordId,
    githubUrl: user.githubUrl,
    twitterUrl: user.twitterUrl,
    ...settings
  });
});

app.patch('/api/users/me/profile', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const updated = updateUserProfile(ctx.userId, req.body || {});
  if (!updated) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  res.json(updated);
});

app.post('/api/users/me/license/regenerate', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const newKey = regenerateUserLicense(ctx.userId);
  res.json({ licenseKey: newKey });
});

app.patch('/api/users/me/allowed-ip', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const ip = typeof req.body?.allowedIp === 'string' ? req.body.allowedIp.trim() : null;
  updateUserAllowedIp(ctx.userId, ip);
  res.json({ success: true });
});

// Server Management
app.get('/api/users/me/servers', (req, res) => {
  if (!hasValidAuthHeader(req)) return res.status(401).json({ error: 'não autorizado' });
  const ctx = getAuthContext(req)!;
  const servers = listServersForUser(ctx.userId);
  const serversWithPlugins = servers.map(s => ({
    ...s,
    plugins: listPluginsForServer(s.id)
  }));
  res.json({ items: serversWithPlugins });
});

app.post('/api/users/me/servers', (req, res) => {
  if (!hasValidAuthHeader(req)) return res.status(401).json({ error: 'não autorizado' });
  const ctx = getAuthContext(req)!;
  const { name, ips } = req.body;
  if (!name) return res.status(400).json({ error: 'nome do servidor é obrigatório' });
  const server = createServer(ctx.userId, name, ips || []);
  res.status(201).json(server);
});

app.patch('/api/users/me/servers/:id', (req, res) => {
  if (!hasValidAuthHeader(req)) return res.status(401).json({ error: 'não autorizado' });
  const ctx = getAuthContext(req)!;
  const server = findServerById(req.params.id);
  if (!server || server.userId !== ctx.userId) return res.status(404).json({ error: 'servidor não encontrado' });
  const updated = updateServer(server.id, req.body);
  res.json(updated);
});

app.delete('/api/users/me/servers/:id', (req, res) => {
  if (!hasValidAuthHeader(req)) return res.status(401).json({ error: 'não autorizado' });
  const ctx = getAuthContext(req)!;
  const server = findServerById(req.params.id);
  if (!server || server.userId !== ctx.userId) return res.status(404).json({ error: 'servidor não encontrado' });
  deleteServer(server.id);
  res.json({ ok: true });
});

app.post('/api/users/me/servers/:id/plugins', (req, res) => {
  if (!hasValidAuthHeader(req)) return res.status(401).json({ error: 'não autorizado' });
  const ctx = getAuthContext(req)!;
  const server = findServerById(req.params.id);
  if (!server || server.userId !== ctx.userId) return res.status(404).json({ error: 'servidor não encontrado' });
  const { pluginId } = req.body;
  if (!pluginId) return res.status(400).json({ error: 'pluginId é obrigatório' });
  
  // Check if user owns the plugin
  const ownsPlugin = getLicensesForUser(ctx.userId).some(p => p.pluginId === pluginId && p.status === 'Ativo');
  if (!ownsPlugin) return res.status(403).json({ error: 'você não possui este plugin' });

  assignPluginToServer(server.id, pluginId);
  res.json({ ok: true });
});

app.delete('/api/users/me/servers/:id/plugins/:pluginId', (req, res) => {
  if (!hasValidAuthHeader(req)) return res.status(401).json({ error: 'não autorizado' });
  const ctx = getAuthContext(req)!;
  const server = findServerById(req.params.id);
  if (!server || server.userId !== ctx.userId) return res.status(404).json({ error: 'servidor não encontrado' });
  unassignPluginFromServer(server.id, Number(req.params.pluginId));
  res.json({ ok: true });
});

app.patch('/api/users/me/settings', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  updateUserSettings(ctx.userId, req.body ?? {});
  res.json({ success: true });
});

app.get('/api/users/me/notifications', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  res.json(notifications);
});

app.post('/api/users/me/notifications/read-all', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  clearNotifications();
  res.json({ success: true });
});

app.get('/api/users/me/payments', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const userPurchases = listAllPurchases().filter(p => p.userId === ctx.userId);
  res.json(userPurchases.map(p => ({
    id: p.id,
    dateISO: p.createdISO,
    amountCents: 1990, // Exemplo fixo
    status: p.status,
    method: 'PIX',
    pluginName: getPluginDetail(p.pluginId)?.name || 'Plugin'
  })));
});

app.get('/api/plugins/:id/config', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const id = Number(req.params.id);
  const plugin = getPluginDetail(id);
  const ctx = getAuthContext(req)!;
  const user = findUserById(ctx.userId);
  
  res.json({
    pluginId: id,
    name: plugin?.name || 'Plugin',
    version: plugin?.version || '1.0.0',
    jarUrl: `https://starfinplugins.com/download/${id}/latest.jar`,
    hwid: 'NÃO VINCULADO',
    allowedIp: user?.allowedIp || ''
  });
});

app.patch('/api/plugins/:id/config', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/status', (_req, res) => {
  res.json({ items: statusComponents });
});

app.get('/api/changelog', (_req, res) => {
  res.json({ items: changelog });
});

app.get('/api/docs', (_req, res) => {
  res.json({ items: docsSections, integration: integrationConfig });
});

app.post('/api/auth/resend-verification', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) return res.status(400).json({ error: 'email requerido' });
  
  const user = findUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'usuário não encontrado' });
  
  if (user.verified) return res.status(400).json({ error: 'usuário já verificado' });
  
  // Simulation: just return ok
  res.json({ ok: true, message: 'email de verificação reenviado' });
});

app.get('/api/admin/stats', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }

  const allUsers = listAllUsers();
  const allPurchases = listAllPurchases();
  const allOrders = listAllOrders();
  const allTickets = listSupportTickets();

  const normalizeStatus = (value: string): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
    const s = String(value || '').toLowerCase();
    if (['approved', 'completed', 'paid', 'success'].includes(s)) return 'approved';
    if (['rejected', 'failed', 'denied', 'refused'].includes(s)) return 'rejected';
    if (['cancelled', 'canceled', 'voided', 'refunded', 'charged_back'].includes(s)) return 'cancelled';
    return 'pending';
  };

  const pluginById = new Map(pluginSummaries.map((p) => [p.id, p]));

  const purchaseSummary = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  for (const purchase of allPurchases) {
    purchaseSummary[normalizeStatus(purchase.status)] += 1;
  }

  const paymentSummary = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  for (const order of allOrders) {
    paymentSummary[normalizeStatus(order.status)] += 1;
  }

  const approvedOrderRevenue = allOrders
    .filter((o) => normalizeStatus(o.status) === 'approved')
    .reduce((acc, order) => acc + Math.max(0, Number(order.totalCents || 0)), 0);

  const fallbackApprovedPurchaseRevenue = allPurchases
    .filter((p) => normalizeStatus(p.status) === 'approved')
    .reduce((acc, purchase) => {
      const plugin = pluginById.get(purchase.pluginId);
      return acc + Math.max(0, Math.round(Number(plugin?.priceCents || 0)));
    }, 0);

  const totalRevenueCents = approvedOrderRevenue > 0 ? approvedOrderRevenue : fallbackApprovedPurchaseRevenue;

  const salesByPlugin = new Map<number, number>();
  for (const purchase of allPurchases) {
    if (normalizeStatus(purchase.status) !== 'approved') continue;
    salesByPlugin.set(purchase.pluginId, (salesByPlugin.get(purchase.pluginId) || 0) + 1);
  }

  const topPlugins = [...salesByPlugin.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pluginId, sales]) => {
      const plugin = pluginById.get(pluginId);
      const fallbackName = `Plugin #${pluginId}`;
      return {
        id: String(pluginId),
        name: plugin?.name || fallbackName,
        slug: (plugin?.name || fallbackName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sales,
        revenueCents: sales * Math.max(0, Math.round(Number(plugin?.priceCents || 0)))
      };
    });

  const purchasesByCustomer = new Map<string, number>();
  for (const purchase of allPurchases) {
    if (normalizeStatus(purchase.status) !== 'approved') continue;
    purchasesByCustomer.set(purchase.userId, (purchasesByCustomer.get(purchase.userId) || 0) + 1);
  }

  const topCustomers = [...purchasesByCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, pluginCount]) => {
      const user = findUserById(userId);
      return {
        id: userId,
        name: user?.name || 'Usuário removido',
        email: user?.email || '-',
        pluginCount
      };
    });

  const ticketsSummary = {
    open: allTickets.filter((t) => t.status === 'open').length,
    answered: allTickets.filter((t) => t.status === 'answered').length,
    closed: allTickets.filter((t) => t.status === 'closed').length
  };

  const pluginsWithSales = new Set(allPurchases.filter((p) => normalizeStatus(p.status) === 'approved').map((p) => p.pluginId)).size;

  res.json({
    topPlugins,
    topCustomers,
    stats: {
      totalSales: allPurchases.length,
      totalRevenueCents,
      totalUsers: allUsers.length,
      totalOrders: allOrders.length,
      totalPlugins: pluginSummaries.length,
      pluginsWithSales
    },
    paymentStatus: paymentSummary,
    pluginStatus: purchaseSummary,
    tickets: ticketsSummary
  });
});

app.get('/api/admin/users', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: listAllUsers() });
});

app.post('/api/admin/users', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const user = createUserAdmin(req.body ?? {});
  res.status(201).json(user);
});

app.get('/api/admin/users/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const user = findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  res.json(user);
});

app.post('/api/admin/users/:id/license/hwid/reset', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const user = findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'usuÃ¡rio nÃ£o encontrado' });
    return;
  }
  const updated = resetUserLicenseHwid(user.id);
  if (!updated) {
    res.status(500).json({ error: 'falha ao resetar HWID' });
    return;
  }
  addNotification(
    'HWID global resetado por admin',
    `HWID global do usuÃ¡rio ${user.email} foi resetado.`,
    {
      type: 'manual',
      priority: 'high',
      source: 'admin_hwid_reset',
      metadata: { userId: user.id }
    }
  );
  res.json({ ok: true, userId: user.id });
});

function mapAdminUserPluginAssignment(purchase: any) {
  const plugin = getPluginDetail(Number(purchase.pluginId));
  return {
    purchaseId: purchase.id,
    pluginId: Number(purchase.pluginId),
    pluginName: plugin?.name || `Plugin #${purchase.pluginId}`,
    status: purchase.status,
    licenseKey: purchase.licenseKey || null,
    createdISO: purchase.createdISO,
    updatedISO: purchase.updatedISO
  };
}

app.get('/api/admin/users/:id/plugins', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const user = findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  const items = listAllPurchases()
    .filter((p) => p.userId === user.id && p.status === 'approved')
    .map(mapAdminUserPluginAssignment);
  res.json({ items });
});

app.post('/api/admin/users/:id/plugins', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const user = findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }

  const pluginIdRaw = typeof req.body?.pluginId === 'number' ? req.body.pluginId : Number(req.body?.pluginId);
  const pluginId = Number.isFinite(pluginIdRaw) ? Number(pluginIdRaw) : 0;
  if (!pluginId || pluginId <= 0) {
    res.status(400).json({ error: 'pluginId inválido' });
    return;
  }

  const plugin = getPluginDetail(pluginId);
  if (!plugin) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }

  const userPurchases = listAllPurchases().filter((p) => p.userId === user.id && Number(p.pluginId) === pluginId);
  const existingApproved = userPurchases.find((p) => p.status === 'approved');
  if (existingApproved) {
    res.json({ item: mapAdminUserPluginAssignment(existingApproved) });
    return;
  }

  const reusablePurchase = userPurchases.find((p) => p.status !== 'approved');
  const basePurchase = reusablePurchase || createPurchase(user.id, pluginId);
  const approved = updatePurchaseStatus(basePurchase.id, 'approved');
  if (!approved) {
    res.status(500).json({ error: 'falha ao aprovar licença' });
    return;
  }

  addNotification(
    'Plugin atribuído manualmente',
    `Plugin ${plugin.name} atribuído ao usuário ${user.email}.`,
    {
      type: 'sale',
      priority: 'normal',
      source: 'admin_user_plugin_assign',
      metadata: { userId: user.id, pluginId, purchaseId: approved.id }
    }
  );

  res.status(201).json({ item: mapAdminUserPluginAssignment(approved) });
});

app.delete('/api/admin/users/:id/plugins/:pluginId', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const user = findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }

  const pluginId = Number(req.params.pluginId);
  if (!Number.isFinite(pluginId) || pluginId <= 0) {
    res.status(400).json({ error: 'pluginId inválido' });
    return;
  }

  const plugin = getPluginDetail(pluginId);
  if (!plugin) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }

  const approvedPurchases = listAllPurchases().filter(
    (p) => p.userId === user.id && Number(p.pluginId) === pluginId && p.status === 'approved'
  );
  if (approvedPurchases.length === 0) {
    res.status(404).json({ error: 'usuário não possui este plugin' });
    return;
  }

  let revokedCount = 0;
  for (const purchase of approvedPurchases) {
    const updated = updatePurchaseStatus(purchase.id, 'cancelled');
    if (updated) revokedCount += 1;
  }

  addNotification(
    'Plugin removido manualmente',
    `Plugin ${plugin.name} removido do usuário ${user.email}.`,
    {
      type: 'sale',
      priority: 'normal',
      source: 'admin_user_plugin_remove',
      metadata: { userId: user.id, pluginId, revokedCount }
    }
  );

  res.json({ ok: true, revokedCount });
});

app.put('/api/admin/users/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const next = updateUserAdmin(req.params.id, req.body ?? {});
  if (!next) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  res.json(next);
});

app.delete('/api/admin/users/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const success = deleteUserAdmin(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  res.json({ ok: true });
});

app.get('/api/admin/smtp', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({
    ...smtpConfig,
    pass: smtpConfig.pass ? '********' : ''
  });
});

app.put('/api/admin/smtp', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const body = req.body ?? {};
  const newConfig = { ...smtpConfig };
  if (typeof body.enabled === 'boolean') newConfig.enabled = body.enabled;
  if (typeof body.host === 'string') newConfig.host = body.host.trim();
  if (typeof body.port === 'number') newConfig.port = body.port;
  if (typeof body.secure === 'boolean') newConfig.secure = body.secure;
  if (typeof body.user === 'string') newConfig.user = body.user.trim();
  if (typeof body.pass === 'string' && body.pass && body.pass !== '********') newConfig.pass = body.pass;
  if (typeof body.fromName === 'string') newConfig.fromName = body.fromName.trim();
  if (typeof body.fromEmail === 'string') newConfig.fromEmail = body.fromEmail.trim();
  
  saveSmtpConfig(newConfig);
  res.json({ ok: true });
});

app.post('/api/admin/smtp/test', async (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const to = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
  if (!to || !to.includes('@')) {
    res.status(400).json({ error: 'to (email) obrigatório' });
    return;
  }
  const result = await testSmtp(to);
  res.json(result);
});

app.get('/api/admin/emails/outbox', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: outbox.slice(0, 50) });
});

app.get('/api/admin/newsletter/subscribers', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: listNewsletterSubscribers() });
});

app.get('/api/admin/reviews', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  try {
    res.json({ items: listAllReviews() });
  } catch (err) {
    console.error('Error in /api/admin/reviews:', err);
    res.status(500).json({ error: 'erro interno ao listar avaliações' });
  }
});

app.delete('/api/admin/reviews/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const ok = deleteReview(req.params.id);
  if (!ok) {
    res.status(404).json({ error: 'avaliação não encontrada' });
    return;
  }
  res.json({ ok: true });
});

app.get('/api/admin/plans', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: listPlans() });
});

app.post('/api/admin/plans', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const { name, price, features } = req.body;
  const plan = createPlan({ name, price, features });
  res.status(201).json(plan);
});

app.put('/api/admin/plans/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const { name, price, features, active, grantsAllPlugins } = req.body;
  updatePlan(req.params.id, {
    name: String(name ?? ''),
    price: String(price ?? ''),
    features: Array.isArray(features) ? features.map(String) : [],
    active: Boolean(active),
    grantsAllPlugins: Boolean(grantsAllPlugins)
  });
  res.json({ ok: true });
});

app.delete('/api/admin/plans/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const ok = deletePlan(req.params.id);
  res.json({ ok });
});

app.post('/api/admin/newsletter/send', async (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  
  if (!subject || !body) {
    res.status(400).json({ error: 'subject e body são obrigatórios' });
    return;
  }

  const subscribers = listNewsletterSubscribers();
  if (subscribers.length === 0) {
    res.status(400).json({ error: 'nenhum inscrito encontrado' });
    return;
  }

  // Send emails in background
  (async () => {
    const html = EMAIL_LAYOUT(body);
    for (const to of subscribers) {
      try {
        await sendEmail({ to, subject, html });
      } catch (e) {
        console.error(`Failed to send newsletter to ${to}:`, e);
      }
    }
  })().catch(console.error);

  res.json({ ok: true });
});

app.get('/api/admin/integrations', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json(integrationConfig);
});

app.put('/api/admin/integrations', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const body = req.body ?? {};
  const newConfig = { ...integrationConfig };
  if (typeof body.panelBaseUrl === 'string') newConfig.panelBaseUrl = body.panelBaseUrl.trim();
  if (typeof body.pluginAuthEndpoint === 'string') newConfig.pluginAuthEndpoint = body.pluginAuthEndpoint.trim();
  if (typeof body.docsBaseUrl === 'string') newConfig.docsBaseUrl = body.docsBaseUrl.trim();
  
  saveIntegrationConfig(newConfig);
  res.json({ ok: true });
});

app.get('/api/admin/purchases', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: listAllPurchases() });
});

app.put('/api/admin/purchases/:id', async (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const body = req.body ?? {};
  
  const purchase = updatePurchaseAdmin(id, body);
  if (!purchase) {
    res.status(404).json({ error: 'compra não encontrada' });
    return;
  }

  const user = findUserById(purchase.userId);
  const plugin = getPluginDetail(purchase.pluginId);
  if (user && body.status) {
    const pluginName = plugin?.name ?? purchase.pluginId;
    const statusText =
      purchase.status === 'approved'
        ? 'Aprovada'
        : purchase.status === 'cancelled'
          ? 'Cancelada'
          : purchase.status === 'rejected'
            ? 'Recusada'
            : 'Pendente';

    addNotification(
      'Status de venda atualizado',
      `Compra ${purchase.id} (${pluginName}) agora está ${statusText.toLowerCase()}.`,
      {
        type: 'sale',
        priority: purchase.status === 'approved' ? 'high' : 'normal',
        source: 'admin_purchase_update',
        metadata: { purchaseId: purchase.id, status: purchase.status, pluginId: purchase.pluginId, userId: purchase.userId }
      }
    );
    
    let extraHtml = '';
    if (purchase.status === 'approved' && purchase.licenseKey) {
      extraHtml = `
        <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Sua Chave de Licença</p>
        <div style="background-color: #0b0b0f; border: 1px dashed #7b2cbf; border-radius: 8px; padding: 15px; text-align: center;">
          <code style="color: #ffffff; font-size: 18px; font-family: monospace; letter-spacing: 2px;">${purchase.licenseKey}</code>
        </div>
      `;
    }

    await sendEmail({
      to: user.email,
      subject: `Atualização da compra (${purchase.id}) - StarfinPlugins`,
      html: EMAIL_LAYOUT(`
        <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Pedido Atualizado</h2>
        <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          O status do seu pedido foi atualizado para: <strong>${statusText}</strong>
        </p>
        <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 25px; margin-bottom: 20px;">
          <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Produto</p>
          <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 15px 0;">${pluginName}</h3>
          ${extraHtml}
        </div>
        <p style="color: #666666; font-size: 12px;">ID do Pedido: ${purchase.id}</p>
      `)
    });
  }
  res.json({ ok: true, purchase });
});

app.put('/api/admin/status/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const idx = statusComponents.findIndex((s) => s.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'componente não encontrado' });
    return;
  }
  const status = typeof req.body?.status === 'string' ? req.body.status : '';
  const message = typeof req.body?.message === 'string' ? req.body.message : '';
  if (status) statusComponents[idx].status = status;
  if (message) statusComponents[idx].message = message;
  statusComponents[idx].updatedISO = new Date().toISOString();
  res.json({ ok: true, item: statusComponents[idx] });
});

app.post('/api/admin/changelog', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const version = typeof req.body?.version === 'string' ? req.body.version.trim() : '';
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  if (!version || !title || !body) {
    res.status(400).json({ error: 'version, title e body são obrigatórios' });
    return;
  }
  const item = { id: `cl_${Date.now()}`, version, title, body, createdISO: new Date().toISOString() };
  changelog.unshift(item);
  res.status(201).json(item);
});

app.put('/api/admin/changelog/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const idx = changelog.findIndex((c) => c.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'changelog não encontrado' });
    return;
  }
  if (typeof req.body?.version === 'string') changelog[idx].version = req.body.version.trim();
  if (typeof req.body?.title === 'string') changelog[idx].title = req.body.title.trim();
  if (typeof req.body?.body === 'string') changelog[idx].body = req.body.body.trim();
  res.json({ ok: true, item: changelog[idx] });
});

app.delete('/api/admin/changelog/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const idx = changelog.findIndex((c) => c.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'changelog não encontrado' });
    return;
  }
  changelog.splice(idx, 1);
  res.json({ ok: true });
});

app.put('/api/admin/docs/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const body = typeof req.body?.body === 'string' ? req.body.body : '';
  if (!title || !body) {
    res.status(400).json({ error: 'title e body são obrigatórios' });
    return;
  }
  updateDocsSection(id, title, body);
  res.json({ ok: true });
});

let newsletterSending = false;
async function maybeSendNewsletterAuto() {
  if (newsletterSending) return;
  const settings = getAdminSettings();
  if (!settings.newsletterAutoEnabled) return;
  const freqDays = Number(settings.newsletterFrequencyDays) || 7;
  const lastISO = settings.newsletterLastSentISO ? new Date(settings.newsletterLastSentISO).getTime() : 0;
  const now = Date.now();
  if (lastISO && now - lastISO < freqDays * 24 * 60 * 60 * 1000) return;

  const recipients = listNewsletterSubscribers();
  if (recipients.length === 0) {
    saveAdminSettings({ newsletterLastSentISO: new Date().toISOString() });
    return;
  }

  newsletterSending = true;
  try {
    const brand = settings.siteName || 'StarfinPlugins';
    const subject = `Novidades e promoções - ${brand}`;
    const html = EMAIL_LAYOUT(`
      <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 16px;">Novidades da semana</h2>
      <p style="color: #a0a0a8; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
        Confira lançamentos, atualizações e promoções ativas na ${brand}.
      </p>
      <div style="background-color: #1a1a22; border: 1px solid #7b2cbf44; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <p style="color: #c77dff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0;">Destaques</p>
        <ul style="color: #ffffff; margin: 0; padding-left: 18px;">
          <li>Novos plugins e versões mais recentes</li>
          <li>Cupons e descontos sazonais</li>
          <li>Atualizações no StarfinLicense e painel</li>
        </ul>
      </div>
      <p style="color: #666666; font-size: 12px; margin: 0;">Você recebeu este email porque se inscreveu na newsletter.</p>
    `);

    for (const to of recipients) {
      await sendEmail({ to, subject, html });
    }
    saveAdminSettings({ newsletterLastSentISO: new Date().toISOString() });
  } finally {
    newsletterSending = false;
  }
}

setInterval(() => {
  maybeSendNewsletterAuto().catch(() => null);
}, 60 * 60 * 1000);

const isProdRuntime = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_PROJECT_ID);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('SERVER FATAL ERROR:', err.message || err, err.stack);
  if (err.cause) console.error('Error Cause:', err.cause);
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Contate o suporte',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

if (isProdRuntime) {
  const distPath = path.join(__dirname, '..', '..', 'dist');
  app.use(express.static(distPath));
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

process.on('uncaughtException', (error) => {
  console.error('[fatal] uncaughtException:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection:', reason);
});

const start = async () => {
  try {
    const port = Number(process.env.PORT);
    if (!Number.isFinite(port) || port <= 0) {
      throw new Error('PORT não definida');
    }

    console.log('Iniciando servidor...');
    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, '0.0.0.0', () => resolve());
      server.once('error', reject);
    });
    console.log(`Server rodando na porta ${port}`);
    process.stdout.write(`StarfinPlugins API rodando em http://0.0.0.0:${port} (${isProdRuntime ? 'prod' : 'dev'})\n`);
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app };
