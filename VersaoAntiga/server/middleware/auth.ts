import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getUserById } from "../store";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const user = getUserById(payload.sub);
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  });
}

