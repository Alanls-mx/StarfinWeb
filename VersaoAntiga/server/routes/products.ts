import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import {
  GetPluginsResponse,
  GetPluginResponse,
  CreatePluginRequest,
} from "@shared/api";
import {
  getPlugins,
  findPluginById,
  findPluginByName,
  addPlugin,
  updatePluginInStore,
  deletePluginFromStore,
  addReleaseToPlugin,
  listReleases,
  deleteRelease,
  getCategories,
  addCategory,
  deleteCategory,
  listLogs,
  getOrdersForUser,
  addOrder,
  ensureStarfinLicenseForUser,
  listLicensesForUser,
  updateLicenseProductIp,
} from "../store";

// Data is managed via shared store

export const getAllPlugins: RequestHandler = (req, res) => {
  // TODO: Implement filtering by category, sorting, pagination
  const category = req.query.category as string | undefined;

  const plugins = getPlugins(category);

  const response: GetPluginsResponse = {
    success: true,
    plugins,
    total: plugins.length,
  };

  res.json(response);
};

export const getPluginById: RequestHandler = (req, res) => {
  const { id } = req.params;

  // TODO: Fetch from database
  const plugin = findPluginById(id);

  if (!plugin) {
    const response: GetPluginResponse = {
      success: false,
      message: "Plugin not found",
    };
    return res.status(404).json(response);
  }

  const response: GetPluginResponse = {
    success: true,
    plugin,
  };

  res.json(response);
};

export const createPlugin: RequestHandler = (req, res) => {
  const { name, subtitle, description, category, price, version, imageUrl, longDescriptionHtml, imageBase64, imageFileName } =
    req.body as CreatePluginRequest;

  // TODO: Validate input and save to database
  if (!name || !description || !category || price === undefined || !version) {
    const response: GetPluginResponse = {
      success: false,
      message: "All fields are required",
    };
    return res.status(400).json(response);
  }

  const newPlugin = addPlugin({ name, subtitle, description, category, price, version, imageUrl, longDescriptionHtml, dependencies: (req.body as any).dependencies });
  let responsePlugin = newPlugin;

  try {
    if (imageBase64 && imageFileName) {
      const uploadsDir = path.join(import.meta.dirname, "../uploads", newPlugin.id);
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const safeName = imageFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const target = path.join(uploadsDir, safeName);
      const data = Buffer.from(imageBase64, "base64");
      fs.writeFileSync(target, data);
      const updated = updatePluginInStore(newPlugin.id, { imageUrl: `/uploads/${newPlugin.id}/${safeName}` } as any);
      if (updated) responsePlugin = updated as any;
    }
  } catch {}

  const response: GetPluginResponse = {
    success: true,
    plugin: responsePlugin,
  };

  res.json(response);
};

export const updatePlugin: RequestHandler = (req, res) => {
  const { id } = req.params;
  const updates = req.body as Partial<CreatePluginRequest & { rating?: number; downloads?: number }>;

  const finalUpdates: Partial<CreatePluginRequest & { rating?: number; downloads?: number }> = { ...updates };

  try {
    const imageBase64 = (updates as any).imageBase64 as string | undefined;
    const imageFileName = (updates as any).imageFileName as string | undefined;
    if (imageBase64 && imageFileName) {
      const uploadsDir = path.join(import.meta.dirname, "../uploads", id as string);
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const safeName = imageFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const target = path.join(uploadsDir, safeName);
      const data = Buffer.from(imageBase64, "base64");
      fs.writeFileSync(target, data);
      finalUpdates.imageUrl = `/uploads/${id}/${safeName}`;
    }
  } catch {}

  const updated = updatePluginInStore(id, finalUpdates as any);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Plugin not found" });
  }
  return res.json({ success: true, plugin: updated });
};

export const deletePlugin: RequestHandler = (req, res) => {
  const { id } = req.params;
  const ok = deletePluginFromStore(id);
  if (!ok) {
    return res.status(404).json({ success: false, message: "Plugin not found" });
  }
  return res.json({ success: true });
};

