import type { Request, Response } from "express";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { prisma } from "../services/prisma";

const optionsSanitize: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "h1", "h2", "img", "figure", "figcaption", "s", "sub", "sup",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height", "style"],
    "*": ["class", "style"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      color: [/.*/],
    },
  },
};

function nettoyer(html: string) {
  return sanitizeHtml(html, optionsSanitize);
}

const schemaArticle = z.object({
  titre: z.string().min(1, "Le titre est obligatoire"),
  contenu_html: z.string().min(1, "Le contenu est obligatoire"),
  publie: z.preprocess((v) => v === "true" || v === true, z.boolean()).optional(),
});

const champsListe = {
  id: true,
  titre: true,
  image: true,
  publie: true,
  createdAt: true,
  auteur: { select: { prenom: true, nom: true } },
} as const;

// ── Routes publiques ──────────────────────────────────────────────────────────

export async function listerArticles(_req: Request, res: Response) {
  const articles = await prisma.article.findMany({
    where: { publie: true },
    orderBy: { createdAt: "desc" },
    select: champsListe,
  });
  res.json({ articles });
}

export async function detailArticle(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }

  const article = await prisma.article.findUnique({
    where: { id, publie: true },
    include: { auteur: { select: { prenom: true, nom: true } } },
  });
  if (!article) {
    res.status(404).json({ message: "Article introuvable" });
    return;
  }
  res.json({ article });
}

// ── Routes admin ──────────────────────────────────────────────────────────────

export async function listerArticlesAdmin(_req: Request, res: Response) {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    select: champsListe,
  });
  res.json({ articles });
}

export async function detailArticleAdmin(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }

  const article = await prisma.article.findUnique({
    where: { id },
    include: { auteur: { select: { prenom: true, nom: true } } },
  });
  if (!article) {
    res.status(404).json({ message: "Article introuvable" });
    return;
  }
  res.json({ article });
}

export async function creerArticle(req: Request, res: Response) {
  const resultat = schemaArticle.safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const { titre, contenu_html, publie } = resultat.data;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  const article = await prisma.article.create({
    data: {
      titre,
      contenu_html: nettoyer(contenu_html),
      image,
      publie: publie ?? false,
      auteurId: res.locals.utilisateur.id,
    },
  });

  res.status(201).json({ article });
}

export async function modifierArticle(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }

  const existant = await prisma.article.findUnique({ where: { id } });
  if (!existant) {
    res.status(404).json({ message: "Article introuvable" });
    return;
  }

  const resultat = schemaArticle.partial().safeParse(req.body);
  if (!resultat.success) {
    res.status(400).json({ message: resultat.error.issues[0].message });
    return;
  }

  const { titre, contenu_html, publie } = resultat.data;
  const image = req.file ? `/uploads/${req.file.filename}` : undefined;

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(titre !== undefined && { titre }),
      ...(contenu_html !== undefined && { contenu_html: nettoyer(contenu_html) }),
      ...(publie !== undefined && { publie }),
      ...(image !== undefined && { image }),
    },
  });

  res.json({ article });
}

export async function supprimerArticle(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "L'identifiant est invalide" });
    return;
  }

  const existant = await prisma.article.findUnique({ where: { id } });
  if (!existant) {
    res.status(404).json({ message: "Article introuvable" });
    return;
  }

  await prisma.article.delete({ where: { id } });
  res.json({ message: "Article supprimé" });
}
