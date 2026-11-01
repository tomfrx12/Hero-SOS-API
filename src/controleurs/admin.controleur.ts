import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { envoyerMail } from "../services/mail";

const schemaEnvoiNewsletter = z.object({
  sujet: z.string().min(1, "Le sujet est obligatoire"),
  corps: z.string().min(1, "Le contenu est obligatoire"),
  destinataireId: z.number().optional(),
});

export async function envoyerNewsletter(req: Request, res: Response) {
  const resultat = schemaEnvoiNewsletter.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { sujet, corps, destinataireId } = resultat.data;

  let destinataires: string[];

  if (destinataireId) {
    const utilisateur = await prisma.utilisateur.findUnique({ where: { id: destinataireId } });
    if (!utilisateur) {
      res.status(404).json({ message: "Utilisateur introuvable" });
      return;
    }
    destinataires = [utilisateur.email];
  } else {
    const inscrits = await prisma.utilisateur.findMany({
      where: { newsletter: true, statut_compte: "Actif" },
      select: { email: true },
    });
    const anonymes = await prisma.newsletterAnonymous.findMany({
      where: { actif: true },
      select: { email: true },
    });
    destinataires = [...inscrits.map((u) => u.email), ...anonymes.map((a) => a.email)];
  }

  await envoyerMail(destinataires, sujet, corps);
  res.json({ message: `Newsletter envoyée à ${destinataires.length} destinataire(s)` });
}

const champsUtilisateur = {
  id: true,
  civilite: true,
  nom: true,
  prenom: true,
  pseudo: true,
  email: true,
  email_en_attente: true,
  numero_tel: true,
  ville: true,
  role: true,
  statut_compte: true,
  verifiedAt: true,
  createdAt: true,
};

export async function tableauDeBord(_req: Request, res: Response) {
  const utilisateurs = await prisma.utilisateur.count();
  const incidentsOuverts = await prisma.incident.count({ where: { status: { in: ["Signale", "En_Cours"] } } });
  const incidentsUrgents = await prisma.incident.count({ where: { status: { in: ["Signale", "En_Cours"] }, urgence: "Haute" } });
  const interventionsEnCours = await prisma.intervention.count({ where: { statut: "En_Cours" } });

  const herosEnAttente = await prisma.utilisateur.findMany({
    where: { role: "SuperHeros", statut_compte: "EnAttente" },
    orderBy: { createdAt: "asc" },
    select: champsUtilisateur,
  });
  const emailsEnAttente = await prisma.utilisateur.findMany({
    where: { email_en_attente: { not: null } },
    orderBy: { updatedAt: "asc" },
    select: champsUtilisateur,
  });
  const citoyensAVerifier = await prisma.utilisateur.count({
    where: { role: "Citoyens", statut_compte: "Actif", verifiedAt: null },
  });

  res.json({
    utilisateurs,
    incidents_ouverts: incidentsOuverts,
    incidents_urgents: incidentsUrgents,
    interventions_en_cours: interventionsEnCours,
    citoyens_a_verifier: citoyensAVerifier,
    heros_en_attente: herosEnAttente,
    emails_en_attente: emailsEnAttente,
  });
}

export async function listerUtilisateurs(_req: Request, res: Response) {
  const utilisateurs = await prisma.utilisateur.findMany({
    orderBy: { createdAt: "desc" },
    select: champsUtilisateur,
  });

  res.json({ utilisateurs });
}

// Tout ce qui concerne un compte : ses incidents signalés, ses interventions et les avis
export async function detailUtilisateur(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id },
    select: {
      ...champsUtilisateur,
      adresse: true,
      code_postal: true,
      incidentsSignales: {
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, status: true, ville: true, createdAt: true },
      },
      interventions: {
        orderBy: { debut: "desc" },
        select: {
          id: true,
          statut: true,
          debut: true,
          incident: { select: { id: true, type: true, ville: true } },
          notes: { select: { id: true, note: true, commentaire: true, enLigne: true } },
        },
      },
      notesDonnees: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          note: true,
          commentaire: true,
          enLigne: true,
          intervention: { select: { super_heros: { select: { id: true, pseudo: true } }, incident: { select: { id: true, type: true } } } },
        },
      },
    },
  });
  if (!utilisateur) {
    res.status(404).json({ message: "Utilisateur introuvable" });
    return;
  }

  res.json({ utilisateur });
}

const schemaAction = z.object({
  action: z.enum(
    ["accepter_heros", "refuser_heros", "verifier", "desactiver", "reactiver", "valider_email", "refuser_email"],
    "L'action est invalide",
  ),
});

