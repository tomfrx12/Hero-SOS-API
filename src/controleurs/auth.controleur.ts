import type { Request, Response } from "express";
import type { Utilisateur } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { creerToken } from "../services/token";

const schemaInscription = z.object({
  role: z.enum(["Citoyens", "SuperHeros"]),
  pseudo: z.string().optional(),
  civilite: z.string().min(1, "La civilité est obligatoire"),
  nom: z.string().min(1, "Le nom est obligatoire"),
  prenom: z.string().min(1, "Le prénom est obligatoire"),
  date_de_naissance: z.coerce.date("La date de naissance est invalide"),
  email: z.email("L'adresse email est invalide"),
  numero_tel: z.string().min(1, "Le numéro de téléphone est obligatoire"),
  adresse: z.string().min(1, "L'adresse est obligatoire"),
  complement_adresse: z.string().optional(),
  ville: z.string().min(1, "La ville est obligatoire"),
  code_postal: z.string().min(1, "Le code postal est obligatoire"),
  pays: z.string().min(1, "Le pays est obligatoire"),
  mot_de_passe: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

const schemaConnexion = z.object({
  identifiant: z.string().min(1, "L'email ou le pseudo est obligatoire"),
  mot_de_passe: z.string().min(1, "Le mot de passe est obligatoire"),
});

function sansMotDePasse(utilisateur: Utilisateur) {
  const { mot_de_passe, ...reste } = utilisateur;
  return reste;
}

export async function inscription(req: Request, res: Response) {
  const resultat = schemaInscription.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const donnees = resultat.data;

  if (donnees.role === "SuperHeros" && !donnees.pseudo) {
    res.status(400).json({ message: "Le pseudo est obligatoire pour un super-héros" });
    return;
  }

  const emailUtilise = await prisma.utilisateur.findUnique({ where: { email: donnees.email } });
  if (emailUtilise) {
    res.status(409).json({ message: "Cet email est déjà utilisé" });
    return;
  }

  if (donnees.pseudo) {
    const pseudoUtilise = await prisma.utilisateur.findUnique({ where: { pseudo: donnees.pseudo } });
    if (pseudoUtilise) {
      res.status(409).json({ message: "Ce pseudo est déjà utilisé" });
      return;
    }
  }

  const utilisateur = await prisma.utilisateur.create({
    data: {
      ...donnees,
      mot_de_passe: await bcrypt.hash(donnees.mot_de_passe, 10),
      statut_compte: donnees.role === "SuperHeros" ? "EnAttente" : "Actif",
    },
  });

  res.status(201).json({ utilisateur: sansMotDePasse(utilisateur) });
}

export async function connexion(req: Request, res: Response) {
  const resultat = schemaConnexion.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { identifiant, mot_de_passe } = resultat.data;

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { OR: [{ email: identifiant }, { pseudo: identifiant }] },
  });

  if (!utilisateur || !(await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe))) {
    res.status(401).json({ message: "Identifiant ou mot de passe incorrect" });
    return;
  }
  if (utilisateur.statut_compte === "Desactive") {
    res.status(403).json({ message: "Ce compte a été désactivé" });
    return;
  }
  if (utilisateur.statut_compte === "EnAttente") {
    res.status(403).json({ message: "Ce compte est en attente de validation" });
    return;
  }

  const token = creerToken({ id: utilisateur.id, role: utilisateur.role });
  res.json({ token, utilisateur: sansMotDePasse(utilisateur) });
}

export async function me(_req: Request, res: Response) {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: res.locals.utilisateur.id },
  });

  if (!utilisateur || utilisateur.statut_compte !== "Actif") {
    res.status(401).json({ message: "Session expirée, reconnectez-vous" });
    return;
  }

  res.json({ utilisateur: sansMotDePasse(utilisateur) });
}
