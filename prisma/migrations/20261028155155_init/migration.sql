-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Signale', 'En_Cours', 'Reussi', 'Echoue', 'Supprime');

-- CreateEnum
CREATE TYPE "StatutIntervention" AS ENUM ('En_Cours', 'Reussie', 'Echouee');

-- CreateEnum
CREATE TYPE "Urgence" AS ENUM ('Haute', 'Normale', 'Basse');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Citoyens', 'SuperHeros', 'SuperVillains', 'Administrateurs');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('EnAttente', 'Actif', 'Desactive');

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "pseudo" TEXT,
    "civilite" TEXT NOT NULL,
    "date_de_naissance" TIMESTAMP(3) NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "numero_tel" TEXT NOT NULL,
    "photo_profil" TEXT,
    "adresse" TEXT NOT NULL,
    "complement_adresse" TEXT,
    "ville" TEXT NOT NULL,
    "code_postal" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'Citoyens',
    "statut_compte" "StatutCompte" NOT NULL DEFAULT 'EnAttente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperVilain" (
    "id" SERIAL NOT NULL,
    "pseudo" TEXT NOT NULL,
    "nom" TEXT,
    "prenom" TEXT,
    "specialite" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "utilisateurId" INTEGER,

    CONSTRAINT "SuperVilain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" SERIAL NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'Signale',
    "urgence" "Urgence" NOT NULL DEFAULT 'Normale',
    "type" TEXT NOT NULL,
    "description" TEXT,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "code_postal" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cree_parId" INTEGER NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" SERIAL NOT NULL,
    "statut" "StatutIntervention" NOT NULL DEFAULT 'En_Cours',
    "debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "incidentId" INTEGER NOT NULL,
    "super_herosId" INTEGER NOT NULL,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentVilain" (
    "incidentId" INTEGER NOT NULL,
    "vilainId" INTEGER NOT NULL,
    "arrete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "IncidentVilain_pkey" PRIMARY KEY ("incidentId","vilainId")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "reponse_heros" TEXT,
    "enLigne" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interventionId" INTEGER NOT NULL,
    "citoyenId" INTEGER NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_pseudo_key" ON "Utilisateur"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "SuperVilain_pseudo_key" ON "SuperVilain"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "SuperVilain_utilisateurId_key" ON "SuperVilain"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "Intervention_incidentId_super_herosId_key" ON "Intervention"("incidentId", "super_herosId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_interventionId_citoyenId_key" ON "Note"("interventionId", "citoyenId");

-- AddForeignKey
ALTER TABLE "SuperVilain" ADD CONSTRAINT "SuperVilain_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_cree_parId_fkey" FOREIGN KEY ("cree_parId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_super_herosId_fkey" FOREIGN KEY ("super_herosId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentVilain" ADD CONSTRAINT "IncidentVilain_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentVilain" ADD CONSTRAINT "IncidentVilain_vilainId_fkey" FOREIGN KEY ("vilainId") REFERENCES "SuperVilain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_citoyenId_fkey" FOREIGN KEY ("citoyenId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
