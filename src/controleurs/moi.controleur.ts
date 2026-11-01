import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { emailsDuRole, envoyerMail } from "../services/mail";
import { sansMotDePasse } from "./auth.controleur";

const schemaModificationProfil = z.object({
  numero_tel: z.string().min(1, "Le numéro de téléphone est obligatoire").optional(),
  adresse: z.string().min(1, "L'adresse est obligatoire").optional(),
  complement_adresse: z.string().optional(),
  ville: z.string().min(1, "La ville est obligatoire").optional(),
  code_postal: z.string().min(1, "Le code postal est obligatoire").optional(),
  pays: z.string().min(1, "Le pays est obligatoire").optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  newsletter: z.boolean().optional(),
});

export async function modifierProfil(req: Request, res: Response) {
  const resultat = schemaModificationProfil.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const utilisateur = await prisma.utilisateur.update({
    where: { id: res.locals.utilisateur.id },
    data: resultat.data,
  });

  res.json({ utilisateur: sansMotDePasse(utilisateur) });
}

const schemaEmail = z.object({
  email: z.email("L'adresse email est invalide"),
});

export async function demanderChangementEmail(req: Request, res: Response) {
  const resultat = schemaEmail.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { email } = resultat.data;

  const emailUtilise = await prisma.utilisateur.findUnique({ where: { email } });
  if (emailUtilise) {
    res.status(409).json({ message: "Cet email est déjà utilisé" });
    return;
  }

  // L'email n'est pas changé tout de suite : un administrateur doit d'abord valider la demande
  const utilisateur = await prisma.utilisateur.update({
    where: { id: res.locals.utilisateur.id },
    data: { email_en_attente: email },
  });

  await envoyerMail(
    await emailsDuRole("Administrateurs"),
    "Demande de changement d'email",
    `${utilisateur.prenom ?? "Un utilisateur"} souhaite remplacer ${utilisateur.email} par ${email}.`,
  );

  res.json({ utilisateur: sansMotDePasse(utilisateur) });
}

export async function changerPhoto(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ message: "Choisis une image (2 Mo maximum)" });
    return;
  }

  const utilisateur = await prisma.utilisateur.update({
    where: { id: res.locals.utilisateur.id },
    data: { photo_profil: `/uploads/${req.file.filename}` },
  });

  res.json({ utilisateur: sansMotDePasse(utilisateur) });
}

const schemaMotDePasse = z.object({
  ancien_mot_de_passe: z.string().min(1, "L'ancien mot de passe est obligatoire"),
  nouveau_mot_de_passe: z.string().min(8, "Le nouveau mot de passe doit faire au moins 8 caractères"),
});

export async function changerMotDePasse(req: Request, res: Response) {
  const resultat = schemaMotDePasse.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { ancien_mot_de_passe, nouveau_mot_de_passe } = resultat.data;

  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: res.locals.utilisateur.id } });
  if (!utilisateur || !(await bcrypt.compare(ancien_mot_de_passe, utilisateur.mot_de_passe))) {
    res.status(400).json({ message: "L'ancien mot de passe est incorrect" });
    return;
  }

  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { mot_de_passe: await bcrypt.hash(nouveau_mot_de_passe, 10) },
  });

  res.json({ message: "Ton mot de passe a été modifié" });
}

const schemaCompletionProfil = z.object({
  civilite: z.string().min(1, "La civilité est obligatoire"),
  nom: z.string().min(1, "Le nom est obligatoire"),
  prenom: z.string().min(1, "Le prénom est obligatoire"),
  date_de_naissance: z.coerce.date("La date de naissance est invalide"),
  numero_tel: z.string().min(1, "Le numéro de téléphone est obligatoire"),
  adresse: z.string().min(1, "L'adresse est obligatoire"),
  complement_adresse: z.string().optional(),
  ville: z.string().min(1, "La ville est obligatoire"),
  code_postal: z.string().min(1, "Le code postal est obligatoire"),
  pays: z.string().min(1, "Le pays est obligatoire"),
  latitude: z.number("Choisis ton adresse dans la liste"),
  longitude: z.number("Choisis ton adresse dans la liste"),
});

