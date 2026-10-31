import type { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { envoyerMail } from "../services/mail";

const schemaEmail = z.object({
  email: z.email("L'adresse email est invalide"),
});

export async function sInscrire(req: Request, res: Response) {
  const resultat = schemaEmail.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { email } = resultat.data;

  // Si l'email correspond à un compte inscrit, on met à jour directement son flag newsletter
  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (utilisateur) {
    if (utilisateur.newsletter) {
      res.status(409).json({ message: "Vous êtes déjà abonné à la newsletter" });
      return;
    }
    await prisma.utilisateur.update({ where: { email }, data: { newsletter: true } });
    res.json({ message: "Vous êtes abonné à la newsletter" });
    return;
  }

  // Visiteur anonyme : création ou réactivation
  const existant = await prisma.newsletterAnonymous.findUnique({ where: { email } });
  if (existant) {
    if (existant.actif) {
      res.status(409).json({ message: "Vous êtes déjà abonné à la newsletter" });
      return;
    }
    await prisma.newsletterAnonymous.update({ where: { email }, data: { actif: true } });
    res.json({ message: "Vous êtes à nouveau abonné à la newsletter" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.newsletterAnonymous.create({ data: { email, token } });

  await envoyerMail(
    [email],
    "Bienvenue sur la newsletter Héros SOS",
    `Bonjour,\n\nVous êtes maintenant abonné à la newsletter Héros SOS.\n\nPour vous désinscrire à tout moment : ${process.env.FRONTEND_URL}/newsletter/desinscrire?token=${token}`,
  );

  res.status(201).json({ message: "Vous êtes abonné à la newsletter" });
}

export async function seDesinscrire(req: Request, res: Response) {
  const token = String(req.query.token ?? "");
  if (!token) {
    res.status(400).json({ message: "Lien invalide" });
    return;
  }

  const abonne = await prisma.newsletterAnonymous.findUnique({ where: { token } });
  if (!abonne) {
    res.status(404).json({ message: "Lien invalide ou déjà utilisé" });
    return;
  }

  await prisma.newsletterAnonymous.update({ where: { token }, data: { actif: false } });

  res.json({ message: "Vous avez été désinscrit de la newsletter" });
}
