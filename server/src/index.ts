import cors from 'cors';
import express from 'express';
import multer from 'multer';
import net from 'net';
import { createHash, randomUUID } from 'node:crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  auth,
  categories,
  createApiKeyForUser,
  createEmailVerificationToken,
  createPasswordResetToken,
  consumePasswordResetToken,
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
  listPluginReleases,
  findPluginRelease,
  createPluginRelease,
  setPluginReleasePublished,
  deletePluginRelease,
  userOwnsPlugin,
  integrationConfig,
  notifications,
  listUserNotifications,
  createUserNotification,
  readAllUserNotifications,
  outbox,
  randomToken,
  saveSmtpConfig,
  saveIntegrationConfig,
  smtpConfig,
  statusComponents,
  updateStatusComponent,
  changelog,
  createChangelogEntry,
  updateChangelogEntry,
  deleteChangelogEntry,
  recordAdminAudit,
  listAdminAudit,
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
  revokeUserSessions,
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
  claimVerifiedOrder,
  completeVerifiedOrder,
  grantOrderPluginOnce,
  reverseVerifiedOrder,
  revokeOrderPlugins,
  listAllOrders,
  listOrdersForUser,
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
import { reconcilePayment, verifyMercadoPagoWebhook, type VerifiedPayment } from './payment-validation.js';
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
    if (!user || user.banned) return null;
    return { token, userId: session.userId, role: user.role };
  }
  return null;
}

function safeUser<T extends { passwordHash?: string; settings?: unknown }>(user: T) {
  const { passwordHash: _hash, settings: _settings, ...publicFields } = user;
  return publicFields;
}

function safeAdminUser<T extends { passwordHash?: string; settings?: unknown; licenseKey?: string | null }>(user: T) {
  const result = safeUser(user);
  return { ...result, licenseKey: user.licenseKey ? `••••${user.licenseKey.slice(-4)}` : null };
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
  // Never trust client-supplied forwarding headers by default.
  // If a reverse proxy is used, both its socket IP and forwarding header
  // must be explicitly configured, and the proxy must scrub spoofed headers.
  const peerIp = normalizeIp(req.socket.remoteAddress || '');
  const trustedPeers = (process.env.TRUSTED_PROXY_IPS || '')
    .split(',').map(normalizeIp).filter(Boolean);
  const headerName = (process.env.TRUSTED_PROXY_HEADER || '').trim().toLowerCase();
  const permittedHeaders = new Set(['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for']);
  if (peerIp && trustedPeers.includes(peerIp) && permittedHeaders.has(headerName)) {
    const forwarded = normalizeIp(readHeaderValue(req.headers[headerName]));
    if (forwarded) return forwarded;
  }
  return peerIp;
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

function auditAdmin(req: express.Request, action: string, resourceType: string, resourceId: string, details: Record<string, unknown> | null = null) {
  const actorUserId = getAuthContext(req)?.userId;
  if (!actorUserId) return;
  recordAdminAudit({ actorUserId, action, resourceType, resourceId, outcome: 'success', details });
}

// Multer config for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = process.env.STARFIN_UPLOADS_DIR || path.join(__dirname, '..', '..', 'public', 'uploads');
const privateReleasesDir = process.env.STARFIN_PRIVATE_RELEASES_DIR || path.join(process.cwd(), 'private', 'releases');
const releaseUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function publicRelease(release: ReturnType<typeof findPluginRelease>) {
  if (!release) return null;
  const { fileName: _fileName, ...metadata } = release;
  return metadata;
}

fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o750 });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ctx = getAuthContext(_req);
    const uniqueSuffix = _req.path === '/api/users/me/avatar' && ctx
      ? `avatar-${ctx.userId}-${randomUUID()}`
      : randomUUID();
    const extensionByMime: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif'
    };
    cb(null, uniqueSuffix + (extensionByMime[file.mimetype] || '.bin'));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use PNG, JPG, WEBP ou GIF.'));
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
app.use('/uploads', express.static(uploadsDir, { dotfiles: 'deny', setHeaders(res) { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));

function validUploadedImage(file: Express.Multer.File): boolean {
  const bytes = fs.readFileSync(file.path).subarray(0, 12);
  return file.mimetype === 'image/png'
    ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : file.mimetype === 'image/jpeg'
      ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : file.mimetype === 'image/gif'
        ? ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))
        : bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
}

function discardInvalidUpload(file: Express.Multer.File): boolean {
  if (validUploadedImage(file)) return false;
  fs.unlinkSync(file.path);
  return true;
}

function removeOwnedAvatar(url: string | null | undefined, userId: string) {
  if (!url || !url.startsWith(`/uploads/avatar-${userId}-`) || !/^\/uploads\/avatar-user_[a-f0-9-]+-[a-f0-9-]+\.(?:png|jpg|webp|gif)$/.test(url)) return;
  const filePath = path.join(uploadsDir, path.basename(url));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

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
  if (discardInvalidUpload(req.file)) {
    return res.status(415).json({ error: 'O conteúdo do arquivo não corresponde a uma imagem válida.' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.get('/api/admin/media', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'acesso administrativo necessário' });
  const items = fs.readdirSync(uploadsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && /^[a-f0-9-]+\.(?:png|jpg|webp|gif)$/.test(entry.name))
    .map(entry => ({ url: `/uploads/${entry.name}`, createdAt: fs.statSync(path.join(uploadsDir, entry.name)).mtime.toISOString() }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ items });
});

app.post('/api/users/me/avatar', (req, res, next) => {
  if (!getAuthContext(req)) return res.status(401).json({ error: 'não autorizado' });
  next();
}, upload.single('file'), (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx || !req.file) return res.status(400).json({ error: 'nenhuma imagem enviada' });
  if (discardInvalidUpload(req.file)) return res.status(415).json({ error: 'imagem inválida' });
  const previous = findUserById(ctx.userId)?.avatarUrl;
  const avatarUrl = `/uploads/${req.file.filename}`;
  const user = updateUserProfile(ctx.userId, { avatarUrl });
  if (!user) { fs.unlinkSync(req.file.path); return res.status(404).json({ error: 'usuário não encontrado' }); }
  removeOwnedAvatar(previous, ctx.userId);
  res.json({ avatarUrl });
});

app.delete('/api/users/me/avatar', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'não autorizado' });
  const previous = findUserById(ctx.userId)?.avatarUrl;
  updateUserProfile(ctx.userId, { avatarUrl: null });
  removeOwnedAvatar(previous, ctx.userId);
  res.json({ avatarUrl: null });
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

