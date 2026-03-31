import { RequestHandler } from "express";
import { GetOrdersResponse, Order, CreateOrderRequest } from "@shared/api";
import {
  addOrder,
  getOrdersForUser,
  findOrderById,
  findPluginById,
  incrementPluginDownloads,
  ensureStarfinLicenseForUser,
  updateOrderStatus,
  deleteOrderById,
  reassignOrderUser,
  ensureStarfinPlugin,
  listLicensesForUser,
  deleteLicense,
  addLog,
  createLicenseForOrder,
  getUserById,
  getPaymentAccessToken,
  doesUserOwnPlugin,
} from "../store";
import https from "https";

export const getOrders: RequestHandler = (req, res) => {
  // TODO: Get orders for authenticated user from database
  const userId = req.query.userId as string;

  const userOrders = getOrdersForUser(userId);

  const response: GetOrdersResponse = {
    success: true,
    orders: userOrders,
  };

  res.json(response);
};

export const createOrder: RequestHandler = (req, res) => {
  const { pluginId, quantity } = req.body as CreateOrderRequest;
  const userId = ((req as any).user?.id as string) || (req.query.userId as string);

  // TODO: Validate request, process payment, save to database
  if (!pluginId || !quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order data",
    });
  }

  const plugin = findPluginById(pluginId);
  if (!plugin) {
    return res.status(404).json({
      success: false,
      message: "Plugin not found",
    });
  }

  const newOrder: Order = {
    id: `order-${Date.now()}`,
    userId: userId || "anonymous",
    pluginId,
    price: plugin.price * quantity,
    status: "completed",
    createdAt: new Date().toISOString(),
    ownershipPolicy: plugin.licensePolicy ?? { type: "infinite" },
  };

  addOrder(newOrder);
  incrementPluginDownloads(pluginId, quantity);
  const license = ensureStarfinLicenseForUser(newOrder.userId);

  res.json({
    success: true,
    message: "Order created successfully",
    order: newOrder,
    license,
  });
};

export const updateOrder: RequestHandler = (req, res) => {
  const { id } = req.params as any;
  const { status } = req.body as Partial<Order>;
  if (!status) return res.status(400).json({ success: false, message: "status é obrigatório" });
  const updated = updateOrderStatus(id, status);
  if (!updated) return res.status(404).json({ success: false, message: "Pedido não encontrado" });
  return res.json({ success: true, order: updated });
};

export const deleteOrderHandler: RequestHandler = (req, res) => {
  const { id } = req.params as any;
  const ok = deleteOrderById(id);
  if (!ok) return res.status(404).json({ success: false, message: "Pedido não encontrado" });
  return res.json({ success: true });
};

export const reassignOrderHandler: RequestHandler = (req, res) => {
  const { id } = req.params as any;
  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ success: false, message: "userId é obrigatório" });
  const updated = reassignOrderUser(id, userId);
  if (!updated) return res.status(404).json({ success: false, message: "Pedido não encontrado" });
  return res.json({ success: true, order: updated });
};

export const regenerateLicenseHandler: RequestHandler = (req, res) => {
  const { id } = req.params as any;
  const order = findOrderById(id);
  if (!order) return res.status(404).json({ success: false, message: "Pedido não encontrado" });
  const starfin = ensureStarfinPlugin();
  const userLicenses = listLicensesForUser(order.userId);
  const existing = userLicenses.find((l) => l.pluginId === starfin.id);
  if (existing) deleteLicense(existing.id);
  const lic = ensureStarfinLicenseForUser(order.userId);
  return res.json({ success: true, license: lic });
};

