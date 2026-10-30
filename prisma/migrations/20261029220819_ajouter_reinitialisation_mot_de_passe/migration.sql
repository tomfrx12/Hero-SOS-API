-- CreateTable
CREATE TABLE "ReinitialisationMotDePasse" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "ReinitialisationMotDePasse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReinitialisationMotDePasse_token_key" ON "ReinitialisationMotDePasse"("token");

-- AddForeignKey
ALTER TABLE "ReinitialisationMotDePasse" ADD CONSTRAINT "ReinitialisationMotDePasse_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
