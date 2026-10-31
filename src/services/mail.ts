import nodemailer from "nodemailer";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

// En dev (Mailpit), pas d'auth. En prod (Brevo), SMTP_USER + SMTP_PASSWORD sont définis.
const transporteur = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  ...(process.env.SMTP_USER && {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  }),
});

export async function envoyerMail(destinataires: string[], sujet: string, texte: string) {
  if (destinataires.length === 0) return;

  // Un mail qui ne part pas ne doit pas faire échouer la requête
  try {
    await transporteur.sendMail({
      from: "Héros SOS <no-reply@heros-sos.tom-fourneaux.fr>",
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