export async function completerProfil(req: Request, res: Response) {
  const resultat = schemaCompletionProfil.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const utilisateur = await prisma.utilisateur.update({
    where: { id: res.locals.utilisateur.id },
    data: { ...resultat.data, profil_complet: true },
  });

  res.json({ utilisateur: sansMotDePasse(utilisateur) });
}

// Historique des incidents signalés, avec les héros intervenus et la note déjà donnée
export async function mesIncidents(_req: Request, res: Response) {
  const citoyenId = res.locals.utilisateur.id;

  const incidents = await prisma.incident.findMany({
    where: { cree_parId: citoyenId },
    orderBy: { createdAt: "desc" },
    include: {
      interventions: {
        select: {
          id: true,
          statut: true,
          debut: true,
          fin: true,
          super_heros: { select: { pseudo: true } },
          notes: { where: { citoyenId }, select: { note: true, commentaire: true, reponse_heros: true } },
        },
      },
    },
  });

  res.json({ incidents });
}

const schemaNote = z.object({
  interventionId: z.number("L'intervention est invalide"),
  note: z.number().int().min(1, "La note va de 1 à 5").max(5, "La note va de 1 à 5"),
  commentaire: z.string().optional(),
});

export async function noterHeros(req: Request, res: Response) {
  const resultat = schemaNote.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { interventionId, note, commentaire } = resultat.data;
  const citoyenId = res.locals.utilisateur.id;

  // On ne peut noter que les héros intervenus sur ses propres incidents, une fois l'intervention finie
  const intervention = await prisma.intervention.findUnique({
    where: { id: interventionId },
    include: { incident: true },
  });
  if (!intervention || intervention.incident.cree_parId !== citoyenId) {
    res.status(404).json({ message: "Intervention introuvable" });
    return;
  }
  if (intervention.statut === "En_Cours") {
    res.status(409).json({ message: "L'intervention n'est pas encore terminée" });
    return;
  }

  const dejaNote = await prisma.note.findUnique({
    where: { interventionId_citoyenId: { interventionId, citoyenId } },
  });
  if (dejaNote) {
    res.status(409).json({ message: "Tu as déjà noté cette intervention" });
    return;
  }

  const nouvelleNote = await prisma.note.create({
    data: { interventionId, citoyenId, note, commentaire },
  });

  res.status(201).json({ note: nouvelleNote });
}

// Statistiques personnelles du super-héros connecté
export async function mesStatistiques(_req: Request, res: Response) {
  const interventions = await prisma.intervention.findMany({
    where: { super_herosId: res.locals.utilisateur.id },
    select: {
      statut: true,
      debut: true,
      fin: true,
      notes: { where: { enLigne: true }, select: { note: true } },
      incident: { select: { vilains: { select: { arrete: true } } } },
    },
  });

  let reussies = 0;
  let echouees = 0;
  let enCours = 0;
  let totalMinutes = 0;
  let totalNotes = 0;
  let nombreAvis = 0;
  let vilainsArretes = 0;

  for (const intervention of interventions) {
    if (intervention.statut === "En_Cours") enCours++;
    if (intervention.statut === "Echouee") echouees++;
    if (intervention.statut === "Reussie") {
      reussies++;
      totalMinutes += (intervention.fin!.getTime() - intervention.debut.getTime()) / 60000;
    }
    for (const avis of intervention.notes) {
      totalNotes += avis.note;
      nombreAvis++;
    }
    for (const lien of intervention.incident.vilains) {
      if (intervention.statut === "Reussie" && lien.arrete) vilainsArretes++;
    }
  }

  const terminees = reussies + echouees;

  res.json({
    interventions: interventions.length,
    reussies,
    echouees,
    en_cours: enCours,
    taux_reussite: terminees > 0 ? Math.round((reussies * 100) / terminees) : null,
    temps_moyen_minutes: reussies > 0 ? Math.round(totalMinutes / reussies) : null,
    note_moyenne: nombreAvis > 0 ? totalNotes / nombreAvis : null,
    nombre_avis: nombreAvis,
    // Un incident réussi = un citoyen secouru
    citoyens_secourus: reussies,
    vilains_arretes: vilainsArretes,
  });
}

