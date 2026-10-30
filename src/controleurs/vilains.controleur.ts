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