// Inicia checkout Mercado Pago para múltiplos itens do carrinho
export const startMercadoPagoCheckout: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ success: false, message: "Auth required" });
    const items = (req.body?.items as { pluginId: string; quantity: number }[]) || [];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Itens do carrinho inválidos" });
    }
    const token = getPaymentAccessToken();
    if (!token) {
      return res.status(500).json({ success: false, message: "MERCADO_PAGO_ACCESS_TOKEN não configurado" });
    }
    const configuredBase = (require("../store") as any).getPublicBaseUrl?.() || "";
    let baseUrl = String(configuredBase || `${req.protocol}://${req.get("host") || ""}`).trim();
    if (!/^https?:\/\//i.test(baseUrl) || baseUrl.length < 8) baseUrl = "http://localhost:3000";
    baseUrl = baseUrl.replace(/\/$/, "");
    const orderIds: string[] = [];
    const mpItems: any[] = [];
    const nowIso = new Date().toISOString();
    const paidItems: { pluginId: string; quantity: number }[] = [];
    const allDeps = new Set<string>();
    for (const it of items) {
      const plugin = findPluginById(it.pluginId);
      if (!plugin) return res.status(404).json({ success: false, message: `Plugin não encontrado: ${it.pluginId}` });
      paidItems.push({ pluginId: plugin.id, quantity: it.quantity || 1 });
      const deps = (plugin.dependencies || []).filter((d) => !!findPluginById(d));
      for (const d of deps) allDeps.add(d);
    }
    const depList = Array.from(allDeps).filter((depId) => !doesUserOwnPlugin(user.id, depId));
    // Create orders for paid items
    for (const p of paidItems) {
      const plug = findPluginById(p.pluginId)!;
      const unique = `order-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const order: Order = {
        id: unique,
        userId: user.id,
        pluginId: plug.id,
        price: plug.price * p.quantity,
        status: "pending",
        createdAt: nowIso,
        ownershipPolicy: plug.licensePolicy ?? { type: "infinite" },
      };
      addOrder(order);
      orderIds.push(order.id);
      mpItems.push({
        id: plug.id,
        title: plug.name,
        description: plug.subtitle || plug.description,
        quantity: p.quantity,
        currency_id: "BRL",
        unit_price: plug.price,
      });
    }
    // Create zero-price orders for dependencies (not added to MP items)
    for (const depId of depList) {
      const dep = findPluginById(depId)!;
      const unique = `order-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const order: Order = {
        id: unique,
        userId: user.id,
        pluginId: dep.id,
        price: 0,
        status: "pending",
        createdAt: nowIso,
        ownershipPolicy: dep.licensePolicy ?? { type: "infinite" },
      };
      addOrder(order);
      orderIds.push(order.id);
    }
    const extRef = `orders:${orderIds.join("|")}`;
    const userObj = getUserById(user.id);
    const payerEmail = userObj?.email || "";

    const payload = {
      items: mpItems,
      payer: payerEmail ? { email: payerEmail } : undefined,
      back_urls: {
        success: `${baseUrl}/obrigado?orders=${encodeURIComponent(orderIds.join(","))}`,
        pending: `${baseUrl}/obrigado?orders=${encodeURIComponent(orderIds.join(","))}`,
        failure: `${baseUrl}/checkout?falha=1`,
      },
      notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
      external_reference: extRef,
      auto_return: "approved",
    } as any;
    if (!payload.back_urls?.success) delete payload.auto_return;

    let prefRaw = "";
    const prefRes = await new Promise<{ init_point?: string; sandbox_init_point?: string; id?: string }>((resolve, reject) => {
      const data = JSON.stringify(payload);
      const u = new URL("https://api.mercadopago.com/checkout/preferences");
      const reqOpts = {
        hostname: u.hostname,
        path: u.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const r = https.request(reqOpts, (rr: any) => {
        let body = "";
        rr.on("data", (ch: any) => (body += ch));
        rr.on("end", () => {
          prefRaw = body;
          try {
            const json = JSON.parse(body);
            if (rr.statusCode && rr.statusCode >= 300) {
              reject(new Error(`MP ${rr.statusCode}: ${json?.message || body}`));
              return;
            }
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      });
      r.setTimeout(15000, () => { r.destroy(new Error("timeout")); });
      r.on("error", reject);
      r.write(data);
      r.end();
    });

    let initPoint = prefRes.init_point || prefRes.sandbox_init_point;
    if (!initPoint && prefRes.id) {
      const u2 = new URL(`https://api.mercadopago.com/checkout/preferences/${prefRes.id}`);
      const prefGet = await new Promise<any>((resolve, reject) => {
        const reqOpts = {
          hostname: u2.hostname,
          path: u2.pathname,
          method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        };
        const r = https.request(reqOpts, (rr: any) => {
          let body = "";
          rr.on("data", (ch: any) => (body += ch));
          rr.on("end", () => {
            try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
          });
        });
        r.setTimeout(10000, () => { r.destroy(new Error("timeout")); });
        r.on("error", reject);
        r.end();
      });
      initPoint = prefGet?.init_point || prefGet?.sandbox_init_point || "";
    }
    if (!initPoint) {
      addLog("payment:error", `Falha preferência: ${JSON.stringify({ id: prefRes.id, raw: prefRaw }).slice(0, 500)}`);
      return res.status(500).json({ success: false, message: "Falha ao criar preferência de pagamento", details: { id: prefRes.id, raw: prefRaw } });
    }
    addLog("payment:preference", `Preferência criada para ${orderIds.join(", ")}`);
    return res.json({ success: true, initPoint, preferenceId: prefRes.id, orderIds });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Erro ao iniciar checkout", error: String(e) });
  }
};

// Webhook de notificação do Mercado Pago
export const mercadoPagoWebhook: RequestHandler = async (req, res) => {
  try {
    const token = getPaymentAccessToken();
    if (!token) return res.status(500).json({ success: false, message: "MERCADO_PAGO_ACCESS_TOKEN não configurado" });
    const id = (req.query.id as string) || (req.body?.data?.id as string);
    const topic = (req.query.topic as string) || (req.body?.type as string);
    if (!id) {
      return res.status(200).json({ received: true });
    }
    if ((topic || "").toLowerCase().includes("payment")) {
      const payInfo = await new Promise<any>((resolve, reject) => {
        const u = new URL(`https://api.mercadopago.com/v1/payments/${id}`);
        const reqOpts = {
          hostname: u.hostname,
          path: u.pathname,
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        };
        const r = https.request(reqOpts, (rr: any) => {
          let body = "";
          rr.on("data", (ch: any) => (body += ch));
          rr.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        });
        r.on("error", reject);
        r.end();
      });
      const status = String(payInfo?.status || "").toLowerCase();
      const extRef = String(payInfo?.external_reference || "");
      if (extRef.startsWith("orders:")) {
        const ids = extRef.replace(/^orders:/, "").split("|").filter((s) => !!s);
        if (status === "approved") {
          for (const oid of ids) {
            const o = findOrderById(oid);
            if (!o) continue;
            updateOrderStatus(oid, "completed");
            incrementPluginDownloads(o.pluginId, 1);
            const lic = createLicenseForOrder({ ...o, status: "completed" });
            addLog("payment:approved", `Pedido ${oid} aprovado. Licença ${lic.id} criada.`);
          }
        } else if (status === "rejected" || status === "cancelled") {
          for (const oid of ids) updateOrderStatus(oid, "failed");
          addLog("payment:failed", `Pagamento ${id} falhou para pedidos ${ids.join(", ")}`);
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    return res.status(200).json({ received: true });
  }
};

export const getOrderById: RequestHandler = (req, res) => {
  const { id } = req.params;

  // TODO: Get order from database
  const order = findOrderById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  res.json({
    success: true,
    order,
  });
};
