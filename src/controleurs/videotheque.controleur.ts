import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

async function tmdbFetch(path: string) {
  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
      accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

// ── Public ─────────────────────────────────────────────────────────────────────

export async function listerFilmsPublics(_req: Request, res: Response) {
  const films = await prisma.film.findMany({
    where: { heros: { some: { statut: "Valide" } } },
    orderBy: { titre: "asc" },
    include: {
      heros: {
        where: { statut: "Valide" },
        include: { heros: { select: { pseudo: true, photo_profil: true } } },
      },
    },
  });
  res.json({ films });
}

// ── Super-héros ────────────────────────────────────────────────────────────────

export async function rechercherFilm(req: Request, res: Response) {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.status(400).json({ message: "Le paramètre q est requis" });
    return;
  }

  const data = await tmdbFetch(
    `/search/movie?query=${encodeURIComponent(q)}&language=fr-FR&page=1`
  );

  const resultats = (data.results as Array<Record<string, unknown>>)
    .slice(0, 10)
    .map((f) => ({
      tmdb_id: f.id,
      titre: f.title,
      annee: typeof f.release_date === "string" ? f.release_date.slice(0, 4) : null,
      affiche_url: f.poster_path ? `${TMDB_IMAGE}${f.poster_path}` : null,
      description: f.overview ?? null,
    }));

  res.json({ resultats });
}

export async function mesFilms(req: Request, res: Response) {
  const herosId = res.locals.utilisateur.id as number;

  const entrees = await prisma.filmHeros.findMany({
    where: { herosId },
    orderBy: { createdAt: "desc" },
    include: { film: true },
  });

  res.json({ films: entrees });
}

const schemaAjout = z.object({
  tmdb_id: z.number().int().positive(),
  titre: z.string().min(1),
  annee: z.string().optional().nullable(),
  affiche_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function ajouterFilm(req: Request, res: Response) {
  const herosId = res.locals.utilisateur.id as number;

  const resultat = schemaAjout.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const { tmdb_id, titre, annee, affiche_url, description } = resultat.data;

  // Upsert du film TMDB (identique pour tous les héros)
  const film = await prisma.film.upsert({
    where: { tmdb_id },
    create: { tmdb_id, titre, annee, affiche_url, description },
    update: {},
  });

  // Vérifier que ce héros ne l'a pas déjà ajouté
  const existant = await prisma.filmHeros.findUnique({
    where: { filmId_herosId: { filmId: film.id, herosId } },
  });
  if (existant) {
    res.status(409).json({ message: "Tu as déjà ajouté ce film" });
    return;
  }

  const entree = await prisma.filmHeros.create({
    data: { filmId: film.id, herosId },
    include: { film: true },
  });

  res.status(201).json({ entree });
}

export async function retirerFilm(req: Request, res: Response) {
  const herosId = res.locals.utilisateur.id as number;
  const filmId = Number(req.params.filmId);

  if (!Number.isInteger(filmId)) {
    res.status(400).json({ message: "Identifiant invalide" });
    return;
  }

  const entree = await prisma.filmHeros.findUnique({
    where: { filmId_herosId: { filmId, herosId } },
  });
  if (!entree) {
    res.status(404).json({ message: "Film introuvable dans ta vidéothèque" });
    return;
  }

  await prisma.filmHeros.delete({
    where: { filmId_herosId: { filmId, herosId } },
  });

  res.json({ message: "Film retiré de ta vidéothèque" });
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export async function listerFilmsAdmin(req: Request, res: Response) {
  const statut = req.query.statut as string | undefined;

  const entrees = await prisma.filmHeros.findMany({
    where: statut ? { statut: statut as "EnAttente" | "Valide" | "Refuse" } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      film: true,
      heros: { select: { id: true, pseudo: true, photo_profil: true } },
    },
  });

  res.json({ entrees });
}

export async function validerFilm(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "Identifiant invalide" });
    return;
  }

  const entree = await prisma.filmHeros.findUnique({ where: { id } });
  if (!entree) {
    res.status(404).json({ message: "Entrée introuvable" });
    return;
  }

  const maj = await prisma.filmHeros.update({
    where: { id },
    data: { statut: "Valide" },
    include: { film: true, heros: { select: { pseudo: true } } },
  });

  res.json({ entree: maj });
}

export async function refuserFilm(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "Identifiant invalide" });
    return;
  }

  const entree = await prisma.filmHeros.findUnique({ where: { id } });
  if (!entree) {
    res.status(404).json({ message: "Entrée introuvable" });
    return;
  }

  const maj = await prisma.filmHeros.update({
    where: { id },
    data: { statut: "Refuse" },
    include: { film: true, heros: { select: { pseudo: true } } },
  });

  res.json({ entree: maj });
}
