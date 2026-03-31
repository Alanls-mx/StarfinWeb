import { RequestHandler } from "express";
import { getMetrics } from "../store";

export const getMetricsHandler: RequestHandler = (_req, res) => {
  const metrics = getMetrics();
  res.json({ success: true, ...metrics });
};

