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
      email: true,
      numero_tel: true,
      ville: true,
      pays: true,
      createdAt: true,
      interventions: {
        select: {
          statut: true,
          notes: { select: { note: true, commentaire: true, reponse_heros: true, enLigne: true, createdAt: true } },
        },
      },
    },
  });

  const heros = herosEnBase.map((h) => {
    let totalNotes = 0;
    let nombreAvis = 0;
    let missionsReussies = 0;
    let missionsEchouees = 0;
    let missionsEnCours = 0;

    for (const intervention of h.interventions) {
      if (intervention.statut === "Reussie") missionsReussies++;
      if (intervention.statut === "Echouee") missionsEchouees++;
      if (intervention.statut === "En_Cours") missionsEnCours++;
      for (const avis of intervention.notes) {
        totalNotes += avis.note;
        nombreAvis++;
      }
    }

    // Seuls les avis en ligne sont publics, sans l'identité du citoyen
    const avis = h.interventions
      .flatMap((intervention) => intervention.notes)
      .filter((note) => note.enLigne)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(({ enLigne: _enLigne, ...note }) => note);

    return {
      id: h.id,
      pseudo: h.pseudo,
      photo: h.photo_profil,
      note_moyenne: nombreAvis > 0 ? totalNotes / nombreAvis : null,
      nombre_avis: nombreAvis,
      missions_reussies: missionsReussies,
      missions_echouees: missionsEchouees,
      missions_en_cours: missionsEnCours,
      email: h.email,
      numero_tel: h.numero_tel,
      ville: h.ville,
      pays: h.pays,
      membre_depuis: h.createdAt,
      avis,
    };
  });

  res.json({ heros });
}
