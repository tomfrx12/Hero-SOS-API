import nodemailer from "nodemailer";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

// En dev, les mails partent vers Mailpit (http://localhost:8025) au lieu d'une vraie boîte
const transporteur = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
});

export async function envoyerMail(destinataires: string[], sujet: string, texte: string) {
  if (destinataires.length === 0) return;

  // Un mail qui ne part pas ne doit pas faire échouer la requête
  try {
    await transporteur.sendMail({
      from: "Héros SOS <no-reply@heros-sos.fr>",
      to: destinataires,
      subject: sujet,
      text: texte,
    });
  } catch (erreur) {
    console.error("Le mail n'a pas pu être envoyé :", erreur);
  }
}

// Les emails des comptes actifs d'un ou plusieurs rôles (ex : tous les administrateurs)
export async function emailsDuRole(...roles: Role[]) {
  const utilisateurs = await prisma.utilisateur.findMany({
    where: { role: { in: roles }, statut_compte: "Actif" },
    select: { email: true },
  });
  return utilisateurs.map((utilisateur) => utilisateur.email);
}