// Do not grant paid privileges from an authenticated self-service request.
// A subscription must be created by a verified payment/reconciliation path.
app.post('/api/users/me/plans/subscribe', (_req, res) => {
  res.status(403).json({
    error: 'Assinaturas são liberadas somente após confirmação do pagamento.',
    code: 'PAYMENT_REQUIRED'
  });
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
  const bootstrapPluginNames = ['StarfinCore', 'StarfinLicense'];
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
  const bootstrapPluginAliases = new Set(['starfincore', 'starfin-core', 'starfinlicense', 'starfin-license']);
  const isBootstrapRequest = requestedPluginNames.some((name) => bootstrapPluginAliases.has(name));
  const pluginByLowerName = new Map(pluginSummaries.map((p) => [p.name.toLowerCase(), p] as const));
  const withBootstrapPlugin = (plugins: string[]) => {
    return Array.from(new Set([...bootstrapPluginNames, ...plugins.filter(Boolean)]));
  };
  const authorizationProductIds = (allowedPlugins: string[]): string[] => {
    const authorizedNames = new Set(allowedPlugins.map(name => name.toLowerCase()));
    return Array.from(new Set(pluginSummaries
      .filter(p => authorizedNames.has(p.name.toLowerCase()))
      .map(p => {
        // Product identifiers are stable and independent from display names.
        if (p.name.toLowerCase() === 'starfinbans') return 'starfin_bans';
        const declared = String(p.licenseName || `starfin_product_${p.id}`).toLowerCase().trim();
        return /^[a-z0-9_]{2,64}$/.test(declared) ? declared : '';
      })
      .filter(Boolean)));
  };
  const licenseAuthorizationLease = () => new Date(Date.now() + 45 * 60_000).toISOString();
  // A private, authenticated release endpoint is required before advertising
  // download URLs to installed plugins.
  const buildUpdates = (_allowedPlugins: string[]) => ({});
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
  const keyRef = createHash('sha256').update(String(licenseKey)).digest('hex').slice(0, 12);
  const auditPrefix = `[License Check] [key:${keyRef}]`;

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
    const ownedProductIds = new Set(getLicensesForUser(user.id)
      .filter(p => p.status === 'Ativo').map(p => p.pluginId));
    if (!hasGlobalAccess && ownedProductIds.size === 0) {
      return res.status(200).json({ valid: false, ok: false,
        reason: 'Nenhum produto adquirido ou autorizado para esta conta.' });
    }
    if (requestedPluginNames.length > 0 && !isBootstrapRequest) {
      const assigned = matchingServer ? new Set(listPluginsForServer(matchingServer.id)) : null;
      const requestedIsOwned = pluginSummaries.some(p =>
        requestedPluginNames.includes(p.name.toLowerCase()) &&
        (hasGlobalAccess || ownedProductIds.has(p.id)) &&
        (!assigned || hasGlobalAccess || assigned.has(p.id))
      );
      if (!requestedIsOwned) {
        return res.status(200).json({ valid: false, ok: false,
          reason: 'Plugin solicitado nao autorizado para esta licenca.' });
      }
    }
    const storedUserHwid = normalizeHwid(user.licenseHwid || '');
    if (!storedUserHwid) {
      const bound = bindUserLicenseHwid(user.id, normalizedHwid);
      if (normalizeHwid(bound?.licenseHwid || '') !== normalizedHwid) {
        return res.status(200).json({ valid: false, ok: false, reason: 'HWID nao autorizado.' });
      }
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
        .filter(p => assignedPluginIds.includes(p.id) && (hasGlobalAccess || ownedProductIds.has(p.id)))
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
        allowedProductIds: authorizationProductIds(allowedPlugins),
        authorizationExpiresAt: licenseAuthorizationLease(),
        protocolVersion: 2,
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
      allowedProductIds: authorizationProductIds(allowedPlugins),
      authorizationExpiresAt: licenseAuthorizationLease(),
      protocolVersion: 2,
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
    const activeOwnerProducts = new Set(getLicensesForUser(owner.id)
      .filter(p => p.status === 'Ativo').map(p => p.pluginId));
    const ownerPlan = listPlans().find(p => p.name === owner.plan && p.active);
    const planActive = Boolean(owner.planExpiresAt && new Date(owner.planExpiresAt).getTime() > Date.now());
    const ownerGlobalAccess = owner.role === 'admin' || (planActive && Boolean(ownerPlan?.grantsAllPlugins));
    const allowedPlugins = withBootstrapPlugin(pluginSummaries
      .filter(p => assignedPluginIds.includes(p.id) && (ownerGlobalAccess || activeOwnerProducts.has(p.id)))
      .map(p => p.name));
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
      allowedProductIds: authorizationProductIds(allowedPlugins),
      authorizationExpiresAt: licenseAuthorizationLease(),
      protocolVersion: 2,
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
    if (requestedPluginNames.length > 0 && !isBootstrapRequest &&
        (!plugin?.name || !requestedPluginNames.includes(plugin.name.toLowerCase()))) {
      return res.status(200).json({ valid: false, ok: false,
        reason: 'Plugin solicitado nao autorizado para esta licenca.' });
    }
    const storedPurchaseHwid = normalizeHwid(purchase.hwid || '');
    if (!storedPurchaseHwid) {
      const bound = updatePurchaseTelemetry(purchase.id, {
        hwid: normalizedHwid,
        allowedIp: incomingIp,
        ip: incomingIp,
        port: normalizedServerPort,
        serverName: normalizedServerName,
        platform: normalizedPlatform,
        performance: normalizedPerformance
      });
      if (normalizeHwid(bound?.hwid || '') !== normalizedHwid) {
        return res.status(200).json({ valid: false, ok: false, reason: 'HWID nao autorizado.' });
      }
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
    const allowedPlugins = withBootstrapPlugin(plugin?.name ? [plugin.name] : []);
    console.log(`${auditPrefix} Validated via purchase license. purchase=${purchase.id} hwid=${normalizedHwid} ip=${incomingIp}`);
    return res.status(200).json({
      valid: true,
      ok: true,
      reason: 'Licenca legada validada!',
      licenseOwner: owner?.name || 'Cliente',
      plan: owner?.plan || 'Free',
      allowedPlugins,
      allowedProductIds: authorizationProductIds(allowedPlugins),
      authorizationExpiresAt: licenseAuthorizationLease(),
      protocolVersion: 2,
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
    .filter((p) => p.featured)
    .slice(0, 6);
  res.json({ items: featured.map(({ jarUrl, ...publicPlugin }) => publicPlugin) });
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

  const { jarUrl, ...publicDetail } = detail;
  res.json(publicDetail);
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
    items: paged.map(({ jarUrl, ...publicPlugin }) => publicPlugin),
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

  if (!name || !email || !email.includes('@') || password.length < 8) {
    res.status(400).json({ error: 'nome, email válido e senha de pelo menos 8 caracteres são obrigatórios' });
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
    ...(process.env.NODE_ENV === 'development' ? { devVerificationUrl: verifyUrl } : {})
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
    const token = createPasswordResetToken(user.id);
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
  if (!token || password.length < 8) {
    res.status(400).json({ error: 'token e senha de pelo menos 8 caracteres são obrigatórios' });
    return;
  }
  
  const user = consumePasswordResetToken(token);
  if (!user) {
    res.status(400).json({ error: 'token inválido ou expirado' });
    return;
  }
  updateUserPassword(user.id, password);
  revokeUserSessions(user.id);
  
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
  res.json({ ok: true, ...(process.env.NODE_ENV === 'development' ? { devVerificationUrl: verifyUrl } : {}) });
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

app.get('/api/users/me/plugins/:id/releases', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'não autorizado' });
  const pluginId = Number(req.params.id);
  if (!Number.isSafeInteger(pluginId) || !userOwnsPlugin(ctx.userId, pluginId)) {
    return res.status(403).json({ error: 'licença ativa necessária' });
  }
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ items: listPluginReleases(pluginId).map(publicRelease) });
});

app.get('/api/users/me/releases/:id/download', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'não autorizado' });
  const release = findPluginRelease(req.params.id);
  if (!release || !release.published) return res.status(404).json({ error: 'versão não encontrada' });
  if (!userOwnsPlugin(ctx.userId, release.pluginId)) {
    return res.status(403).json({ error: 'licença ativa necessária' });
  }
  const filePath = path.join(privateReleasesDir, release.fileName);
  if (!fs.existsSync(filePath)) return res.status(503).json({ error: 'arquivo temporariamente indisponível' });
  res.setHeader('Cache-Control', 'private, no-store');
  res.download(filePath, release.originalName);
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
    twoFactorEnabled: false,
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
  if (user.passwordHash) {
    if (typeof currentPassword !== 'string' || !verifyPassword(currentPassword, user.passwordHash)) {
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
  const body = req.body ?? {};
  const allowed = ['bio', 'discordId', 'githubUrl', 'twitterUrl'];
  if (Object.keys(body).some(key => !allowed.includes(key)) ||
      allowed.some(key => body[key] !== undefined && body[key] !== null && (typeof body[key] !== 'string' || body[key].length > 500))) {
    return res.status(400).json({ error: 'campos de perfil inválidos' });
  }
  const user = updateUserProfile(ctx.userId, body);
  res.json(user ? safeUser(user) : null);
});

app.get('/api/users/me/notifications', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  res.setHeader('Cache-Control', 'private, no-store');
  res.json(listUserNotifications(getAuthContext(req)!.userId));
});

