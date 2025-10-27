import type { Request, Response, NextFunction } from "express";

export function sessionRequired(req: Request, res: Response, next: NextFunction) {
  console.log('Session check:', req.session);
  // @ts-ignore
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
}
