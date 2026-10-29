import type { Request, Response } from "express";
import { prisma } from "../services/prisma";

export async function listeHeros(_req: Request, res: Response) {
  const herosEnBase = await prisma.utilisateur.findMany({
    where: { role: "SuperHeros", statut_compte: "Actif" },
    orderBy: { pseudo: "asc" },
    select: {
      id: true,
      pseudo: true,
      photo_profil: true,
      interventions: { select: { statut: true, notes: { select: { note: true } } } },
    },
  });

  const heros = herosEnBase.map((h) => {
    let totalNotes = 0;
    let nombreAvis = 0;
    let missionsReussies = 0;

    for (const intervention of h.interventions) {
      if (intervention.statut === "Reussie") missionsReussies++;
      for (const avis of intervention.notes) {
        totalNotes += avis.note;
        nombreAvis++;
      }
    }

    return {
      id: h.id,
      pseudo: h.pseudo,
      photo: h.photo_profil,
      note_moyenne: nombreAvis > 0 ? totalNotes / nombreAvis : null,
      nombre_avis: nombreAvis,
      missions_reussies: missionsReussies,
    };
  });

  res.json({ heros });
}