app.get('/api/users/me/payments', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const ctx = getAuthContext(req)!;
  const orders = listOrdersForUser(ctx.userId);
  const productNames = new Map(pluginSummaries.map(plugin => [plugin.id, plugin.name]));
  res.json(orders.map(o => ({
    id: o.id,
    dateISO: o.createdISO,
    amountCents: o.totalCents,
    status: o.status,
    method: o.paymentProvider,
    paymentId: o.paymentId,
    pluginName: o.pluginIds.map(id => productNames.get(id) || `Produto ${id}`).join(', ')
  })));
});

app.get('/api/plugins/:id/config', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const id = Number(req.params.id);
  const ctx = getAuthContext(req)!;
  const purchase = listAllPurchases().find(p => p.userId === ctx.userId && p.pluginId === id && p.status === 'approved');
  if (!purchase) return res.status(404).json({ error: 'licença não encontrada' });
  
  res.json({
    jarUrl: null,
    version: getPluginDetail(id)?.version || 'Versão indisponível',
    pluginId: id,
    hwid: purchase.hwid || '',
    allowedIp: purchase.allowedIp || ''
  });
});

// Changes to license status and keys must never be accepted from customer input.
app.patch('/api/plugins/:id/config', (_req, res) => {
  res.status(403).json({ error: 'Alteracao de licencas pelo cliente nao permitida.' });
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
  const rawIp = req.body?.allowedIp;
  if (rawIp !== null && rawIp !== undefined && typeof rawIp !== 'string') {
    return res.status(400).json({ error: 'Informe um IP válido ou deixe o campo vazio.' });
  }
  const ip = typeof rawIp === 'string' ? rawIp.trim() : '';
  if (ip && !net.isIP(ip)) {
    return res.status(400).json({ error: 'Informe um endereço IPv4 ou IPv6 válido.' });
  }
  updateUserAllowedIp(ctx.userId, ip || null);
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

// Server management routes are defined once below with authorization checks.
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

// Disabled: legacy self-service endpoint previously approved a purchase with no payment.
// All commercial grants must originate from reconciliation or explicit audited admin action.
app.post('/api/purchases', (_req, res) => {
  res.status(410).json({ error: 'Compra direta desativada. Utilize o checkout Mercado Pago.' });
});

app.post('/api/commerce/coupon/validate', (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  const totalCents = typeof req.body?.totalCents === 'number' ? req.body.totalCents : 0;
  
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

app.post('/api/admin/users/:id/notifications', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'usuário não encontrado' });
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!title || title.length > 255 || !message || message.length > 4000) {
    return res.status(400).json({ error: 'título ou mensagem inválidos' });
  }
  const item = createUserNotification(user.id, title, message);
  auditAdmin(req, 'notification.send', 'user', user.id, { notificationId: item.id });
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
  const pluginIds: number[] = Array.isArray(req.body?.pluginIds) ? req.body.pluginIds.map(Number) : [];
  const planId = typeof req.body?.planId === 'string' ? req.body.planId : null;
  const couponCode = typeof req.body?.couponCode === 'string' ? req.body.couponCode : null;
  // Subscriptions need a durable fulfillment ledger before they can be sold.
  if (planId) {
    res.status(503).json({ error: 'Assinaturas temporariamente indisponiveis ate homologacao financeira.' });
    return;
  }
  if (pluginIds.length === 0 || pluginIds.length > 30 ||
      pluginIds.some(id => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(pluginIds).size !== pluginIds.length ||
      pluginIds.some(id => !getPluginDetail(id) || Number(getPluginDetail(id)?.priceCents) <= 0)) {
    res.status(400).json({ error: 'Itens do pedido invalidos ou indisponiveis.' });
    return;
  }
  
  if (pluginIds.length === 0 && !planId) {
    res.status(400).json({ error: 'nenhum item selecionado' });
    return;
  }

  if (ctx.token === auth.demoToken) {
    res.status(403).json({ error: 'Conta de demonstracao nao pode comprar.' });
    return;
  }
  const user = findUserById(ctx.userId);
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
    if (!coupon || !coupon.active ||
        (coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) ||
        (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) ||
        (coupon.minPurchase != null && totalCents < coupon.minPurchase)) {
      res.status(400).json({ error: 'Cupom inválido ou indisponível. Revise o pedido antes de pagar.' });
      return;
    }
    {
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

  // The Mercado Pago preference and persisted amount must match exactly.
  if (!items.length || items.some(item => !Number.isFinite(item.unit_price) || item.unit_price <= 0)) {
    res.status(400).json({ error: 'Pedido de valor zero nao autorizado pelo checkout comercial.' });
    return;
  }
  totalCents = items.reduce((sum, item) => sum + Math.round(item.unit_price * 100), 0);
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    res.status(400).json({ error: 'Total invalido.' });
    return;
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
    
    if (validItems.length !== items.length ||
        validItems.reduce((sum, item) => sum + Math.round(item.unit_price * 100), 0) !== totalCents) {
      res.status(400).json({ error: 'Valor do pagamento inconsistente. Pedido nao enviado.' });
      return;
    }

    // Never construct payment return URLs from untrusted Origin/Referer headers.
    const siteUrl = process.env.PUBLIC_SITE_URL || 'https://starfinplugins.com.br';
    const parsedSiteUrl = new URL(siteUrl);
    const origin = parsedSiteUrl.origin;
    if (parsedSiteUrl.protocol !== 'https:' &&
        !(process.env.NODE_ENV === 'development' && parsedSiteUrl.hostname === 'localhost')) {
      throw new Error('PUBLIC_SITE_URL deve ser HTTPS');
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
  // Webhook contents are only a hint. Always retrieve the payment from MP.
  const type = String(req.body?.type || req.query?.type || '').toLowerCase();
  const paymentId = String(req.body?.data?.id ?? req.query?.['data.id'] ?? '');
  if (type !== 'payment' || !/^\d{1,32}$/.test(paymentId)) {
    res.sendStatus(200);
    return;
  }

  const secret = process.env.MP_WEBHOOK_SECRET || '';
  if (!secret) {
    res.status(503).json({ error: 'Assinatura de webhook nao configurada' });
    return;
  }
  const signedDataId = String(req.query?.['data.id'] || '');
  if (signedDataId !== paymentId || !verifyMercadoPagoWebhook(
    req.get('x-signature'), req.get('x-request-id'), signedDataId, secret
  )) {
    res.status(401).json({ error: 'Assinatura do webhook invalida' });
    return;
  }

  try {
    const { accessToken } = getMpCredentials();
    if (!accessToken) {
      res.status(503).json({ error: 'Gateway nao configurado' });
      return;
    }
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000)
      }
    );
    if (!paymentResponse.ok) {
      res.status(503).json({ error: 'Consulta ao provedor falhou' });
      return;
    }
    const payment = await paymentResponse.json() as VerifiedPayment;
    const orderId = String(payment.external_reference || '');
    const order = orderId ? findOrderById(orderId) : null;
    if (!order) {
      res.sendStatus(200);
      return;
    }
    const reconciliation = reconcilePayment(order, payment, paymentId);
    if (!reconciliation.ok) {
      console.warn('[MercadoPago] Conciliacao recusada', {
        orderId, reason: reconciliation.reason
      });
      res.status(409).json({ error: 'Dados de pagamento divergentes' });
      return;
    }
    if (reconciliation.state === 'pending') {
      res.sendStatus(200);
      return;
    }
    if (reconciliation.state === 'reversed') {
      const reversalStatus = payment.status === 'charged_back' ? 'charged_back'
        : payment.status === 'refunded' ? 'refunded'
        : payment.status === 'rejected' ? 'rejected' : 'cancelled';
      const reversed = reverseVerifiedOrder(orderId, paymentId, reversalStatus);
      if (reversed) {
        revokeOrderPlugins(orderId, order.pluginIds);
        addNotification('Pagamento revertido', `Pedido ${orderId}: ${reversalStatus}`, {
          type: 'sale',
          priority: 'high',
          source: 'mercadopago_webhook',
          metadata: { orderId, paymentId, status: reversalStatus }
        });
      }
      res.sendStatus(200);
      return;
    }
    if (order.planId) {
      // Legacy plan orders must not be fulfilled through an untracked privilege update.
      res.status(409).json({ error: 'Pedido de assinatura requer conciliacao manual' });
      return;
    }
    if (order.status === 'completed' && order.paymentId === paymentId) {
      res.sendStatus(200);
      return;
    }
    if (!claimVerifiedOrder(orderId, paymentId)) {
      res.status(409).json({ error: 'Pedido nao pode ser confirmado neste estado' });
      return;
    }
    // Deterministic purchase IDs permit safe retry after a partial grant.
    for (const pluginId of order.pluginIds) {
      grantOrderPluginOnce(orderId, order.userId, pluginId);
    }
    const complete = completeVerifiedOrder(orderId, paymentId);
    if (!complete) {
      const latest = findOrderById(orderId);
      // Refund/reversal may race a delayed successful webhook. Never leave
      // an active purchase linked to a reversed order.
      if (latest && ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(latest.status)) {
        revokeOrderPlugins(orderId, order.pluginIds);
        res.sendStatus(200);
        return;
      }
      // A concurrent repeated notification already finished fulfillment.
      if (latest?.status === 'completed' && latest.paymentId === paymentId) {
        res.sendStatus(200);
        return;
      }
      throw new Error('Nao foi possivel finalizar a conciliacao');
    }
    addNotification('Venda aprovada', `Pedido ${orderId} aprovado no Mercado Pago.`, {
      type: 'sale',
      priority: 'high',
      source: 'mercadopago_webhook',
      metadata: { orderId, paymentId, status: 'approved' }
    });
    res.sendStatus(200);
  } catch (error) {
    console.error('[MercadoPago] Falha na conciliacao:', error instanceof Error ? error.message : 'error');
    res.status(503).json({ error: 'Falha temporaria de conciliacao' });
  }
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
    faviconUrl: s.faviconUrl,
    siteDescription: s.siteDescription,
    footerText: s.footerText,
    discordUrl: s.discordUrl,
    supportEmail: s.supportEmail,
    homeStatsPlugins: s.homeStatsPlugins,
    homeStatsServers: s.homeStatsServers,
    homeStatsRating: s.homeStatsRating,
    homeStatsSupport: s.homeStatsSupport,
    homeContent: s.homeContent,
    institutionalContent: s.institutionalContent,
    faqItems: s.faqItems,
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
app.get('/api/admin/plugins/:id/releases', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const pluginId = Number(req.params.id);
  if (!Number.isSafeInteger(pluginId) || !getPluginDetail(pluginId)) return res.status(404).json({ error: 'produto não encontrado' });
  res.json({ items: listPluginReleases(pluginId, true).map(publicRelease) });
});

app.post('/api/admin/plugins/:id/releases', (req, res, next) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  releaseUpload.single('file')(req, res, next);
}, (req, res) => {
  const pluginId = Number(req.params.id);
  if (!Number.isSafeInteger(pluginId) || !getPluginDetail(pluginId)) return res.status(404).json({ error: 'produto não encontrado' });
  const version = typeof req.body?.version === 'string' ? req.body.version.trim() : '';
  const mcVersion = typeof req.body?.mcVersion === 'string' ? req.body.mcVersion.trim() : '';
  const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
  const file = req.file;
  if (!/^[0-9A-Za-z][0-9A-Za-z.+_-]{0,63}$/.test(version) || !/^[0-9A-Za-z.,+ _-]{1,64}$/.test(mcVersion) || notes.length > 4000 ||
      !file || !/\.jar$/i.test(file.originalname) || file.originalname.length > 180 ||
      file.buffer.length < 22 || file.buffer.subarray(0, 4).toString('hex') !== '504b0304' ||
      file.buffer.lastIndexOf(Buffer.from('504b0506', 'hex')) < file.buffer.length - 65_557) {
    return res.status(400).json({ error: 'Versão, Minecraft ou arquivo JAR inválido (máximo 50 MB).' });
  }
  if (listPluginReleases(pluginId, true).some(item => item.version === version)) {
    return res.status(409).json({ error: 'versão já cadastrada' });
  }
  const id = `rel_${randomUUID()}`;
  const fileName = `${id}.jar`;
  const filePath = path.join(privateReleasesDir, fileName);
  try {
    fs.mkdirSync(privateReleasesDir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(filePath, file.buffer, { flag: 'wx', mode: 0o600 });
    const item = createPluginRelease({
      id, pluginId, version, mcVersion, notes: notes || null, fileName,
      originalName: path.basename(file.originalname).replace(/[^0-9A-Za-z._-]/g, '_'),
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
      sizeBytes: file.buffer.length, published: false
    });
    auditAdmin(req, 'release.create', 'plugin_release', id, { pluginId, version, sha256: item.sha256 });
    res.status(201).json({ item: publicRelease(item) });
  } catch (error) {
    fs.rmSync(filePath, { force: true });
    console.error('release upload failed', error);
    res.status(500).json({ error: 'não foi possível gravar a versão' });
  }
});

app.patch('/api/admin/releases/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const release = findPluginRelease(req.params.id);
  if (!release) return res.status(404).json({ error: 'versão não encontrada' });
  if (typeof req.body?.published !== 'boolean') return res.status(400).json({ error: 'published deve ser booleano' });
  if (req.body.published && !fs.existsSync(path.join(privateReleasesDir, release.fileName))) {
    return res.status(503).json({ error: 'arquivo privado não encontrado' });
  }
  setPluginReleasePublished(release.id, req.body.published);
  const latestPublished = listPluginReleases(release.pluginId)[0];
  updatePlugin(release.pluginId, {
    version: latestPublished?.version ?? '',
    mcVersion: latestPublished?.mcVersion ?? getPluginDetail(release.pluginId)?.mcVersion ?? ''
  });
  auditAdmin(req, req.body.published ? 'release.publish' : 'release.unpublish', 'plugin_release', release.id);
  res.json({ item: publicRelease(findPluginRelease(release.id)) });
});

