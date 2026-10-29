import type { Request, Response } from "express";
import { prisma } from "../services/prisma";

// stat "QG des Héros" accueil
export async function statistiques(_req: Request, res: Response) {
  const herosActifs = await prisma.utilisateur.count({
    where: { role: "SuperHeros", statut_compte: "Actif" },
  });

  const incidentsSignales = await prisma.incident.count({
    where: { status: { not: "Supprime" } },
  });

  // Seulement les interventions terminées (avec une date de fin)
  const terminees = await prisma.intervention.findMany({
    where: { fin: { not: null } },
    select: { statut: true, debut: true, fin: true },
  });

  let reussies = 0;
  let totalMinutes = 0;
  for (const intervention of terminees) {
    if (intervention.statut === "Reussie") {
      reussies++;
      totalMinutes += (intervention.fin!.getTime() - intervention.debut.getTime()) / 60000;
    }
  }

  res.json({
    heros_actifs: herosActifs,
    incidents_signales: incidentsSignales,
    taux_reussite: terminees.length > 0 ? Math.round((reussies * 100) / terminees.length) : null,
    temps_moyen_minutes: reussies > 0 ? Math.round(totalMinutes / reussies) : null,
  });
}
