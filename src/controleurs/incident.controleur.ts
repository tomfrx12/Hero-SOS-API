import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";

const schemaCreationIncident = z.object({
  type: z.string().min(1, "Le type est obligatoire"),
  description: z.string().optional(),
  urgence: z.enum(["Haute", "Normale", "Basse"]).optional(),
  adresse: z.string().min(1, "L'adresse est obligatoire"),
  ville: z.string().min(1, "La ville est obligatoire"),
  code_postal: z.string().min(1, "Le code postal est obligatoire"),
  pays: z.string().min(1, "Le pays est obligatoire"),
  latitude: z.coerce.number().min(-90).max(90, "La latitude est invalide"),
  longitude: z.coerce.number().min(-180).max(180, "La longitude est invalide"),
});

export async function creerIncident(req: Request, res: Response) {
  const resultat = schemaCreationIncident.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { urgence, ...donnees } = resultat.data;

  // La priorité est définie par un admin ou un super-héros, pas par le citoyen
  const estAdmin = res.locals.utilisateur.role === "Administrateurs";

  const incident = await prisma.incident.create({
    data: {
      ...donnees,
      urgence: estAdmin ? urgence : undefined,
      cree_parId: res.locals.utilisateur.id,
    },
  });

  res.status(201).json({ incident });
}

const schemaFiltresIncidents = z.object({
  status: z.enum(["Signale", "En_Cours", "Reussi", "Echoue", "Supprime"], "Le statut est invalide").optional(),
  ville: z.string().optional(),
  urgence: z.enum(["Haute", "Normale", "Basse"], "La priorité est invalide").optional(),
});

export async function listerIncidents(req: Request, res: Response) {
  const resultat = schemaFiltresIncidents.safeParse(req.query);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const { status, ville, urgence } = resultat.data;

  const incidents = await prisma.incident.findMany({
    where: {
      // Les incidents supprimés ne s'affichent que si on les demande explicitement
      status: status ?? { not: "Supprime" },
      ville: ville ? { equals: ville, mode: "insensitive" } : undefined,
      urgence,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ incidents });
}

export async function recupererIncident(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) {
    res.status(404).json({ message: "Incident introuvable" });
    return;
  }

  res.json({ incident });
}

export async function intervenir(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }
  const herosId = res.locals.utilisateur.id;

  const incident = await prisma.incident.findUnique({ where: { id } });
  if (!incident) {
    res.status(404).json({ message: "Incident introuvable" });
    return;
  }
  if (incident.status !== "Signale" && incident.status !== "En_Cours") {
    res.status(409).json({ message: "Cet incident n'est plus ouvert aux interventions" });
    return;
  }

  const interventionEnCours = await prisma.intervention.findFirst({
    where: { super_herosId: herosId, statut: "En_Cours" },
  });
  if (interventionEnCours) {
    res.status(409).json({ message: "Vous avez déjà une intervention en cours" });
    return;
  }

  const dejaIntervenu = await prisma.intervention.findUnique({
    where: { incidentId_super_herosId: { incidentId: id, super_herosId: herosId } },
  });
  if (dejaIntervenu) {
    res.status(409).json({ message: "Vous êtes déjà intervenu sur cet incident" });
    return;
  }

  const [intervention] = await prisma.$transaction([
    prisma.intervention.create({ data: { incidentId: id, super_herosId: herosId } }),
    prisma.incident.update({ where: { id }, data: { status: "En_Cours" } }),
  ]);

  res.status(201).json({ intervention });
}

const schemaFinIntervention = z.object({
  resultat: z.enum(["Reussie", "Echouee"], "Le résultat doit être Reussie ou Echouee"),
});

export async function terminerIntervention(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }
  const resultat = schemaFinIntervention.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }
  const herosId = res.locals.utilisateur.id;

  const intervention = await prisma.intervention.findUnique({
    where: { incidentId_super_herosId: { incidentId: id, super_herosId: herosId } },
  });
  if (!intervention || intervention.statut !== "En_Cours") {
    res.status(404).json({ message: "Aucune intervention en cours sur cet incident" });
    return;
  }

  const interventionTerminee = await prisma.$transaction(async (tx) => {
    const terminee = await tx.intervention.update({
      where: { id: intervention.id },
      data: { statut: resultat.data.resultat, fin: new Date() },
    });

    // Un succès clôt l'incident (et libère les autres héros) ; un échec seulement si plus aucun héros n'est dessus
    if (resultat.data.resultat === "Reussie") {
      await tx.intervention.updateMany({
        where: { incidentId: id, statut: "En_Cours" },
        data: { statut: "Reussie", fin: new Date() },
      });
      await tx.incident.update({ where: { id }, data: { status: "Reussi" } });
    } else {
      const autresEnCours = await tx.intervention.count({ where: { incidentId: id, statut: "En_Cours" } });
      if (autresEnCours === 0) {
        await tx.incident.update({ where: { id }, data: { status: "Echoue" } });
      }
    }

    return terminee;
  });

  res.json({ intervention: interventionTerminee });
}