app.delete('/api/admin/releases/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const release = findPluginRelease(req.params.id);
  if (!release) return res.status(404).json({ error: 'versão não encontrada' });
  if (release.published) return res.status(409).json({ error: 'retire a publicação antes de excluir' });
  deletePluginRelease(release.id);
  fs.rmSync(path.join(privateReleasesDir, release.fileName), { force: true });
  auditAdmin(req, 'release.delete', 'plugin_release', release.id, { pluginId: release.pluginId, version: release.version });
  res.json({ ok: true });
});

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
  const priceDisplay = String(body.priceDisplay).trim();
  if (!/^(?:R\$\s*)?\d{1,6}(?:\.\d{3})*(?:,\d{2})?$/.test(priceDisplay) ||
      Number(priceDisplay.replace('R$', '').replaceAll('.', '').replace(',', '.').trim()) <= 0) {
    res.status(400).json({ error: 'preço inválido; use, por exemplo, R$ 29,90' });
    return;
  }
  if (body.licenseName && !/^[a-z0-9_]{2,64}$/.test(String(body.licenseName))) {
    res.status(400).json({ error: 'ID de licença inválido' });
    return;
  }
  if (body.licenseName && pluginSummaries.some(plugin => plugin.licenseName === body.licenseName)) {
    res.status(409).json({ error: 'ID de licença já utilizado' });
    return;
  }
  const detail = createPlugin({
    name: String(body.name),
    description: String(body.description),
    category: String(body.category) as any,
    licenseName: body.licenseName ? String(body.licenseName) : undefined,
    tags: Array.isArray(body.tags) ? (body.tags as any) : [],
    mcVersion: String(body.mcVersion),
    imageUrl: String(body.imageUrl),
    priceDisplay,
    featured: body.featured === true,
    platform: typeof body.platform === 'string' ? body.platform : undefined,
    dependencies: Array.isArray(body.dependencies) ? body.dependencies.map(String) : undefined,
    rating: 0,
    downloadsDisplay: '0'
  });
  auditAdmin(req, 'plugin.create', 'plugin', String(detail.id));

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
  const body = req.body ?? {};
  const writable = ['name', 'description', 'category', 'licenseName', 'tags', 'mcVersion', 'imageUrl', 'priceDisplay', 'tagline', 'author', 'screenshots', 'features', 'docsSections', 'dependencies', 'platform', 'featured'];
  if (Object.keys(body).some(key => !writable.includes(key))) {
    res.status(400).json({ error: 'campo de produto não editável nesta operação' });
    return;
  }
  if (body.licenseName !== undefined && body.licenseName !== null && body.licenseName !== '' &&
      !/^[a-z0-9_]{2,64}$/.test(String(body.licenseName))) {
    res.status(400).json({ error: 'ID de licença inválido' });
    return;
  }
  if (body.licenseName && pluginSummaries.some(plugin => plugin.id !== id && plugin.licenseName === body.licenseName)) {
    res.status(409).json({ error: 'ID de licença já utilizado' });
    return;
  }
  if (body.priceDisplay !== undefined &&
      (!/^(?:R\$\s*)?\d{1,6}(?:\.\d{3})*(?:,\d{2})?$/.test(String(body.priceDisplay).trim()) ||
       Number(String(body.priceDisplay).replace('R$', '').replaceAll('.', '').replace(',', '.').trim()) <= 0)) {
    res.status(400).json({ error: 'preço inválido; use, por exemplo, R$ 29,90' });
    return;
  }
  const next = updatePlugin(id, body);
  if (!next) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }
  auditAdmin(req, 'plugin.update', 'plugin', String(id), { fields: Object.keys(body) });
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
  if (listPluginReleases(id, true).length > 0) {
    return res.status(409).json({ error: 'retire e exclua as versões antes de remover o produto' });
  }
  if (listAllPurchases().some(purchase => purchase.pluginId === id)) {
    return res.status(409).json({ error: 'produto com histórico de licenças não pode ser excluído' });
  }
  const ok = deletePlugin(id);
  if (!ok) {
    res.status(404).json({ error: 'plugin não encontrado' });
    return;
  }
  auditAdmin(req, 'plugin.delete', 'plugin', String(id));
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
  const settings = getAdminSettings();
  res.json({ ...settings, mercadopagoAccessToken: '', mercadopagoTokenConfigured: Boolean(settings.mercadopagoAccessToken || process.env.MP_ACCESS_TOKEN) });
});