// Une seule route pour toutes les actions de l'admin sur un compte
export async function modifierUtilisateur(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }
  const resultat = schemaAction.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const action = resultat.data.action;

  const compte = await prisma.utilisateur.findUnique({ where: { id } });
  if (!compte) {
    res.status(404).json({ message: "Utilisateur introuvable" });
    return;
  }
  const appelation = compte.prenom ?? compte.email;

  if (action === "accepter_heros" || action === "refuser_heros") {
    if (compte.role !== "SuperHeros" || compte.statut_compte !== "EnAttente") {
      res.status(409).json({ message: "Aucune demande de super-héros en attente pour ce compte" });
      return;
    }
  }
  if (action === "verifier" && compte.role !== "Citoyens") {
    res.status(409).json({ message: "Seul un citoyen peut être vérifié" });
    return;
  }
  if (action === "desactiver" && id === res.locals.utilisateur.id) {
    res.status(409).json({ message: "Tu ne peux pas désactiver ton propre compte" });
    return;
  }
  if ((action === "valider_email" || action === "refuser_email") && !compte.email_en_attente) {
    res.status(409).json({ message: "Aucun changement d'email en attente pour ce compte" });
    return;
  }

  if (action === "accepter_heros") {
    await prisma.utilisateur.update({ where: { id }, data: { statut_compte: "Actif", verifiedAt: new Date() } });
    await envoyerMail(
      [compte.email],
      "Ta demande de super-héros est acceptée",
      `Bonjour ${appelation},\n\nBienvenue parmi les héros ! Tu peux maintenant te connecter sur ${process.env.FRONTEND_URL}/connexion.`,
    );
  }

  // Un héros refusé redevient citoyen pour garder l'accès à son compte
  if (action === "refuser_heros") {
    await prisma.utilisateur.update({ where: { id }, data: { role: "Citoyens", statut_compte: "Actif", pseudo: null } });
    await envoyerMail(
      [compte.email],
      "Ta demande de super-héros est refusée",
      `Bonjour ${appelation},\n\nAprès vérification, ta demande pour devenir super-héros n'a pas été acceptée. Tu peux toujours te connecter avec ton compte citoyen.`,
    );
  }

  if (action === "verifier") {
    await prisma.utilisateur.update({ where: { id }, data: { verifiedAt: new Date() } });
  }

  if (action === "desactiver") {
    await prisma.utilisateur.update({ where: { id }, data: { statut_compte: "Desactive" } });
  }

  if (action === "reactiver") {
    await prisma.utilisateur.update({ where: { id }, data: { statut_compte: "Actif" } });
  }

  if (action === "valider_email" && compte.email_en_attente) {
    // L'email a pu être pris par un autre compte depuis la demande
    const emailUtilise = await prisma.utilisateur.findUnique({ where: { email: compte.email_en_attente } });
    if (emailUtilise) {
      res.status(409).json({ message: "Cet email est déjà utilisé par un autre compte" });
      return;
    }

    await prisma.utilisateur.update({ where: { id }, data: { email: compte.email_en_attente, email_en_attente: null } });
    await envoyerMail(
      [compte.email_en_attente],
      "Ton nouvel email est validé",
      `Bonjour ${appelation},\n\nTon adresse email est maintenant ${compte.email_en_attente}.`,
    );
  }

  if (action === "refuser_email") {
    await prisma.utilisateur.update({ where: { id }, data: { email_en_attente: null } });
    await envoyerMail(
      [compte.email],
      "Ton changement d'email est refusé",
      `Bonjour ${appelation},\n\nTa demande pour utiliser l'adresse ${compte.email_en_attente} n'a pas été acceptée.`,
    );
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { id }, select: champsUtilisateur });
  res.json({ utilisateur });
}

export async function listerAvis(_req: Request, res: Response) {
  const avis = await prisma.note.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      note: true,
      commentaire: true,
      reponse_heros: true,
      enLigne: true,
      createdAt: true,
      citoyen: { select: { id: true, prenom: true, nom: true } },
      intervention: { select: { super_heros: { select: { id: true, pseudo: true } }, incident: { select: { id: true, type: true, ville: true } } } },
    },
  });

  res.json({ avis });
}

const schemaVisibilite = z.object({
  enLigne: z.boolean("La visibilité est invalide"),
});

export async function changerVisibiliteAvis(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }
  const resultat = schemaVisibilite.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) {
    res.status(404).json({ message: "Avis introuvable" });
    return;
  }

  const avis = await prisma.note.update({ where: { id }, data: { enLigne: resultat.data.enLigne } });

  res.json({ avis });
}

// Tout ce qu'il faut pour vérifier un incident : qui l'a signalé, les héros, leurs avis et les vilains
export async function detailIncident(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      cree_par: { select: { id: true, prenom: true, nom: true, email: true, numero_tel: true, verifiedAt: true } },
      interventions: {
        orderBy: { debut: "desc" },
        include: {
          super_heros: { select: { id: true, pseudo: true } },
          notes: { include: { citoyen: { select: { id: true, prenom: true, nom: true } } } },
        },
      },
      vilains: { include: { vilain: { select: { pseudo: true } } } },
    },
  });
  if (!incident) {
    res.status(404).json({ message: "Incident introuvable" });
    return;
  }

  res.json({ incident });
}
