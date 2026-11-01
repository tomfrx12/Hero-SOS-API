import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";

const schemaCreationVilain = z.object({
  pseudo: z.string().min(1, "Le pseudo est obligatoire"),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  specialite: z.string().min(1, "La spécialité est obligatoire"),
  secteur: z.string().min(1, "Le secteur est obligatoire"),
  description: z.string().optional(),
});

const schemaModificationVilain = z.object({
  pseudo: z.string().min(1).optional(),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  specialite: z.string().min(1).optional(),
  secteur: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function creerVilain(req: Request, res: Response) {
  const resultat = schemaCreationVilain.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const existant = await prisma.superVilain.findUnique({ where: { pseudo: resultat.data.pseudo } });
  if (existant) {
    res.status(409).json({ message: "Ce pseudo est déjà utilisé" });
    return;
  }

  const vilain = await prisma.superVilain.create({ data: resultat.data });

  res.status(201).json({ vilain });
}

export async function listeVilains(_req: Request, res: Response) {
  const vilainsEnBase = await prisma.superVilain.findMany({
    orderBy: { pseudo: "asc" },
    select: {
      id: true,
      pseudo: true,
      specialite: true,
      secteur: true,
      description: true,
      // Les incidents supprimés ne comptent pas dans le palmarès
      incidents: {
        where: { incident: { status: { not: "Supprime" } } },
        select: { arrete: true },
      },
    },
  });

  const vilains = vilainsEnBase.map(({ incidents, ...v }) => ({
    ...v,
    nombre_incidents: incidents.length,
    nombre_arrestations: incidents.filter((i) => i.arrete).length,
  }));

  res.json({ vilains });
}

export async function detailVilain(req: Request, res: Response) {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ message: "Identifiant invalide" });
    return;
  }

  const vilain = await prisma.superVilain.findUnique({
    where: { id },
    include: {
      incidents: {
        where: { incident: { status: { not: "Supprime" } } },
        select: {
          arrete: true,
          incident: {
            select: {
              id: true,
              type: true,
              ville: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!vilain) {
    res.status(404).json({ message: "Vilain introuvable" });
    return;
  }

  res.json({ vilain });
}

export async function modifierVilain(req: Request, res: Response) {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ message: "Identifiant invalide" });
    return;
  }

  const resultat = schemaModificationVilain.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const existant = await prisma.superVilain.findUnique({ where: { id } });
  if (!existant) {
    res.status(404).json({ message: "Vilain introuvable" });
    return;
  }

  if (resultat.data.pseudo && resultat.data.pseudo !== existant.pseudo) {
    const pseudoPris = await prisma.superVilain.findUnique({ where: { pseudo: resultat.data.pseudo } });
    if (pseudoPris) {
      res.status(409).json({ message: "Ce pseudo est déjà utilisé" });
      return;
    }
  }

  const vilain = await prisma.superVilain.update({ where: { id }, data: resultat.data });

  res.json({ vilain });
}

export async function supprimerVilain(req: Request, res: Response) {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ message: "Identifiant invalide" });
    return;
  }

  const existant = await prisma.superVilain.findUnique({ where: { id } });
  if (!existant) {
    res.status(404).json({ message: "Vilain introuvable" });
    return;
  }

  await prisma.superVilain.delete({ where: { id } });

  res.status(204).send();
}
