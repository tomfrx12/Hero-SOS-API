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