app.post('/api/admin/settings', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const body = { ...(req.body ?? {}) };
  const currentSettings = getAdminSettings();
  for (const key of ['logoUrl', 'faviconUrl'] as const) {
    if (body[key] !== undefined && body[key] !== '' && body[key] !== currentSettings[key] &&
        (typeof body[key] !== 'string' || !/^\/uploads\/[a-f0-9-]+\.(?:png|jpg|webp|gif)$/.test(body[key]))) {
      return res.status(400).json({ error: `${key} deve ser uma imagem da biblioteca de mídia` });
    }
  }
  for (const [key, max] of [['siteName', 80], ['siteDescription', 300], ['footerText', 200]] as const) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > max || (key === 'siteName' && !body[key].trim()))) {
      return res.status(400).json({ error: `${key} inválido` });
    }
  }
  if (body.homeContent !== undefined) {
    const fields = ['heroEyebrow', 'heroTitle', 'heroAccent', 'heroDescription', 'accountTitle', 'accountDescription'];
    const images = ['heroImageUrl', 'accountImageUrl', 'projectImageUrl'];
    const labels = ['heroPrimaryLabel', 'heroSecondaryLabel'];
    const links = ['heroPrimaryHref', 'heroSecondaryHref'];
    if (!body.homeContent || typeof body.homeContent !== 'object' || Array.isArray(body.homeContent) ||
        Object.keys(body.homeContent).some(key => ![...fields, ...images, ...labels, ...links, 'accountEyebrow'].includes(key)) ||
        fields.some(key => typeof body.homeContent[key] !== 'string' || !body.homeContent[key].trim() || body.homeContent[key].length > (key.endsWith('Description') ? 400 : 100)) ||
        images.some(key => body.homeContent[key] !== undefined && body.homeContent[key] !== '' && (typeof body.homeContent[key] !== 'string' || !/^\/uploads\/[a-f0-9-]+\.(?:png|jpg|webp|gif)$/.test(body.homeContent[key]))) ||
        labels.some(key => body.homeContent[key] !== undefined && (typeof body.homeContent[key] !== 'string' || body.homeContent[key].length > 60)) ||
        links.some(key => body.homeContent[key] !== undefined && (typeof body.homeContent[key] !== 'string' || !/^\/(?:[a-z0-9/-]*)$/.test(body.homeContent[key])))) {
      return res.status(400).json({ error: 'conteúdo da homepage inválido' });
    }
    body.homeContent = Object.fromEntries([...fields, ...images, ...labels, ...links].filter(key => body.homeContent[key] !== undefined).map(key => [key, body.homeContent[key].trim()]));
  }
  if (body.institutionalContent !== undefined) {
    const fields = ['aboutTitle', 'aboutDescription', 'aboutMissionTitle', 'aboutMissionDescription', 'aboutMissionSecondary', 'contactTitle', 'contactDescription', 'faqTitle', 'faqDescription'];
    if (!body.institutionalContent || typeof body.institutionalContent !== 'object' || Array.isArray(body.institutionalContent) ||
        Object.keys(body.institutionalContent).some(key => !fields.includes(key)) ||
        fields.some(key => typeof body.institutionalContent[key] !== 'string' || !body.institutionalContent[key].trim() || body.institutionalContent[key].length > (key.endsWith('Title') ? 100 : 500))) {
      return res.status(400).json({ error: 'conteúdo institucional inválido' });
    }
    body.institutionalContent = Object.fromEntries(fields.map(key => [key, body.institutionalContent[key].trim()]));
  }
  if (body.faqItems !== undefined) {
    if (!Array.isArray(body.faqItems) || body.faqItems.length > 30 || body.faqItems.some((item: unknown) => !item || typeof item !== 'object' ||
      Object.keys(item).some(key => !['id', 'category', 'question', 'answer'].includes(key)) ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test((item as any).id) ||
      ['category', 'question', 'answer'].some(key => typeof (item as any)[key] !== 'string' || !(item as any)[key].trim() || (item as any)[key].length > (key === 'answer' ? 1000 : 200))) ||
      new Set(body.faqItems.map((item: any) => item.id)).size !== body.faqItems.length) {
      return res.status(400).json({ error: 'perguntas frequentes inválidas' });
    }
    body.faqItems = body.faqItems.map((item: any) => ({ id: item.id, category: item.category.trim(), question: item.question.trim(), answer: item.answer.trim() }));
  }
  // An empty or masked field leaves the stored credential untouched.
  if (typeof body.mercadopagoAccessToken !== 'string' ||
      !body.mercadopagoAccessToken.trim() || body.mercadopagoAccessToken === '********') {
    delete body.mercadopagoAccessToken;
  }
  const next = saveAdminSettings(body);
  res.json({ success: true, settings: { ...next, mercadopagoAccessToken: '', mercadopagoTokenConfigured: Boolean(next.mercadopagoAccessToken || process.env.MP_ACCESS_TOKEN) } });
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

