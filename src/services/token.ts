import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

export interface ContenuToken {
  id: number;
  role: Role;
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans .env");
}
const SECRET = process.env.JWT_SECRET;

export function creerToken(contenu: ContenuToken) {
  return jwt.sign(contenu, SECRET, { expiresIn: "7d" });
}

export function lireToken(token: string) {
  return jwt.verify(token, SECRET) as ContenuToken;
}