// Les interventions du super-héros connecté, la plus récente en premier
export async function mesInterventions(_req: Request, res: Response) {
  const interventions = await prisma.intervention.findMany({
    where: { super_herosId: res.locals.utilisateur.id },
    orderBy: { debut: "desc" },
    select: {
      id: true,
      statut: true,
      debut: true,
      fin: true,
      incident: {
        select: {
          id: true,
          type: true,
          urgence: true,
          description: true,
          adresse: true,
          ville: true,
          vilains: { select: { vilain: { select: { pseudo: true } } } },
        },
      },
    },
  });

  res.json({ interventions });
}

const schemaCandidatureHeros = z.object({
  pseudo: z.string().min(1, "Le pseudo est obligatoire"),
});

export async function candidatureHeros(req: Request, res: Response) {
  const resultat = schemaCandidatureHeros.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const userId = res.locals.utilisateur.id;
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: userId } });

  if (!utilisateur || utilisateur.role !== "Citoyens") {
    res.status(400).json({ message: "Seuls les citoyens peuvent envoyer une candidature" });
    return;
  }

  const pseudoPris = await prisma.utilisateur.findUnique({ where: { pseudo: resultat.data.pseudo } });
  if (pseudoPris) {
    res.status(409).json({ message: "Ce pseudo est déjà utilisé" });
    return;
  }

  await prisma.utilisateur.update({
    where: { id: userId },
    data: { pseudo: resultat.data.pseudo, role: "SuperHeros", statut_compte: "EnAttente" },
  });

  const appelation = utilisateur.prenom ?? utilisateur.email;

  await envoyerMail(
    [utilisateur.email],
    "Ta candidature super-héros a été envoyée",
    `Bonjour ${appelation},\n\nTa candidature pour rejoindre Héros SOS en tant que super-héros avec le pseudo "${resultat.data.pseudo}" a bien été reçue.\n\nUn modérateur va l'examiner prochainement. Tu recevras un mail dès qu'une décision aura été prise.\n\nÀ bientôt !`,
  );

  await envoyerMail(
    await emailsDuRole("Administrateurs"),
    "Nouvelle candidature super-héros",
    `${appelation} (${utilisateur.email}) souhaite devenir super-héros avec le pseudo "${resultat.data.pseudo}".`,
  );

  res.json({ message: "Ta candidature a été envoyée" });
}

// Les avis laissés par les citoyens sur les interventions du héros connecté
export async function maReputation(_req: Request, res: Response) {
  const notes = await prisma.note.findMany({
    where: { enLigne: true, intervention: { super_herosId: res.locals.utilisateur.id } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      note: true,
      commentaire: true,
      reponse_heros: true,
      createdAt: true,
      citoyen: { select: { prenom: true } },
      intervention: { select: { incident: { select: { type: true, ville: true } } } },
    },
  });

  res.json({ notes });
}

const schemaReponse = z.object({
  reponse: z.string().min(1, "La réponse est vide"),
});

export async function repondreAvis(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }
  const resultat = schemaReponse.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const note = await prisma.note.findUnique({ where: { id }, include: { intervention: true } });
  if (!note || note.intervention.super_herosId !== res.locals.utilisateur.id) {
    res.status(404).json({ message: "Avis introuvable" });
    return;
  }

  const noteModifiee = await prisma.note.update({
    where: { id },
    data: { reponse_heros: resultat.data.reponse },
  });

  res.json({ note: noteModifiee });
}
