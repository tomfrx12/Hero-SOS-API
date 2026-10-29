import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { lireToken } from "../services/token";

export function authentifier(req: Request, res: Response, next: NextFunction) {
  const [type, token] = req.headers.authorization?.split(" ") ?? [];

  if (type !== "Bearer" || !token) {
    res.status(401).json({ message: "Vous devez être connecté" });
    return;
  }

  try {
    res.locals.utilisateur = lireToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Session expirée, reconnectez-vous" });
  }
}

export function autoriser(...roles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(res.locals.utilisateur?.role)) {
      res.status(403).json({ message: "Accès refusé" });
      return;
    }
    next();
  };
}
