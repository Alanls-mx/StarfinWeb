import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

import { handleLogin, handleRegister, handleLogout, handleForgotPassword, handleResetPassword } from "./routes/auth";
import { getAllPlugins, getPluginById, createPlugin, updatePlugin, deletePlugin, getPluginReleases, uploadPluginRelease, deletePluginRelease, downloadPluginJar, getCategoriesHandler, createCategoryHandler, deleteCategoryHandler, getLogsHandler, getPluginImage } from "./routes/products";
import { getOrders, createOrder, getOrderById, updateOrder, deleteOrderHandler, reassignOrderHandler, regenerateLicenseHandler, startMercadoPagoCheckout, mercadoPagoWebhook } from "./routes/orders";
import { getUser, getCurrentUser, updateUser, updateCurrentUser, getUserPurchases, getAllUsers, deleteUserHandler } from "./routes/users";
import { handleDemo } from "./routes/demo";
import { getMetricsHandler } from "./routes/metrics";
import { requireAuth, requireAdmin } from "./middleware/auth";
import { getSiteAssetPath, setSiteAsset, deleteSiteAsset, listSiteAssets, addSiteHighlight, listSiteHighlights, getSiteHighlightPath, deleteSiteHighlight, listLicensesForUser, validateLicense, revokeLicense, renewLicense, deleteLicense, assignLicense, findLicenseById, updateLicenseIp, updateLicenseProductIp, findLicenseByKey, getOfficialJarHashByPluginName, getOfficialJarHashesByPluginId, findPluginById, findPluginByName, getPlugins, getUserById, doesUserOwnPlugin, getOrdersForUser, getPaymentSettings, updatePaymentSettings } from "./store";
import crypto from "crypto";
const LOG_ENABLED = String(process.env.STARFIN_LOGS || "true").toLowerCase() === "true";
function log(type: string, data: any) {
  try {
    if (!LOG_ENABLED) return;
    const ts = new Date().toISOString();
  } catch {}
}

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.set("trust proxy", true);

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  app.use("/uploads", express.static(path.join(import.meta.dirname, "../uploads")));

  app.get("/api/demo", handleDemo);

  app.get("/api/banner", (_req, res) => {
    const siteBanner = getSiteAssetPath("banner");
    if (siteBanner && fs.existsSync(siteBanner)) return res.sendFile(siteBanner);
    const file = path.join(import.meta.dirname, "../starfinplugins.png");
    if (fs.existsSync(file)) return res.sendFile(file);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="682" viewBox="0 0 1024 682">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#29a3ff"/>
      <stop offset="100%" stop-color="#0784d1"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
      <feOffset dx="0" dy="3" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.4"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="682" fill="url(#g)"/>
  <text x="64" y="120" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="800" fill="#ffeb3b">NOVIDADES IMPERDÍVEIS!</text>
  <text x="64" y="210" font-family="Inter, Arial, sans-serif" font-size="80" font-weight="900" fill="#ffffff">TESTE MEUS</text>
  <text x="64" y="290" font-family="Inter, Arial, sans-serif" font-size="80" font-weight="900" fill="#ffffff">PLUGINS!</text>
  <text x="64" y="350" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500" fill="#eaf6ff">Experimente novos plugins incríveis para o seu servidor Minecraft!</text>
  <g filter="url(#shadow)">
    <rect x="64" y="400" rx="12" ry="12" width="180" height="64" fill="#f59e0b"/>
    <text x="92" y="442" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800" fill="#ffffff">VER MAIS</text>
  </g>
  <circle cx="900" cy="120" r="60" fill="#ffffff22" />
  <circle cx="860" cy="220" r="40" fill="#ffffff22" />
  <circle cx="960" cy="260" r="30" fill="#ffffff22" />
</svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(svg);
  });

  app.get("/api/assets", (_req, res) => {
    const list = listSiteAssets();
    return res.json({ success: true, assets: list });
  });
  app.get("/api/assets/:name", (req, res) => {
    const p = getSiteAssetPath(req.params.name);
    if (p && fs.existsSync(p)) return res.sendFile(p);
    return res.status(404).json({ success: false, message: "Asset not found" });
  });
  app.post("/api/assets/:name", requireAdmin, async (req, res) => {
    const name = req.params.name;
    const fileName = req.body?.fileName as string;
    const imageBase64 = req.body?.imageBase64 as string;
    if (!fileName || !imageBase64) {
      return res.status(400).json({ success: false, message: "Missing fileName or imageBase64" });
    }
    const r = setSiteAsset(name, fileName, imageBase64);
    if ("error" in r) return res.status(500).json({ success: false, message: r.error });
    return res.json({ success: true, path: r.path });
  });
  app.delete("/api/assets/:name", requireAdmin, (req, res) => {
    const ok = deleteSiteAsset(req.params.name);
    if (!ok) return res.status(404).json({ success: false, message: "Asset not found" });
    return res.json({ success: true });
  });

  app.get("/api/highlights", (_req, res) => {
    const items = listSiteHighlights().map((h) => ({ id: h.id, fileName: h.fileName, uploadedAt: h.uploadedAt }));
    return res.json({ success: true, items });
  });
  app.get("/api/highlights/:id", (req, res) => {
    const p = getSiteHighlightPath(req.params.id);
    if (p && fs.existsSync(p)) return res.sendFile(p);
    return res.status(404).json({ success: false, message: "Highlight not found" });
  });
  app.post("/api/highlights", requireAdmin, async (req, res) => {
    const fileName = req.body?.fileName as string;
    const imageBase64 = req.body?.imageBase64 as string;
    if (!fileName || !imageBase64) {
      return res.status(400).json({ success: false, message: "Missing fileName or imageBase64" });
    }
    const r = addSiteHighlight(fileName, imageBase64);
    if ("error" in r) return res.status(500).json({ success: false, message: r.error });
    return res.json({ success: true, item: { id: r.item.id, fileName: r.item.fileName, uploadedAt: r.item.uploadedAt } });
  });
  app.delete("/api/highlights/:id", requireAdmin, (req, res) => {
    const ok = deleteSiteHighlight(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: "Highlight not found" });
    return res.json({ success: true });
  });

  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/logout", handleLogout);
  app.post("/api/auth/forgot-password", handleForgotPassword);
  app.post("/api/auth/reset-password", handleResetPassword);

  app.get("/api/plugins", getAllPlugins);
  app.get("/api/plugins/:id", getPluginById);
  app.get("/api/plugins/:id/image", getPluginImage);
  app.post("/api/plugins", requireAdmin, createPlugin);
  app.put("/api/plugins/:id", requireAdmin, updatePlugin);
  app.delete("/api/plugins/:id", requireAdmin, deletePlugin);
  app.get("/api/plugins/:id/releases", getPluginReleases);
  app.post("/api/plugins/:id/releases", requireAdmin, uploadPluginRelease);
  app.delete("/api/plugins/:id/releases/:version", requireAdmin, deletePluginRelease);
  app.get("/api/plugins/:id/releases/:version/jar", requireAuth, downloadPluginJar);

  app.get("/api/orders", getOrders);
  app.post("/api/orders", requireAuth, createOrder);
  app.get("/api/orders/:id", getOrderById);
  app.put("/api/orders/:id", requireAdmin, updateOrder);
  app.delete("/api/orders/:id", requireAdmin, deleteOrderHandler);
  app.post("/api/orders/:id/reassign", requireAdmin, reassignOrderHandler);
  app.post("/api/orders/:id/regenerate-license", requireAdmin, regenerateLicenseHandler);

  app.get("/api/settings/payments", requireAdmin, (_req, res) => {
    const s = getPaymentSettings();
    return res.json({ success: true, settings: s });
  });
  app.put("/api/settings/payments", requireAdmin, (req, res) => {
    const mp = String((req.body || {}).mercadoPagoAccessToken || "").trim();
    const base = String((req.body || {}).publicBaseUrl || "").trim();
    const s = updatePaymentSettings({ mercadoPagoAccessToken: mp || undefined, publicBaseUrl: base || undefined });
    return res.json({ success: true, settings: s });
  });

  app.post("/api/payments/mercadopago/start", requireAuth, startMercadoPagoCheckout);
  app.post("/api/payments/mercadopago/webhook", mercadoPagoWebhook);
  app.get("/api/payments/mercadopago/webhook", mercadoPagoWebhook);

  app.get("/api/licenses", (req, res) => {
    const userId = (req.query.userId as string) || ((req as any).user?.id as string);
    const licenses = listLicensesForUser(userId);
    return res.json({ success: true, licenses });
  });
  app.post("/api/licenses/validate", (req, res) => {
    const { key, licenseId, pluginId, userId, ipAddress } = req.body || {};
    const r = validateLicense({ key, licenseId, pluginId, userId, ipAddress: ipAddress || req.ip });
    if (!r.valid) return res.status(400).json({ success: false, valid: false, message: r.message });
    return res.json({ success: true, valid: true, license: r.license });
  });
  app.put("/api/licenses/:id/revoke", requireAdmin, (req, res) => {
    const lic = revokeLicense(req.params.id);
    if (!lic) return res.status(404).json({ success: false, message: "Licença não encontrada" });
    return res.json({ success: true, license: lic });
  });
  app.put("/api/licenses/:id/renew", requireAdmin, (req, res) => {
    const expiresAt = req.body?.expiresAt as string | undefined;
    const lic = renewLicense(req.params.id, expiresAt);
    if (!lic) return res.status(404).json({ success: false, message: "Licença não encontrada" });
    return res.json({ success: true, license: lic });
  });
  app.put("/api/licenses/:id/assign", requireAdmin, (req, res) => {
    const userId = req.body?.userId as string | undefined;
    if (!userId) return res.status(400).json({ success: false, message: "userId é obrigatório" });
    const lic = assignLicense(req.params.id, userId);
    if (!lic) return res.status(404).json({ success: false, message: "Licença não encontrada" });
    return res.json({ success: true, license: lic });
  });
  app.put("/api/licenses/:id/ip", requireAuth, (req, res) => {
    const ip = (req.body?.ipAddress as string | undefined) || req.ip;
    if (!ip) return res.status(400).json({ success: false, message: "ipAddress é obrigatório" });
    const lic = findLicenseById(req.params.id);
    if (!lic) return res.status(404).json({ success: false, message: "Licença não encontrada" });
    const actor = (req as any).user;
    if (actor?.role !== "admin" && lic.userId !== actor?.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const updated = updateLicenseIp(lic.id, ip);
    return res.json({ success: true, license: updated });
  });
  app.put("/api/licenses/:id/product-ip", requireAuth, (req, res) => {
    const pluginId = req.body?.pluginId as string | undefined;
    const ipSingle = (req.body?.ipAddress as string | undefined) || req.ip;
    const ipsBody = req.body?.ips as string[] | undefined;
    if (!pluginId) return res.status(400).json({ success: false, message: "pluginId é obrigatório" });
    const lic = findLicenseById(req.params.id);
    if (!lic) return res.status(404).json({ success: false, message: "Licença não encontrada" });
    const actor = (req as any).user;
    if (actor?.role !== "admin" && lic.userId !== actor?.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    let ips: string[] = [];
    if (Array.isArray(ipsBody)) ips = ipsBody;
    else if (ipSingle) ips = String(ipSingle).split(/[;,]/).map((s) => s.trim()).filter((s) => !!s);
    if (ips.length === 0) return res.status(400).json({ success: false, message: "Informe pelo menos 1 IP" });
    ips = Array.from(new Set(ips)).slice(0, 4);
    const updated = updateLicenseProductIp(lic.id, pluginId, ips);
    log("license_product_ip.bind", { licenseId: lic.id, pluginId, ips });
    return res.json({ success: true, license: updated });
  });
  app.delete("/api/licenses/:id", requireAdmin, (req, res) => {
    const ok = deleteLicense(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: "Licença não encontrada" });
    return res.json({ success: true });
  });

  app.get("/api/license/public-key", (_req, res) => {
    if (PUBLIC_KEY) {
      res.setHeader("Content-Type", "text/plain");
      return res.send(PUBLIC_KEY);
    }
    return res.status(404).json({ error: "Public key not found" });
  });

  app.post("/api/license/check", async (req, res) => {
    function stripColorCodes(s: string) {
      const input = String(s || "");
      const HEX_SEQ = /(?:[\u00A7\u00BA&]x(?:[\u00A7\u00BA&][0-9A-Fa-f]){6})/g;
      const SIMPLE = /[\u00A7\u00BA&][0-9A-FK-ORa-fk-or]/g;
      const STRAY = /[\u00A7\u00BA&]/g;
      return input.replace(HEX_SEQ, "").replace(SIMPLE, "").replace(STRAY, "").trim();
    }
    function sendSignedResponse(valid: boolean, licenseOwner: string, plan: string, reason: string | null, allowedPlugins: string[], allowedPluginNames: string[], expiresAt: string | null) {
      const dataToSign = `${valid}|${licenseOwner}|${plan}`;
      let signature = "";
      try {
        if (!PRIVATE_KEY_OBJ) {
          return res.status(500).json({ valid: false, licenseOwner: "Unknown", plan: "Free", reason: "Chave privada não configurada", allowedPlugins: [], allowedPluginNames: [], expiresAt: null, signature: "" });
        }
        const signer = crypto.createSign("RSA-SHA256");
        signer.update(dataToSign);
        signer.end();
        signature = signer.sign(PRIVATE_KEY_OBJ).toString("base64");
      } catch (e) {
        return res.status(500).json({ valid: false, licenseOwner: "Unknown", plan: "Free", reason: "Falha ao assinar resposta", allowedPlugins: [], allowedPluginNames: [], expiresAt: null, signature: "" });
      }
      const owns = allowedPlugins.length > 0;
      log("license_check.response", { valid, plan, reason, allowedCount: allowedPlugins.length, expiresAt });
      return res.json({ valid, licenseOwner, plan, expiresAt, reason, allowedPlugins, allowedPluginNames, ownsPlugin: owns, signature });
    }
    
      const { licenseKey, serverIp, serverPort, serverName, platform, pluginCore, fileHash } = req.body || {};
      const maskedKey = String(licenseKey || "").replace(/([A-Z0-9]{4})[A-Z0-9-]*/, "$1****");
      log("license_check.request", { pluginCore, fileHash: String(fileHash || "").slice(0, 12), serverIp, serverPort, serverName, platform, licenseKey: maskedKey });
      if (!licenseKey || !fileHash) {
        return res.status(400).json({ valid: false, reason: "Campos obrigatórios ausentes", signature: "" });
      }
      const HASH_STRICT = String(process.env.STARFIN_HASH_STRICT || "true").toLowerCase() === "true";
      const allowedHashes: string[] = [];
      if (OFFICIAL_HASH_ENV) allowedHashes.push(OFFICIAL_HASH_ENV);
      if (pluginCore) {
        const hs = getOfficialJarHashesByPluginId(pluginCore).map((x) => x.hash);
        for (const h of hs) allowedHashes.push(h);
        if (allowedHashes.length === 0) {
          const h = getOfficialJarHashByPluginName(pluginCore);
          if (h) allowedHashes.push(h);
        }
      }
      log("license_check.hashes", { whitelist: allowedHashes.slice(0, 5), whitelistCount: allowedHashes.length });
      if (allowedHashes.length > 0 && !allowedHashes.includes(fileHash)) {
        if (HASH_STRICT) {
          return sendSignedResponse(false, "Unknown", "Free", "Integridade violada. Plugin modificado.", [], [], null);
        }
      }
      const lic = findLicenseByKey(licenseKey);
      if (!lic) {
        log("license_check.license", { status: "not_found" });
        return sendSignedResponse(false, "Unknown", "Free", "Licença não encontrada", [], [], null);
      }
      if (lic.status !== "active") {
        log("license_check.license", { status: lic.status });
        return sendSignedResponse(false, "Unknown", "Free", "Licença inválida", [], [], lic.expiresAt ?? null);
      }
      if (lic.expiresAt) {
        const exp = new Date(lic.expiresAt).getTime();
        if (Date.now() > exp) {
          log("license_check.license", { status: "expired", expiresAt: lic.expiresAt });
          return sendSignedResponse(false, "Unknown", "Free", "Licença expirada", [], [], lic.expiresAt);
        }
      }
      function n(x: string | undefined) {
        if (!x) return "";
        let v = x.trim();
        v = v.replace(/^::ffff:/, "");
        v = v.replace(/^\[?([^\]]+)\]?(:\d+)?$/, "$1");
        if (v.includes(",")) v = v.split(",")[0].trim();
        if (v === "::1") v = "127.0.0.1";
        return v;
      }
      const ipCandidates = [
        serverIp as string | undefined,
        req.headers["x-real-ip"] as string | undefined,
        (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim(),
        (req.socket as any)?.remoteAddress as string | undefined,
        req.ip as string | undefined,
      ];
      const actualIp = n(ipCandidates.find((i) => !!i));
      const starfin = findPluginByName("StarfinLicense") || findPluginById("starfin-license");
      const resolvedCore = pluginCore ? (findPluginById(pluginCore) || findPluginByName(pluginCore)) : starfin;
      const isStarfinCore = !!resolvedCore && !!starfin && resolvedCore.id === starfin.id;
      if (isStarfinCore) {
        const map = (lic as any).productIps || {};
        const entry = map[starfin!.id];
        const ipList = Array.isArray(entry)
          ? entry.map((x: string) => n(x)).filter((x: string) => !!x)
          : String(entry || "")
              .split(/[;,]+/)
              .map((s) => n(s as string))
              .filter((s) => !!s);
        const globalList = String(lic.ipAddress || "")
          .split(/[;,]+/)
          .map((s) => n(s as string))
          .filter((s) => !!s);
        const anyList = ipList.length > 0 ? ipList : globalList;
        if (ipList.length === 0 && globalList.length === 0) {
          log("license_check.ip", { resolvedIp: actualIp, ipList: ipList, globalList: globalList, match: false });
          return sendSignedResponse(false, "Unknown", "Free", "IP não configurado", [], [], lic.expiresAt ?? null);
        }
        if (!actualIp || !anyList.includes(actualIp)) {
          log("license_check.ip", { resolvedIp: actualIp, list: anyList, match: false });
          return sendSignedResponse(false, "Unknown", "Free", "IP não corresponde", [], [], lic.expiresAt ?? null);
        }
        log("license_check.ip", { resolvedIp: actualIp, list: anyList, match: true });
      }
      const owner = getUserById(lic.userId);
      const ownerName = owner?.username || owner?.email || "Cliente";
      const userOrders = getOrdersForUser(lic.userId);
      const hasPaid = userOrders.some((o) => {
        if (o.status !== "completed") return false;
        const p = findPluginById(o.pluginId);
        return !!p && p.price > 0;
      });
      const plan = hasPaid ? "Pago" : "Free";
      let ownsPlugin = false;
      if (pluginCore) {
        const target = findPluginById(pluginCore);
        if (target) {
          ownsPlugin = doesUserOwnPlugin(lic.userId, target.id);
        }
      }
      const catalog = getPlugins();
      const allowed = catalog.filter((p) => doesUserOwnPlugin(lic.userId, p.id));
      const allowedPlugins = allowed.map((p) => p.id);
      log("license_check.allowed", { ownsPlugin, allowedCount: allowedPlugins.length });
      const allowedPluginNames = allowed.map((p) => stripColorCodes(p.name));
      const ownerNameClean = stripColorCodes(ownerName);
      return sendSignedResponse(true, ownerNameClean, plan, null, allowedPlugins, allowedPluginNames, lic.expiresAt ?? null);
    
  });

  app.get("/api/users", requireAdmin, getAllUsers);
  app.get("/api/users/me", requireAuth, getCurrentUser);
  app.put("/api/users/me", requireAuth, updateCurrentUser);
  app.get("/api/users/:id", getUser);
  app.put("/api/users/:id", requireAdmin, updateUser);
  app.delete("/api/users/:id", requireAdmin, deleteUserHandler);
  app.get("/api/users/:id/purchases", getUserPurchases);

  app.get("/api/metrics", getMetricsHandler);

  app.get("/api/categories", getCategoriesHandler);
  app.post("/api/categories", requireAdmin, createCategoryHandler);
  app.delete("/api/categories/:name", requireAdmin, deleteCategoryHandler);

  app.get("/api/logs", requireAdmin, getLogsHandler);

  return app;
}