app.post('/api/users/me/notifications/read-all', (req, res) => {
  if (!hasValidAuthHeader(req)) {
    res.status(401).json({ error: 'não autorizado' });
    return;
  }
  const count = readAllUserNotifications(getAuthContext(req)!.userId);
  res.json({ success: true, count });
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

  const totalRevenueCents = approvedOrderRevenue;

  const salesByPlugin = new Map<number, number>();
  for (const purchase of allPurchases) {
    if (normalizeStatus(purchase.status) !== 'approved' || purchase.grantSource === 'admin_grant') continue;
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
        sales
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

  const pluginsWithSales = new Set(allPurchases.filter((p) => normalizeStatus(p.status) === 'approved' && p.grantSource !== 'admin_grant').map((p) => p.pluginId)).size;

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

app.get('/api/admin/audit', (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'admin token requerido' });
  const limit = Number(req.query.limit) || 100;
  res.json({ items: listAdminAudit(limit) });
});

app.get('/api/admin/users', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: listAllUsers().map(safeAdminUser) });
});

app.post('/api/admin/users', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const user = createUserAdmin(req.body ?? {});
  if (!user) return res.status(400).json({ error: 'Não foi possível criar o usuário. Confira os dados e o e-mail.' });
  auditAdmin(req, 'user.create', 'user', user.id);
  res.status(201).json(safeAdminUser(user));
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
  res.json(safeAdminUser(user));
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
  auditAdmin(req, 'license.global_hwid_reset', 'user', user.id);
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
    licenseKey: purchase.licenseKey ? `••••${String(purchase.licenseKey).slice(-4)}` : null,
    grantSource: purchase.grantSource || 'payment',
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

  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (reason.length < 10 || reason.length > 500) {
    res.status(400).json({ error: 'Informe uma justificativa de 10 a 500 caracteres para a concessão manual.' });
    return;
  }
  const basePurchase = createPurchase(user.id, pluginId, 'admin_grant');
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

  auditAdmin(req, 'license.manual_grant', 'purchase', approved.id, { userId: user.id, pluginId, reason });

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
    (p) => p.userId === user.id && Number(p.pluginId) === pluginId && p.status === 'approved' && p.grantSource === 'admin_grant'
  );
  if (approvedPurchases.length === 0) {
    res.status(409).json({ error: 'Não há concessão manual ativa para revogar. Compras pagas exigem conciliação financeira.' });
    return;
  }

  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (reason.length < 10 || reason.length > 500) {
    res.status(400).json({ error: 'Informe uma justificativa de 10 a 500 caracteres para a revogação.' });
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

  auditAdmin(req, 'license.manual_revoke', 'user', user.id, { pluginId, revokedCount, reason });

  res.json({ ok: true, revokedCount });
});