export const getCategoriesHandler: RequestHandler = (_req, res) => {
  return res.json({ success: true, categories: getCategories() });
};

export const createCategoryHandler: RequestHandler = (req, res) => {
  const { name } = req.body as { name?: string };
  if (!name) return res.status(400).json({ success: false, message: "name is required" });
  const ok = addCategory(name);
  if (!ok) return res.status(400).json({ success: false, message: "Category already exists or invalid" });
  return res.json({ success: true });
};

export const deleteCategoryHandler: RequestHandler = (req, res) => {
  const { name } = req.params as any;
  const ok = deleteCategory(name);
  if (!ok) return res.status(404).json({ success: false, message: "Category not found" });
  return res.json({ success: true });
};

export const getLogsHandler: RequestHandler = (_req, res) => {
  return res.json({ success: true, logs: listLogs() });
};

export const getPluginReleases: RequestHandler = (req, res) => {
  const { id } = req.params;
  const releases = listReleases(id);
  if (!releases) return res.status(404).json({ success: false, message: "Plugin not found" });
  return res.json({ success: true, releases });
};

export const uploadPluginRelease: RequestHandler = (req, res) => {
  const { id } = req.params;
  const { version, releaseNotes, jarBase64, fileName } = req.body as any;
  if (!version || !jarBase64 || !fileName) {
    return res.status(400).json({ success: false, message: "version, fileName and jarBase64 are required" });
  }
  const result = addReleaseToPlugin(id, version, fileName, jarBase64, releaseNotes);
  if ((result as any).error) {
    return res.status(500).json({ success: false, message: (result as any).error });
  }
  return res.json({ success: true, release: (result as any).release });
};

export const deletePluginRelease: RequestHandler = (req, res) => {
  const { id, version } = req.params as any;
  const ok = deleteRelease(id, version);
  if (!ok) return res.status(404).json({ success: false, message: "Release not found" });
  return res.json({ success: true });
};

export const downloadPluginJar: RequestHandler = (req, res) => {
  const { id, version } = req.params as any;
  const user = (req as any).user;
  const plugin = findPluginById(id);
  if (!plugin) return res.status(404).json({ success: false, message: "Plugin not found" });

  if (plugin.price > 0) {
    if (!user?.id) return res.status(401).json({ success: false, message: "Auth required" });
    const orders = getOrdersForUser(user.id);
    const owns = orders.some((o) => o.pluginId === id && o.status === "completed");
    if (!owns) return res.status(403).json({ success: false, message: "Você não possui este produto" });
  } else {
    if (user?.id) {
      ensureStarfinLicenseForUser(user.id);
      const orders = getOrdersForUser(user.id);
      const owns = orders.some((o) => o.pluginId === id && o.status === "completed");
      if (!owns) {
        const newOrder = {
          id: `order-free-${Date.now()}`,
          userId: user.id,
          pluginId: id,
          price: 0,
          status: "completed",
          createdAt: new Date().toISOString(),
          ownershipPolicy: plugin.licensePolicy ?? { type: "infinite" },
        } as any;
        addOrder(newOrder);
      }
    }
  }

  // IP não é verificado por produto; apenas posse é exigida acima

  const releases = listReleases(id);
  if (!releases) return res.status(404).json({ success: false, message: "Plugin not found" });
  const rel = releases.find((r: any) => r.version === version);
  if (!rel || !rel.jarPath) return res.status(404).json({ success: false, message: "Jar not found" });
  res.setHeader("Content-Type", "application/java-archive");
  res.download(rel.jarPath);
};

export const getPluginImage: RequestHandler = (req, res) => {
  const { id } = req.params as any;
  const plugin = findPluginById(id);
  if (!plugin || !plugin.imageUrl) return res.status(404).json({ success: false, message: "Plugin or image not found" });
  const url = plugin.imageUrl;
  if (/^https?:\/\//i.test(url)) {
    return res.redirect(url);
  }
  const rel = url.startsWith("/") ? url.slice(1) : url;
  const filePath = path.join(import.meta.dirname, "../", rel);
  if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: "Image file not found" });
  return res.sendFile(filePath);
};