let PRIVATE_KEY: string | null = null;
let PRIVATE_KEY_OBJ: crypto.KeyObject | null = null;
const envPem = process.env.PRIVATE_KEY_PEM as string | undefined;
if (envPem && envPem.includes("-----BEGIN") && envPem.includes("PRIVATE KEY-----")) {
  try {
    PRIVATE_KEY_OBJ = crypto.createPrivateKey({ key: envPem, passphrase: process.env.PRIVATE_KEY_PASSPHRASE });
    PRIVATE_KEY = envPem;
  } catch (e) {
  }
} else {
  const preferredKeyPath = "C:/Users/alanl/Downloads/Key/privatekey.pem";
  const rootKeyPath = path.join(import.meta.dirname, "../Beckend.pem");
  const fallbackKeyPath = path.join(import.meta.dirname, "private_key.pem");
  const envKeyPath = process.env.PRIVATE_KEY_PATH as string | undefined;
  const resolvedKeyPath = (() => {
    if (fs.existsSync(preferredKeyPath)) return preferredKeyPath;
    if (envKeyPath && fs.existsSync(envKeyPath)) return envKeyPath;
    if (fs.existsSync(rootKeyPath)) return rootKeyPath;
    if (fs.existsSync(fallbackKeyPath)) return fallbackKeyPath;
    return undefined;
  })();
  try {
    if (resolvedKeyPath && fs.existsSync(resolvedKeyPath)) {
      const pem = fs.readFileSync(resolvedKeyPath, "utf8");
      PRIVATE_KEY_OBJ = crypto.createPrivateKey({ key: pem, passphrase: process.env.PRIVATE_KEY_PASSPHRASE });
      PRIVATE_KEY = pem;
    }
  } catch (e) {
  }
}

let PUBLIC_KEY: string | null = null;
const envPubPem = process.env.PUBLIC_KEY_PEM as string | undefined;
if (envPubPem && envPubPem.includes("-----BEGIN") && envPubPem.includes("PUBLIC KEY-----")) {
  PUBLIC_KEY = envPubPem;
} else {
  const envPubPath = process.env.PUBLIC_KEY_PATH as string | undefined;
  const rootPub = path.join(import.meta.dirname, "../public_key.pem");
  const serverPub = path.join(import.meta.dirname, "public_key.pem");
  const resolvedPub = (() => {
    if (envPubPath && fs.existsSync(envPubPath)) return envPubPath;
    if (fs.existsSync(rootPub)) return rootPub;
    if (fs.existsSync(serverPub)) return serverPub;
    return undefined;
  })();
  try {
    if (resolvedPub && fs.existsSync(resolvedPub)) {
      PUBLIC_KEY = fs.readFileSync(resolvedPub, "utf8");
    }
  } catch {}
}

const OFFICIAL_HASH_ENV = process.env.STARFIN_OFFICIAL_HASH || "";