app.put('/api/admin/users/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const body = req.body ?? {};
  const allowed = ['name', 'email', 'plan', 'planExpiresAt', 'planDurationDays', 'role', 'phone', 'banned', 'permissions', 'avatarUrl', 'bio', 'discordId', 'githubUrl', 'twitterUrl'];
  const changes = Object.fromEntries(allowed.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
  if (req.params.id === getAuthContext(req)?.userId && (changes.banned === true || (changes.role && changes.role !== 'admin'))) {
    return res.status(400).json({ error: 'Não é possível suspender ou rebaixar a própria conta administrativa.' });
  }
  const next = updateUserAdmin(req.params.id, changes);
  if (!next) {
    res.status(404).json({ error: 'usuário não encontrado' });
    return;
  }
  auditAdmin(req, 'user.update', 'user', req.params.id, { fields: Object.keys(changes) });
  res.json(safeAdminUser(next));
});

app.delete('/api/admin/users/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.status(409).json({ error: 'Exclusão definitiva desabilitada para preservar pedidos e histórico. Suspenda a conta na edição do usuário.' });
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

  const html = EMAIL_LAYOUT(body);
  let delivered = 0;
  let failed = 0;
  for (const to of subscribers) {
    try {
      const result = await sendEmail({ to, subject, html });
      if (result.delivered) delivered += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  auditAdmin(req, 'newsletter.send', 'newsletter', 'campaign', { delivered, failed });
  res.json({ ok: failed === 0, delivered, failed });
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
  auditAdmin(req, 'integration.update', 'integration', 'public_urls', { fields: Object.keys(body) });
  res.json({ ok: true });
});

app.get('/api/admin/purchases', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  res.json({ items: listAllPurchases().map(purchase => ({
    ...purchase,
    licenseKey: purchase.licenseKey ? `••••${purchase.licenseKey.slice(-4)}` : null
  })) });
});

app.get('/api/admin/orders', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const customers = new Map(listAllUsers().map(user => [user.id, user]));
  const productNames = new Map(pluginSummaries.map(plugin => [plugin.id, plugin.name]));
  res.json({ items: listAllOrders().map(order => {
    const customer = customers.get(order.userId);
    return {
      id: order.id,
      customerName: customer?.name || 'Usuário indisponível',
      customerEmail: customer?.email || null,
      pluginNames: order.pluginIds.map(id => productNames.get(id) || `Produto ${id}`),
      planId: order.planId,
      totalCents: order.totalCents,
      status: order.status,
      paymentProvider: order.paymentProvider,
      paymentId: order.paymentId,
      createdISO: order.createdISO,
      updatedISO: order.updatedISO
    };
  }) });
});

