-- CreateEnum
CREATE TYPE "StatutFilm" AS ENUM ('EnAttente', 'Valide', 'Refuse');

-- CreateTable
CREATE TABLE "Film" (
    "id" SERIAL NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "annee" TEXT,
    "affiche_url" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Film_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmHeros" (
    "id" SERIAL NOT NULL,
    "statut" "StatutFilm" NOT NULL DEFAULT 'EnAttente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filmId" INTEGER NOT NULL,
    "herosId" INTEGER NOT NULL,

    CONSTRAINT "FilmHeros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Film_tmdb_id_key" ON "Film"("tmdb_id");

-- CreateIndex
CREATE UNIQUE INDEX "FilmHeros_filmId_herosId_key" ON "FilmHeros"("filmId", "herosId");

-- AddForeignKey
ALTER TABLE "FilmHeros" ADD CONSTRAINT "FilmHeros_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmHeros" ADD CONSTRAINT "FilmHeros_herosId_fkey" FOREIGN KEY ("herosId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
