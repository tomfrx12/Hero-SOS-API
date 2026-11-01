import type { Request, Response } from "express";
import type { Utilisateur } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { creerToken } from "../services/token";
import { emailsDuRole, envoyerMail } from "../services/mail";

const schemaInscription = z.object({
  role: z.enum(["Citoyens", "SuperHeros"]),
  pseudo: z.string().optional(),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  email: z.email("L'adresse email est invalide"),
  mot_de_passe: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

const schemaConnexion = z.object({
  identifiant: z.string().min(1, "L'email ou le pseudo est obligatoire"),
  mot_de_passe: z.string().min(1, "Le mot de passe est obligatoire"),
});

export function sansMotDePasse(utilisateur: Utilisateur) {
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

  const estHeros = donnees.role === "SuperHeros";
  const appelation = donnees.prenom ?? donnees.pseudo ?? "toi";

  const utilisateur = await prisma.utilisateur.create({
    data: {
      ...donnees,
      mot_de_passe: await bcrypt.hash(donnees.mot_de_passe, 10),
      statut_compte: estHeros ? "EnAttente" : "Actif",
      profil_complet: false,
    },
  });

  // Si l'email était abonné anonymement, on rattache l'abonnement au nouveau compte
  const abonneAnonyme = await prisma.newsletterAnonymous.findUnique({ where: { email: utilisateur.email } });
  if (abonneAnonyme?.actif) {
    await prisma.utilisateur.update({ where: { id: utilisateur.id }, data: { newsletter: true } });
    await prisma.newsletterAnonymous.delete({ where: { email: utilisateur.email } });
    utilisateur.newsletter = true;
  }

  if (!estHeros) {
    await envoyerMail(
      [utilisateur.email],
      "Bienvenue sur Héros SOS",
      `Bonjour ${appelation},\n\nTon compte a bien été créé. Tu peux maintenant signaler des incidents.\n\nPense à compléter ton profil pour accéder à toutes les fonctionnalités : ${process.env.FRONTEND_URL}/profil/completer\n\nÀ bientôt sur Héros SOS !`,
    );
  } else {
    await envoyerMail(
      [utilisateur.email],
      "Ta demande de super-héros est en cours d'examen",
      `Bonjour ${appelation},\n\nTa demande pour rejoindre Héros SOS en tant que super-héros a bien été reçue. Un modérateur va l'examiner prochainement.\n\nTu recevras un mail dès qu'une décision aura été prise.`,
    );
  }

  const identite = [donnees.prenom, donnees.nom].filter(Boolean).join(" ") || donnees.pseudo || donnees.email;
  await envoyerMail(
    await emailsDuRole("Administrateurs"),
    "Nouvel inscrit sur Héros SOS",
    `${identite} (${utilisateur.email}) vient de s'inscrire en tant que ${utilisateur.role}.`,
  );

  if (estHeros) {
    res.status(201).json({ utilisateur: sansMotDePasse(utilisateur) });
    return;
  }

  // Pour les citoyens : token immédiat pour ne pas forcer une reconnexion
  const token = creerToken({ id: utilisateur.id, role: utilisateur.role });
  res.status(201).json({ token, utilisateur: sansMotDePasse(utilisateur) });
}

const schemaInscriptionRapide = z.object({
  email: z.email("L'adresse email est invalide"),
  mot_de_passe: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

export async function inscriptionRapide(req: Request, res: Response) {
  const resultat = schemaInscriptionRapide.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { email, mot_de_passe } = resultat.data;

  const emailUtilise = await prisma.utilisateur.findUnique({ where: { email } });
  if (emailUtilise) {
    res.status(409).json({ message: "Cet email est déjà utilisé" });
    return;
  }

  const utilisateur = await prisma.utilisateur.create({
    data: {
      email,
      mot_de_passe: await bcrypt.hash(mot_de_passe, 10),
      statut_compte: "Actif",
      profil_complet: false,
    },
  });

  await envoyerMail(
    [utilisateur.email],
    "Bienvenue sur Héros SOS",
    `Bienvenue sur Héros SOS !\n\nTon compte a bien été créé. Tu peux maintenant signaler des incidents.\n\nPense à compléter ton profil pour accéder à toutes les fonctionnalités : ${process.env.FRONTEND_URL}/profil/completer\n\nÀ bientôt !`,
  );

  const token = creerToken({ id: utilisateur.id, role: utilisateur.role });
  res.status(201).json({ token, utilisateur: sansMotDePasse(utilisateur) });
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

const schemaMotDePasseOublie = z.object({
  email: z.email("L'adresse email est invalide"),
});

export async function motDePasseOublie(req: Request, res: Response) {
  const resultat = schemaMotDePasseOublie.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email: resultat.data.email } });

  if (utilisateur) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.reinitialisationMotDePasse.create({
      data: {
        token,
        expireLe: new Date(Date.now() + 60 * 60 * 1000), // valable 1 heure
        utilisateurId: utilisateur.id,
      },
    });

    await envoyerMail(
      [utilisateur.email],
      "Réinitialisation de votre mot de passe",
      `Bonjour ${utilisateur.prenom},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${process.env.FRONTEND_URL}/reinitialiser-le-mot-de-passe?token=${token}\n\nSi vous n'avez rien demandé, ignorez ce mail.`,
    );
  }

  // Même réponse que le compte existe ou non, pour ne pas révéler quels emails sont inscrits
  res.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé." });
}

const schemaReinitialisation = z.object({
  token: z.string().min(1, "Le lien est invalide"),
  mot_de_passe: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

export async function reinitialiserMotDePasse(req: Request, res: Response) {
  const resultat = schemaReinitialisation.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { token, mot_de_passe } = resultat.data;

  const demande = await prisma.reinitialisationMotDePasse.findUnique({ where: { token } });
  if (!demande || demande.expireLe < new Date()) {
    res.status(400).json({ message: "Ce lien n'est plus valide, refais une demande" });
    return;
  }

  await prisma.utilisateur.update({
    where: { id: demande.utilisateurId },
    data: { mot_de_passe: await bcrypt.hash(mot_de_passe, 10) },
  });

  // Un lien ne sert qu'une fois : on supprime toutes les demandes de cet utilisateur
  await prisma.reinitialisationMotDePasse.deleteMany({ where: { utilisateurId: demande.utilisateurId } });

  res.json({ message: "Ton mot de passe a été modifié, tu peux te connecter." });
}