app.put('/api/admin/purchases/:id', async (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const body = req.body ?? {};
  if (Object.keys(body).some(key => !['allowedIp', 'resetHwid'].includes(key)) ||
      (body.allowedIp !== undefined && body.allowedIp !== null && typeof body.allowedIp !== 'string') ||
      (body.resetHwid !== undefined && typeof body.resetHwid !== 'boolean')) {
    res.status(400).json({ error: 'Somente IP autorizado e reset de HWID podem ser alterados aqui.' });
    return;
  }
  if (typeof body.allowedIp === 'string' && body.allowedIp.trim() && !net.isIP(body.allowedIp.trim())) {
    return res.status(400).json({ error: 'Informe um endereço IPv4 ou IPv6 válido.' });
  }
  if (typeof body.allowedIp === 'string') body.allowedIp = body.allowedIp.trim() || null;
  
  const purchase = updatePurchaseAdmin(id, body);
  if (!purchase) {
    res.status(404).json({ error: 'compra não encontrada' });
    return;
  }

  if (body.allowedIp !== undefined || body.resetHwid) {
    addNotification('Instalação de licença atualizada',
      `Vínculo da licença ${purchase.id} atualizado por um administrador.`, {
        type: 'sale', priority: 'high', source: 'admin_license_installation_update',
        metadata: { purchaseId: purchase.id, userId: purchase.userId, resetHwid: body.resetHwid === true }
      });
  }
  auditAdmin(req, 'license.installation_update', 'purchase', purchase.id, {
    allowedIpChanged: body.allowedIp !== undefined, resetHwid: body.resetHwid === true
  });
  res.json({ ok: true, purchase: { ...purchase, licenseKey: purchase.licenseKey ? `••••${purchase.licenseKey.slice(-4)}` : null } });
});

app.put('/api/admin/status/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const id = req.params.id;
  const status = req.body?.status;
  const message = req.body?.message;
  if (!['unknown', 'operational', 'degraded', 'down'].includes(status) ||
      typeof message !== 'string' || !message.trim() || message.length > 500) {
    return res.status(400).json({ error: 'Informe status e mensagem válidos.' });
  }
  const item = updateStatusComponent(id, status, message.trim());
  if (!item) return res.status(404).json({ error: 'componente não encontrado' });
  res.json({ ok: true, item });
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
  const item = createChangelogEntry({ version, title, body });
  auditAdmin(req, 'changelog.create', 'changelog', item.id);
  res.status(201).json(item);
});

app.put('/api/admin/changelog/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  const current = changelog.find(entry => entry.id === req.params.id);
  if (!current) return res.status(404).json({ error: 'changelog não encontrado' });
  const version = typeof req.body?.version === 'string' ? req.body.version.trim() : current.version;
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : current.title;
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : current.body;
  if (!version || !title || !body) return res.status(400).json({ error: 'version, title e body são obrigatórios' });
  const item = updateChangelogEntry(req.params.id, { version, title, body });
  if (!item) return res.status(404).json({ error: 'changelog não encontrado' });
  auditAdmin(req, 'changelog.update', 'changelog', item.id);
  res.json({ ok: true, item });
});

app.delete('/api/admin/changelog/:id', (req, res) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: 'admin token requerido' });
    return;
  }
  if (!deleteChangelogEntry(req.params.id)) return res.status(404).json({ error: 'changelog não encontrado' });
  auditAdmin(req, 'changelog.delete', 'changelog', req.params.id);
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

const newsletterTimer = setInterval(() => {
  maybeSendNewsletterAuto().catch(() => null);
}, 60 * 60 * 1000);
newsletterTimer.unref();

const isProdRuntime = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_PROJECT_ID);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Imagem acima do limite de 5 MB.' : 'Upload inválido.' });
  }
  if (err instanceof Error && err.message === 'Formato de arquivo não suportado. Use PNG, JPG, WEBP ou GIF.') {
    return res.status(415).json({ error: err.message });
  }
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
  const htmlTemplate = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
  const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  app.get('/index.html', (_req, res) => res.redirect(302, '/'));
  app.use(express.static(distPath, { index: false }));
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    const settings = getAdminSettings();
    const siteName = typeof settings.siteName === 'string' && settings.siteName.trim() ? settings.siteName.trim().slice(0, 80) : 'StarfinPlugins';
    const managedImage = (value: unknown) => typeof value === 'string' && /^\/uploads\/[a-f0-9-]+\.(?:png|jpg|webp|gif)$/.test(value) ? value : '';
    const publicConfig = {
      siteName,
      logoUrl: managedImage(settings.logoUrl),
      faviconUrl: managedImage(settings.faviconUrl),
      footerText: typeof settings.footerText === 'string' ? settings.footerText.slice(0, 200) : '',
      homeContent: settings.homeContent,
      institutionalContent: settings.institutionalContent,
      faqItems: settings.faqItems,
      aboutTeam: settings.aboutTeam,
      careersJobs: settings.careersJobs.filter(job => job.enabled)
    };
    const faviconType = publicConfig.faviconUrl.endsWith('.png') ? 'image/png' : publicConfig.faviconUrl.endsWith('.jpg') ? 'image/jpeg' : publicConfig.faviconUrl.endsWith('.webp') ? 'image/webp' : publicConfig.faviconUrl.endsWith('.gif') ? 'image/gif' : 'image/svg+xml';
    const description = typeof settings.siteDescription === 'string' && settings.siteDescription.trim() ? settings.siteDescription.trim().slice(0, 300) : 'Plugins e ferramentas para servidores Minecraft.';
    const html = htmlTemplate
      .replace('StarfinPlugins — plugins para servidores Minecraft', escapeHtml(`${siteName} — plugins para servidores Minecraft`))
      .replace('Plugins e ferramentas para servidores Minecraft. Conheça os produtos StarfinPlugins e gerencie suas licenças.', escapeHtml(description))
      .replace('type="image/svg+xml" href="/favicon.svg"', `type="${faviconType}" href="${escapeHtml(publicConfig.faviconUrl || '/favicon.svg')}"`)
      .replace('__STARFIN_PUBLIC_CONFIG__', JSON.stringify(publicConfig).replaceAll('<', '\\u003c'));
    res.setHeader('Cache-Control', 'no-store');
    res.type('html').send(html);
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
      const server = app.listen(port, process.env.HOST || '127.0.0.1', () => resolve());
      server.once('error', reject);
    });
    console.log(`Server rodando na porta ${port}`);
    process.stdout.write(`StarfinPlugins API rodando em http://${process.env.HOST || '127.0.0.1'}:${port} (${isProdRuntime ? 'prod' : 'dev'})\n`);
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { app };
